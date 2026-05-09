import React, { useRef, useState, useEffect } from "react";
import { useTheme, themes, wallpaperPresets, ALL_DESKTOP_ICON_IDS } from "@/contexts/ThemeContext";
import { EXTRA_APP_MAP } from "@/lib/extraApps";
import { detectDevice, refreshHighEntropyDeviceInfo } from "@/utils/deviceDetect";

const CORE_ICON_META: Record<string, { label: string; emoji: string }> = {
  mycomputer: { label: "Bilgisayarım", emoji: "🌞" },
  browser: { label: "Tarayıcı", emoji: "🧭" },
  notepad: { label: "Notlar", emoji: "🗒️" },
  terminal: { label: "Günter", emoji: "🌤️" },
  minesweeper: { label: "Mayın", emoji: "💣" },
  kidsgames: { label: "Oyunlar", emoji: "🎮" },
  paint: { label: "Çizim", emoji: "🖌️" },
  music: { label: "Müzik", emoji: "🎶" },
  files: { label: "Dosyalar", emoji: "🗂️" },
  contacts: { label: "Kişiler", emoji: "👥" },
  yapayakil: { label: "Yapay Akıl", emoji: "🧠" },
  sohbeto: { label: "Sohbeto", emoji: "💬" },
  kuran: { label: "Vakit & Kuran", emoji: "📖" },
  pwap: { label: "Pwap", emoji: "🛍️" },
  mesajlar: { label: "Mesajlar", emoji: "💌" },
  telankara: { label: "Telankara", emoji: "📱" },
  posta: { label: "Posta", emoji: "✉️" },
  radio: { label: "Radyo", emoji: "📻" },
  seyret: { label: "Seyret", emoji: "🎬" },
  settings: { label: "Ayarlar", emoji: "⚙️" },
  trash: { label: "Çöp", emoji: "🗑️" },
};

const ICON_META: Record<string, { label: string; emoji: string }> = {
  ...CORE_ICON_META,
  ...Object.fromEntries(
    Object.values(EXTRA_APP_MAP).map((a) => [a.id, { label: a.label, emoji: a.emoji }])
  ),
};

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex justify-between gap-2">
    <span className="text-[11px] text-gray-500 shrink-0">{k}</span>
    <span className="text-[11px] font-medium text-gray-800 truncate text-right">{v}</span>
  </div>
);

