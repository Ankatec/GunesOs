import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import BootScreen from "./BootScreen";
import Desktop, { type AppId, type FileItem } from "./Desktop";
import Taskbar from "./Taskbar";
import WindowFrame from "./WindowFrame";
import Notepad from "./apps/Notepad";
import TerminalApp from "./apps/Terminal";
import Minesweeper from "./apps/Minesweeper";
import BrowserApp from "./apps/Browser";
import KidsGames from "./apps/KidsGames";
import Contacts from "./apps/Contacts";
import SettingsApp from "./apps/Settings";
import { RadioApp, SeyretApp, YazekaApp, PostaAnkaraApp, TelankaraApp } from "./apps/NewApps";
import YapayAkilApp from "./apps/YapayAkil";
import Sohbeto from "./apps/Sohbeto";
import Kuran from "./apps/Kuran";
import Mesajlar from "./apps/Mesajlar";
import { EXTRA_APP_MAP } from "@/lib/extraApps";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { detectDevice, type DeviceInfo } from "@/utils/deviceDetect";
import { InstallSheet } from "@/pwa/InstallSheet";
import { PermissionsOnboarding } from "@/pwa/PermissionsOnboarding";
import { isStandalone as detectStandaloneMode } from "@/pwa/serviceWorkerRegistration";
import MobileNavBar from "./MobileNavBar";
import RecentsOverlay from "./RecentsOverlay";
import { useHistoryNav } from "@/hooks/useHistoryNav";

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

const globalDeviceInfo = detectDevice();

const appConfig: Record<string, { title: string; width: number; height: number }> = {
  mycomputer: {
    title:
      globalDeviceInfo.type === "phone"
        ? "Telefonum"
        : globalDeviceInfo.type === "tablet"
          ? "Tabletim"
          : "Bilgisayarım",
    width: 500,
    height: 400,
  },
  browser: { title: "Ega", width: 700, height: 500 },
  notepad: { title: "Not Defteri", width: 500, height: 400 },
  terminal: { title: "Günter", width: 600, height: 400 },
  minesweeper: { title: "Mayın Tarlası", width: 320, height: 420 },
  paint: { title: "Paint", width: 600, height: 450 },
  music: { title: "Müziklerim", width: 400, height: 300 },
  files: { title: "Dosya Gezgini", width: 550, height: 400 },
  trash: { title: "Çöp Kutusu", width: 400, height: 300 },
  settings: { title: "Ayarlar", width: 640, height: 500 },
  kidsgames: { title: "Oyun Merkezi", width: 420, height: 500 },
  contacts: { title: "Rehber", width: 450, height: 400 },
  radio: { title: "Radyo", width: 380, height: 500 },
  seyret: { title: "Seyret", width: 450, height: 450 },
  yazeka: { title: "Yazeka", width: 380, height: 480 },
  posta: { title: "Posta Ankara", width: 450, height: 420 },
  telankara: { title: "Telankara", width: 340, height: 500 },
  yapayakil: { title: "Yapay Akıl", width: 420, height: 520 },
  sohbeto: { title: "Sohbeto", width: 420, height: 640 },
  kuran: { title: "Vakit & Kuran Pro", width: 420, height: 700 },
  mesajlar: { title: "Mesajlar", width: 420, height: 600 },
};

const getViewportSize = () => ({
  width: typeof window !== "undefined" ? window.innerWidth : 1280,
  height: typeof window !== "undefined" ? window.innerHeight : 720,
});

function useResponsive() {
  const [size, setSize] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 1280,
    h: typeof window !== "undefined" ? window.innerHeight : 720,
  });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return {
    isMobile: size.w < 640,
    isTablet: size.w >= 640 && size.w < 1024,
    isDesktop: size.w >= 1024,
  };
}

const PaintApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  useEffect(() => {
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

  const colors = [
    "#000000",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#ffffff",
    "#808080",
    "#800000",
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-2 p-1 bg-[#e0e0e0] border-b border-[#a0a0a0] flex-wrap">
        <div className="flex gap-[2px]">
          {colors.map((c) => (
            <button
              key={c}
              className={`w-5 h-5 border ${color === c ? "border-black border-2" : "border-gray-400"}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <select
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="text-[11px] border border-gray-400 bg-white px-1 text-black"
        >
          {[1, 2, 3, 5, 8, 12].map((s) => (
            <option key={s} value={s}>
              {s}px
            </option>
          ))}
        </select>
        <button
          onClick={clearCanvas}
          className="text-[11px] px-2 py-[2px] bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] hover:bg-[#d0d0d0] text-black"
        >
          Temizle
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="flex-1 cursor-crosshair bg-white"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
      />
    </div>
  );
};

const GunesOSInner: React.FC = () => {
  const { theme, settings } = useTheme();
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const zCounter = useRef(100);
  const [windowZMap, setWindowZMap] = useState<Record<string, number>>({});
  const [files, setFiles] = useLocalStorage<FileItem[]>("gunesOS-files", []);
  const [trashedFiles, setTrashedFiles] = useLocalStorage<FileItem[]>("gunesOS-trash", []);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [recentsOpen, setRecentsOpen] = useState(false);

  // İlk girişte: Mesajlar boş başlar — sadece GüneşOS Ekibi karşılama mesajı düşer.
  // Sohbeto'ya kayıt olduğunda doğrulama + 3 hoş geldin mesajı ayrı ayrı bildirim olarak gelir.
  useEffect(() => {
    if (!booted) return;
    if (typeof window === "undefined") return;
    const SEED = "gunesOS-mesajlar-seeded-v2";

    if (!localStorage.getItem(SEED)) {
      // Yeni akışa geçiş: eski tohum verisini temizle, sadece GüneşOS Ekibi karşılama mesajı düşür.
      try {
        if (localStorage.getItem("gunesOS-mesajlar-seeded") && !localStorage.getItem(SEED)) {
          localStorage.removeItem("gunesOS-mesajlar");
        }
      } catch {
        /* ignore */
      }
      import("@/lib/messaging").then(({ pushSystemMessage }) => {
        pushSystemMessage({
          threadId: "gunesos-team",
          name: "GüneşOS Ekibi",
          avatar: "☀️",
          text: "🌞 GüneşOS'a hoş geldin! Tüm uygulamalar masaüstünde seni bekliyor. İyi keşifler!",
        });
        toast("☀️ GüneşOS Ekibi", { description: "Yeni bir mesajın var." });
      });
      localStorage.setItem(SEED, "1");
    }

    // Sohbeto iframe'inden gelen kayıt olaylarını dinle ve Mesajlar'a düşür.
    const onMsg = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || typeof data !== "object") return;
      import("@/lib/messaging").then(({ pushSystemMessage }) => {
        if (data.type === "sohbeto:code" && typeof data.code === "string") {
          pushSystemMessage({
            threadId: "sohbeto-welcome",
            name: "Sohbeto",
            avatar: "💬",
            text: `🔐 Sohbeto Doğrulama Kodun: ${data.code}\n\nKodu kimseyle paylaşma. Bu kod 10 dakika geçerlidir.`,
          });
          toast("💬 Sohbeto", { description: "Doğrulama kodun geldi." });
        } else if (data.type === "sohbeto:registered") {
          const followUps = [
            { delay: 800, text: "👋 Merhaba ve hoş geldin!" },
            {
              delay: 2400,
              text: "Sohbeto'ya başarıyla kaydoldun. Artık güvenli, hızlı ve uçtan uca şifreli mesajlaşmanın keyfini çıkarabilirsin.",
            },
            {
              delay: 4200,
              text: "İpucu: Profil resmini ve adını Sohbeto > Ayarlar bölümünden güncelleyebilirsin. İyi sohbetler! ✨",
            },
          ];
          followUps.forEach((m) => {
            setTimeout(() => {
              pushSystemMessage({
                threadId: "sohbeto-welcome",
                name: "Sohbeto",
                avatar: "💬",
                text: m.text,
              });
              toast("💬 Sohbeto", {
                description: m.text.length > 60 ? m.text.slice(0, 60) + "…" : m.text,
              });
            }, m.delay);
          });
        }
      });
    };
    window.addEventListener("message", onMsg);

    return () => window.removeEventListener("message", onMsg);
  }, [booted]);
  const responsive = useResponsive();
  const isTablet = responsive.isTablet;
  const isMobile = responsive.isMobile;
  // PC = ne mobil ne tablet. Mobil/tablet'te asla PC izi (taskbar, üst bar, başlat çubuğu) gösterilmez.
  const isPC = !isMobile && !isTablet;
  const isTouchUI = isMobile || isTablet;
  // PWA standalone modunda telefonun kendi nav barı geri/home/recents'i bizim history hook'umuz
  // üzerinden zaten yönetiyor → bizim nav bar'ı gizle. Sadece tarayıcı sekmesinde göster.
  const [isStandalone, setIsStandalone] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const queries = [
      window.matchMedia("(display-mode: standalone)"),
      window.matchMedia("(display-mode: fullscreen)"),
      window.matchMedia("(display-mode: minimal-ui)"),
    ];
    const update = () => setIsStandalone(detectStandaloneMode());
    update();
    queries.forEach((mq) => mq.addEventListener?.("change", update));
    window.addEventListener("pageshow", update);
    return () => {
      queries.forEach((mq) => mq.removeEventListener?.("change", update));
      window.removeEventListener("pageshow", update);
    };
  }, []);
  const deviceTitle =
    settings.customDeviceName?.trim() ||
    (globalDeviceInfo.category === "phone"
      ? "Telefonum"
      : globalDeviceInfo.category === "tablet"
        ? "Tabletim"
        : globalDeviceInfo.category === "laptop"
          ? "Dizüstüm"
          : "Bilgisayarım");

  const addFile = useCallback(
    (file: FileItem) => {
      setFiles((prev) => [...prev, file]);
    },
    [setFiles],
  );

  const trashFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const f = prev.find((x) => x.id === id);
        if (f) setTrashedFiles((t) => [...t, f]);
        return prev.filter((x) => x.id !== id);
      });
    },
    [setFiles, setTrashedFiles],
  );

  const restoreTrash = useCallback(
    (id: string) => {
      setTrashedFiles((prev) => {
        const f = prev.find((x) => x.id === id);
        if (f) setFiles((files) => [...files, f]);
        return prev.filter((x) => x.id !== id);
      });
    },
    [setFiles, setTrashedFiles],
  );

  const emptyTrash = useCallback(() => setTrashedFiles([]), [setTrashedFiles]);

  const openApp = useCallback(
    (appId: AppId) => {
      // Pwap henüz entegre edilmedi — sadece bilgi göster, pencere açma
      if (appId === "pwap") {
        toast("🛍️ Pwap yakında!", {
          description: "Uygulama marketi entegrasyonu çok yakında geliyor.",
        });
        return;
      }
      const extra = EXTRA_APP_MAP[appId as string];
      const baseConfig =
        appConfig[appId] ||
        (extra
          ? { title: extra.label, width: 420, height: 480 }
          : { title: appId, width: 500, height: 400 });
      const config = appId === "mycomputer" ? { ...baseConfig, title: deviceTitle } : baseConfig;
      setWindows((prev) => {
        const offset = (prev.length % 6) * 25;
        const id = `${appId}-${Date.now()}`;

        let width = config.width;
        let height = config.height;
        let x = 60 + offset;
        let y = 30 + offset;

        if (isTouchUI) {
          // Mobil/tablet: gerçek telefon gibi tam ekran
          width = window.innerWidth;
          height = window.innerHeight;
          x = 0;
          y = 0;
        }

        const newWindow: WindowState = {
          id,
          appId,
          title: config.title,
          isMinimized: false,
          isMaximized: isTouchUI,
          x,
          y,
          width,
          height,
        };
        zCounter.current += 1;
        setWindowZMap((zMap) => ({ ...zMap, [id]: zCounter.current }));
        setActiveWindowId(id);
        return [...prev, newWindow];
      });
    },
    [isTouchUI, deviceTitle],
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)),
    );
  }, []);

  const focusWindow = useCallback((id: string) => {
    zCounter.current += 1;
    setWindowZMap((prev) => ({ ...prev, [id]: zCounter.current }));
    setActiveWindowId(id);
  }, []);

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
    [windows, activeWindowId, focusWindow, minimizeWindow],
  );

  const handleTerminalCommand = useCallback(
    (cmd: string, args: string) => {
      if (cmd === "close") {
        const termWin = windows.find((w) => w.appId === "terminal" && activeWindowId === w.id);
        if (termWin) closeWindow(termWin.id);
      } else if (cmd === "open") {
        openApp(args as AppId);
      } else if (cmd === "save") {
        try {
          const data = JSON.parse(args);
          addFile({
            id: `${data.type === "gunesos" ? "gos" : "doc"}-${Date.now()}`,
            name: data.name,
            type: data.type || "document",
            content: data.content || "",
            createdAt: new Date().toISOString(),
          });
        } catch {
          // ignore parse errors
        }
      } else if (cmd === "refresh") {
        // Desktop refresh - just reset icon order, don't reload page
        setFiles((prev) => [...prev]);
      }
    },
    [windows, activeWindowId, closeWindow, openApp, addFile],
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
    [files, setFiles, addFile],
  );

  const handleHomeClick = () => {
    // Mobil/tablet: ev = açık uygulamayı son uygulamalara gönder (küçült).
    if (isTouchUI) {
      const topId = activeWindowId ?? windows[windows.length - 1]?.id;
      if (topId) {
        minimizeWindow(topId);
        return;
      }
    }
    setStartMenuOpen((prev) => !prev);
  };

  const handleBackClick = () => {
    // Önce recents açıksa onu kapat
    if (recentsOpen) {
      setRecentsOpen(false);
      return;
    }
    const topId = activeWindowId ?? windows[windows.length - 1]?.id;
    if (topId) closeWindow(topId);
  };

  // Tarayıcı / PWA geri tuşu entegrasyonu — açık katman sayısı kadar history entry tut.
  const navDepth = (recentsOpen ? 1 : 0) + windows.length;
  useHistoryNav({
    depth: navDepth,
    onBack: () => {
      if (recentsOpen) {
        setRecentsOpen(false);
        return;
      }
      const topId = activeWindowId ?? windows[windows.length - 1]?.id;
      if (topId) closeWindow(topId);
    },
  });

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
        return <KidsGames onOpenApp={openApp} />;
      case "yapayakil":
        return <YapayAkilApp />;
      case "sohbeto":
        return <Sohbeto />;
      case "kuran":
        return <Kuran />;
      case "mesajlar":
        return <Mesajlar />;
      case "contacts":
        return <Contacts />;
      case "radio":
        return <RadioApp />;
      case "seyret":
        return <SeyretApp />;
      case "yazeka":
        return <YazekaApp />;
      case "posta":
        return <PostaAnkaraApp />;
      case "telankara":
        return <TelankaraApp />;
      case "settings":
        return <SettingsApp isMobile={isMobile} isTablet={isTablet} />;
      case "mycomputer":
        return (
          <div className="p-4 overflow-auto h-full">
            <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <span className="text-5xl">{globalDeviceInfo.emoji}</span>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#000080] truncate">
                  {settings.customDeviceName?.trim() || deviceTitle}
                </h3>
                <p className="text-xs text-gray-500">
                  {globalDeviceInfo.emoji} {globalDeviceInfo.typeLabel} • {globalDeviceInfo.os}
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="p-2 bg-gray-50 rounded border flex justify-between">
                <span className="text-[11px] text-gray-600">Cihaz Adı</span>
                <span className="text-[11px] font-bold text-black">
                  {settings.customDeviceName?.trim() || globalDeviceInfo.label}
                </span>
              </div>
              <div className="p-2 bg-gray-50 rounded border flex justify-between">
                <span className="text-[11px] text-gray-600">Marka</span>
                <span className="text-[11px] font-bold text-black">{globalDeviceInfo.brand}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded border flex justify-between">
                <span className="text-[11px] text-gray-600">Model</span>
                <span className="text-[11px] font-bold text-black">{globalDeviceInfo.model}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded border flex justify-between">
                <span className="text-[11px] text-gray-600">İşletim Sistemi</span>
                <span className="text-[11px] font-bold text-black">{globalDeviceInfo.os}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded border flex justify-between">
                <span className="text-[11px] text-gray-600">Cihaz Türü</span>
                <span className="text-[11px] font-bold text-black">
                  {globalDeviceInfo.typeLabel}
                </span>
              </div>
              <div className="p-2 bg-gray-50 rounded border flex justify-between">
                <span className="text-[11px] text-gray-600">Ekran Çözünürlük</span>
                <span className="text-[11px] font-bold text-black">
                  {getViewportSize().width} × {getViewportSize().height}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "Yerel Disk (C:)", emoji: "💾", info: "45.2 GB boş / 120 GB" },
                { name: "DVD Sürücü (D:)", emoji: "💿", info: "Disk yok" },
                { name: "Belgelerim", emoji: "📁", info: `${files.length} öğe` },
                { name: "Denetim Masası", emoji: "⚙️", info: "Sistem ayarları" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col items-center gap-1 p-3 rounded hover:bg-blue-50 cursor-pointer"
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <span className="text-[11px] text-center font-medium text-black">
                    {item.name}
                  </span>
                  <span className="text-[9px] text-gray-500">{item.info}</span>
                </div>
              ))}
            </div>
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
                <button
                  key={btn}
                  className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-lg hover:bg-purple-200"
                >
                  {btn}
                </button>
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
              <div className="space-y-0.5">
                <div className="grid grid-cols-[1fr_80px_140px] gap-2 px-2 py-1 text-[10px] text-gray-500 font-bold border-b border-gray-200">
                  <span>Ad</span>
                  <span>Tür</span>
                  <span>Oluşturma</span>
                </div>
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_80px_140px] gap-2 items-center px-2 py-1 hover:bg-blue-50 cursor-pointer rounded"
                  >
                    <span className="text-[12px] flex items-center gap-2 text-black truncate">
                      <span>
                        {item.type === "folder" ? "📁" : item.type === "gunesos" ? "☀️" : "📄"}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {item.type === "folder"
                        ? "Klasör"
                        : item.type === "gunesos"
                          ? "GüneşOS"
                          : "Belge"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(item.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "trash":
        return (
          <div className="p-3 overflow-auto h-full bg-white">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <span className="text-[12px] text-gray-600 flex items-center gap-2">
                🗑️ Çöp Kutusu ({trashedFiles.length})
              </span>
              {trashedFiles.length > 0 && (
                <button
                  onClick={emptyTrash}
                  className="text-[11px] px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Boşalt
                </button>
              )}
            </div>
            {trashedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-12">
                <span className="text-5xl mb-4">🗑️</span>
                <p className="text-sm text-gray-500">Çöp kutusu boş.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {trashedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-red-50 rounded"
                  >
                    <span>
                      {item.type === "folder" ? "📁" : item.type === "gunesos" ? "☀️" : "📄"}
                    </span>
                    <span className="text-[12px] flex-1 text-black truncate">{item.name}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                    <button
                      onClick={() => restoreTrash(item.id)}
                      className="text-[10px] px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Geri Yükle
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default: {
        const extra = EXTRA_APP_MAP[appId as string];
        if (extra) {
          return (
            <div
              className={`h-full w-full flex flex-col items-center justify-center text-center px-6 ${extra.gradient}`}
            >
              <div className="relative mb-5">
                <span className="text-7xl">{extra.emoji}</span>
                <span className="absolute -bottom-2 -right-2 text-3xl animate-bounce">🚧</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">{extra.label}</h2>
              <p className="text-sm text-gray-600 mb-4">{extra.desc}</p>
              <div className="px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-300">
                🛠️ Yapım Aşamasında
              </div>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Yükleniyor...</p>
          </div>
        );
      }
    }
  };

  if (!booted) {
    return <BootScreen onComplete={() => setBooted(true)} />;
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: theme.primary }}
    >
      <Desktop
        onOpenApp={openApp}
        isMobile={isMobile}
        isTablet={isTablet}
        files={files}
        onAddFile={addFile}
        onTrashFile={trashFile}
        nostalgiaMode={isPC && settings.nostalgiaMode}
        onHomeClick={handleHomeClick}
      />

      {windows.map((win) => (
        <WindowFrame
          key={win.id}
          id={win.id}
          title={win.title}
          appId={win.appId}
          isActive={activeWindowId === win.id}
          isMinimized={win.isMinimized}
          isMaximized={win.isMaximized || isTouchUI}
          initialX={win.x}
          initialY={win.y}
          initialWidth={win.width}
          initialHeight={win.height}
          zIndex={windowZMap[win.id] || 100}
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
          onFocus={() => focusWindow(win.id)}
          nostalgiaMode={isPC && settings.nostalgiaMode}
        >
          {renderAppContent(win.appId)}
        </WindowFrame>
      ))}

      {isPC && settings.nostalgiaMode && (
        <Taskbar
          openWindows={windows.map((w) => ({
            id: w.id,
            appId: w.appId,
            title: w.title,
            isMinimized: w.isMinimized,
            isActive: activeWindowId === w.id,
          }))}
          onWindowClick={handleTaskbarWindowClick}
          onOpenApp={openApp}
          isMobile={false}
          isTablet={false}
        />
      )}

      {/* Mobil/tablet: alta yapışık 3 tuşlu nav bar (geri / ev / son uygulamalar) */}
      {/* Mobil/tablet + tarayıcı sekmesi: bizim nav bar. PWA standalone'da telefonun
          kendi nav barı işi gördüğü için gizleriz (üst üste iki nav bar olmasın). */}
      {isTouchUI && !isStandalone && !(isPC && settings.nostalgiaMode) && (
        <MobileNavBar
          onBack={handleBackClick}
          onHome={handleHomeClick}
          onRecents={() => setRecentsOpen(true)}
          hasActive={windows.length > 0}
        />
      )}

      {recentsOpen && (
        <RecentsOverlay
          items={windows.map((w) => ({ id: w.id, title: w.title, appId: w.appId }))}
          onPick={(id) => {
            setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: false } : w)));
            focusWindow(id);
            setRecentsOpen(false);
          }}
          onClose={(id) => closeWindow(id)}
          onClearAll={() => {
            setWindows([]);
            setActiveWindowId(null);
            setRecentsOpen(false);
          }}
          onDismiss={() => setRecentsOpen(false)}
        />
      )}

      {/* No PC trace when nostalgia is off — apps run fullscreen modal style */}
      <InstallSheet />
      <PermissionsOnboarding />
    </div>
  );
};

const GunesOS: React.FC = () => (
  <ThemeProvider>
    <GunesOSInner />
  </ThemeProvider>
);

export default GunesOS;
