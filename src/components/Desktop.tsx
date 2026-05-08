import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTheme } from "@/contexts/ThemeContext";
import { detectDevice } from "@/utils/deviceDetect";

export type AppId =
  | "mycomputer"
  | "browser"
  | "notepad"
  | "paint"
  | "minesweeper"
  | "terminal"
  | "trash"
  | "music"
  | "files"
  | "settings"
  | "kidsgames"
  | "contacts"
  | "radio"
  | "seyret"
  | "yazeka"
  | "posta"
  | "telankara";

export interface FileItem {
  id: string;
  name: string;
  type: "folder" | "document" | "gunesos";
  content?: string;
  createdAt: string;
}

interface DesktopIcon {
  id: AppId | string;
  label: string;
  emoji: string;
  isApp: boolean;
}

const deviceInfo = detectDevice();

const defaultIcons: DesktopIcon[] = [
  { id: "mycomputer", label: deviceInfo.type === "phone" ? "Telefonum" : deviceInfo.type === "tablet" ? "Tabletim" : "Bilgisayarım", emoji: deviceInfo.emoji, isApp: true },
  { id: "browser", label: "Tarayıcı", emoji: "🌐", isApp: true },
  { id: "posta", label: "Posta Ankara", emoji: "📬", isApp: true },
  { id: "telankara", label: "Telankara", emoji: "📞", isApp: true },
  { id: "notepad", label: "Not Defteri", emoji: "📝", isApp: true },
  { id: "terminal", label: "Terminal", emoji: "⬛", isApp: true },
  { id: "minesweeper", label: "Mayın Tarlası", emoji: "💣", isApp: true },
  { id: "kidsgames", label: "Oyun Merkezi", emoji: "🧩", isApp: true },
  { id: "paint", label: "Paint", emoji: "🎨", isApp: true },
  { id: "music", label: "Müziklerim", emoji: "🎵", isApp: true },
  { id: "files", label: "Dosya Gezgini", emoji: "📁", isApp: true },
  { id: "contacts", label: "Rehber", emoji: "📇", isApp: true },
  { id: "radio", label: "Radyo", emoji: "📻", isApp: true },
  { id: "seyret", label: "Seyret", emoji: "📺", isApp: true },
  { id: "yazeka", label: "Yazeka", emoji: "📝", isApp: true },
  { id: "settings", label: "Ayarlar", emoji: "⚙️", isApp: true },
  { id: "trash", label: "Çöp Kutusu", emoji: "🗑️", isApp: true },
];

interface DesktopProps {
  onOpenApp: (appId: AppId) => void;
  isMobile: boolean;
  isTablet: boolean;
  files: FileItem[];
  onAddFile: (file: FileItem) => void;
  nostalgiaMode: boolean;
  onHomeClick: () => void;
}

const Desktop: React.FC<DesktopProps> = ({ onOpenApp, isMobile, isTablet, files, onAddFile, nostalgiaMode, onHomeClick }) => {
  const { theme, settings } = useTheme();
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [iconOrder, setIconOrder] = useLocalStorage<string[]>(
    "gunesOS-icon-order",
    defaultIcons.map((i) => i.id)
  );
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  const fileEmoji = (type: string) => {
    if (type === "folder") return "📁";
    if (type === "gunesos") return "☀️";
    return "📄";
  };

  const allIcons: DesktopIcon[] = [
    ...defaultIcons,
    ...files
      .filter((f) => f.type === "folder" || f.type === "gunesos" || f.type === "document")
      .map((f) => ({ id: f.id, label: f.name, emoji: fileEmoji(f.type), isApp: false })),
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

  const createNewGunesOS = () => {
    const name = `GüneşOS ${files.filter((f) => f.type === "gunesos").length + 1}.gunes.os`;
    onAddFile({
      id: `gos-${Date.now()}`,
      name,
      type: "gunesos",
      content: `# GüneşOS Belgesi\n# Oluşturulma: ${new Date().toLocaleString("tr-TR")}\n\n`,
      createdAt: new Date().toISOString(),
    });
    setContextMenu(null);
  };

  const handleIconClick = (icon: DesktopIcon) => {
    setSelectedIcon(icon.id);
    setContextMenu(null);
    if (settings.singleClickOpen && icon.isApp) {
      onOpenApp(icon.id as AppId);
    }
  };

  const handleIconDoubleClick = (icon: DesktopIcon) => {
    if (!settings.singleClickOpen && icon.isApp) {
      onOpenApp(icon.id as AppId);
    }
  };

  const wallpaperStyle = settings.customWallpaper
    ? { backgroundImage: `url(${settings.customWallpaper})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: theme.wallpaper };

  const iconSize = isMobile ? "w-[72px]" : isTablet ? "w-[80px]" : "w-20";
  const emojiSize = isMobile ? "text-2xl" : "text-3xl";
  const labelSize = isMobile ? "text-[9px]" : "text-[11px]";
  const gridCols = isMobile ? "grid-cols-4" : isTablet ? "grid-cols-5" : "grid-cols-1";
  const gap = isMobile ? "gap-1" : isTablet ? "gap-2" : "gap-1";

  const displayIcons = sortedIcons;

  return (
    <div
      className="absolute inset-x-0 top-0 bottom-10 overflow-y-auto overflow-x-hidden"
      style={wallpaperStyle}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      <div className={`p-2 grid ${gridCols} ${gap} ${isMobile ? "w-full" : "w-fit"} relative z-10`}>
        {displayIcons.map((icon) => (
          <button
            key={icon.id}
            draggable={!isMobile && !isTablet}
            onDragStart={() => handleDragStart(icon.id)}
            onDragOver={(e) => handleDragOver(e, icon.id)}
            onDrop={handleDrop}
            className={`flex flex-col items-center ${iconSize} p-2 rounded cursor-default transition-transform ${
              selectedIcon === icon.id
                ? "bg-[#000080]/50 outline outline-1 outline-dashed outline-white scale-95"
                : "hover:bg-white/10"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleIconClick(icon);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleIconDoubleClick(icon);
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

      {/* Floating Home Button (when nostalgia mode is off) */}
      {!nostalgiaMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHomeClick();
          }}
          className="fixed bottom-14 right-3 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-lg hover:bg-white/30 transition-all z-[8997] border border-white/30"
        >
          ☀️
        </button>
      )}

      {contextMenu && (
        <div
          className="fixed bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-md py-1 min-w-[180px] z-[9000]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { label: "Görünüm", action: () => setContextMenu(null) },
            {
              label: "Simgeleri Hizala",
              action: () => {
                setIconOrder(defaultIcons.map((i) => i.id));
                setContextMenu(null);
              },
            },
            { label: "Yenile", action: () => { setIconOrder(defaultIcons.map((i) => i.id)); setContextMenu(null); } },
            { label: "---", action: () => {} },
            { label: "📁 Yeni Klasör", action: createNewFolder },
            { label: "📄 Yeni Belge", action: createNewDocument },
            { label: "☀️ GüneşOS Belgesi", action: createNewGunesOS },
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