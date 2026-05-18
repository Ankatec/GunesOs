import React, { useRef, useState, useEffect } from "react";
import { useTheme, themes, wallpaperPresets, ALL_DESKTOP_ICON_IDS } from "@/contexts/ThemeContext";
import { EXTRA_APP_MAP } from "@/lib/extraApps";
import { detectDevice, refreshHighEntropyDeviceInfo } from "@/utils/deviceDetect";
import { BOOT_SOUND_OPTIONS, playBootSound, type BootSoundId } from "@/lib/bootSound";

// ─── GüneşOS Kilit Ekranı ayarları (localStorage) ───
const LOCK_KEY = "gunesos.lock.v1";
type LockCfg = { enabled: boolean; password: string };
function readLock(): LockCfg {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LOCK_KEY) : null;
    if (!raw) return { enabled: false, password: "" };
    const o = JSON.parse(raw);
    return { enabled: !!o.enabled, password: String(o.password || "") };
  } catch { return { enabled: false, password: "" }; }
}
function writeLock(cfg: LockCfg) {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify(cfg)); } catch {}
}

const LockSection: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [cfg, setCfg] = useState<LockCfg>(() => readLock());
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const enable = () => {
    if (pw.length < 3) { setMsg("Şifre en az 3 karakter olmalı"); return; }
    if (pw !== pw2) { setMsg("Şifreler eşleşmiyor"); return; }
    const next = { enabled: true, password: pw };
    writeLock(next); setCfg(next); setPw(""); setPw2("");
    setMsg("✅ Kilit ekranı etkin. Bir sonraki açılışta şifre sorulacak.");
  };
  const disable = () => {
    const next = { enabled: false, password: "" };
    writeLock(next); setCfg(next); setMsg("Kilit ekranı kapatıldı.");
  };

  const wrap = compact
    ? "bg-white rounded-2xl p-3 shadow-sm space-y-2"
    : "p-3 bg-gray-50 rounded-lg border space-y-2";

  return (
    <div className={wrap}>
      <h3 className="text-[12px] font-bold text-gray-700">🔒 Kilit Ekranı</h3>
      <p className="text-[10px] text-gray-500">
        Etkinleştirirsen GüneşOS açılışında şifre sorulur. Şifre tarayıcında güvenli şekilde saklanır.
      </p>
      {cfg.enabled ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-green-700 font-medium">✅ Açık</span>
          <button
            onClick={disable}
            className="px-3 py-1.5 text-[11px] rounded-lg bg-red-500 text-white hover:bg-red-600"
          >Kilidi Kaldır</button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="password" value={pw} onChange={(e) => { setPw(e.target.value); setMsg(null); }}
            placeholder="Yeni şifre"
            className="w-full px-3 py-2 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <input
            type="password" value={pw2} onChange={(e) => { setPw2(e.target.value); setMsg(null); }}
            placeholder="Şifreyi tekrar gir"
            className="w-full px-3 py-2 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={enable}
            className="w-full py-2 text-[11px] rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold"
          >Kilidi Etkinleştir</button>
        </div>
      )}
      {msg && <p className="text-[10px] text-gray-600">{msg}</p>}
    </div>
  );
};

const CORE_ICON_META: Record<string, { label: string; emoji: string }> = {
  mycomputer: { label: "Bilgisayarım", emoji: "🖥️" },
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
  ...Object.fromEntries(Object.values(EXTRA_APP_MAP).map((a) => [a.id, { label: a.label, emoji: a.emoji }])),
};

type TabId = "device" | "theme" | "wallpaper" | "icons" | "behavior" | "storage";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "device", label: "Cihaz", emoji: "📱" },
  { id: "theme", label: "Tema", emoji: "🎨" },
  { id: "wallpaper", label: "Arka Plan", emoji: "🖼️" },
  { id: "icons", label: "Simgeler", emoji: "🧺" },
  { id: "behavior", label: "Davranış", emoji: "🖱️" },
  { id: "storage", label: "Depolama", emoji: "💾" },
];

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex justify-between gap-2 p-2 bg-gray-50 rounded border">
    <span className="text-[11px] text-gray-600 shrink-0">{k}</span>
    <span className="text-[11px] font-bold text-gray-900 truncate text-right">{v}</span>
  </div>
);

