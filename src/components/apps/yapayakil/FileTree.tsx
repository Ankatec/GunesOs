import { useState } from "react";
import { ChevronLeft, Folder, FolderOpen, File, FileCode2, FileJson, FileText, Plus, Search, ArrowUpDown } from "lucide-react";
import { SortMode } from "@/components/apps/yapayakil/YapayakilIndex";

export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

interface FileTreeProps {
  open: boolean;
  onToggle: () => void;
  files: FileNode[];
  activeFile: string;
  onSelect: (name: string, path?: string) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
}

function getFileIcon(name: string) {
  if (name.endsWith(".html") || name.endsWith(".tsx") || name.endsWith(".jsx") || name.endsWith(".js") || name.endsWith(".ts"))
    return <FileCode2 className="w-3.5 h-3.5 text-blue-400" />;
  if (name.endsWith(".json")) return <FileJson className="w-3.5 h-3.5 text-yellow-400" />;
  if (name.endsWith(".css")) return <FileCode2 className="w-3.5 h-3.5 text-pink-400" />;
  if (name.endsWith(".md")) return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
  return <File className="w-3.5 h-3.5 text-muted-foreground" />;
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "name-asc", label: "İsim (A-Z)" },
  { value: "name-desc", label: "İsim (Z-A)" },
  { value: "type", label: "Tür (Klasör önce)" },
  { value: "ext", label: "Uzantı" },
];

function TreeNode({
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
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-secondary/50 text-left text-xs text-foreground/90 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {expanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-primary/80" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-primary/80" />
          )}
          <span className="truncate">{node.name}</span>
          {node.children && (
            <span className="ml-auto text-[9px] text-muted-foreground/60">{node.children.length}</span>
          )}
        </button>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.name}
                node={child}
                depth={depth + 1}
                activeFile={activeFile}
                onSelect={onSelect}
                parentPath={currentPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activeFile === node.name;
  return (
    <button
      onClick={() => onSelect(node.name, currentPath)}
      className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-xs transition-colors ${
        isActive
          ? "bg-primary/20 text-primary border border-primary/30"
          : "hover:bg-secondary/50 text-foreground/80"
      }`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export default function FileTree({ open, onToggle, files, activeFile, onSelect, sortMode, onSortChange }: FileTreeProps) {
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter files based on search query
  function filterNodes(nodes: FileNode[], query: string): FileNode[] {
    if (!query) return nodes;
    return nodes.reduce<FileNode[]>((acc, node) => {
      if (node.type === "file") {
        if (node.name.toLowerCase().includes(query.toLowerCase())) {
          acc.push(node);
        }
      } else if (node.type === "folder") {
        const filteredChildren = filterNodes(node.children || [], query);
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(query.toLowerCase())) {
          acc.push({ ...node, children: filteredChildren.length > 0 ? filteredChildren : node.children });
        }
      }
      return acc;
    }, []);
  }

  const filteredFiles = filterNodes(files, searchQuery);

  return (
    <>
      {/* Toggle button - always visible on the left edge of chat panel */}
      <button
        onClick={onToggle}
        className={`absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 w-6 h-14 rounded-l-md rounded-r-none z-30 flex items-center justify-center transition-all duration-300 ${
          open
            ? "bg-primary text-white shadow-glow-violet"
            : "bg-panel border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40"
        }`}
        title={open ? "Dosya ağacını kapat" : "Dosya ağacını aç"}
        aria-label="Toggle file tree"
      >
        <ChevronLeft
          className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Sliding panel - opens to the LEFT from the chat panel */}
      <div
        className={`absolute top-2 bottom-2 right-full mr-2 w-64 bg-panel rounded-xl border border-border/60 z-20 overflow-hidden transition-all duration-300 ease-out ${
          open
            ? "opacity-100 translate-x-0 shadow-panel-strong"
            : "opacity-0 translate-x-4 pointer-events-none"
        }`}
        style={{
          boxShadow: open
            ? "0 20px 50px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,92,255,0.15), -10px 0 40px -10px rgba(124,92,255,0.2)"
            : undefined,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-10 flex items-center justify-between px-3 border-b border-border/60">
            <span className="text-xs font-semibold text-foreground/90 uppercase tracking-wider">
              Dosyalar
            </span>
            <div className="flex items-center gap-1">
              {/* Sort button */}
              <div className="relative">
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="w-6 h-6 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                  title="Sırala"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
                {sortDropdownOpen && (
                  <div className="absolute right-0 top-7 w-36 bg-panel border border-border/60 rounded-lg shadow-xl z-50 py-1">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          onSortChange(opt.value);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${
                          sortMode === opt.value
                            ? "bg-primary/15 text-primary"
                            : "text-foreground/80 hover:bg-secondary/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="w-6 h-6 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                title="Yeni dosya"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-border/40">
            <div className="flex items-center gap-1.5 h-7 px-2 rounded-md bg-secondary/40 border border-border/40">
              <Search className="w-3 h-3 text-muted-foreground" />
              <input
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto py-1">
            {filteredFiles.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-[11px] text-muted-foreground/60">
                  {files.length === 0 ? "Henüz dosya yüklenmedi. Üstteki \"Dosya\" veya \"Klasör\" butonunu kullanın." : "Sonuç bulunamadı"}
                </p>
              </div>
            ) : (
              filteredFiles.map((node) => (
                <TreeNode
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

          {/* Footer */}
          <div className="h-8 px-3 flex items-center border-t border-border/60 text-[10px] text-muted-foreground">
            <span>{countFiles(files)} dosya</span>
          </div>
        </div>
      </div>
    </>
  );
}

function countFiles(nodes: FileNode[]): number {
  let count = 0;
  for (const n of nodes) {
    if (n.type === "file") count++;
    if (n.children) count += countFiles(n.children);
  }
  return count;
}