import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { playBootSound } from "@/lib/bootSound";

interface BootScreenProps {
  onComplete: () => void;
}

// GüneşOS açılış ekranı.
// - Arka plan: manifest theme_color (#0b1d3a) → tam ekran/PWA geçişlerinde renk sıçraması olmaz.
// - Logo: gerçek uygulama ikonu (manifeste de düşen icon-192).
// - Loading bar: ikonun amber/turuncu tonunda.
// - İlerleme: en az MIN_DURATION sürer + masaüstü duvar kâğıdı tamamen ön belleğe yüklenene kadar
//   son adıma geçmez. Yani ağır görsel/ağ koşullarında bile masaüstü hazırken giriş yapılır.
// - Açılış sesi: Web Audio ile sentezlenmiş çift gong (ayarlardan değiştirilebilir).
const BG = "#0b1d3a";
const MIN_DURATION_MS = 3500; // En az bu kadar göster — kullanıcı renk geçişini fark etsin.
const SAFETY_TIMEOUT_MS = 12_000; // Wallpaper hiç yüklenmezse takılmasın.

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const { settings } = useTheme();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"logo" | "loading" | "done">("logo");
  const wallpaperReady = useRef(false);
  const startedAt = useRef(Date.now());
  const playedRef = useRef(false);

  // Açılış sesini bir kez çal.
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    // Tarayıcı autoplay engelini aşmak için minik gecikme.
    const t = window.setTimeout(() => playBootSound(settings.bootSound ?? "gong-double"), 250);
    return () => window.clearTimeout(t);
  }, [settings.bootSound]);

  // Wallpaper'ı önceden yükle — masaüstü açıldığında flash olmasın.
  useEffect(() => {
    const url = settings.customWallpaper;
    if (!url) {
      wallpaperReady.current = true;
      return;
    }
    const img = new Image();
    img.onload = () => {
      wallpaperReady.current = true;
    };
    img.onerror = () => {
      wallpaperReady.current = true; // hata olsa da takılmayalım
    };
    img.src = url;
    // Güvenlik
    const safety = window.setTimeout(() => {
      wallpaperReady.current = true;
    }, SAFETY_TIMEOUT_MS);
    return () => window.clearTimeout(safety);
  }, [settings.customWallpaper]);

  // Logo → loading geçişi
  useEffect(() => {
    const logoTimer = setTimeout(() => setPhase("loading"), 900);
    return () => clearTimeout(logoTimer);
  }, []);

  // Loading: %92'ye kadar yumuşak ilerle, sonra wallpaper hazır + min süre dolduğunda %100'e tamamla.
  useEffect(() => {
    if (phase !== "loading") return;
    let raf = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startedAt.current;
      const minProgress = Math.min(92, (elapsed / MIN_DURATION_MS) * 92);

      setProgress((p) => {
        const target =
          wallpaperReady.current && elapsed >= MIN_DURATION_MS ? 100 : Math.max(p, minProgress);
        // Yumuşak yaklaşma
        const next = p + (target - p) * 0.08 + 0.15;
        return Math.min(next, target);
      });

      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [phase]);

  // %100'e ulaşınca kapan.
  useEffect(() => {
    if (progress >= 99.5 && phase === "loading") {
      setPhase("done");
      const t = setTimeout(onComplete, 450);
      return () => clearTimeout(t);
    }
  }, [progress, phase, onComplete]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-[9999] select-none transition-opacity duration-500"
      style={{
        backgroundColor: BG,
        opacity: phase === "done" ? 0 : 1,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* Yumuşak amber halo — ikonun ışığı */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(245,158,11,0.18), transparent 55%)",
        }}
      />

      <div
        className={`relative transition-all duration-700 ease-out ${
          phase === "logo" ? "scale-105" : "scale-100"
        }`}
      >
        <div
          className="absolute inset-0 rounded-[28%] blur-2xl opacity-60 animate-pulse"
          style={{ backgroundColor: "rgba(245,158,11,0.45)" }}
        />
        <img
          src="/icons/icon-192.png"
          alt="GüneşOS"
          className="relative w-32 h-32 rounded-[28%] shadow-[0_18px_50px_-10px_rgba(245,158,11,0.55)]"
          draggable={false}
        />
      </div>

      <h1 className="relative text-white text-[28px] font-extrabold mt-7 tracking-tight">GüneşOS</h1>
      <p className="relative text-amber-200/70 text-xs mt-1 tracking-wider">Sürüm 1.0 • Hoş Geldiniz</p>

      <div className="relative mt-10 w-64 flex flex-col items-center gap-3">
        <div className="relative w-full h-[6px] rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-150 ease-out"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background:
                "linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fb923c 100%)",
              boxShadow: "0 0 14px rgba(245,158,11,0.6)",
            }}
          />
        </div>
        <p className="text-amber-100/60 text-[11px] tracking-wide">
          {phase === "logo" ? "Hazırlanıyor…" : progress < 92 ? "Sistem yükleniyor…" : "Masaüstü açılıyor…"}
        </p>
      </div>
    </div>
  );
};

export default BootScreen;