const SettingsApp: React.FC<{ isMobile: boolean; isTablet: boolean }> = ({ isMobile, isTablet }) => {
  const { settings, setSettings } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<TabId>("device");

  const [, force] = useState(0);
  const device = detectDevice();
  useEffect(() => {
    refreshHighEntropyDeviceInfo().then(() => force((n) => n + 1));
  }, []);

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
    reader.onload = (ev) => updateSetting("customWallpaper", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const isPC = !isMobile && !isTablet;
  const viewMode = isMobile ? "📱 Telefon Görünümü" : isTablet ? "📱 Tablet Görünümü" : `${device.emoji} ${device.typeLabel} Görünümü`;

  // ───────────────────────────────────────────────────────────
  // MOBİL / TABLET AYARLAR — iOS tarzı dikey liste, sekme yok.
  // PC'ye ait hiçbir seçenek (telefon görünümü, nostalji modu, çift tık vs.) burada yoktur.
  // ───────────────────────────────────────────────────────────
  if (!isPC) {
    return (
      <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
        <div className="px-4 pt-5 pb-3 bg-white border-b">
          <h2 className="text-lg font-bold text-gray-900">Ayarlar</h2>
          <div className="mt-3 flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
            <span className="text-3xl">{device.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-gray-900 truncate">
                {settings.customDeviceName?.trim() || device.label}
              </p>
              <p className="text-[11px] text-gray-500 truncate">{device.typeLabel} • {device.os}</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Cihaz Adı */}
          <section>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2 px-1">Cihaz Adı</p>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
              <input
                type="text"
                value={settings.customDeviceName}
                onChange={(e) => updateSetting("customDeviceName", e.target.value)}
                placeholder={device.label}
                className="w-full text-[14px] outline-none placeholder:text-gray-400"
                maxLength={40}
              />
            </div>
          </section>

          {/* Tema */}
          <section>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2 px-1">Tema</p>
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
              {themes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => updateSetting("themeName", t.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-100 transition"
                >
                  <span className="w-7 h-7 rounded-full border border-gray-200 shrink-0" style={{ background: t.wallpaper }} />
                  <span className="flex-1 text-left text-[14px] text-gray-800">{t.emoji} {t.label}</span>
                  {settings.themeName === t.name && <span className="text-blue-500 text-lg">✓</span>}
                </button>
              ))}
            </div>
          </section>

          {/* Arka Plan */}
          <section>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2 px-1">Arka Plan</p>
            <div className="grid grid-cols-3 gap-2">
              {wallpaperPresets.map((wp) => {
                const active = settings.customWallpaper === wp.url;
                return (
                  <button
                    key={wp.id}
                    onClick={() => updateSetting("customWallpaper", wp.url)}
                    className={`relative h-24 rounded-2xl overflow-hidden border-2 transition ${
                      active ? "border-blue-500" : "border-transparent"
                    }`}
                  >
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${wp.url})` }} />
                    {active && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-blue-500 text-white rounded-full text-[12px] flex items-center justify-center">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-2 py-3 text-[13px] bg-white rounded-2xl shadow-sm active:bg-gray-100"
            >
              📷 Galeriden Foto Seç
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleWallpaperUpload} className="hidden" />
          </section>

          {/* Simgeler */}
          <section>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2 px-1">
              Uygulamalar ({(settings.visibleIcons || []).length}/{ALL_DESKTOP_ICON_IDS.length})
            </p>
            <div className="grid grid-cols-4 gap-2 bg-white rounded-2xl p-3 shadow-sm">
              {ALL_DESKTOP_ICON_IDS.map((id) => {
                const meta = ICON_META[id];
                const visible = (settings.visibleIcons || []).includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => {
                      const cur = new Set(settings.visibleIcons || []);
                      if (cur.has(id)) cur.delete(id); else cur.add(id);
                      updateSetting("visibleIcons", Array.from(cur));
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
                      visible ? "bg-blue-50" : "opacity-40"
                    }`}
                  >
                    <span className="text-2xl">{meta.emoji}</span>
                    <span className="text-[9px] text-gray-700 truncate w-full text-center">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Hakkında */}
          <section>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2 px-1">Hakkında</p>
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
              <Row k="Marka" v={device.brand} />
              <Row k="Model" v={device.model} />
              <Row k="İşletim Sistemi" v={device.os} />
              <Row k="Ekran" v={`${viewportSize.width} × ${viewportSize.height}`} />
              <Row k="Sürüm" v="GüneşOS v2.0" />
              <Row k="Depolama" v={`${storageUsedKb} KB`} />
            </div>
            <button
              onClick={() => {
                if (confirm("Tüm veriler silinecek. Emin misiniz?")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="w-full mt-2 py-3 text-[13px] bg-red-500 text-white rounded-2xl active:bg-red-600"
            >
              🗑️ Tüm Verileri Sıfırla
            </button>
          </section>

          {/* Güvenlik / Kilit */}
          <section>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2 px-1">Güvenlik</p>
            <LockSection compact />
          </section>
        </div>
      </div>
    );
  }


  return (
    <div className="flex h-full bg-white">
      <aside className="w-44 shrink-0 bg-gradient-to-b from-slate-50 to-slate-100/80 relative flex flex-col">
        <div className="p-3 border-b border-slate-200/70">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5 font-semibold">Ayarlar</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl">{device.emoji}</span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 truncate">
                {settings.customDeviceName?.trim() || device.label}
              </p>
              <p className="text-[9px] text-slate-500 truncate">{device.os}</p>
            </div>
          </div>
        </div>
        <nav className="py-2 flex-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left transition-colors border-l-2 ${
                tab === t.id
                  ? "border-blue-500 bg-white text-blue-700 font-semibold"
                  : "border-transparent text-slate-600 hover:bg-white/60"
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute top-3 bottom-3 right-0 w-px bg-gradient-to-b from-transparent via-slate-300/80 to-transparent pointer-events-none" />
      </aside>

      <div className="flex-1 overflow-auto p-4">
        {tab === "device" && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <h3 className="text-[12px] font-bold mb-2 text-gray-700">📝 Cihaz Adı</h3>
              <p className="text-[10px] text-gray-500 mb-2">
                Cihazınıza isim verin (ör. "Samsung Galaxy", "Ofis PC"). Boş bırakırsanız otomatik tespit kullanılır.
              </p>
              <input
                type="text"
                value={settings.customDeviceName}
                onChange={(e) => updateSetting("customDeviceName", e.target.value)}
                placeholder={device.label}
                className="w-full px-3 py-2 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                maxLength={40}
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border">
              <h3 className="text-[12px] font-bold mb-2 text-gray-700">📱 Cihaz Bilgisi</h3>
              <div className="space-y-1">
                <Row k="Marka" v={device.brand} />
                <Row k="Model" v={device.model} />
                <Row k="İşletim Sistemi" v={device.os} />
                <Row k="Cihaz Türü" v={device.typeLabel} />
                <Row k="Görünüm" v={viewMode} />
                <Row k="Ekran" v={`${viewportSize.width} × ${viewportSize.height}`} />
                <Row k="Gerçek Cihaz" v={`${device.realBrand} ${device.realModel}`} />
                <Row k="Sürüm" v="GüneşOS v2.0" />
              </div>
            </div>

          </div>
        )}
        {/* PC'de telefon görünümü seçeneği kaldırıldı — PC ve mobil tamamen ayrı deneyimler. */}


        {tab === "theme" && (
          <div className="p-3 bg-gray-50 rounded-lg border">
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
                  <div className="w-8 h-8 rounded-full shrink-0 border border-gray-200" style={{ background: t.wallpaper }} />
                  <div className="text-left min-w-0">
                    <p className="text-[11px] font-medium text-gray-800 truncate">{t.emoji} {t.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "wallpaper" && (
          <div className="p-3 bg-gray-50 rounded-lg border">
            <h3 className="text-[12px] font-bold mb-2 text-gray-700">🖼️ Masaüstü Arka Planı</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {wallpaperPresets.map((wp) => {
                const active = settings.customWallpaper === wp.url;
                return (
                  <button
                    key={wp.id}
                    onClick={() => updateSetting("customWallpaper", wp.url)}
                    className={`group relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                      active ? "border-blue-500 shadow-md ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${wp.url})` }} />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] py-1 px-1.5 truncate text-left">
                      {wp.label}
                    </div>
                    {active && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] flex items-center justify-center shadow">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mb-2">
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
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleWallpaperUpload} className="hidden" />
            {settings.customWallpaper && (
              <div className="relative">
                <div
                  className="h-28 rounded-lg bg-cover bg-center border border-gray-200"
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
        )}

        {tab === "icons" && (
          <div className="p-3 bg-gray-50 rounded-lg border">
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
                      if (cur.has(id)) cur.delete(id); else cur.add(id);
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
        )}

        {tab === "behavior" && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <h3 className="text-[12px] font-bold mb-2 text-gray-700">🕹️ Nostalji Modu (PC Görünümü)</h3>
              <p className="text-[10px] text-gray-500 mb-2">
                Açıldığında klasik başlat çubuğu, menü çubuğu ve pencere tarzı görünür.
              </p>
              <button
                onClick={() => updateSetting("nostalgiaMode", !settings.nostalgiaMode)}
                className={`w-full py-2 text-[11px] rounded-lg border-2 transition-all ${
                  settings.nostalgiaMode
                    ? "border-green-500 bg-green-50 text-green-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {settings.nostalgiaMode ? "✅ Nostalji (PC) Açık" : "⬜ Modern Görünüm"}
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border">
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

            <div className="p-3 bg-gray-50 rounded-lg border">
              <h3 className="text-[12px] font-bold mb-2 text-gray-700">🔔 Açılış Sesi</h3>
              <p className="text-[10px] text-gray-500 mb-2">
                GüneşOS açılırken çalan ses. Dinlemek için seçeneğin üzerine bas.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BOOT_SOUND_OPTIONS.map((opt) => {
                  const active = (settings.bootSound ?? "gong-double") === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        updateSetting("bootSound", opt.id as BootSoundId);
                        playBootSound(opt.id);
                      }}
                      className={`p-2 text-left rounded-lg border-2 transition-all ${
                        active
                          ? "border-amber-500 bg-amber-50 text-amber-800"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="text-[11px] font-semibold flex items-center gap-1">
                        <span>{opt.emoji}</span>
                        <span>{opt.label}</span>
                        {active && <span className="ml-auto text-[10px]">✓</span>}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <LockSection />
          </div>
        )}

        {tab === "storage" && (
          <div className="p-3 bg-gray-50 rounded-lg border">
            <h3 className="text-[12px] font-bold mb-2 text-gray-700">💾 Depolama</h3>
            <p className="text-[11px] text-gray-500 mb-2">Kullanılan: {storageUsedKb} KB</p>
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
        )}
      </div>
    </div>
  );
};

export default SettingsApp;
