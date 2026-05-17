import { useState, useCallback, useEffect } from "react";
import TopBar from "./TopBar";
import PreviewPanel from "./PreviewPanel";
import CodeEditor from "./CodeEditor";
import YapayakilChat from "./YapayakilChat";
import FileTree, { FileNode } from "./FileTree";
import SettingsModal from "./SettingsModal";
import { ChevronRight, ChevronLeft, Eye, Code2, MessageSquare, FolderTree } from "lucide-react";
import { useWebContainer } from "@/hooks/useWebContainer";

export type SortMode = "name-asc" | "name-desc" | "type" | "ext";

export interface FileStore {
  [path: string]: string;
}

type MobileTab = "preview" | "code" | "chat";

const DEFAULT_CODE = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>WebOS Uygulamam</title>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
      color: #e4e6eb;
      min-height: 100vh;
      display: grid;
      place-items: center;
    }
    .hero { text-align: center; padding: 40px; }
    h1 {
      font-size: 48px; margin: 0 0 12px;
      background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    p { color: #8b92a7; font-size: 16px; max-width: 460px; margin: 0 auto; line-height: 1.6; }
    .btn {
      margin-top: 24px; padding: 12px 28px; border-radius: 10px;
      background: linear-gradient(135deg, #7c5cff 0%, #4f9fff 100%);
      color: white; border: 0; cursor: pointer; font-weight: 600; font-size: 14px;
      box-shadow: 0 10px 30px -8px rgba(124, 92, 255, 0.5); transition: transform 0.2s;
    }
    .btn:hover { transform: translateY(-2px); }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Merhaba, WebOS!</h1>
    <p>Bu uygulama Yapayakıl destekli kod editörümde geliştirildi. Sağdaki sohbet panelinden AI ile konuşarak kodunu yazdırabilirsin.</p>
    <button class="btn" onclick="alert('Yapayakıl seni selamlıyor! 🚀')">Başla</button>
  </div>
</body>
</html>`;

function sortNodes(nodes: FileNode[], sortMode: SortMode): FileNode[] {
  const sorted = [...nodes].sort((a, b) => {
    if (sortMode === "type") {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name, "tr");
    }
    if (sortMode === "ext") {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      const extA = a.name.includes(".") ? a.name.split(".").pop()! : "";
      const extB = b.name.includes(".") ? b.name.split(".").pop()! : "";
      if (extA !== extB) return extA.localeCompare(extB, "tr");
      return a.name.localeCompare(b.name, "tr");
    }
    if (sortMode === "name-desc") return b.name.localeCompare(a.name, "tr");
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, "tr");
  });
  return sorted.map((node) =>
    node.type === "folder" && node.children
      ? { ...node, children: sortNodes(node.children, sortMode) }
      : node
  );
}

function buildTreeFromFiles(
  fileList: FileList,
  existingTree: FileNode[],
  fileStore: FileStore
): { tree: FileNode[]; store: FileStore } {
  const newStore = { ...fileStore };
  const files = Array.from(fileList);
  const hasRelativePaths = files.some((f) => f.webkitRelativePath && f.webkitRelativePath.length > 0);

  if (hasRelativePaths) {
    const root: FileNode[] = [...existingTree];
    for (const file of files) {
      const relativePath = file.webkitRelativePath || file.name;
      const parts = relativePath.split("/");
      let currentLevel = root;
      let currentPath = "";
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (i === parts.length - 1) {
          if (!currentLevel.find((n) => n.name === part && n.type === "file")) {
            currentLevel.push({ name: part, type: "file" });
          }
          const reader = new FileReader();
          const filePath = currentPath;
          reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) newStore[filePath] = content;
          };
          reader.readAsText(file);
        } else {
          let folder = currentLevel.find((n) => n.name === part && n.type === "folder");
          if (!folder) {
            folder = { name: part, type: "folder", children: [] };
            currentLevel.push(folder);
          }
          currentLevel = folder.children!;
        }
      }
    }
    return { tree: root, store: newStore };
  } else {
    const root: FileNode[] = [...existingTree];
    for (const file of files) {
      if (!root.find((n) => n.name === file.name && n.type === "file")) {
        root.push({ name: file.name, type: "file" });
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) newStore[file.name] = content;
      };
      reader.readAsText(file);
    }
    return { tree: root, store: newStore };
  }
}

// Custom breakpoint hook: returns 'mobile' (<768), 'tablet' (768-1023), 'desktop' (>=1024)
function useLayoutMode(): "mobile" | "tablet" | "desktop" {
  const [mode, setMode] = useState<"mobile" | "tablet" | "desktop">(() => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  });
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setMode(w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return mode;
}

export default function YapayakilIndex() {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [fileTreeOpen, setFileTreeOpen] = useState<boolean>(false);
  const [activeFile, setActiveFile] = useState<string>("index.html");
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileNode[]>([]);
  const [fileStore, setFileStore] = useState<FileStore>({ "index.html": DEFAULT_CODE });
  const [sortMode, setSortMode] = useState<SortMode>("name-asc");
  const [expanded, setExpanded] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("preview");

  const layoutMode = useLayoutMode();
  const isCompact = layoutMode !== "desktop";

  const {
    isBooted: wcBooted,
    isRunning: wcRunning,
    previewUrl: wcUrl,
    logs: wcLogs,
    error: wcError,
    runProject: wcRunProject,
    stop: wcStop,
  } = useWebContainer();

  const sortedFiles = sortNodes(uploadedFiles, sortMode);

  const handleFileUpload = useCallback((files: FileList) => {
    const { tree, store } = buildTreeFromFiles(files, uploadedFiles, fileStore);
    setUploadedFiles(tree);
    setFileStore(store);
    setFileTreeOpen(true);
    const htmlFile = Array.from(files).find((f) => f.name.endsWith(".html"));
    if (htmlFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          setCode(content);
          setActiveFile(htmlFile.name);
        }
      };
      reader.readAsText(htmlFile);
    }
  }, [uploadedFiles, fileStore]);

  const handleFolderUpload = useCallback((files: FileList) => {
    const { tree, store } = buildTreeFromFiles(files, uploadedFiles, fileStore);
    setUploadedFiles(tree);
    setFileStore(store);
    setFileTreeOpen(true);
  }, [uploadedFiles, fileStore]);

  function handleFileSelect(name: string, path?: string) {
    const filePath = path || name;
    setActiveFile(name);
    const content = fileStore[filePath];
    if (content) setCode(content);
    if (isCompact) {
      setMobileTab("code");
      setFileTreeOpen(false);
    }
  }

  function handleCodeChange(newCode: string) {
    setCode(newCode);
    setFileStore((prev) => ({ ...prev, [activeFile]: newCode }));
  }

  function handleRunProject() {
    if (uploadedFiles.length > 0) {
      wcRunProject(uploadedFiles, fileStore);
    } else {
      const singleTree: FileNode[] = [{ name: "index.html", type: "file" }];
      const singleStore: FileStore = { "index.html": code };
      wcRunProject(singleTree, singleStore);
    }
  }

  function handleStopProject() { wcStop(); }

  // ============ Mobile / Tablet: tab-based stacked layout ============
  if (isCompact) {
    const tabs: { id: MobileTab; label: string; icon: typeof Eye }[] = [
      { id: "preview", label: "Önizleme", icon: Eye },
      { id: "code", label: "Kod", icon: Code2 },
      { id: "chat", label: "Sohbet", icon: MessageSquare },
    ];

    return (
      <div className="yapayakil-root w-full h-full flex flex-col bg-deep overflow-hidden text-foreground">
        <TopBar
          onSettingsOpen={() => setSettingsOpen(true)}
          onFileUpload={handleFileUpload}
          onFolderUpload={handleFolderUpload}
        />

        {/* Mobile tab bar */}
        <div className="flex items-center gap-1 px-2 pt-2 pb-1 bg-panel/40 border-b border-border/40 overflow-x-auto">
          {tabs.map((t) => {
            const active = mobileTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setMobileTab(t.id)}
                className={`flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? "bg-primary/20 text-primary border border-primary/40 shadow-glow-violet"
                    : "bg-secondary/40 text-muted-foreground border border-border/40 hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
          <button
            onClick={() => setFileTreeOpen(true)}
            className="ml-auto flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-medium whitespace-nowrap bg-secondary/40 text-muted-foreground border border-border/40 hover:bg-secondary/60 hover:text-foreground shrink-0"
            title="Dosyalar"
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Dosyalar</span>
            {uploadedFiles.length > 0 && (
              <span className="ml-0.5 text-[9px] px-1 rounded-full bg-primary/20 text-primary">
                {uploadedFiles.length}
              </span>
            )}
          </button>
        </div>

        {/* Active panel */}
        <div className="flex-1 min-h-0 p-2 overflow-hidden">
          <div className={`h-full ${mobileTab === "preview" ? "block" : "hidden"}`}>
            <PreviewPanel
              code={code}
              webContainerUrl={wcUrl}
              isWebContainerRunning={wcRunning}
              webContainerLogs={wcLogs}
              webContainerError={wcError}
              isWebContainerBooted={wcBooted}
              onRunProject={handleRunProject}
              onStopProject={handleStopProject}
            />
          </div>
          <div className={`h-full ${mobileTab === "code" ? "block" : "hidden"}`}>
            <CodeEditor code={code} onChange={handleCodeChange} filename={activeFile} />
          </div>
          <div className={`h-full ${mobileTab === "chat" ? "block" : "hidden"}`}>
            <YapayakilChat onCodeSuggestion={(c) => { setCode(c); setMobileTab("preview"); }} />
          </div>
        </div>

        {/* FileTree overlay (mobile) */}
        {fileTreeOpen && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex" onClick={() => setFileTreeOpen(false)}>
            <div
              className="ml-auto w-[85%] max-w-xs h-full bg-panel border-l border-border/60 shadow-panel-strong flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <MobileFileTree
                files={sortedFiles}
                activeFile={activeFile}
                onSelect={handleFileSelect}
                onClose={() => setFileTreeOpen(false)}
                sortMode={sortMode}
                onSortChange={setSortMode}
              />
            </div>
          </div>
        )}

        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    );
  }

  // ============ Desktop: original split layout ============
  return (
    <div className="yapayakil-root w-full h-full flex flex-col bg-deep overflow-hidden text-foreground">
      <TopBar
        onSettingsOpen={() => setSettingsOpen(true)}
        onFileUpload={handleFileUpload}
        onFolderUpload={handleFolderUpload}
      />

      <div className="flex-1 flex gap-2 p-2 overflow-hidden">
        <div className={`relative min-w-0 transition-all duration-300 ease-in-out ${expanded ? "flex-[3]" : "flex-1"}`}>
          <PreviewPanel
            code={code}
            webContainerUrl={wcUrl}
            isWebContainerRunning={wcRunning}
            webContainerLogs={wcLogs}
            webContainerError={wcError}
            isWebContainerBooted={wcBooted}
            onRunProject={handleRunProject}
            onStopProject={handleStopProject}
          />
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-14 rounded-r-md z-30 flex items-center justify-center transition-all duration-300 ${
              expanded
                ? "bg-primary text-white shadow-glow-violet"
                : "bg-panel border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40"
            }`}
            title={expanded ? "Paneli daralt" : "Önizlemeyi genişlet"}
            aria-label="Toggle preview expand"
          >
            {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <div className={`flex min-w-0 transition-all duration-300 ease-in-out ${expanded ? "flex-col flex-1 gap-2" : "flex-row flex-[2] gap-2"}`}>
          <div className="min-w-0 flex-1">
            <CodeEditor code={code} onChange={handleCodeChange} filename={activeFile} />
          </div>

          <div className={`shrink-0 relative ${expanded ? "h-[280px]" : "w-[380px]"}`}>
            <FileTree
              open={fileTreeOpen}
              onToggle={() => setFileTreeOpen((v) => !v)}
              files={sortedFiles}
              activeFile={activeFile}
              onSelect={handleFileSelect}
              sortMode={sortMode}
              onSortChange={setSortMode}
            />
            <YapayakilChat onCodeSuggestion={setCode} />
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

// ============ Mobile FileTree (simplified overlay version) ============
function MobileFileTree({
  files,
  activeFile,
  onSelect,
  onClose,
  sortMode,
  onSortChange,
}: {
  files: FileNode[];
  activeFile: string;
  onSelect: (name: string, path?: string) => void;
  onClose: () => void;
  sortMode: SortMode;
  onSortChange: (m: SortMode) => void;
}) {
  return (
    <>
      <div className="h-12 flex items-center justify-between px-3 border-b border-border/60">
        <span className="text-sm font-semibold text-foreground/90">Dosyalar</span>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
          aria-label="Kapat"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="px-3 py-2 border-b border-border/40">
        <select
          value={sortMode}
          onChange={(e) => onSortChange(e.target.value as SortMode)}
          className="w-full h-8 px-2 rounded-md bg-secondary/40 border border-border/40 text-xs text-foreground/90 outline-none"
        >
          <option value="name-asc">İsim (A-Z)</option>
          <option value="name-desc">İsim (Z-A)</option>
          <option value="type">Tür</option>
          <option value="ext">Uzantı</option>
        </select>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <p className="px-3 py-8 text-center text-[11px] text-muted-foreground/60">
            Henüz dosya yüklenmedi. Yukarıdaki "Dosya" / "Klasör" butonlarını kullanın.
          </p>
        ) : (
          files.map((node) => (
            <MobileTreeItem
              key={node.name}
              node={node}
              depth={0}
              activeFile={activeFile}
              onSelect={onSelect}
              parentPath=""
            />
          ))
        )}
      </div>
    </>
  );
}

function MobileTreeItem({
  node,
  depth,
  activeFile,
  onSelect,
  parentPath,
}: {
  node: FileNode;
  depth: number;
  activeFile: string;
  onSelect: (name: string, path?: string) => void;
  parentPath: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-foreground/90 hover:bg-secondary/40 active:bg-secondary/60"
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
        >
          <FolderTree className="w-4 h-4 text-primary/80 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children?.map((child) => (
          <MobileTreeItem
            key={child.name}
            node={child}
            depth={depth + 1}
            activeFile={activeFile}
            onSelect={onSelect}
            parentPath={currentPath}
          />
        ))}
      </div>
    );
  }

  const isActive = activeFile === node.name;
  return (
    <button
      onClick={() => onSelect(node.name, currentPath)}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
        isActive ? "bg-primary/20 text-primary" : "hover:bg-secondary/40 text-foreground/80"
      }`}
      style={{ paddingLeft: `${depth * 14 + 12}px` }}
    >
      <Code2 className="w-4 h-4 shrink-0 opacity-70" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
