import { RefreshCw, Maximize2, Minimize2, Monitor, Smartphone, Play, Square, Terminal as TerminalIcon } from "lucide-react";
import { useState, useMemo, useRef } from "react";

interface PreviewPanelProps {
  code: string;
  webContainerUrl?: string | null;
  isWebContainerRunning?: boolean;
  webContainerLogs?: string[];
  webContainerError?: string | null;
  isWebContainerBooted?: boolean;
  onRunProject?: () => void;
  onStopProject?: () => void;
}

export default function PreviewPanel({
  code,
  webContainerUrl,
  isWebContainerRunning,
  webContainerLogs = [],
  webContainerError,
  isWebContainerBooted,
  onRunProject,
  onStopProject,
}: PreviewPanelProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [reloadKey, setReloadKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const srcDoc = useMemo(() => code, [code]);

  // Use WebContainer URL if running, otherwise srcDoc
  const useWebContainer = isWebContainerRunning && webContainerUrl;

  function toggleFullscreen() {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }

  // Listen for fullscreen exit via Escape
  useState(() => {
    function handleFSChange() {
      if (!document.fullscreenElement) {
        setFullscreen(false);
      }
    }
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  });

  return (
    <section
      ref={containerRef}
      className="h-full flex flex-col bg-panel rounded-xl shadow-panel-strong overflow-hidden border border-border/60"
    >
      {/* Header */}
      <div className="h-11 flex items-center justify-between px-3 border-b border-border/60 bg-gradient-to-b from-[#151a2b] to-[#10152300]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 shadow-sm" />
          </div>
          <span className="ml-3 text-xs text-muted-foreground font-medium">
            Önizleme
            {useWebContainer && (
              <span className="ml-2 text-[10px] text-green-400 font-semibold">● WebContainer</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Run / Stop buttons */}
          {onRunProject && (
            <>
              {!isWebContainerRunning ? (
                <button
                  onClick={onRunProject}
                  disabled={!isWebContainerBooted}
                  className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    isWebContainerBooted
                      ? "bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30"
                      : "bg-secondary/40 text-muted-foreground cursor-not-allowed border border-border/40"
                  }`}
                  title={isWebContainerBooted ? "Projeyi çalıştır" : "WebContainer yükleniyor..."}
                >
                  <Play className="w-3 h-3" />
                  <span>Çalıştır</span>
                </button>
              ) : (
                <button
                  onClick={onStopProject}
                  className="h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 transition-colors"
                  title="Durdur"
                >
                  <Square className="w-3 h-3" />
                  <span>Durdur</span>
                </button>
              )}
            </>
          )}

          {/* Logs toggle */}
          <button
            onClick={() => setShowLogs((v) => !v)}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              showLogs ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary/60"
            }`}
            title="Terminal logları"
          >
            <TerminalIcon className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-border mx-1" />

          <button
            onClick={() => setDevice("desktop")}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              device === "desktop" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary/60"
            }`}
            title="Masaüstü"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              device === "mobile" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary/60"
            }`}
            title="Mobil"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="w-7 h-7 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
            title="Yenile"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-7 h-7 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
            title={fullscreen ? "Tam ekrandan çık" : "Tam ekran"}
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* URL bar */}
      <div className="h-8 px-3 flex items-center gap-2 border-b border-border/60 bg-[#0e1322]">
        <div className="flex-1 h-6 rounded-md bg-secondary/40 border border-border/40 flex items-center px-2">
          <span className="text-[10px] text-muted-foreground font-mono">
            {useWebContainer ? webContainerUrl : "webos://preview/index.html"}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {webContainerError && (
        <div className="px-3 py-2 bg-red-900/30 border-b border-red-500/30 text-xs text-red-300">
          ⚠️ {webContainerError}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Iframe */}
        <div className={`flex-1 bg-[#0b1020] p-2 sm:p-4 flex items-center justify-center overflow-auto ${showLogs ? "h-[60%]" : ""}`}>
          <div
            className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
              device === "mobile"
                ? "w-full max-w-[375px] h-full max-h-[667px] aspect-[375/667]"
                : "w-full h-full"
            }`}
            style={{
              boxShadow:
                "0 25px 60px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,92,255,0.1), 0 0 40px -10px rgba(124,92,255,0.25)",
            }}
          >
            {useWebContainer ? (
              <iframe
                key={reloadKey}
                src={webContainerUrl}
                title="preview-webcontainer"
                className="w-full h-full border-0"
              />
            ) : (
              <iframe
                key={reloadKey}
                srcDoc={srcDoc}
                title="preview"
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full border-0"
              />
            )}
          </div>
        </div>

        {/* Logs panel */}
        {showLogs && (
          <div className="h-[200px] border-t border-border/60 bg-[#0a0e1a] flex flex-col">
            <div className="h-7 flex items-center px-3 border-b border-border/40 bg-[#0e1322]">
              <TerminalIcon className="w-3 h-3 text-muted-foreground mr-2" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Terminal</span>
              <span className="ml-auto text-[9px] text-muted-foreground/60">{webContainerLogs.length} satır</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] text-green-300/80 leading-relaxed">
              {webContainerLogs.length === 0 ? (
                <span className="text-muted-foreground/50">Henüz log yok. "Çalıştır" butonuna basın.</span>
              ) : (
                webContainerLogs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap break-all">
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}