import React, { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Message {
  role: "user" | "ai";
  text: string;
}

interface RepoFile {
  path: string;
  content: string;
}

interface RepoInfo {
  owner: string;
  repo: string;
  branch: string;
  files: RepoFile[];
  readme: string;
  fetchedAt: string;
}

function parseGithubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  try {
    const u = new URL(url.trim());
    if (!u.hostname.includes("github.com")) return null;
    const parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (parts.length < 2) return null;
    const [owner, repoRaw, , branch] = parts;
    const repo = repoRaw.replace(/\.git$/, "");
    return { owner, repo, branch };
  } catch {
    return null;
  }
}

async function fetchRepo(owner: string, repo: string, branch?: string): Promise<RepoInfo> {
  // Resolve default branch if not given
  let resolvedBranch = branch;
  if (!resolvedBranch) {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!r.ok) throw new Error(`Repo bulunamadı (${r.status})`);
    const meta = await r.json();
    resolvedBranch = meta.default_branch || "main";
  }

  // Get tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${resolvedBranch}?recursive=1`
  );
  if (!treeRes.ok) throw new Error(`Dosya ağacı alınamadı (${treeRes.status})`);
  const tree = await treeRes.json();

  const codeExt = /\.(ts|tsx|js|jsx|py|go|rs|java|c|cpp|h|cs|rb|php|swift|kt|md|json|html|css)$/i;
  const codeFiles = (tree.tree as Array<{ path: string; type: string; size: number }>)
    .filter((f) => f.type === "blob" && codeExt.test(f.path) && f.size < 50_000)
    .slice(0, 30);

  const files: RepoFile[] = [];
  for (const f of codeFiles) {
    try {
      const raw = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${resolvedBranch}/${f.path}`
      );
      if (!raw.ok) continue;
      const content = await raw.text();
      files.push({ path: f.path, content: content.slice(0, 8000) });
    } catch {
      // skip
    }
  }

  const readmeFile = files.find((f) => /readme/i.test(f.path));
  return {
    owner,
    repo,
    branch: resolvedBranch!,
    files,
    readme: readmeFile?.content || "",
    fetchedAt: new Date().toISOString(),
  };
}

function answerFromRepo(question: string, repo: RepoInfo | null): string {
  if (!repo) {
    return "Henüz bir kaynak repo bağlı değil. Üstteki alana GitHub repo URL'sini yapıştırıp 'Bağla' butonuna basın.";
  }
  const q = question.toLowerCase();

  if (/dosya|liste|file|list/.test(q)) {
    const list = repo.files.map((f) => `• ${f.path}`).join("\n");
    return `📂 ${repo.owner}/${repo.repo} (${repo.branch}) içindeki kaynak dosyalar:\n\n${list || "Dosya bulunamadı."}`;
  }
  if (/readme|açıkla|nedir|ne yapar/.test(q) && repo.readme) {
    return `📘 README özeti:\n\n${repo.readme.slice(0, 1200)}${repo.readme.length > 1200 ? "..." : ""}`;
  }

  // Keyword search across files
  const keywords = q.split(/\s+/).filter((w) => w.length > 3);
  const hits: string[] = [];
  for (const f of repo.files) {
    const lc = f.content.toLowerCase();
    for (const kw of keywords) {
      const idx = lc.indexOf(kw);
      if (idx !== -1) {
        const snippet = f.content.slice(Math.max(0, idx - 80), idx + 200);
        hits.push(`📄 ${f.path}\n…${snippet}…`);
        break;
      }
    }
    if (hits.length >= 3) break;
  }

  if (hits.length) {
    return `🔍 ${repo.owner}/${repo.repo} içinde bulduklarım:\n\n${hits.join("\n\n")}`;
  }
  return `Sorunuzla ilgili bir şey bulamadım. ${repo.files.length} dosya yüklü. "dosyaları listele" veya "readme" yazmayı deneyin.`;
}

const YapayAkilApp: React.FC = () => {
  const [repoUrl, setRepoUrl] = useLocalStorage<string>("yapayakil-repo-url", "");
  const [repo, setRepo] = useLocalStorage<RepoInfo | null>("yapayakil-repo-data", null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text:
        "Merhaba! Ben Yapay Akıl. Bana bir GitHub repo URL'si verirseniz oradaki kaynak kodu okuyup sorularınızı yanıtlayabilirim.",
    },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (repo) {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: `✅ Bağlı repo: ${repo.owner}/${repo.repo} (${repo.branch}) — ${repo.files.length} dosya hazır.`,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async () => {
    setError(null);
    const parsed = parseGithubUrl(repoUrl);
    if (!parsed) {
      setError("Geçerli bir GitHub URL girin (örn: https://github.com/kullanici/depo)");
      return;
    }
    setLoading(true);
    try {
      const info = await fetchRepo(parsed.owner, parsed.repo, parsed.branch);
      setRepo(info);
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: `✅ ${info.owner}/${info.repo} bağlandı. ${info.files.length} dosya yüklendi. Bir şey sorabilirsin!`,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTimeout(() => {
      const reply = answerFromRepo(text, repo);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    }, 300);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-violet-50 to-indigo-50">
      <div className="px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <div className="flex-1">
          <div className="text-sm font-bold">Yapay Akıl</div>
          <div className="text-[10px] opacity-80">
            {repo ? `${repo.owner}/${repo.repo}` : "Kaynak repo bağlı değil"}
          </div>
        </div>
      </div>

      {/* Repo connect bar */}
      <div className="p-2 bg-white border-b border-violet-200 flex flex-col gap-1">
        <div className="flex gap-1">
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/kullanici/depo"
            className="flex-1 text-[11px] px-2 py-1 rounded border border-violet-200 bg-violet-50 outline-none text-black"
          />
          <button
            onClick={connect}
            disabled={loading}
            className="px-3 py-1 text-[11px] bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "..." : "Bağla"}
          </button>
        </div>
        {error && <div className="text-[10px] text-red-600">{error}</div>}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-[12px] whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-violet-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-violet-100 rounded-bl-sm"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-violet-200 bg-white flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Bir şey sorun... (örn: dosyaları listele)"
          className="flex-1 text-[12px] px-3 py-2 rounded-full border border-violet-200 bg-violet-50 outline-none focus:border-violet-400 text-black"
        />
        <button
          onClick={send}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[12px] rounded-full hover:opacity-90"
        >
          Gönder
        </button>
      </div>
    </div>
  );
};

export default YapayAkilApp;
