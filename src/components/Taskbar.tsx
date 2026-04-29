import React, { useState, useEffect } from "react";
import type { AppId } from "./Desktop";

interface OpenWindow {
  id: string;
  appId: AppId;
  title: string;
  isMinimized: boolean;
  isActive: boolean;
}

interface TaskbarProps {
  openWindows: OpenWindow[];
  onWindowClick: (id: string) => void;
  onOpenApp: (appId: AppId) => void;
  isMobile: boolean;
  isTablet: boolean;
}

const Taskbar: React.FC<TaskbarProps> = ({ openWindows, onWindowClick, onOpenApp, isMobile, isTablet }) => {
  const [time, setTime] = useState(new Date());
  const [startOpen, setStartOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const startMenuItems: { label: string; emoji: string; appId?: AppId }[] = [
    { label: "Bilgisayarım", emoji: "🖥️", appId: "mycomputer" },
    { label: "Tarayıcı", emoji: "🌐", appId: "browser" },
    { label: "Not Defteri", emoji: "📝", appId: "notepad" },
    { label: "Terminal", emoji: "⬛", appId: "terminal" },
    { label: "Oyun Merkezi", emoji: "🧩", appId: "kidsgames" },
    { label: "Mayın Tarlası", emoji: "💣", appId: "minesweeper" },
    { label: "Paint", emoji: "🎨", appId: "paint" },
    { label: "Ayarlar", emoji: "⚙️", appId: "settings" },
  ];

  const compact = isMobile || isTablet;

  return (
    <>
      {startOpen && (
        <div className="fixed inset-0 z-[8998]" onClick={() => setStartOpen(false)} />
      )}

      {startOpen && (
        <div
          className={`fixed z-[8999] bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-lg flex ${
            isMobile ? "bottom-10 left-0 right-0" : "bottom-10 left-0 min-w-[220px]"
          }`}
        >
          {!isMobile && (
            <div className="w-6 bg-gradient-to-t from-[#000080] to-[#1084d0] flex items-end justify-center pb-2">
              <span className="text-white text-[10px] font-bold [writing-mode:vertical-lr] rotate-180 tracking-widest">
                GüneşOS
              </span>
            </div>
          )}
          <div className={`flex-1 py-1 ${isMobile ? "grid grid-cols-4 gap-1 p-2" : ""}`}>
            {startMenuItems.map((item) => (
              <button
                key={item.label}
                className={`flex items-center gap-2 text-[12px] text-black hover:bg-[#000080] hover:text-white ${
                  isMobile
                    ? "flex-col p-2 rounded"
                    : "w-full px-3 py-[6px]"
                }`}
                onClick={() => {
                  if (item.appId) onOpenApp(item.appId);
                  setStartOpen(false);
                }}
              >
                <span className={isMobile ? "text-2xl" : "text-lg"}>{item.emoji}</span>
                <span className={isMobile ? "text-[10px]" : ""}>{item.label}</span>
              </button>
            ))}
            {!isMobile && (
              <>
                <div className="border-t border-[#808080] my-1 mx-2" />
                <button
                  className="w-full flex items-center gap-2 px-3 py-[6px] text-[12px] text-black hover:bg-[#000080] hover:text-white"
                  onClick={() => window.location.reload()}
                >
                  <span className="text-lg">🔌</span>
                  <span>Kapat</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className={`fixed bottom-0 left-0 right-0 bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 gap-1 z-[9000] select-none ${
        compact ? "h-10" : "h-10"
      }`}>
        <button
          className={`h-7 px-2 flex items-center gap-1 font-bold text-[12px] border-2 shrink-0 ${
            startOpen
              ? "border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#b0b0b0]"
              : "border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#c0c0c0] hover:bg-[#d0d0d0]"
          }`}
          onClick={() => setStartOpen(!startOpen)}
        >
          <span className="text-sm">☀️</span>
          {!isMobile && <span className="text-black">Başlat</span>}
        </button>

        <div className="w-[2px] h-6 bg-[#808080] border-r border-white mx-1 shrink-0" />

        <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-none">
          {openWindows.map((win) => (
            <button
              key={win.id}
              className={`h-7 px-2 flex items-center gap-1 text-[11px] truncate border-2 shrink-0 ${
                compact ? "min-w-[80px] max-w-[100px]" : "min-w-[120px] max-w-[160px]"
              } ${
                win.isActive && !win.isMinimized
                  ? "border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#b0b0b0]"
                  : "border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#c0c0c0] hover:bg-[#d0d0d0]"
              }`}
              onClick={() => onWindowClick(win.id)}
            >
              <span className="truncate text-black">{compact ? win.title.slice(0, 8) : win.title}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center h-7 px-2 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white gap-1 shrink-0">
          {!isMobile && <span className="text-[11px] text-black">🔊</span>}
          <span className="text-[11px] text-black font-mono">
            {time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </>
  );
};

export default Taskbar;