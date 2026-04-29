import React, { useState, useRef, useCallback, useEffect } from "react";

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
}) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight });
  const [prevState, setPrevState] = useState({ x: initialX, y: initialY, w: initialWidth, h: initialHeight });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMaximized) {
      setPrevState({ x: pos.x, y: pos.y, w: size.w, h: size.h });
      setPos({ x: 0, y: 0 });
      setSize({ w: window.innerWidth, h: window.innerHeight - 40 });
    }
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

  if (isMinimized) return null;

  const frameStyle: React.CSSProperties = isMaximized
    ? { position: "fixed", top: 0, left: 0, width: "100vw", height: "calc(100vh - 40px)", zIndex }
    : { position: "absolute", top: pos.y, left: pos.x, width: size.w, height: size.h, zIndex };

  return (
    <div
      ref={frameRef}
      style={frameStyle}
      className="flex flex-col shadow-[2px_2px_0_#000] select-none"
      onMouseDown={onFocus}
    >
      {/* Title Bar */}
      <div
        className={`flex items-center h-7 px-1 gap-1 cursor-move shrink-0 ${
          isActive
            ? "bg-gradient-to-r from-[#000080] to-[#1084d0]"
            : "bg-gradient-to-r from-[#808080] to-[#b0b0b0]"
        }`}
        onMouseDown={handleMouseDownDrag}
        onDoubleClick={handleRestore}
      >
        {icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>}
        <span className="text-white text-xs font-bold truncate flex-1">{title}</span>
        <div className="flex gap-[2px]">
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] font-bold leading-none hover:bg-[#d4d4d4] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white"
          >
            _
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRestore(); }}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] font-bold leading-none hover:bg-[#d4d4d4] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white"
          >
            {isMaximized ? "❐" : "□"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] font-bold leading-none hover:bg-[#d4d4d4] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Menu Bar (optional visual) */}
      <div className="h-5 bg-[#c0c0c0] border-b border-[#808080] flex items-center px-1 shrink-0">
        <span className="text-[11px] text-black px-2 hover:bg-[#000080] hover:text-white cursor-default">Dosya</span>
        <span className="text-[11px] text-black px-2 hover:bg-[#000080] hover:text-white cursor-default">Düzenle</span>
        <span className="text-[11px] text-black px-2 hover:bg-[#000080] hover:text-white cursor-default">Yardım</span>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white overflow-hidden relative">
        {children}
      </div>

      {/* Resize Handle */}
      {!isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleMouseDownResize}
          style={{
            background: "linear-gradient(135deg, transparent 50%, #808080 50%, #808080 60%, transparent 60%, transparent 70%, #808080 70%, #808080 80%, transparent 80%)",
          }}
        />
      )}
    </div>
  );
};

export default WindowFrame;