import { Sparkles, Play, Save, Settings, Plus, FolderUp } from "lucide-react";
import { useRef } from "react";

interface TopBarProps {
  onSettingsOpen: () => void;
  onFileUpload: (files: FileList) => void;
  onFolderUpload: (files: FileList) => void;
}

export default function TopBar({ onSettingsOpen, onFileUpload, onFolderUpload }: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  function handleFileClick() {
    fileInputRef.current?.click();
  }

  function handleFolderClick() {
    folderInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
      e.target.value = "";
    }
  }

  function handleFolderChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onFolderUpload(e.target.files);
      e.target.value = "";
    }
  }

  return (
    <header className="h-12 bg-panel border-b border-border/60 shadow-panel flex items-center justify-between px-2 sm:px-4 gap-2 relative z-30">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg gradient-yapayakil flex items-center justify-center shadow-glow-violet shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-sm font-semibold gradient-yapayakil-text truncate">Yapayakıl</span>
          <span className="hidden xs:inline text-[10px] text-muted-foreground -mt-0.5 truncate">WebOS Code Editor</span>
        </div>
        <div className="hidden lg:flex items-center gap-1 ml-6 text-xs text-muted-foreground">
          <span className="px-2 py-0.5 rounded-md bg-secondary/60 border border-border/50">project / index.html</span>
        </div>
        <div className="hidden lg:flex items-center gap-1 ml-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/40 text-primary bg-primary/10">
            📚 Kütüphane Modu
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Folder upload button */}
        <button
          onClick={handleFolderClick}
          className="text-xs px-2 sm:px-3 h-8 rounded-md bg-secondary/60 hover:bg-secondary text-foreground/80 hover:text-foreground border border-border/50 transition-colors flex items-center gap-1.5"
          title="Klasör yükle"
        >
          <FolderUp className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Klasör</span>
        </button>
        <input
          ref={folderInputRef}
          type="file"
          className="hidden"
          onChange={handleFolderChange}
          {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
          multiple
        />

        {/* File upload button */}
        <button
          onClick={handleFileClick}
          className="text-xs px-2 sm:px-3 h-8 rounded-md bg-secondary/60 hover:bg-secondary text-foreground/80 hover:text-foreground border border-border/50 transition-colors flex items-center gap-1.5"
          title="Yerelden dosya yükle"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Dosya</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          className="hidden sm:flex text-xs px-2 sm:px-3 h-8 rounded-md bg-secondary/60 hover:bg-secondary text-foreground/80 hover:text-foreground border border-border/50 transition-colors items-center gap-1.5"
          title="Kaydet"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Kaydet</span>
        </button>
        <button
          className="text-xs px-2 sm:px-3 h-8 rounded-md gradient-yapayakil text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-glow-violet"
          title="Çalıştır"
        >
          <Play className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Çalıştır</span>
        </button>
        <button
          onClick={onSettingsOpen}
          className="w-8 h-8 rounded-md hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center shrink-0"
          title="Ayarlar"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
