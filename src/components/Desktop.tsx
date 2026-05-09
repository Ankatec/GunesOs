import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTheme } from "@/contexts/ThemeContext";
import { detectDevice } from "@/utils/deviceDetect";
import { EXTRA_APPS } from "@/lib/extraApps";
import SohbetoIcon from "./SohbetoIcon";
import KuranIcon from "./KuranIcon";
import PwapIcon from "./PwapIcon";
import YapayAkilIcon from "./YapayAkilIcon";
import MesajlarIcon from "./MesajlarIcon";

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
  | "telankara"
  | "yapayakil"
  | string;

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

const coreIcons: DesktopIcon[] = [
  { id: "mycomputer", label: deviceInfo.type === "phone" ? "Telefonum" : deviceInfo.type === "tablet" ? "Tabletim" : "Bilgisayarım", emoji: "🌞", isApp: true },
  { id: "browser", label: "Tarayıcı", emoji: "🧭", isApp: true },
  { id: "notepad", label: "Notlar", emoji: "🗒️", isApp: true },
  { id: "terminal", label: "Günter", emoji: "🌤️", isApp: true },
  { id: "minesweeper", label: "Mayın", emoji: "💣", isApp: true },
  { id: "kidsgames", label: "Oyunlar", emoji: "🎮", isApp: true },
  { id: "paint", label: "Çizim", emoji: "🖌️", isApp: true },
  { id: "music", label: "Müzik", emoji: "🎶", isApp: true },
  { id: "files", label: "Dosyalar", emoji: "🗂️", isApp: true },
  { id: "contacts", label: "Kişiler", emoji: "👥", isApp: true },
  { id: "yapayakil", label: "Yapay Akıl", emoji: "🧠", isApp: true },
  { id: "sohbeto", label: "Sohbeto", emoji: "💬", isApp: true },
  { id: "kuran", label: "Vakit & Kuran", emoji: "📖", isApp: true },
  { id: "pwap", label: "Pwap", emoji: "🛍️", isApp: true },
  { id: "mesajlar", label: "Mesajlar", emoji: "💌", isApp: true },
  { id: "telankara", label: "Telankara", emoji: "📱", isApp: true },
  { id: "posta", label: "Posta", emoji: "✉️", isApp: true },
  { id: "radio", label: "Radyo", emoji: "📻", isApp: true },
  { id: "seyret", label: "Seyret", emoji: "🎬", isApp: true },
  { id: "settings", label: "Ayarlar", emoji: "⚙️", isApp: true },
  { id: "trash", label: "Çöp", emoji: "🗑️", isApp: true },
];

const defaultIcons: DesktopIcon[] = [
  ...coreIcons,
  ...EXTRA_APPS.map((a) => ({ id: a.id, label: a.label, emoji: a.emoji, isApp: true })),
];

interface DesktopProps {
  onOpenApp: (appId: AppId) => void;
  isMobile: boolean;
  isTablet: boolean;
  files: FileItem[];
  onAddFile: (file: FileItem) => void;
  onTrashFile?: (id: string) => void;
  nostalgiaMode: boolean;
  onHomeClick: () => void;
}

