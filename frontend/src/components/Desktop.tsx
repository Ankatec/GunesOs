import React, { useState, useRef, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type AppId = "mycomputer" | "browser" | "notepad" | "paint" | "minesweeper" | "terminal" | "trash" | "music" | "files" | "settings" | "kidsgames";

export interface FileItem {
  id: string;
  name: string;
  type: "folder" | "document";
  content?: string;
  createdAt: string;
}

interface DesktopIcon {
  id: AppId | string;
  label: string;
  emoji: string;
  isApp: boolean;
}

const defaultIcons: DesktopIcon[] = [
  { id: "mycomputer", label: "Bilgisayarım", emoji: "🖥️", isApp: true },
  { id: "browser", label: "Tarayıcı", emoji: "🌐", isApp: true },
  { id: "notepad", label: "Not Defteri", emoji: "📝", isApp: true },
  { id: "terminal", label: "Terminal", emoji: "⬛", isApp: true },
  { id: "minesweeper", label: "Mayın Tarlası", emoji: "💣", isApp: true },
  { id: "kidsgames", label: "Oyun Merkezi", emoji: "🧩", isApp: true },
  { id: "paint", label: "Paint", emoji: "🎨", isApp: true },
  { id: "music", label: "Müziklerim", emoji: "🎵", isApp: true },
  { id: "files", label: "Dosya Gezgini", emoji: "📁", isApp: true },
  { id: "trash", label: "Çöp Kutusu", emoji: "🗑️", isApp: true },
];

interface DesktopProps {
  onOpenApp: (appId: AppId) => void;
  isMobile: boolean;
  isTablet: boolean;
  files: FileItem[];
  onAddFile: (file: FileItem) => void;
}

const Desktop: React.FC<DesktopProps> = ({ onOpenApp, isMobile, isTablet, files, onAddFile }) => {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [iconOrder, setIconOrder] = useLocalStorage<string[]>("gunesOS-icon-order", defaultIcons.map((i) => i.id));
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  const allIcons: DesktopIcon[] = [
    ...defaultIcons,
    ...files
      .filter((f) => f.type === "folder")
      .map((f) => ({ id: f.id, label: f.name, emoji: "📁", isApp: false })),
  ];

  const sortedIcons = [...allIcons].sort((a, b) => {
    const ai = iconOrder.indexOf(a.id);
    const bi = iconOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const handleDragStart = (id: string) => {
    dragItem.current = id;
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragOverItem.current = id;
  };

  const handleDrop = useCallback(() => {
    if (!dragItem.current || !dragOverItem.current || dragItem.current === dragOverItem.current) return;
    const ids = sortedIcons.map((i) => i.id);
    const fromIdx = ids.indexOf(dragItem.current);
    const toIdx = ids.indexOf(dragOverItem.current);
    if (fromIdx === -1 || toIdx === -1) return;
    const newOrder = [...ids];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    setIconOrder(newOrder);
    dragItem.current = null;
    dragOverItem.current = null;
  }, [sortedIcons, setIconOrder]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedIcon(null);
  };

  const handleClick = () => {
    setContextMenu(null);
    setSelectedIcon(null);
  };

  const createNewFolder = () => {
    const name = `Yeni Klasör ${files.filter((f) => f.type === "folder").length + 1}`;
    onAddFile({
      id: `folder-${Date.now()}`,
      name,
      type: "folder",
      createdAt: new Date().toISOString(),
    });
    setContextMenu(null);
  };

  const createNewDocument = () => {
    const name = `Yeni Belge ${files.filter((f) => f.type === "document").length + 1}.txt`;
    onAddFile({
      id: `doc-${Date.now()}`,
      name,
      type: "document",
      content: "",
      createdAt: new Date().toISOString(),
    });
    setContextMenu(null);
  };

  const iconSize = isMobile ? "w-16" : isTablet ? "w-18" : "w-20";
  const emojiSize = isMobile ? "text-2xl" : "text-3xl";
  const labelSize = isMobile ? "text-[9px]" : "text-[11px]";
  const gridCols = isMobile ? "grid-cols-4" : isTablet ? "grid-cols-2" : "grid-cols-1";
  const gap = isMobile ? "gap-2" : "gap-1";

  return (
    <div
      className="absolute inset-0 bottom-10 overflow-hidden"
      style={{
        backgroundImage: `url(https://mgx-backend-cdn.metadl.com/generate/images/1158115/2026-04-27/nnvmzzqaafma/desktop-wallpaper-teal.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      <div className={`p-3 grid ${gridCols} ${gap} w-fit ${isMobile ? "w-full" : ""}`}>
        {sortedIcons.map((icon) => (
          <button
            key={icon.id}
            draggable
            onDragStart={() => handleDragStart(icon.id)}
            onDragOver={(e) => handleDragOver(e, icon.id)}
            onDrop={handleDrop}
            className={`flex flex-col items-center ${iconSize} p-2 rounded cursor-default select-none transition-transform ${
              selectedIcon === icon.id
                ? "bg-[#000080]/50 outline outline-1 outline-dashed outline-white scale-95"
                : "hover:bg-white/10"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIcon(icon.id);
              setContextMenu(null);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (icon.isApp) onOpenApp(icon.id as AppId);
            }}
          >
            <span className={`${emojiSize} drop-shadow-md`}>{icon.emoji}</span>
            <span
              className={`${labelSize} text-center leading-tight mt-1 px-1 ${
                selectedIcon === icon.id
                  ? "bg-[#000080] text-white"
                  : "text-white drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]"
              }`}
            >
              {icon.label}
            </span>
          </button>
        ))}
      </div>

      {contextMenu && (
        <div
          className="fixed bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-md py-1 min-w-[180px] z-[9000]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { label: "Görünüm", action: () => setContextMenu(null) },
            { label: "Simgeleri Hizala", action: () => { setIconOrder(defaultIcons.map((i) => i.id)); setContextMenu(null); } },
            { label: "Yenile", action: () => window.location.reload() },
            { label: "---", action: () => {} },
            { label: "📁 Yeni Klasör", action: createNewFolder },
            { label: "📄 Yeni Belge", action: createNewDocument },
            { label: "---", action: () => {} },
            { label: "Özellikler", action: () => setContextMenu(null) },
          ].map((item, i) =>
            item.label === "---" ? (
              <div key={i} className="border-t border-[#808080] my-1 mx-1" />
            ) : (
              <button
                key={i}
                className="w-full text-left px-4 py-[2px] text-[12px] text-black hover:bg-[#000080] hover:text-white"
                onClick={item.action}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Desktop;