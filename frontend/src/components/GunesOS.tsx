import React, { useState, useCallback, useEffect } from "react";
import BootScreen from "./BootScreen";
import Desktop, { type AppId, type FileItem } from "./Desktop";
import Taskbar from "./Taskbar";
import WindowFrame from "./WindowFrame";
import Notepad from "./apps/Notepad";
import TerminalApp from "./apps/Terminal";
import Minesweeper from "./apps/Minesweeper";
import BrowserApp from "./apps/Browser";
import KidsGames from "./apps/KidsGames";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

const appConfig: Record<string, { title: string; width: number; height: number }> = {
  mycomputer: { title: "Bilgisayarım", width: 500, height: 400 },
  browser: { title: "EGA Tarayıcı", width: 700, height: 500 },
  notepad: { title: "Not Defteri", width: 500, height: 400 },
  terminal: { title: "Terminal", width: 600, height: 400 },
  minesweeper: { title: "Mayın Tarlası", width: 320, height: 420 },
  paint: { title: "Paint", width: 600, height: 450 },
  music: { title: "Müziklerim", width: 400, height: 300 },
  files: { title: "Dosya Gezgini", width: 550, height: 400 },
  trash: { title: "Çöp Kutusu", width: 400, height: 300 },
  settings: { title: "Ayarlar", width: 450, height: 400 },
  kidsgames: { title: "Oyun Merkezi", width: 420, height: 500 },
};

function useResponsive() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return { isMobile: size.w < 640, isTablet: size.w >= 640 && size.w < 1024, isDesktop: size.w >= 1024 };
}