const Desktop: React.FC<DesktopProps> = ({ onOpenApp, isMobile, isTablet, files, onAddFile, onTrashFile, nostalgiaMode, onHomeClick }) => {
  const { theme, settings } = useTheme();
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [iconContextMenu, setIconContextMenu] = useState<{ x: number; y: number; iconId: string; isFile: boolean } | null>(null);
  const [propertiesIcon, setPropertiesIcon] = useState<{ id: string; label: string; emoji: string; isApp: boolean } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
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

  const visibleList = settings.visibleIcons && settings.visibleIcons.length > 0
    ? settings.visibleIcons
    : defaultIcons.map((i) => i.id);
  const visibleSet = new Set(visibleList);
  const allIcons: DesktopIcon[] = [
    ...defaultIcons.filter((i) => visibleSet.has(i.id)),
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

  const doRefresh = () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setContextMenu(null);
    setTimeout(() => setRefreshing(false), 600);
  };

  const openProperties = (icon: { id: string; label: string; emoji: string; isApp: boolean }) => {
    setPropertiesIcon(icon);
    setContextMenu(null);
    setIconContextMenu(null);
  };

  const handleIconClick = (icon: DesktopIcon) => {
    setSelectedIcon(icon.id);
    setContextMenu(null);
    setIconContextMenu(null);
    if (settings.singleClickOpen && icon.isApp) {
      onOpenApp(icon.id as AppId);
    }
  };

  const handleIconDoubleClick = (icon: DesktopIcon) => {
    if (!settings.singleClickOpen && icon.isApp) {
      onOpenApp(icon.id as AppId);
    }
  };

  const handleIconContextMenu = (e: React.MouseEvent, icon: DesktopIcon) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIcon(icon.id);
    setIconContextMenu({ x: e.clientX, y: e.clientY, iconId: icon.id, isFile: !icon.isApp });
    setContextMenu(null);
  };

  const wallpaperStyle = settings.customWallpaper
    ? { backgroundImage: `url(${settings.customWallpaper})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: theme.wallpaper };

  const iconSize = isMobile ? "w-[72px]" : isTablet ? "w-[80px]" : "w-20";
  const emojiSize = isMobile ? "text-2xl" : "text-3xl";
  const labelSize = isMobile ? "text-[9px]" : "text-[11px]";
  const gap = isMobile ? "gap-1" : isTablet ? "gap-2" : "gap-1";

  // PC/Tablet: column-flow with fixed rows so icons go top→bottom then wrap to next column.
  // Mobile: standard 4-column grid that scrolls vertically.
  const gridLayout = isMobile
    ? "grid grid-cols-4"
    : isTablet
      ? "grid grid-flow-col grid-rows-[repeat(9,minmax(0,1fr))] auto-cols-max"
      : "grid grid-flow-col grid-rows-[repeat(13,minmax(0,1fr))] auto-cols-max";

  const displayIcons = sortedIcons;

  return (
    <div
      className={`absolute inset-x-0 top-0 bottom-10 ${isMobile ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden"}`}
      style={wallpaperStyle}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      <div
        key={refreshKey}
        className={`p-2 ${gridLayout} ${gap} ${isMobile ? "w-full" : "w-fit h-full"} relative z-10 ${refreshing ? "animate-in fade-in zoom-in-95 duration-500" : ""}`}
      >
        {displayIcons.map((icon) => (
          <button
            key={icon.id}
            draggable={!isMobile && !isTablet}
            onDragStart={() => handleDragStart(icon.id)}
            onDragOver={(e) => handleDragOver(e, icon.id)}
            onDrop={handleDrop}
            onContextMenu={(e) => handleIconContextMenu(e, icon)}
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
            {icon.id === "sohbeto" ? (
              <SohbetoIcon className={emojiSize} />
            ) : icon.id === "kuran" ? (
              <KuranIcon className={emojiSize} />
            ) : icon.id === "pwap" ? (
              <PwapIcon className={emojiSize} />
            ) : icon.id === "yapayakil" ? (
              <YapayAkilIcon className={emojiSize} />
            ) : icon.id === "mesajlar" ? (
              <MesajlarIcon className={emojiSize} />
            ) : (
              <span className={`${emojiSize} drop-shadow-md`}>{icon.emoji}</span>
            )}
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
            { label: "🔄 Yenile", action: doRefresh },
            { label: "---", action: () => {} },
            { label: "📁 Yeni Klasör", action: createNewFolder },
            { label: "📄 Yeni Belge", action: createNewDocument },
            { label: "☀️ GüneşOS Belgesi", action: createNewGunesOS },
            { label: "---", action: () => {} },
            {
              label: "Özellikler",
              action: () =>
                openProperties({ id: "desktop", label: "Masaüstü", emoji: "🖥️", isApp: false }),
            },
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

      {iconContextMenu && (() => {
        const icon = sortedIcons.find((i) => i.id === iconContextMenu.iconId);
        if (!icon) return null;
        const file = files.find((f) => f.id === iconContextMenu.iconId);
        const items: { label: string; action: () => void; sep?: boolean }[] = [
          { label: "Aç", action: () => { onOpenApp(icon.id as AppId); setIconContextMenu(null); } },
        ];
        if (iconContextMenu.isFile && onTrashFile) {
          items.push({ label: "---", action: () => {}, sep: true });
          items.push({
            label: "🗑️ Çöp Kutusuna Taşı",
            action: () => { onTrashFile(iconContextMenu.iconId); setIconContextMenu(null); },
          });
        }
        items.push({ label: "---", action: () => {}, sep: true });
        items.push({
          label: "Özellikler",
          action: () => openProperties({
            id: icon.id, label: icon.label, emoji: icon.emoji, isApp: icon.isApp,
          }),
        });
        return (
          <div
            className="fixed bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-md py-1 min-w-[180px] z-[9000]"
            style={{ left: iconContextMenu.x, top: iconContextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item, i) => item.sep ? (
              <div key={i} className="border-t border-[#808080] my-1 mx-1" />
            ) : (
              <button
                key={i}
                className="w-full text-left px-4 py-[2px] text-[12px] text-black hover:bg-[#000080] hover:text-white"
                onClick={item.action}
              >
                {item.label}
              </button>
            ))}
          </div>
        );
      })()}

      {propertiesIcon && (() => {
        const file = files.find((f) => f.id === propertiesIcon.id);
        return (
          <div
            className="fixed inset-0 bg-black/40 z-[9500] flex items-center justify-center"
            onClick={() => setPropertiesIcon(null)}
          >
            <div
              className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] w-[320px] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex justify-between items-center">
                <span className="text-[12px] font-bold">{propertiesIcon.label} - Özellikler</span>
                <button
                  className="text-white px-2 hover:bg-white/20"
                  onClick={() => setPropertiesIcon(null)}
                >✕</button>
              </div>
              <div className="p-4 text-[12px] text-black space-y-2">
                <div className="flex items-center gap-3 pb-2 border-b border-[#808080]">
                  <span className="text-4xl">{propertiesIcon.emoji}</span>
                  <span className="font-bold">{propertiesIcon.label}</span>
                </div>
                <div className="flex justify-between"><span>Tür:</span><span>{propertiesIcon.isApp ? "Uygulama" : file?.type === "folder" ? "Klasör" : file?.type === "gunesos" ? "GüneşOS Belgesi" : "Belge"}</span></div>
                <div className="flex justify-between"><span>Konum:</span><span>C:\GüneşOS\Masaüstü</span></div>
                {file && (
                  <>
                    <div className="flex justify-between"><span>Boyut:</span><span>{file.content ? `${file.content.length} bayt` : "—"}</span></div>
                    <div className="flex justify-between"><span>Oluşturma:</span><span>{new Date(file.createdAt).toLocaleString("tr-TR")}</span></div>
                  </>
                )}
                {!file && (
                  <div className="flex justify-between"><span>Sürüm:</span><span>GüneşOS v2.0</span></div>
                )}
              </div>
              <div className="px-3 pb-3 flex justify-end">
                <button
                  className="px-4 py-1 text-[12px] bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] hover:bg-[#d0d0d0]"
                  onClick={() => setPropertiesIcon(null)}
                >Tamam</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Desktop;