import React, { useRef } from "react";
import { useTheme, themes } from "@/contexts/ThemeContext";

const SettingsApp: React.FC<{ isMobile: boolean; isTablet: boolean }> = ({ isMobile, isTablet }) => {
  const { theme, settings, setSettings } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deviceType = isMobile ? "📱 Telefon" : isTablet ? "📱 Tablet" : "🖥️ Masaüstü";

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
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-[11px] text-gray-500">Mod</span>
            <span className="text-[11px] font-medium text-gray-800">{deviceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[11px] text-gray-500">Ekran</span>
            <span className="text-[11px] font-medium text-gray-800">{window.innerWidth} × {window.innerHeight}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[11px] text-gray-500">Sürüm</span>
            <span className="text-[11px] font-medium text-gray-800">GüneşOS v2.0</span>
          </div>
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
        <h3 className="text-[12px] font-bold mb-2 text-gray-700">🖼️ Arka Plan</h3>
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

      {/* Nostalgia Mode */}
      <div className="p-3 bg-gray-50 rounded-lg border mb-3">
        <h3 className="text-[12px] font-bold mb-2 text-gray-700">🕹️ Nostalji Modu</h3>
        <p className="text-[10px] text-gray-500 mb-2">
          Klasik Windows tarzı başlat çubuğu ve menü çubuklarını gösterir.
        </p>
        <button
          onClick={() => updateSetting("nostalgiaMode", !settings.nostalgiaMode)}
          className={`w-full py-2 text-[11px] rounded-lg border-2 transition-all ${
            settings.nostalgiaMode
              ? "border-green-500 bg-green-50 text-green-700 font-medium"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          {settings.nostalgiaMode ? "✅ Nostalji Modu Açık" : "⬜ Nostalji Modu Kapalı"}
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
          Kullanılan: {(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB
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