const GunesOS: React.FC = () => {
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZ, setNextZ] = useState(100);
  const [windowZMap, setWindowZMap] = useState<Record<string, number>>({});
  const [files, setFiles] = useLocalStorage<FileItem[]>("gunesOS-files", []);
  const { isMobile, isTablet } = useResponsive();

  const addFile = useCallback((file: FileItem) => {
    setFiles((prev) => [...prev, file]);
  }, [setFiles]);

  const openApp = useCallback(
    (appId: AppId) => {
      const config = appConfig[appId] || { title: appId, width: 500, height: 400 };
      const offset = (windows.length % 6) * 25;
      const id = `${appId}-${Date.now()}`;

      let width = config.width;
      let height = config.height;
      let x = 60 + offset;
      let y = 30 + offset;

      if (isMobile) {
        width = window.innerWidth;
        height = window.innerHeight - 40;
        x = 0;
        y = 0;
      } else if (isTablet) {
        width = Math.min(config.width, window.innerWidth - 20);
        height = Math.min(config.height, window.innerHeight - 60);
        x = 10;
        y = 10;
      }

      const newWindow: WindowState = {
        id, appId, title: config.title,
        isMinimized: false, isMaximized: isMobile,
        x, y, width, height,
      };
      setWindows((prev) => [...prev, newWindow]);
      setActiveWindowId(id);
      setWindowZMap((prev) => ({ ...prev, [id]: nextZ }));
      setNextZ((z) => z + 1);
    },
    [windows.length, nextZ, isMobile, isTablet]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const minimizeWindow = useCallback(
    (id: string) => {
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
      if (activeWindowId === id) setActiveWindowId(null);
    },
    [activeWindowId]
  );

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)));
  }, []);

  const focusWindow = useCallback(
    (id: string) => {
      setActiveWindowId(id);
      setWindowZMap((prev) => ({ ...prev, [id]: nextZ }));
      setNextZ((z) => z + 1);
    },
    [nextZ]
  );

  const handleTaskbarWindowClick = useCallback(
    (id: string) => {
      const win = windows.find((w) => w.id === id);
      if (!win) return;
      if (win.isMinimized) {
        setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: false } : w)));
        focusWindow(id);
      } else if (activeWindowId === id) {
        minimizeWindow(id);
      } else {
        focusWindow(id);
      }
    },
    [windows, activeWindowId, focusWindow, minimizeWindow]
  );

  const handleTerminalCommand = useCallback(
    (cmd: string, args: string) => {
      if (cmd === "close") {
        const termWin = windows.find((w) => w.appId === "terminal" && activeWindowId === w.id);
        if (termWin) closeWindow(termWin.id);
      } else if (cmd === "open") {
        openApp(args as AppId);
      }
    },
    [windows, activeWindowId, closeWindow, openApp]
  );

  const handleSaveFile = useCallback(
    (name: string, content: string) => {
      const existing = files.find((f) => f.name === name && f.type === "document");
      if (existing) {
        setFiles((prev) => prev.map((f) => (f.id === existing.id ? { ...f, content } : f)));
      } else {
        addFile({
          id: `doc-${Date.now()}`,
          name,
          type: "document",
          content,
          createdAt: new Date().toISOString(),
        });
      }
    },
    [files, setFiles, addFile]
  );

  const renderAppContent = (appId: AppId) => {
    switch (appId) {
      case "notepad":
        return <Notepad onSaveFile={handleSaveFile} />;
      case "terminal":
        return <TerminalApp onSystemCommand={handleTerminalCommand} />;
      case "minesweeper":
        return <Minesweeper />;
      case "browser":
        return <BrowserApp isMobile={isMobile} />;
      case "kidsgames":
        return <KidsGames />;
      case "mycomputer":
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            {[
              { name: "Yerel Disk (C:)", emoji: "💾", info: "45.2 GB boş / 120 GB" },
              { name: "DVD Sürücü (D:)", emoji: "💿", info: "Disk yok" },
              { name: "Belgelerim", emoji: "📁", info: `${files.length} öğe` },
              { name: "Denetim Masası", emoji: "⚙️", info: "Sistem ayarları" },
            ].map((item) => (
              <div key={item.name} className="flex flex-col items-center gap-1 p-3 rounded hover:bg-blue-50 cursor-pointer">
                <span className="text-3xl">{item.emoji}</span>
                <span className="text-[11px] text-center font-medium">{item.name}</span>
                <span className="text-[9px] text-gray-500">{item.info}</span>
              </div>
            ))}
          </div>
        );
      case "paint":
        return <PaintApp />;
      case "music":
        return (
          <div className="p-4 flex flex-col items-center justify-center h-full bg-gradient-to-b from-purple-50 to-white">
            <span className="text-5xl mb-4">🎵</span>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Müziklerim</h3>
            <p className="text-sm text-gray-500">Henüz müzik dosyası yok.</p>
            <div className="mt-4 flex gap-2">
              {["⏮", "▶️", "⏭"].map((btn) => (
                <button key={btn} className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-lg hover:bg-purple-200">{btn}</button>
              ))}
            </div>
          </div>
        );
      case "files":
        return (
          <div className="p-3 overflow-auto h-full">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
              <span className="text-sm">📁</span>
              <span className="text-[12px] text-gray-600">C:\GüneşOS\Belgelerim</span>
            </div>
            {files.length === 0 ? (
              <p className="text-sm text-gray-400 text-center mt-8">Klasör boş</p>
            ) : (
              files.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-2 py-1 hover:bg-blue-50 cursor-pointer rounded">
                  <span>{item.type === "folder" ? "📁" : "📄"}</span>
                  <span className="text-[12px] flex-1">{item.name}</span>
                  <span className="text-[10px] text-gray-400">{item.type === "folder" ? "Klasör" : "Belge"}</span>
                </div>
              ))
            )}
          </div>
        );
      case "trash":
        return (
          <div className="flex flex-col items-center justify-center h-full bg-white">
            <span className="text-5xl mb-4">🗑️</span>
            <p className="text-sm text-gray-500">Çöp kutusu boş.</p>
          </div>
        );
      case "settings":
        return <SettingsApp isMobile={isMobile} isTablet={isTablet} />;
      default:
        return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Yükleniyor...</p></div>;
    }
  };

  if (!booted) {
    return <BootScreen onComplete={() => setBooted(true)} />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#008080] select-none" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Desktop onOpenApp={openApp} isMobile={isMobile} isTablet={isTablet} files={files} onAddFile={addFile} />

      {windows.map((win) => (
        <WindowFrame
          key={win.id}
          id={win.id}
          title={win.title}
          isActive={activeWindowId === win.id}
          isMinimized={win.isMinimized}
          isMaximized={win.isMaximized || isMobile}
          initialX={win.x}
          initialY={win.y}
          initialWidth={win.width}
          initialHeight={win.height}
          zIndex={windowZMap[win.id] || 100}
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
          onFocus={() => focusWindow(win.id)}
        >
          {renderAppContent(win.appId)}
        </WindowFrame>
      ))}

      <Taskbar
        openWindows={windows.map((w) => ({
          id: w.id, appId: w.appId, title: w.title,
          isMinimized: w.isMinimized, isActive: activeWindowId === w.id,
        }))}
        onWindowClick={handleTaskbarWindowClick}
        onOpenApp={openApp}
        isMobile={isMobile}
        isTablet={isTablet}
      />
    </div>
  );
};

