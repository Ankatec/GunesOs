import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, Plus, Upload, Music2 } from "lucide-react";

// GüneşOS retro vinyl palette
const SUN_BG = "radial-gradient(circle at 30% 20%, #fff7ad 0%, #fbbf24 45%, #f97316 100%)";
const SUN_INK = "#0f172a";
const SUN_ACCENT = "#1e3a8a";
const SUN_GOLD = "#b45309";

type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  src?: string;
  color: string;
};

const DEMO_TRACKS: Track[] = [
  { id: "1", title: "Güneşin Doğuşu", artist: "GüneşOS", duration: 187, color: "#f97316" },
  { id: "2", title: "Sarı Yaz", artist: "Retro Band", duration: 222, color: "#fbbf24" },
  { id: "3", title: "Plak Sesi", artist: "Vinyl Dreams", duration: 154, color: "#b45309" },
  { id: "4", title: "Nostalji 78", artist: "Kaset Çocukları", duration: 201, color: "#ea580c" },
  { id: "5", title: "Akşam Üstü", artist: "GüneşOS", duration: 175, color: "#d97706" },
];

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
};

const Muzikler: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>(DEMO_TRACKS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = tracks[currentIdx];

  // simulate progress for demo tracks without src
  useEffect(() => {
    if (!isPlaying) return;
    const audio = audioRef.current;
    if (audio && current?.src) return; // real audio drives progress
    const t = setInterval(() => {
      setProgress((p) => {
        const next = p + 1 / current.duration;
        if (next >= 1) {
          if (repeat) return 0;
          handleNext();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isPlaying, currentIdx, repeat]);

  const handlePlayPause = () => setIsPlaying((p) => !p);

  const handleNext = () => {
    setProgress(0);
    setCurrentIdx((i) => {
      if (shuffle) return Math.floor(Math.random() * tracks.length);
      return (i + 1) % tracks.length;
    });
  };

  const handlePrev = () => {
    setProgress(0);
    setCurrentIdx((i) => (i - 1 + tracks.length) % tracks.length);
  };

  const handleSelect = (idx: number) => {
    setCurrentIdx(idx);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newTracks: Track[] = Array.from(files).map((f, i) => ({
      id: `u-${Date.now()}-${i}`,
      title: f.name.replace(/\.[^.]+$/, ""),
      artist: "Yüklenen",
      duration: 180,
      src: URL.createObjectURL(f),
      color: ["#f97316", "#fbbf24", "#b45309", "#ea580c"][i % 4],
    }));
    setTracks((t) => [...newTracks, ...t]);
    if (newTracks.length) {
      setCurrentIdx(0);
      setIsPlaying(true);
    }
  };

  return (
    <div
      className="h-full w-full overflow-auto"
      style={{ background: SUN_BG, color: SUN_INK }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-5 py-2.5 backdrop-blur-md"
        style={{
          background: "linear-gradient(180deg, rgba(255,247,173,.7), rgba(251,191,36,.35))",
          borderBottom: `1.5px solid ${SUN_INK}22`,
        }}
      >
        <div className="flex items-center gap-2">
          <Music2 size={18} style={{ color: SUN_INK }} />
          <span className="font-bold text-sm sm:text-base tracking-tight">Müziklerim</span>
          <span className="text-[10px] sm:text-xs opacity-60">v1.0</span>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          onTouchEnd={(e) => { e.preventDefault(); fileRef.current?.click(); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform"
          style={{ background: SUN_INK, color: "#fff7ad" }}
        >
          <Upload size={13} />
          <span className="hidden sm:inline">Müzik Ekle</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          multiple
          hidden
          onChange={handleUpload}
        />
      </div>

      {/* Main grid: vinyl + info side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-3 sm:p-5">
        {/* Vinyl */}
        <div className="flex items-center justify-center py-2">
          <div
            className="relative aspect-square w-[min(70vw,260px)] sm:w-[280px] md:w-full md:max-w-[320px]"
            style={{
              animation: isPlaying ? "vinyl-spin 6s linear infinite" : "none",
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "repeating-radial-gradient(circle at center, #0a0a0a 0px, #0a0a0a 2px, #1a1a1a 2px, #1a1a1a 4px)",
                boxShadow: "0 12px 40px rgba(0,0,0,.35), inset 0 0 0 2px #000",
              }}
            />
            {/* center label */}
            <div
              className="absolute inset-[32%] rounded-full flex items-center justify-center text-center px-2"
              style={{
                background: `radial-gradient(circle, ${current.color} 0%, ${SUN_GOLD} 100%)`,
                boxShadow: "0 0 0 2px #000, inset 0 0 12px rgba(0,0,0,.3)",
              }}
            >
              <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider" style={{ color: SUN_INK }}>
                GüneşOS
              </div>
            </div>
            {/* center hole */}
            <div
              className="absolute left-1/2 top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: "#000" }}
            />
            {/* highlight */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,.15), transparent 40%)",
              }}
            />
          </div>
        </div>

        {/* Info + controls */}
        <div className="flex flex-col justify-center gap-3 sm:gap-4">
          <div>
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest opacity-70">
              Şimdi Çalıyor
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mt-1" style={{ color: SUN_INK }}>
              {current.title}
            </h2>
            <p className="text-sm sm:text-base font-medium opacity-80" style={{ color: SUN_ACCENT }}>
              {current.artist}
            </p>
          </div>

          {/* progress */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span>{fmt(progress * current.duration)}</span>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden cursor-pointer"
              style={{ background: "rgba(15,23,42,.18)" }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setProgress(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  background: `linear-gradient(90deg, ${SUN_INK}, ${SUN_ACCENT})`,
                }}
              />
            </div>
            <span>{fmt(current.duration)}</span>
          </div>

          {/* controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-1">
            <button
              onClick={() => setShuffle((s) => !s)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{
                background: shuffle ? SUN_INK : "rgba(255,255,255,.5)",
                color: shuffle ? "#fff7ad" : SUN_INK,
              }}
              aria-label="Karıştır"
            >
              <Shuffle size={16} />
            </button>
            <button
              onClick={handlePrev}
              className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "rgba(255,255,255,.6)", color: SUN_INK }}
              aria-label="Önceki"
            >
              <SkipBack size={20} fill={SUN_INK} />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg"
              style={{
                background: `radial-gradient(circle at 30% 30%, #fff7ad, ${SUN_GOLD})`,
                boxShadow: `0 6px 20px ${SUN_INK}55, inset 0 0 0 2px ${SUN_INK}`,
                color: SUN_INK,
              }}
              aria-label={isPlaying ? "Duraklat" : "Çal"}
            >
              {isPlaying ? <Pause size={26} fill={SUN_INK} /> : <Play size={26} fill={SUN_INK} className="ml-1" />}
            </button>
            <button
              onClick={handleNext}
              className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "rgba(255,255,255,.6)", color: SUN_INK }}
              aria-label="Sonraki"
            >
              <SkipForward size={20} fill={SUN_INK} />
            </button>
            <button
              onClick={() => setRepeat((r) => !r)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{
                background: repeat ? SUN_INK : "rgba(255,255,255,.5)",
                color: repeat ? "#fff7ad" : SUN_INK,
              }}
              aria-label="Tekrar"
            >
              <Repeat size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Cassette playlist */}
      <div className="px-3 sm:px-5 pb-5">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider" style={{ color: SUN_INK }}>
            🎞️ Kasetlerim
          </h3>
          <span className="text-xs font-semibold opacity-70">{tracks.length} parça</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {tracks.map((t, i) => {
            const active = i === currentIdx;
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(i)}
                onTouchEnd={(e) => { e.preventDefault(); handleSelect(i); }}
                className="text-left rounded-xl p-2.5 sm:p-3 flex items-center gap-3 active:scale-[.98] transition-all"
                style={{
                  background: active
                    ? `linear-gradient(135deg, ${t.color}, ${SUN_GOLD})`
                    : "rgba(255,255,255,.55)",
                  border: `2px solid ${active ? SUN_INK : "rgba(15,23,42,.15)"}`,
                  boxShadow: active ? `0 4px 14px ${SUN_INK}33` : "none",
                }}
              >
                {/* mini cassette */}
                <div
                  className="relative w-14 h-10 sm:w-16 sm:h-11 rounded-md flex-shrink-0 flex items-center justify-around px-1.5"
                  style={{
                    background: `linear-gradient(180deg, #1f1f1f, #0a0a0a)`,
                    border: `1.5px solid ${SUN_INK}`,
                    boxShadow: "inset 0 0 6px rgba(0,0,0,.6)",
                  }}
                >
                  <div
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${t.color}, #333)`,
                      animation: active && isPlaying ? "vinyl-spin 2s linear infinite" : "none",
                    }}
                  />
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 sm:w-7 h-1 rounded-sm"
                    style={{ background: t.color, opacity: .5 }}
                  />
                  <div
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${t.color}, #333)`,
                      animation: active && isPlaying ? "vinyl-spin 2s linear infinite" : "none",
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: SUN_INK }}>
                    {t.title}
                  </div>
                  <div className="text-xs font-medium opacity-75 truncate" style={{ color: SUN_INK }}>
                    {t.artist} · {fmt(t.duration)}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLiked((l) => ({ ...l, [t.id]: !l[t.id] }));
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,.4)" }}
                  aria-label="Beğen"
                >
                  <Heart
                    size={14}
                    fill={liked[t.id] ? "#dc2626" : "none"}
                    color={liked[t.id] ? "#dc2626" : SUN_INK}
                  />
                </button>
              </button>
            );
          })}

          {/* Add card */}
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-xl p-3 flex items-center justify-center gap-2 active:scale-[.98] transition-all min-h-[64px]"
            style={{
              background: "rgba(255,255,255,.25)",
              border: `2px dashed ${SUN_INK}55`,
              color: SUN_INK,
            }}
          >
            <Plus size={18} />
            <span className="text-sm font-bold">Yeni Kaset Ekle</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes vinyl-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {current.src && (
        <audio
          ref={audioRef}
          src={current.src}
          autoPlay={isPlaying}
          onTimeUpdate={(e) => {
            const a = e.currentTarget;
            if (a.duration) setProgress(a.currentTime / a.duration);
          }}
          onEnded={handleNext}
        />
      )}
    </div>
  );
};

export default Muzikler;
