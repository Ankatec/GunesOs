import { useEffect, useRef, useState, useCallback } from "react";
// @ts-ignore - optional runtime dependency
import { WebContainer } from "@webcontainer/api";
import type { FileNode } from "@/components/apps/yapayakil/FileTree";
import type { FileStore } from "@/components/apps/yapayakil/YapayakilIndex";

interface UseWebContainerResult {
  isBooted: boolean;
  isRunning: boolean;
  previewUrl: string | null;
  logs: string[];
  error: string | null;
  runProject: (files: FileNode[], fileStore: FileStore) => Promise<void>;
  stop: () => void;
}

/**
 * Convert our FileNode tree + FileStore into WebContainer's FileSystemTree format
 */
function buildFileSystemTree(
  nodes: FileNode[],
  fileStore: FileStore,
  parentPath: string = ""
): Record<string, any> {
  const tree: Record<string, any> = {};

  for (const node of nodes) {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

    if (node.type === "folder" && node.children) {
      tree[node.name] = {
        directory: buildFileSystemTree(node.children, fileStore, currentPath),
      };
    } else if (node.type === "file") {
      const content = fileStore[currentPath] || fileStore[node.name] || "";
      tree[node.name] = {
        file: { contents: content },
      };
    }
  }

  return tree;
}

/**
 * Detect package manager and start command from package.json
 */
function detectStartCommand(fileStore: FileStore): { install: string[]; start: string[] } {
  // Try to find package.json
  let pkgJson: any = null;
  for (const [path, content] of Object.entries(fileStore)) {
    if (path.endsWith("package.json") && !path.includes("node_modules")) {
      try {
        pkgJson = JSON.parse(content);
        break;
      } catch {
        // ignore
      }
    }
  }

  if (pkgJson?.scripts) {
    if (pkgJson.scripts.dev) {
      return { install: ["npm", "install"], start: ["npm", "run", "dev"] };
    }
    if (pkgJson.scripts.start) {
      return { install: ["npm", "install"], start: ["npm", "run", "start"] };
    }
  }

  // Default: try to serve with a simple http server
  return { install: ["npm", "install"], start: ["npx", "serve", "."] };
}

export function useWebContainer(): UseWebContainerResult {
  const instanceRef = useRef<WebContainer | null>(null);
  const [isBooted, setIsBooted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Boot WebContainer once
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const instance = await WebContainer.boot();
        if (!cancelled) {
          instanceRef.current = instance;
          setIsBooted(true);

          // Listen for server-ready
          instance.on("server-ready", (_port: number, url: string) => {
            setPreviewUrl(url);
            setIsRunning(true);
          });

          instance.on("error", ({ message }: { message: string }) => {
            setError(message);
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message?.includes("SharedArrayBuffer")
              ? "WebContainer başlatılamadı: Cross-Origin Isolation headers gerekli. Lütfen sayfayı yenileyin."
              : `WebContainer başlatılamadı: ${err?.message || "Bilinmeyen hata"}`
          );
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-100), msg]);
  }, []);

  const runProject = useCallback(
    async (files: FileNode[], fileStore: FileStore) => {
      const instance = instanceRef.current;
      if (!instance) {
        setError("WebContainer henüz hazır değil. Lütfen bekleyin.");
        return;
      }

      setError(null);
      setPreviewUrl(null);
      setIsRunning(false);
      setLogs([]);

      try {
        // Build file system tree
        const fsTree = buildFileSystemTree(files, fileStore);
        addLog("📁 Dosyalar yükleniyor...");

        // Mount files
        await instance.mount(fsTree);
        addLog("✅ Dosyalar yüklendi");

        // Check if there's a package.json
        const hasPackageJson = Object.keys(fileStore).some(
          (p) => p.endsWith("package.json") && !p.includes("node_modules")
        );

        if (hasPackageJson) {
          const { install, start } = detectStartCommand(fileStore);

          // Install dependencies
          addLog(`📦 Bağımlılıklar yükleniyor: ${install.join(" ")}...`);
          const installProcess = await instance.spawn(install[0], install.slice(1));

          installProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                addLog(data);
              },
            })
          );

          const installExit = await installProcess.exit;
          if (installExit !== 0) {
            setError("Bağımlılık yüklemesi başarısız oldu.");
            addLog("❌ npm install başarısız");
            return;
          }
          addLog("✅ Bağımlılıklar yüklendi");

          // Start dev server
          addLog(`🚀 Sunucu başlatılıyor: ${start.join(" ")}...`);
          const startProcess = await instance.spawn(start[0], start.slice(1));

          startProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                addLog(data);
              },
            })
          );
        } else {
          // No package.json - check for index.html and serve statically
          const hasIndexHtml = Object.keys(fileStore).some(
            (p) => p.endsWith("index.html")
          );

          if (hasIndexHtml) {
            addLog("🌐 Statik dosya sunucusu başlatılıyor...");
            const serveProcess = await instance.spawn("npx", ["serve", ".", "-l", "3000"]);

            serveProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  addLog(data);
                },
              })
            );
          } else {
            setError("Çalıştırılabilir bir proje bulunamadı (package.json veya index.html gerekli).");
          }
        }
      } catch (err: any) {
        setError(`Hata: ${err?.message || "Bilinmeyen hata"}`);
        addLog(`❌ ${err?.message || "Bilinmeyen hata"}`);
      }
    },
    [addLog]
  );

  const stop = useCallback(() => {
    // Teardown is handled by WebContainer internally
    setIsRunning(false);
    setPreviewUrl(null);
    setLogs([]);
  }, []);

  return {
    isBooted,
    isRunning,
    previewUrl,
    logs,
    error,
    runProject,
    stop,
  };
}