// Settings App
const SettingsApp: React.FC<{ isMobile: boolean; isTablet: boolean }> = ({ isMobile, isTablet }) => {
  const deviceType = isMobile ? "📱 Telefon" : isTablet ? "📱 Tablet" : "🖥️ Masaüstü";
  return (
    <div className="p-4 overflow-auto h-full">
      <h2 className="text-lg font-bold text-[#000080] mb-4">⚙️ Ayarlar</h2>
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded border">
          <h3 className="text-sm font-bold mb-1">Cihaz Bilgisi</h3>
          <p className="text-[12px] text-gray-600">Mod: {deviceType}</p>
          <p className="text-[12px] text-gray-600">Ekran: {window.innerWidth} × {window.innerHeight}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded border">
          <h3 className="text-sm font-bold mb-1">Sistem</h3>
          <p className="text-[12px] text-gray-600">GüneşOS Sürüm 1.0</p>
          <p className="text-[12px] text-gray-600">Çekirdek: GüneşKernel 5.0</p>
        </div>
        <div className="p-3 bg-gray-50 rounded border">
          <h3 className="text-sm font-bold mb-1">Depolama</h3>
          <p className="text-[12px] text-gray-600">Kullanılan: {(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB</p>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="mt-2 px-3 py-1 text-[11px] bg-red-500 text-white rounded hover:bg-red-600"
          >
            Verileri Temizle
          </button>
        </div>
        {(isMobile || isTablet) && (
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <h3 className="text-sm font-bold mb-1 text-blue-800">
              {isMobile ? "📱 Telefon Modu" : "📱 Tablet Modu"}
            </h3>
            <p className="text-[12px] text-blue-600">
              {isMobile
                ? "Pencereler tam ekran açılır. Başlat menüsü ızgara görünümündedir."
                : "Pencereler ekrana sığacak şekilde boyutlandırılır."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Paint App
const PaintApp: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const colors = ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff", "#808080", "#800000"];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-2 p-1 bg-[#e0e0e0] border-b border-[#a0a0a0] flex-wrap">
        <div className="flex gap-[2px]">
          {colors.map((c) => (
            <button key={c} className={`w-5 h-5 border ${color === c ? "border-black border-2" : "border-gray-400"}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
          ))}
        </div>
        <select value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="text-[11px] border border-gray-400 bg-white px-1">
          {[1, 2, 3, 5, 8, 12].map((s) => (<option key={s} value={s}>{s}px</option>))}
        </select>
        <button onClick={clearCanvas} className="text-[11px] px-2 py-[2px] bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] hover:bg-[#d0d0d0]">Temizle</button>
      </div>
      <canvas ref={canvasRef} className="flex-1 cursor-crosshair" onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} />
    </div>
  );
};

export default GunesOS;