const SettingsApp: React.FC<{ isMobile: boolean; isTablet: boolean }> = ({ isMobile, isTablet }) => {
  const { theme, settings, setSettings } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [, force] = useState(0);
  const device = detectDevice();
  useEffect(() => {
    refreshHighEntropyDeviceInfo().then(() => force((n) => n + 1));
  }, []);
  const viewMode = isMobile ? "📱 Telefon Görünümü" : isTablet ? "📱 Tablet Görünümü" : "🖥️ Masaüstü Görünümü";
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 720,
  });
  useEffect(() => {
    const onResize = () => setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const storageUsedKb =
    typeof localStorage !== "undefined" ? (JSON.stringify(localStorage).length / 1024).toFixed(1) : "0.0";

  const updateSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateSetting("customWallpaper", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-3 overflow-auto h-full bg-white">
      <h2 className="text-base font-bold text-[#000080] mb-3 flex items-center gap-2">
        ⚙️ Ayarlar
      </h2>

      {/* Device Info */}
      <div className="p-3 bg-gray-50 rounded-lg border mb-3">
        <h3 className="text-[12px] font-bold mb-2 text-gray-700">📱 Cihaz Bilgisi</h3>
        <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded border">
          <span className="text-3xl">{device.emoji}</span>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-gray-900 truncate">{device.label}</p>
            <p className="text-[10px] text-gray-500">{device.os}</p>
          </div>
        </div>
        <div className="space-y-1">
          <Row k="Marka" v={device.brand} />
          <Row k="Model" v={device.model} />
          <Row k="Cihaz Türü" v={device.type === "phone" ? "Telefon" : device.type === "tablet" ? "Tablet" : "Masaüstü"} />
          <Row k="Görünüm" v={viewMode} />
          <Row k="Ekran" v={`${viewportSize.width} × ${viewportSize.height}`} />
          <Row k="Sürüm" v="GüneşOS v2.0" />
        </div>
      </div>

      {/* Theme Selection */}
      <div className="p-3 bg-gray-50 rounded-lg border mb-3">
        <h3 className="text-[12px] font-bold mb-2 text-gray-700">🎨 Tema Seçimi</h3>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((t) => (
            <button
              key={t.name}
              onClick={() => updateSetting("themeName", t.name)}
              className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                settings.themeName === t.name
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div
                className="w-8 h-8 rounded-full shrink-0 border border-gray-200"
                style={{ background: t.wallpaper }}
              />
              <div className="text-left min-w-0">
                <p className="text-[11px] font-medium text-gray-800 truncate">
                  {t.emoji} {t.label}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Wallpaper */}
      <div className="p-3 bg-gray-50 rounded-lg border mb-3">
        <h3 className="text-[12px] font-bold mb-2 text-gray-700">🖼️ Masaüstü Arka Planı</h3>

        {/* Preset gallery */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {wallpaperPresets.map((wp) => {
            const active = settings.customWallpaper === wp.url;
            return (
              <button
                key={wp.id}
                onClick={() => updateSetting("customWallpaper", wp.url)}
                className={`group relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  active ? "border-blue-500 shadow-sm" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${wp.url})` }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] py-0.5 px-1 truncate">
                  {wp.label}
                </div>
                {active && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] flex items-center justify-center">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => updateSetting("customWallpaper", null)}
              className={`flex-1 py-2 text-[11px] rounded-lg border-2 transition-all ${
                !settings.customWallpaper
                  ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              Tema Varsayılanı
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 text-[11px] rounded-lg border-2 border-gray-200 text-gray-600 hover:border-gray-300"
            >
              📷 Fotoğraf Yükle
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleWallpaperUpload}
            className="hidden"
          />
          {settings.customWallpaper && (
            <div className="relative">
              <div
                className="h-20 rounded-lg bg-cover bg-center border border-gray-200"
                style={{ backgroundImage: `url(${settings.customWallpaper})` }}
              />
              <button
                onClick={() => updateSetting("customWallpaper", null)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Icon Picker */}
      <div className="p-3 bg-gray-50 rounded-lg border mb-3">
        <h3 className="text-[12px] font-bold mb-2 text-gray-700">🧺 Simge Sepeti</h3>
        <p className="text-[10px] text-gray-500 mb-2">
          Masaüstünde gösterilecek simgeleri seç ({(settings.visibleIcons || []).length}/{ALL_DESKTOP_ICON_IDS.length}).
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ALL_DESKTOP_ICON_IDS.map((id) => {
            const meta = ICON_META[id];
            const visible = (settings.visibleIcons || []).includes(id);
            return (
              <button
                key={id}
                onClick={() => {
                  const cur = new Set(settings.visibleIcons || []);
                  if (cur.has(id)) cur.delete(id);
                  else cur.add(id);
                  updateSetting("visibleIcons", Array.from(cur));
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition ${
                  visible ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white opacity-60"
                }`}
              >
                <span className="text-2xl">{meta.emoji}</span>
                <span className="text-[10px] text-gray-700 truncate w-full text-center">{meta.label}</span>
                <span className="text-[9px]">{visible ? "✓ Açık" : "Gizli"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nostalgia Mode */}
      <div className="p-3 bg-gray-50 rounded-lg border mb-3">
        <h3 className="text-[12px] font-bold mb-2 text-gray-700">🕹️ Nostalji Modu (PC Görünümü)</h3>
        <p className="text-[10px] text-gray-500 mb-2">
          Açıldığında klasik Windows başlat çubuğu, menü çubuğu ve pencere tarzı görünür. Kapalıysa modern telefon/tablet görünümü kullanılır.
        </p>
        <button
          onClick={() => updateSetting("nostalgiaMode", !settings.nostalgiaMode)}
          className={`w-full py-2 text-[11px] rounded-lg border-2 transition-all ${
            settings.nostalgiaMode
              ? "border-green-500 bg-green-50 text-green-700 font-medium"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          {settings.nostalgiaMode ? "✅ Nostalji (PC) Açık" : "⬜ Modern Görünüm (Telefon/Tablet)"}
        </button>
      </div>

      {/* Desktop Behavior */}
      <div className="p-3 bg-gray-50 rounded-lg border mb-3">
        <h3 className="text-[12px] font-bold mb-2 text-gray-700">🖥️ Masaüstü Davranışı</h3>
        <div className="space-y-2">
          <button
            onClick={() => updateSetting("singleClickOpen", !settings.singleClickOpen)}
            className={`w-full py-2 text-[11px] rounded-lg border-2 transition-all ${
              settings.singleClickOpen
                ? "border-green-500 bg-green-50 text-green-700 font-medium"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {settings.singleClickOpen ? "✅ Tek Tıklama ile Aç" : "⬜ Çift Tıklama ile Aç"}
          </button>
          <button
            onClick={() => updateSetting("autoAlignIcons", !settings.autoAlignIcons)}
            className={`w-full py-2 text-[11px] rounded-lg border-2 transition-all ${
              settings.autoAlignIcons
                ? "border-green-500 bg-green-50 text-green-700 font-medium"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {settings.autoAlignIcons ? "✅ Otomatik Hizala" : "⬜ Serbest Yerleşim"}
          </button>
        </div>
      </div>

      {/* Storage */}
      <div className="p-3 bg-gray-50 rounded-lg border mb-3">
        <h3 className="text-[12px] font-bold mb-2 text-gray-700">💾 Depolama</h3>
        <p className="text-[11px] text-gray-500 mb-2">
          Kullanılan: {storageUsedKb} KB
        </p>
        <button
          onClick={() => {
            if (confirm("Tüm veriler silinecek. Emin misiniz?")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="w-full py-2 text-[11px] bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          🗑️ Verileri Temizle
        </button>
      </div>
    </div>
  );
};

export default SettingsApp;