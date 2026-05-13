import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface WindowFrameProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  zIndex: number;
  nostalgiaMode: boolean;
  appId?: string;
}

const WindowFrame: React.FC<WindowFrameProps> = ({
  title,
  icon,
  children,
  isActive,
  isMinimized,
  isMaximized,
  initialX = 100,
  initialY = 80,
  initialWidth = 640,
  initialHeight = 480,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  zIndex,
  nostalgiaMode,
  appId,
}) => {
  const { theme } = useTheme();
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight });
  const [prevState, setPrevState] = useState({ x: initialX, y: initialY, w: initialWidth, h: initialHeight });
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    if (openMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  const menuItems: Record<string, { label: string; action: () => void; shortcut?: string }[]> = {
    Dosya: [
      { label: "Yeni", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+N" },
      { label: "Aç...", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+O" },
      { label: "Kaydet", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+S" },
      { label: "─", action: () => {}, },
      { label: "Kapat", action: () => { setOpenMenu(null); onClose(); }, shortcut: "Alt+F4" },
    ],
    Düzenle: [
      { label: "Geri Al", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+Z" },
      { label: "Yinele", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+Y" },
      { label: "─", action: () => {}, },
      { label: "Kes", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+X" },
      { label: "Kopyala", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+C" },
      { label: "Yapıştır", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+V" },
      { label: "Tümünü Seç", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+A" },
    ],
    Yardım: [
      { label: `${title} Hakkında`, action: () => { setOpenMenu(null); alert(`☀️ ${title}\nGüneşOS v1.0.2026`); } },
      { label: "GüneşOS Hakkında", action: () => { setOpenMenu(null); alert("☀️ GüneşOS v1.0.2026\nÇocuklar için İşletim Sistemi\n© 2026 GüneşOS"); } },
    ],
  };

  // App-specific menu additions
  if (appId === "terminal") {
    menuItems.Dosya = [
      { label: "Yeni Sekme", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+T" },
      { label: "─", action: () => {} },
      ...menuItems.Dosya,
    ];
  } else if (appId === "notepad") {
    menuItems.Dosya = [
      { label: "Yeni", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+N" },
      { label: "Kaydet", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+S" },
      { label: "─", action: () => {} },
      { label: "Kapat", action: () => { setOpenMenu(null); onClose(); }, shortcut: "Alt+F4" },
    ];
    menuItems.Düzenle = [
      { label: "Geri Al", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+Z" },
      { label: "─", action: () => {} },
      { label: "Kes", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+X" },
      { label: "Kopyala", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+C" },
      { label: "Yapıştır", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+V" },
      { label: "─", action: () => {} },
      { label: "Tümünü Seç", action: () => { setOpenMenu(null); }, shortcut: "Ctrl+A" },
      { label: "Sözcük Kaydır", action: () => { setOpenMenu(null); } },
    ];
    menuItems.Biçim = [
      { label: "Yazı Tipi...", action: () => { setOpenMenu(null); } },
      { label: "Satır Numaraları", action: () => { setOpenMenu(null); } },
    ];
  }

  useEffect(() => {
    if (isMaximized) {
      setPrevState({ x: pos.x, y: pos.y, w: size.w, h: size.h });
      setPos({ x: 0, y: 0 });
      setSize({ w: window.innerWidth, h: window.innerHeight - 40 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMaximized]);

  const handleMouseDownDrag = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
      e.preventDefault();
      onFocus();
      dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };

      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        setPos({ x: dragRef.current.origX + dx, y: Math.max(0, dragRef.current.origY + dy) });
      };
      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [isMaximized, pos, onFocus]
  );

  const handleMouseDownResize = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      onFocus();
      resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h };

      const handleMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const dw = ev.clientX - resizeRef.current.startX;
        const dh = ev.clientY - resizeRef.current.startY;
        setSize({
          w: Math.max(300, resizeRef.current.origW + dw),
          h: Math.max(200, resizeRef.current.origH + dh),
        });
      };
      const handleUp = () => {
        resizeRef.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [isMaximized, size, onFocus]
  );

  const handleRestore = () => {
    if (isMaximized) {
      setPos({ x: prevState.x, y: prevState.y });
      setSize({ w: prevState.w, h: prevState.h });
    }
    onMaximize();
  };

  // Modern phone/tablet fullscreen mode (when nostalgia is OFF) — pure full-screen, no chrome at all.
  // Üst div, geri tuşu ve X tuşu KESİNLİKLE yoktur. Kapatmak için masaüstündeki ev butonu kullanılır.
  // Minimize edildiğinde DOM'da kalır (display:none) — iframe state'i (örn. Sohbeto kayıt akışı) korunur.
  if (!nostalgiaMode) {
    return (
      <MobileFullscreenWindow
        zIndex={zIndex}
        onClose={onClose}
        onMinimize={onMinimize}
        onFocus={onFocus}
        hidden={isMinimized}
      >
        {children}
      </MobileFullscreenWindow>
    );
  }

  if (isMinimized) return null;

  const frameStyle: React.CSSProperties = isMaximized
    ? { position: "fixed", top: 0, left: 0, width: "100vw", height: "calc(100vh - 40px)", zIndex }
    : { position: "absolute", top: pos.y, left: pos.x, width: size.w, height: size.h, zIndex };

  const activeTitleBg = `linear-gradient(to right, ${theme.titleBar}, ${theme.titleBarEnd})`;
  const inactiveTitleBg = "linear-gradient(to right, #808080, #b0b0b0)";

  return (
    <div
      ref={frameRef}
      style={frameStyle}
      className="flex flex-col shadow-[2px_2px_0_#000] select-none rounded-t-sm overflow-hidden"
      onMouseDown={onFocus}
    >
      {/* Title Bar */}
      <div
        className="flex items-center h-7 px-1 gap-1 cursor-move shrink-0"
        style={{ background: isActive ? activeTitleBg : inactiveTitleBg }}
        onMouseDown={handleMouseDownDrag}
        onDoubleClick={handleRestore}
      >
        {icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>}
        <span className="text-white text-xs font-bold truncate flex-1">{title}</span>
        <div className="flex gap-[2px]">
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] font-bold leading-none text-black hover:bg-[#d4d4d4]"
          >
            _
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRestore(); }}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] font-bold leading-none text-black hover:bg-[#d4d4d4]"
          >
            {isMaximized ? "❐" : "□"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] font-bold leading-none text-black hover:bg-[#d4d4d4]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Menu Bar - only in nostalgia mode */}
      <div ref={menuRef} className="h-5 bg-[#c0c0c0] border-b border-[#808080] flex items-center px-1 shrink-0 relative">
        {Object.keys(menuItems).map((menuName) => (
          <div key={menuName} className="relative">
            <span
              className={`text-[11px] px-2 cursor-default ${
                openMenu === menuName ? "bg-[#000080] text-white" : "text-black hover:bg-[#000080] hover:text-white"
              }`}
              onClick={() => setOpenMenu(openMenu === menuName ? null : menuName)}
              onMouseEnter={() => openMenu && setOpenMenu(menuName)}
            >
              {menuName}
            </span>
            {openMenu === menuName && (
              <div className="absolute top-5 left-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] min-w-[180px] z-50 shadow-md">
                {menuItems[menuName].map((item, i) => (
                  item.label === "─" ? (
                    <div key={i} className="h-px bg-[#808080] mx-1 my-1" />
                  ) : (
                    <button
                      key={i}
                      onClick={item.action}
                      className="w-full text-left text-[11px] text-black px-4 py-1 hover:bg-[#000080] hover:text-white flex justify-between items-center"
                    >
                      <span>{item.label}</span>
                      {item.shortcut && <span className="text-[10px] opacity-60 ml-4">{item.shortcut}</span>}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 bg-white overflow-hidden relative">{children}</div>

      {!isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleMouseDownResize}
          style={{
            background:
              "linear-gradient(135deg, transparent 50%, #808080 50%, #808080 60%, transparent 60%, transparent 70%, #808080 70%, #808080 80%, transparent 80%)",
          }}
        />
      )}
    </div>
  );
};

/**
 * Mobil/tablet tam-ekran pencere. Üst bar, X, geri yok.
 * Yatay kaydırma (>120px) → kapat. Aşağı kaydırma (>120px) → küçült (son uygulamalara).
 */
const MobileFullscreenWindow: React.FC<{
  zIndex: number;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  children: React.ReactNode;
  hidden?: boolean;
}> = ({ zIndex, onClose, onMinimize, onFocus, children, hidden }) => {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [closing, setClosing] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    // Sadece üst kenardan başlayan kaydırmayı kapatma jesti olarak al,
    // aksi halde uygulama içi kaydırmaya engel olmamak için yok say.
    const t = e.touches[0];
    if (t.clientY > 40) { start.current = null; return; }
    start.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!start.current) return;
    const t = e.touches[0];
    setDrag({ x: t.clientX - start.current.x, y: Math.max(0, t.clientY - start.current.y) });
  };
  const onTouchEnd = () => {
    if (!start.current) return;
    const { x, y } = drag;
    if (Math.abs(x) > 120) {
      setClosing(true);
      setTimeout(onClose, 180);
    } else if (y > 120) {
      onMinimize();
    }
    start.current = null;
    setDrag({ x: 0, y: 0 });
  };

  const transform = closing
    ? `translateX(${drag.x > 0 ? "120%" : "-120%"})`
    : drag.x || drag.y
      ? `translate(${drag.x}px, ${drag.y}px) scale(${Math.max(0.85, 1 - Math.abs(drag.x) / 1500 - drag.y / 1500)})`
      : undefined;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
        display: hidden ? "none" : undefined,
      }}
      className="flex flex-col bg-white animate-in fade-in zoom-in-95 duration-200 transition-transform"
      onMouseDown={onFocus}
      aria-hidden={hidden || undefined}
    >
      <div
        className="flex-1 bg-white overflow-hidden relative transition-transform"
        style={{ transform, transitionProperty: closing ? "transform, opacity" : "none", opacity: closing ? 0 : 1 }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default WindowFrame;