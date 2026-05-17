import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import sunHappyImg from "@/assets/cute-sun.png";
import sunSleepyImg from "@/assets/cute-sun-sleepy.png";
import gentleLullabyMp3 from "@/assets/lullabies/gentle-lullaby.mp3";
import nightAmbienceMp3 from "@/assets/lullabies/night-ambience.mp3";
import peacefulSoundMp3 from "@/assets/lullabies/peaceful-sound.mp3";
import softMelodyMp3 from "@/assets/lullabies/soft-melody.mp3";
import sweetDreamsMp3 from "@/assets/lullabies/sweet-dreams.mp3";
import toyMusicBoxMp3 from "@/assets/lullabies/toy-music-box-brahms.mp3";

type GameId = "memory" | "math" | "pattern" | "wordguess" | "colorMatch" | "simon" | "sliding" | "numberPuzzle";
type Difficulty = "easy" | "medium" | "hard";

/* ============================================================
 *  LULLABIES — 3 freesound tracks. The direct page URL can't be
 *  embedded; we try the public preview-mp3 pattern, and fall
 *  back to a synthesized version + optional MP3 upload.
 * ============================================================ */

interface LullabyTrack {
  id: string;
  title: string;
  artist: string;
  emoji: string;
  src: string;
  isNight?: boolean; // 21:00-09:00 gece ninnisi (sadece bu çalar)
}

// Tüm ninniler proje içine gömülü mp3 dosyalarıdır — internet veya yükleme gerekmez.
const DEFAULT_TRACKS: LullabyTrack[] = [
  { id: "gentle-lullaby",  title: "Gentle Lullaby",   artist: "Gece Modu",  emoji: "🌙", src: gentleLullabyMp3, isNight: true },
  { id: "sweet-dreams",    title: "Sweet Dreams",     artist: "Akşam Karışımı", emoji: "💫", src: sweetDreamsMp3 },
  { id: "soft-melody",     title: "Soft Melody",      artist: "Akşam Karışımı", emoji: "🎵", src: softMelodyMp3 },
  { id: "peaceful-sound",  title: "Peaceful Sound",   artist: "Akşam Karışımı", emoji: "🕊️", src: peacefulSoundMp3 },
  { id: "night-ambience",  title: "Night Ambience",   artist: "Akşam Karışımı", emoji: "✨", src: nightAmbienceMp3 },
  { id: "toy-music-box",   title: "Toy Music Box (Brahms)", artist: "Akşam Karışımı", emoji: "🎶", src: toyMusicBoxMp3 },
];

interface KidsGamesProps {
  onOpenApp?: (appId: "radio" | "seyret" | "yazeka" | "posta" | "telankara") => void;
}

const KidsGames: React.FC<KidsGamesProps> = ({ onOpenApp: _onOpenApp }) => {
  void _onOpenApp;

  const [now, setNow] = useState<Date>(() => new Date());
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [showLullaby, setShowLullaby] = useState(false);

  // Sun eye tracking
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const sunWrapRef = useRef<HTMLDivElement>(null);

  const tracks = DEFAULT_TRACKS;
  // 21:00 sonrası gece rotasyonu — önce Soft Melody, sonra Gentle Lullaby dönüşümlü.
  const nightTracks = useMemo(() => {
    const order = ["soft-melody", "gentle-lullaby"];
    return order
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is LullabyTrack => Boolean(t));
  }, [tracks]);
  const morningTrack = useMemo(() => tracks.find((t) => t.id === "sweet-dreams") ?? tracks[0], [tracks]);
  // 20:00–21:00 evening rotation — 3 ninni dönüşümlü:
  //   1) night-ambience  2) peaceful-sound  3) toy-music-box
  const eveningTracks = useMemo(() => {
    const order = ["night-ambience", "peaceful-sound", "toy-music-box"];
    return order
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is LullabyTrack => Boolean(t));
  }, [tracks]);

  // Playback
  const [currentTrack, setCurrentTrack] = useState<LullabyTrack>(tracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPending, setAudioPending] = useState(false);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const eveningIdxRef = useRef(0);
  const nightIdxRef = useRef(0);
  const autoModeRef = useRef<"none" | "evening" | "night" | "morning" | "wakeup">("none");
  const pendingPlayRef = useRef<(() => void) | null>(null);

  /* ---------- time ticker — 1 sn (saat geçişleri için hassas) + saat hilesi tespiti ---------- */
  const [tampered, setTampered] = useState(false);
  const lastTickRef = useRef<{ wall: number; perf: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const wallNow = Date.now();
      const perfNow = performance.now();
      const prev = lastTickRef.current;
      if (prev) {
        const wallDelta = wallNow - prev.wall;
        const perfDelta = perfNow - prev.perf;
        // Sekme arka plana atılınca setInterval gecikebilir → tolerans 30 sn.
        // Saat geri/ileri alındıysa wall ile perf birbirinden çok farklı ilerler.
        // Kural sadece uyku penceresinde (21:00 → 09:00) geçerli — gündüz oynamada
        // saat değişikliği uyarısı verilmez.
        if (Math.abs(wallDelta - perfDelta) > 30000) {
          const d = new Date(wallNow);
          const h = d.getHours();
          const inSleepWindow = h >= 21 || h < 9;
          // Atlama sonrası varış saati ya da atlamadan önceki saat uyku
          // penceresindeyse uyar (çocuk 20:55'ten 09:05'e atlasa bile yakalansın).
          const prevH = new Date(prev.wall).getHours();
          const prevInSleep = prevH >= 21 || prevH < 9;
          if (inSleepWindow || prevInSleep) {
            setTampered(true);
          }
        }
      }
      lastTickRef.current = { wall: wallNow, perf: perfNow };
      setNow(new Date(wallNow));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  // Gece (21:00 → 07:59), sabah ninnisi (08:00 → 08:58), uyanma (08:59)
  const isNightHours = hour >= 21 || hour < 8;
  const isMorningMusic = hour === 8 && minute < 59;
  const isWakeup = hour === 8 && minute === 59;
  const isLocked = isNightHours || isMorningMusic || isWakeup;
  const isEvening = hour === 20;
  const isSleepy = (hour === 20 && minute >= 45) || isNightHours || isWakeup;

  // 08:59 → 09:00 geri sayım (60 → 0 sn)
  const wakeupSecondsLeft = isWakeup ? Math.max(0, 60 - second) : 0;

  /* ---------- sun eye tracking ---------- */
  useEffect(() => {
    if (isSleepy) return;
    const onMove = (e: { clientX: number; clientY: number }) => {
      const el = sunWrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / Math.max(1, window.innerWidth / 2);
      const dy = (e.clientY - cy) / Math.max(1, window.innerHeight / 2);
      setMouse({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
    };
    const mh = (e: MouseEvent) => onMove(e);
    const th = (e: TouchEvent) => { const t = e.touches[0]; if (t) onMove({ clientX: t.clientX, clientY: t.clientY }); };
    window.addEventListener("mousemove", mh);
    window.addEventListener("touchmove", th);
    return () => { window.removeEventListener("mousemove", mh); window.removeEventListener("touchmove", th); };
  }, [isSleepy]);

  /* ---------- audio playback (mp3 only) ---------- */
  const stopAll = useCallback(() => {
    if (audioElRef.current) { audioElRef.current.pause(); }
    setIsPlaying(false);
  }, []);

  const startTrack = useCallback((track: LullabyTrack, loop = true, onEnded?: () => void) => {
    const el = audioElRef.current ?? new Audio();
    audioElRef.current = el;
    el.onended = null;
    el.pause();
    el.src = track.src;
    el.loop = loop;
    el.volume = 0.7;
    if (onEnded) el.onended = onEnded;
    setCurrentTrack(track);
    const tryPlay = () => {
      el.play().then(() => {
        setIsPlaying(true);
        setAudioPending(false);
        pendingPlayRef.current = null;
      }).catch(() => {
        // Tarayıcı otomatik oynatmayı engelledi — ilk kullanıcı dokunuşunda yeniden dene.
        setIsPlaying(false);
        setAudioPending(true);
        pendingPlayRef.current = tryPlay;
      });
    };
    tryPlay();
  }, []);

  // İlk kullanıcı etkileşiminde bekleyen otomatik çalmayı tetikle (autoplay policy fallback).
  useEffect(() => {
    const handler = () => {
      const fn = pendingPlayRef.current;
      if (fn) fn();
    };
    window.addEventListener("pointerdown", handler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  /* ---------- AUTO-PLAY
   *  21:00 → 07:59 : gentle-lullaby döngüde (gece)
   *  08:00 → 08:58 : sweet-dreams döngüde (sabah uyanış)
   *  08:59         : müzik yok, "GüneşOS uyanıyor" geri sayımı
   *  20:00 → 20:59 : 4 ninni sırayla (night-ambience → peaceful → toy-music → soft-melody)
   *  diğer saatler  : sessiz
   * ---------- */
  useEffect(() => {
    const desired: "night" | "morning" | "wakeup" | "evening" | "none" =
      isNightHours ? "night"
      : isMorningMusic ? "morning"
      : isWakeup ? "wakeup"
      : isEvening ? "evening"
      : "none";

    if (desired === autoModeRef.current) return;
    autoModeRef.current = desired;

    if (desired === "night") {
      nightIdxRef.current = 0;
      const playNextNight = () => {
        const list = nightTracks;
        if (list.length === 0) return;
        const t = list[nightIdxRef.current % list.length];
        nightIdxRef.current += 1;
        startTrack(t, false, playNextNight);
      };
      playNextNight();
    } else if (desired === "morning") {
      startTrack(morningTrack, true);
    } else if (desired === "evening") {
      eveningIdxRef.current = 0;
      const playNext = () => {
        const list = eveningTracks;
        if (list.length === 0) return;
        const t = list[eveningIdxRef.current % list.length];
        eveningIdxRef.current += 1;
        startTrack(t, false, playNext);
      };
      playNext();
    } else {
      // wakeup veya none → sessiz
      stopAll();
    }
  }, [isNightHours, isMorningMusic, isWakeup, isEvening, nightTracks, morningTrack, eveningTracks, startTrack, stopAll]);

  useEffect(() => () => { if (audioElRef.current) audioElRef.current.pause(); }, []);

  const togglePlay = () => {
    if (isPlaying) { stopAll(); }
    else { startTrack(currentTrack, true); }
  };
  const selectTrack = (t: LullabyTrack) => { startTrack(t, true); };

  /* ---------- sun mascot (göz takibi kaldırıldı — gerçekçi olmadığı için) ---------- */
  const SunMascot: React.FC<{ size?: number; floating?: boolean }> = ({ size = 96, floating = true }) => {
    return (
      <div ref={sunWrapRef} className="relative inline-block" style={{
        width: size, height: size,
        animation: floating ? (isSleepy ? "sun-breathe 4.5s ease-in-out infinite" : "sun-bob 3.2s ease-in-out infinite") : "none",
        filter: isSleepy ? "drop-shadow(0 10px 20px rgba(99,102,241,.5))" : "drop-shadow(0 10px 24px rgba(251,191,36,.55))",
      }}>
        <img src={isSleepy ? sunSleepyImg : sunHappyImg} alt={isSleepy ? "Uykulu güneş" : "Güneş"}
          width={size} height={size} loading="lazy" className="select-none pointer-events-none"
          style={{ width: "100%", height: "100%" }} />
      </div>
    );
  };

  const styles = (
    <style>{`
      @keyframes sun-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      @keyframes sun-breathe { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-3px) scale(1.03); } }
      @keyframes twinkle { 0%,100% { opacity: .3; } 50% { opacity: 1; } }
      @keyframes balloon-float { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-8px) rotate(2deg); } }
      @keyframes cloud-drift { from { transform: translateX(-10px); } to { transform: translateX(10px); } }
      @keyframes rainbow-fade { 0%,100% { opacity: .5; } 50% { opacity: .9; } }
      @keyframes sun-slide-in { 0% { transform: translateX(140%) rotate(-20deg); opacity: 0; } 100% { transform: translateX(0) rotate(0deg); opacity: 1; } }
      @keyframes blanket-tuck { 0% { transform: translateY(-8px) scaleY(.8); opacity: 0; } 100% { transform: translateY(0) scaleY(1); opacity: 1; } }
    `}</style>
  );

  /* ============ SAAT HİLESİ TESPİT EDİLDİ — battaniyenin altından kafa ============ */
  if (tampered) {
    return (
      <div className="w-full h-full relative overflow-hidden text-white"
           style={{ background: "radial-gradient(120% 80% at 50% 0%, #1e1b4b 0%, #0f172a 55%, #020617 100%)" }}>
        {styles}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i} className="absolute rounded-full bg-white" style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 70}%`,
              width: `${1 + Math.random() * 2}px`, height: `${1 + Math.random() * 2}px`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite`,
              opacity: 0.7,
            }} />
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center pt-12 px-6 text-center">
          {/* battaniyenin altından kafasını hafifçe çıkaran güneş */}
          <div className="relative mb-4" style={{ width: 140, height: 130 }}>
            <img src={sunSleepyImg} alt="Uyuyan güneş" width={120} height={120}
                 className="absolute left-1/2 -translate-x-1/2"
                 style={{ top: 6, width: 120, height: 120,
                          filter: "drop-shadow(0 6px 12px rgba(99,102,241,.6))",
                          animation: "sun-breathe 4.5s ease-in-out infinite",
                          clipPath: "inset(0 0 38% 0)" }} />
            <svg viewBox="0 0 140 70" className="absolute left-0"
                 style={{ bottom: 0, width: 140, height: 70,
                          animation: "blanket-tuck .9s ease-out both",
                          filter: "drop-shadow(0 6px 12px rgba(0,0,0,.4))" }}>
              <defs>
                <linearGradient id="blanketGrad2" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <path d="M5,22 Q35,4 70,8 Q105,4 135,22 L140,68 L0,68 Z" fill="url(#blanketGrad2)" />
              <path d="M12,28 Q40,14 70,16 Q100,14 128,28" stroke="#c7b8ff" strokeWidth="1.4" fill="none" strokeDasharray="3 3" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Ben GüneşOS · seni düşünen GüneşOS</h2>
          <p className="text-sm mt-3 text-indigo-100/90 leading-relaxed max-w-xs">
            21:00 uyku vaktiydi · sen saat ile oynadın 🙈<br/>
            Sabah <b>09:00</b>'da oyunlarla oynayana kadar tatlı rüyalar.
          </p>
          <p className="text-xs mt-3 text-indigo-200/70">Şimdi ben yatıyorum, sen de yat 💜</p>
        </div>
      </div>
    );
  }

  /* ============ LOCKED 21:00 → 09:00 — Yatak Odası / Sabah / Uyanış ============ */
  if (isLocked) {
    const isMorningScene = isMorningMusic || isWakeup;
    const bg = isMorningScene
      ? "radial-gradient(120% 80% at 50% 0%, #fde68a 0%, #fb923c 45%, #f97316 100%)"
      : "radial-gradient(120% 80% at 50% 0%, #1e1b4b 0%, #0f172a 55%, #020617 100%)";
    const textTone = isMorningScene ? "text-amber-950" : "text-white";
    const subTone = isMorningScene ? "text-amber-900/80" : "text-indigo-200/80";
    const subTone2 = isMorningScene ? "text-amber-900/60" : "text-indigo-200/50";

    return (
      <div className={`w-full h-full relative overflow-hidden ${textTone}`} style={{ background: bg }}>
        {styles}

        {/* Gece: yıldızlar, Sabah: parıltılar */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 60 }).map((_, i) => (
            <span key={i} className={`absolute rounded-full ${isMorningScene ? "bg-yellow-100" : "bg-white"}`} style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 70}%`,
              width: `${1 + Math.random() * 2.5}px`, height: `${1 + Math.random() * 2.5}px`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite`,
              opacity: 0.7,
            }} />
          ))}
        </div>

        {/* Sabah-uyanış: GüneşOS sağdan yavaşça giriyor · Sabah-müzik: parlak güneş · Gece: ay */}
        {isWakeup ? (
          <div className="absolute top-8 right-6 pointer-events-none"
               style={{ animation: "sun-slide-in 5s cubic-bezier(.22,.61,.36,1) forwards" }}>
            <img src={sunHappyImg} alt="GüneşOS uyanıyor" width={128} height={128}
                 className="w-32 h-32 select-none"
                 style={{ filter: "drop-shadow(0 10px 30px rgba(251,191,36,.7))" }} />
          </div>
        ) : isMorningScene ? (
          <div className="absolute top-10 right-8 pointer-events-none" style={{ animation: "sun-breathe 4s ease-in-out infinite" }}>
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-400 shadow-[0_0_70px_25px_rgba(253,224,71,0.55)]" />
          </div>
        ) : (
          <div className="absolute top-10 right-8 pointer-events-none" style={{ animation: "sun-breathe 6s ease-in-out infinite" }}>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 shadow-[0_0_60px_20px_rgba(254,240,138,0.35)]" />
            <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-yellow-200/60" />
            <div className="absolute top-10 left-12 w-2 h-2 rounded-full bg-yellow-200/50" />
            <div className="absolute bottom-4 left-6 w-4 h-4 rounded-full bg-yellow-200/40" />
          </div>
        )}

        {/* tepe silüetleri */}
        <svg viewBox="0 0 400 120" className="absolute bottom-0 left-0 w-full pointer-events-none" preserveAspectRatio="none" style={{ height: 110 }}>
          <path d="M0,120 L0,70 Q50,30 110,55 T220,50 T330,65 T400,55 L400,120 Z" fill={isMorningScene ? "#9a3412" : "#0b1027"} />
          <path d="M0,120 L0,90 Q60,65 130,80 T260,75 T400,85 L400,120 Z" fill={isMorningScene ? "#7c2d12" : "#060a1d"} />
        </svg>

        {/* başlık */}
        <div className="relative z-10 flex flex-col items-center pt-10 px-4 text-center">
          {/* Gece: güneşin üstüne battaniye örtüldü · Sabah müzik: gündoğumu · Uyanış: parıltı */}
          {isWakeup ? (
            <div className="text-5xl mb-2" style={{ animation: "sun-breathe 4s ease-in-out infinite" }}>✨</div>
          ) : isMorningMusic ? (
            <div className="text-5xl mb-2" style={{ animation: "sun-breathe 4s ease-in-out infinite" }}>🌅</div>
          ) : (
            <div className="relative mb-2" style={{ width: 88, height: 76 }}>
              {/* uyuyan güneş */}
              <img src={sunSleepyImg} alt="Uyuyan güneş" width={88} height={88}
                   className="absolute inset-0 w-[88px] h-[88px] select-none"
                   style={{ filter: "drop-shadow(0 6px 12px rgba(99,102,241,.5))",
                            animation: "sun-breathe 4.5s ease-in-out infinite" }} />
              {/* battaniye — yumuşak yorgan kıvrımı */}
              <svg viewBox="0 0 100 50" className="absolute left-1/2 -translate-x-1/2"
                   style={{ bottom: -6, width: 110, height: 55,
                            animation: "blanket-tuck .9s ease-out both",
                            filter: "drop-shadow(0 4px 8px rgba(0,0,0,.35))" }}>
                <defs>
                  <linearGradient id="blanketGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <path d="M5,18 Q25,4 50,8 Q75,4 95,18 L100,48 L0,48 Z" fill="url(#blanketGrad)" />
                {/* dikiş çizgisi */}
                <path d="M10,22 Q30,12 50,14 Q70,12 90,22" stroke="#c7b8ff" strokeWidth="1.2" fill="none" strokeDasharray="3 3" />
              </svg>
            </div>
          )}
          <h2 className="text-3xl font-extrabold tracking-tight">
            {isWakeup
              ? "GüneşOS uyanıyor"
              : isMorningMusic
                ? "Günaydın yaklaşıyor"
                : "İyi uykular çocuklar"}
          </h2>
          <p className={`text-sm mt-2 ${subTone}`}>
            {isWakeup
              ? "Hayırlı sabahlar çocuklar 🌞"
              : `${isMorningMusic ? "Yumuşak uyanış" : "Tatlı rüyalar"} · ${now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
          {isWakeup ? (
            <div className="mt-5 flex flex-col items-center">
              <div className="text-6xl font-black tabular-nums tracking-tight drop-shadow-lg">
                {`0:${String(wakeupSecondsLeft).padStart(2, "0")}`}
              </div>
              <p className={`text-xs mt-2 ${subTone2}`}>Oyunlar 09:00'da açılıyor…</p>
            </div>
          ) : (
            <p className={`text-[11px] mt-1 ${subTone2}`}>
              {isMorningMusic ? "Oyunlar 09:00'da açılacak" : "Oyunlar 09:00'da yeniden açılacak"}
            </p>
          )}
        </div>

        {/* now playing kart — uyanış anında müzik yok */}
        {!isWakeup && (
          <div className="relative z-10 w-full max-w-sm mx-auto px-4 mt-6">
            <div className={`rounded-3xl p-5 backdrop-blur-xl border shadow-2xl ${isMorningScene ? "border-amber-200/60" : "border-white/15"}`}
                 style={{ background: isMorningScene
                   ? "linear-gradient(135deg, rgba(255,237,213,.55), rgba(254,215,170,.35))"
                   : "linear-gradient(135deg, rgba(99,102,241,.25), rgba(168,85,247,.15))" }}>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner"
                     style={{ background: isMorningScene
                       ? "linear-gradient(135deg, #fb923c, #f59e0b)"
                       : "linear-gradient(135deg, #6366f1, #a855f7)" }}>
                  {currentTrack.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold truncate">{currentTrack.title}</p>
                  <p className={`text-[11px] truncate ${subTone}`}>{currentTrack.artist}</p>
                  {isPlaying && (
                    <div className="flex gap-0.5 mt-1.5">
                      {[0,1,2,3,4].map(i => (
                        <span key={i} className={`w-0.5 rounded-full ${isMorningScene ? "bg-amber-700/80" : "bg-indigo-200/80"}`} style={{
                          height: 10, animation: `sun-bob ${0.6 + i*0.15}s ease-in-out infinite`
                        }} />
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={togglePlay}
                  className={`w-12 h-12 rounded-full hover:scale-105 transition flex items-center justify-center text-xl shadow-lg ${isMorningScene ? "bg-white text-orange-600" : "bg-white text-indigo-700"}`}>
                  {isPlaying ? "⏸" : "▶"}
                </button>
              </div>
              <p className={`text-[10px] mt-4 text-center ${subTone2}`}>
                {isMorningMusic
                  ? "Sweet Dreams sabaha enerji katıyor 🌅"
                  : "Soft Melody & Gentle Lullaby dönüşümlü çalar 🌙"}
              </p>
            </div>
          </div>
        )}

        {/* Autoplay engellendiyse: tüm ekranı tek dokunuş alanı yap */}
        {audioPending && !isWakeup && (
          <button
            onClick={() => { const fn = pendingPlayRef.current; if (fn) fn(); }}
            className="absolute inset-0 z-20 flex items-end justify-center pb-24 bg-black/0 active:bg-black/10 transition"
            aria-label="Müziği başlat">
            <span className="px-5 py-2.5 rounded-full bg-white/90 text-indigo-700 text-sm font-bold shadow-xl backdrop-blur animate-pulse">
              🎵 Dokun · müzik başlasın
            </span>
          </button>
        )}
      </div>
    );
  }

  /* ============ LULLABY PAGE ============ */
  if (showLullaby) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
        {styles}
        <div className="flex items-center gap-2 p-2 bg-white/70 backdrop-blur border-b border-purple-100">
          <button onClick={() => setShowLullaby(false)} className="text-sm px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">← Geri</button>
          <span className="text-sm font-bold text-purple-800">🌙 Ninniler</span>
        </div>
        <div className="flex-1 overflow-auto flex flex-col items-center p-6">
          <SunMascot size={96} />
          <h3 className="text-lg font-bold text-purple-800 mt-3">{currentTrack.title}</h3>
          <p className="text-xs text-gray-500 mb-4">{currentTrack.artist}</p>
          <button onClick={togglePlay} className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-3xl text-white shadow-lg active:scale-95 transition">
            {isPlaying ? "⏸" : "▶️"}
          </button>
          <div className="w-full max-w-sm space-y-2 mt-6">
            {tracks.map((t) => (
              <button key={t.id} onClick={() => selectTrack(t)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${currentTrack.id === t.id ? "bg-purple-100 border-2 border-purple-400 shadow" : "bg-white border border-purple-100"}`}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-purple-800 truncate">{t.title}</p>
                  <p className="text-[10px] text-gray-500 truncate">{t.artist}</p>
                </div>
                {currentTrack.id === t.id && isPlaying && <span className="text-xs animate-pulse">🔊</span>}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-4 text-center max-w-xs leading-relaxed">
            🌅 <b>08:00–08:59</b>: Sweet Dreams &nbsp;·&nbsp; ☀️ <b>09:00–19:59</b>: oyun zamanı<br/>
            🌆 <b>20:00–21:00</b>: 3 ninni dönüşümlü &nbsp;·&nbsp; 🌙 <b>21:00–08:00</b>: Soft Melody &amp; Gentle Lullaby dönüşümlü
          </p>
        </div>
      </div>
    );
  }

  if (activeGame) {
    const gameLabel: Record<GameId, string> = {
      memory: "🧠 Hafıza Oyunu", math: "🔢 Matematik", pattern: "🔷 Desen Tamamla",
      wordguess: "📝 Kelime Avı", colorMatch: "🎨 Renk Eşleştir", simon: "🔔 Simon",
      sliding: "🧩 Kaydırma Bulmacası", numberPuzzle: "🎯 Sayı Bulmacası",
    };
    return (
      <div className="w-full h-full flex flex-col bg-gradient-to-b from-sky-50 to-white relative">
        {styles}
        <div className="flex items-center gap-2 p-2 bg-white/80 backdrop-blur border-b border-sky-200">
          <button onClick={() => setActiveGame(null)} className="text-sm px-2 py-1 bg-sky-600 text-white rounded hover:bg-sky-700">← Geri</button>
          <span className="text-sm font-bold text-sky-800">{gameLabel[activeGame]}</span>
        </div>
        <div className="flex-1 overflow-auto">
          {activeGame === "memory" && <MemoryGame />}
          {activeGame === "math" && <MathGame />}
          {activeGame === "pattern" && <PatternGame />}
          {activeGame === "wordguess" && <WordGuessGame />}
          {activeGame === "colorMatch" && <ColorMatchGame />}
          {activeGame === "simon" && <SimonGame />}
          {activeGame === "sliding" && <SlidingPuzzle />}
          {activeGame === "numberPuzzle" && <NumberPuzzle />}
        </div>
        {/* GüneşOS oyun sırasında da çocuklara eşlik ediyor */}
        <div className="absolute top-2 right-3 pointer-events-none z-20" title="GüneşOS seninle 🌞">
          <SunMascot size={64} />
        </div>
      </div>
    );
  }

  /* ============ MAIN MENU — SKY + BALLOONS ============ */
  const games: { id: GameId; emoji: string; name: string; color: string; tilt: number }[] = [
    { id: "memory",       emoji: "🧠", name: "Hafıza",       color: "from-pink-400 to-rose-500",     tilt: -3 },
    { id: "math",         emoji: "🔢", name: "Matematik",    color: "from-sky-400 to-blue-500",      tilt:  2 },
    { id: "pattern",      emoji: "🔷", name: "Desen",        color: "from-violet-400 to-purple-500", tilt: -2 },
    { id: "wordguess",    emoji: "📝", name: "Kelime Avı",   color: "from-emerald-400 to-green-500", tilt:  3 },
    { id: "colorMatch",   emoji: "🎨", name: "Renkler",      color: "from-orange-400 to-amber-500",  tilt: -3 },
    { id: "simon",        emoji: "🔔", name: "Simon",        color: "from-fuchsia-400 to-pink-500",  tilt:  2 },
    { id: "sliding",      emoji: "🧩", name: "Kaydırma",     color: "from-teal-400 to-cyan-500",     tilt: -2 },
    { id: "numberPuzzle", emoji: "🎯", name: "Sayı Hedefi",  color: "from-yellow-400 to-orange-500", tilt:  3 },
  ];

  return (
    <div className="w-full h-full overflow-auto relative" style={{
      background: "linear-gradient(180deg, #87CEEB 0%, #B0E0E6 40%, #E0F6FF 100%)",
    }}>
      {styles}

      {/* clouds */}
      <div className="absolute top-4 left-2 text-5xl opacity-90 pointer-events-none" style={{ animation: "cloud-drift 8s ease-in-out infinite alternate" }}>☁️</div>
      <div className="absolute top-14 right-4 text-4xl opacity-80 pointer-events-none" style={{ animation: "cloud-drift 10s ease-in-out infinite alternate-reverse" }}>☁️</div>
      <div className="absolute bottom-20 left-4 text-3xl opacity-70 pointer-events-none" style={{ animation: "cloud-drift 12s ease-in-out infinite alternate" }}>☁️</div>

      {/* sun at top center */}
      <div className="relative flex flex-col items-center pt-5 pb-2 z-10">
        <SunMascot size={92} />
        <h2 className="text-2xl font-extrabold text-white drop-shadow-md mt-2 tracking-tight">GüneşOS Oyunlar</h2>
        <p className="text-[11px] text-white/90 drop-shadow">
          {isSleepy ? "Güneş esniyor… 21:00'de uyku zamanı ✨" : "Bir balon seç ve oyna! ✨"}
        </p>
      </div>

      {isSleepy && !isLocked && (
        <div className="mx-4 mb-2 p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 relative z-10">
          <span className="text-base">😴</span>
          <span>Güneşin uykusu geldi · {21 * 60 - (hour * 60 + minute)} dk içinde kapanacak.</span>
        </div>
      )}

      {/* balloon grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto p-4 pt-2 relative z-10">
        {games.map((g, i) => (
          <button key={g.id} onClick={() => setActiveGame(g.id)}
            className={`group relative flex flex-col items-center justify-center aspect-square rounded-[40%_40%_45%_45%/55%_55%_45%_45%] bg-gradient-to-br ${g.color} text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,.3),inset_0_-8px_15px_rgba(0,0,0,.15),inset_0_5px_10px_rgba(255,255,255,.4)] active:scale-95 transition-transform`}
            style={{ animation: `balloon-float ${3 + (i % 3) * 0.5}s ease-in-out ${i * 0.15}s infinite`, transform: `rotate(${g.tilt}deg)` }}>
            <span className="text-4xl mb-1 drop-shadow-md">{g.emoji}</span>
            <span className="text-sm font-extrabold drop-shadow tracking-tight">{g.name}</span>
            {/* balloon string */}
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-px h-3 bg-white/60" />
          </button>
        ))}
      </div>

      {/* Ninniler — moon at bottom */}
      <div className="flex justify-center pb-6 pt-2 relative z-10">
        <button onClick={() => setShowLullaby(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-sm font-bold shadow-xl hover:shadow-2xl active:scale-95 transition">
          <span className="text-xl">🌙</span> Ninniler
        </button>
      </div>
    </div>
  );
};

/* ===========================================================
 *  REUSABLE: difficulty picker
 * =========================================================== */
const DifficultyBar: React.FC<{ value: Difficulty; onChange: (d: Difficulty) => void }> = ({ value, onChange }) => {
  const items: { id: Difficulty; label: string; emoji: string }[] = [
    { id: "easy", label: "Kolay", emoji: "🟢" },
    { id: "medium", label: "Orta", emoji: "🟡" },
    { id: "hard", label: "Zor", emoji: "🔴" },
  ];
  return (
    <div className="flex gap-1.5 mb-3 bg-white/70 rounded-full p-1 shadow-sm">
      {items.map((it) => (
        <button key={it.id} onClick={() => onChange(it.id)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition ${value === it.id ? "bg-sky-500 text-white shadow" : "text-slate-600 hover:bg-sky-100"}`}>
          {it.emoji} {it.label}
        </button>
      ))}
    </div>
  );
};

/* ===========================================================
 *  MEMORY GAME — with difficulty (4 / 6 / 8 pairs)
 * =========================================================== */
const MemoryGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const pairCount = difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8;
  const emojis = ["🐶","🐱","🐸","🦊","🐻","🐼","🐨","🦁","🐵","🐯","🐰","🐮"];

  const [cards, setCards] = useState<{ emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const init = useCallback(() => {
    const pick = emojis.slice(0, pairCount);
    const shuffled = [...pick, ...pick].sort(() => Math.random() - 0.5)
      .map((emoji) => ({ emoji, flipped: false, matched: false }));
    setCards(shuffled); setFlippedIndices([]); setMoves(0); setLocked(false);
  }, [pairCount]);

  useEffect(() => { init(); }, [init]);

  const handleFlip = (index: number) => {
    if (locked) return;
    if (cards[index].flipped || cards[index].matched) return;
    if (flippedIndices.length >= 2) return;

    const newCards = cards.map((c, i) => i === index ? { ...c, flipped: true } : c);
    const newFlipped = [...flippedIndices, index];
    setCards(newCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped;
      if (newCards[a].emoji === newCards[b].emoji) {
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c));
          setFlippedIndices([]);
        }, 300);
      } else {
        setLocked(true);
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => (i === a || i === b) ? { ...c, flipped: false } : c));
          setFlippedIndices([]); setLocked(false);
        }, 800);
      }
    }
  };

  const allMatched = cards.length > 0 && cards.every((c) => c.matched);
  const cols = pairCount === 4 ? "grid-cols-4" : pairCount === 6 ? "grid-cols-4" : "grid-cols-4";

  return (
    <div className="p-4 flex flex-col items-center">
      <DifficultyBar value={difficulty} onChange={setDifficulty} />
      <div className="flex gap-3 mb-3 text-sm text-slate-700">
        <span>Hamle: <b>{moves}</b></span>
        <span>Eşleşen: <b>{cards.filter(c => c.matched).length / 2}</b>/{pairCount}</span>
      </div>
      {allMatched && (
        <div className="text-center mb-3">
          <p className="text-green-600 font-bold">🎉 Harikasın! {moves} hamlede bitirdin!</p>
          <button onClick={init} className="mt-1 px-3 py-1 bg-sky-600 text-white text-sm rounded">Yeni Oyun</button>
        </div>
      )}
      <div className={`grid ${cols} gap-2`}>
        {cards.map((card, i) => (
          <button key={i} onClick={() => handleFlip(i)}
            className={`w-14 h-14 rounded-lg text-2xl flex items-center justify-center transition-all ${
              card.matched ? "bg-green-100 border-2 border-green-400" :
              card.flipped ? "bg-white border-2 border-sky-300" :
              "bg-sky-500 hover:bg-sky-600 text-white"}`}>
            {card.flipped || card.matched ? card.emoji : "?"}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ===========================================================
 *  MATH GAME — difficulty, skip, timer
 * =========================================================== */
const MathGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const generate = useCallback(() => {
    const maxN = difficulty === "easy" ? 10 : difficulty === "medium" ? 25 : 99;
    const ops = difficulty === "easy" ? ["+", "-"] : difficulty === "medium" ? ["+", "-", "×"] : ["+", "-", "×", "÷"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * maxN) + 1;
    let b = Math.floor(Math.random() * maxN) + 1;
    let result: number;
    if (op === "-") { if (b > a) [a, b] = [b, a]; result = a - b; }
    else if (op === "+") result = a + b;
    else if (op === "×") {
      const small = difficulty === "hard" ? 12 : 9;
      a = Math.floor(Math.random() * small) + 1; b = Math.floor(Math.random() * small) + 1;
      result = a * b;
    } else { // division — make it whole
      b = Math.floor(Math.random() * 9) + 2;
      result = Math.floor(Math.random() * 9) + 2;
      a = b * result;
    }
    return { text: `${a} ${op} ${b} = ?`, answer: result };
  }, [difficulty]);

  const [question, setQuestion] = useState(generate);
  useEffect(() => { setQuestion(generate()); setAnswer(""); setFeedback(""); }, [generate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(answer, 10);
    if (Number.isNaN(parsed)) return;
    if (parsed === question.answer) {
      setScore((s) => s + 1); setStreak((s) => s + 1);
      setFeedback("✅ Doğru!");
      setTimeout(() => { setQuestion(generate()); setAnswer(""); setFeedback(""); }, 500);
    } else {
      setStreak(0);
      setFeedback(`❌ Doğru cevap: ${question.answer}`);
      setTimeout(() => { setQuestion(generate()); setAnswer(""); setFeedback(""); }, 1400);
    }
  };

  const skip = () => { setStreak(0); setQuestion(generate()); setAnswer(""); setFeedback(""); };

  return (
    <div className="p-4 flex flex-col items-center">
      <DifficultyBar value={difficulty} onChange={setDifficulty} />
      <div className="flex gap-3 mb-2 text-sm text-slate-700">
        <span>Skor: <b>{score}</b></span>
        {streak >= 2 && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 animate-pulse">🔥 {streak} seri</span>}
      </div>
      <div className="text-4xl font-bold text-sky-800 mb-4 px-6 py-3 bg-white rounded-2xl shadow">{question.text}</div>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
        <input type="number" value={answer} onChange={(e) => setAnswer(e.target.value)}
          className="w-28 px-3 py-2 border-2 border-sky-300 rounded-lg text-center text-lg outline-none focus:border-sky-500 text-black" autoFocus />
        <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-bold">✓</button>
        <button type="button" onClick={skip} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-xs">Atla</button>
      </form>
      {feedback && <p className="text-sm font-bold text-slate-700">{feedback}</p>}
    </div>
  );
};

/* ===========================================================
 *  PATTERN GAME — easy: ABAB, medium: ABCABC, hard: ABBABB
 * =========================================================== */
const PatternGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const shapes = ["🔴","🔵","🟢","🟡","🟣","🟠","⚫","⚪"];
  const [pattern, setPattern] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [correct, setCorrect] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");

  const generate = useCallback(() => {
    const pool = [...shapes].sort(() => Math.random() - 0.5);
    let seq: string[]; let answer: string;
    if (difficulty === "easy") {
      const [a, b] = pool;
      seq = [a, b, a, b, a]; answer = b;
    } else if (difficulty === "medium") {
      const [a, b, c] = pool;
      seq = [a, b, c, a, b]; answer = c;
    } else {
      const [a, b] = pool;
      seq = [a, b, b, a, b, b, a]; answer = b;
    }
    const opts = [answer, ...shapes.filter((s) => s !== answer).slice(0, difficulty === "hard" ? 3 : 2)]
      .sort(() => Math.random() - 0.5);
    setPattern(seq); setCorrect(answer); setOptions(opts); setFeedback("");
  }, [difficulty]);

  useEffect(() => { generate(); }, [generate]);

  const handle = (ans: string) => {
    if (ans === correct) { setScore((s) => s + 1); setFeedback("✅ Doğru!"); setTimeout(generate, 700); }
    else setFeedback("❌ Tekrar dene!");
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <DifficultyBar value={difficulty} onChange={setDifficulty} />
      <p className="text-sm mb-2 text-slate-700">Skor: <b>{score}</b></p>
      <p className="text-sm mb-3 text-slate-700">Sıradaki ne olmalı?</p>
      <div className="flex gap-2 mb-4 text-2xl bg-white rounded-xl p-3 shadow">
        {pattern.map((s, i) => (<span key={i}>{s}</span>))}
        <span className="text-2xl">❓</span>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        {options.map((o, i) => (
          <button key={i} onClick={() => handle(o)} className="text-3xl p-3 bg-white rounded-xl border-2 border-sky-200 hover:border-sky-500 active:scale-95">{o}</button>
        ))}
      </div>
      {feedback && <p className="mt-2 text-sm font-bold text-slate-700">{feedback}</p>}
    </div>
  );
};

/* ===========================================================
 *  WORD GUESS — fully rebuilt: categories, difficulty,
 *  hints, hangman, score, multiple rounds
 * =========================================================== */

interface WordEntry { word: string; hint: string }
const WORD_BANK: Record<string, { easy: WordEntry[]; medium: WordEntry[]; hard: WordEntry[] }> = {
  Hayvanlar: {
    easy: [
      { word: "KEDI", hint: "Miyav diyen sevimli ev hayvanı" },
      { word: "KOPEK", hint: "En sadık dost" },
      { word: "KUS", hint: "Gökyüzünde uçar" },
      { word: "BALIK", hint: "Denizde yüzer" },
      { word: "AT", hint: "Üstüne binilir" },
      { word: "INEK", hint: "Süt veren çiftlik hayvanı" },
    ],
    medium: [
      { word: "ASLAN", hint: "Ormanların kralı" },
      { word: "FIL", hint: "Hortumlu dev hayvan" },
      { word: "TAVSAN", hint: "Uzun kulaklı, havuç sever" },
      { word: "PENGUEN", hint: "Buzda yaşar, smokin giyer" },
      { word: "ZURAFA", hint: "Çok uzun boyunlu hayvan" },
      { word: "KAPLUMBAGA", hint: "Yavaş yürür, kabuğu var" },
    ],
    hard: [
      { word: "GERGEDAN", hint: "Burnunda boynuzu olan iri hayvan" },
      { word: "AHTAPOT", hint: "Sekiz kollu deniz canlısı" },
      { word: "TIMSAH", hint: "Suda yaşayan keskin dişli sürüngen" },
      { word: "KIRPI", hint: "Sırtı dikenli küçük hayvan" },
      { word: "YUNUS", hint: "Zeki deniz memelisi" },
    ],
  },
  Meyveler: {
    easy: [
      { word: "ELMA", hint: "Kırmızı ya da yeşil yuvarlak meyve" },
      { word: "MUZ", hint: "Sarı ve uzun meyve" },
      { word: "UZUM", hint: "Salkım halinde olan meyve" },
      { word: "KIRAZ", hint: "Küçük, kırmızı ve tatlı" },
      { word: "INCIR", hint: "İçi taneli, tatlı meyve" },
    ],
    medium: [
      { word: "KARPUZ", hint: "Yazın yenen büyük yeşil meyve" },
      { word: "PORTAKAL", hint: "C vitamini deposu" },
      { word: "CILEK", hint: "Kırmızı, ufak ve kokulu" },
      { word: "SEFTALI", hint: "Tüylü ve sulu yaz meyvesi" },
      { word: "ANANAS", hint: "Tepesi yapraklı, sarı tropik meyve" },
    ],
    hard: [
      { word: "NAR", hint: "İçi taneli, kırmızı tohumlu meyve" },
      { word: "MANDALINA", hint: "Küçük portakal akrabası" },
      { word: "AVOKADO", hint: "Yeşil yağlı meyve" },
      { word: "FRAMBUAZ", hint: "Küçük kırmızı orman meyvesi" },
    ],
  },
  Renkler: {
    easy: [
      { word: "MAVI", hint: "Gökyüzünün rengi" },
      { word: "SARI", hint: "Güneşin rengi" },
      { word: "MOR", hint: "Patlıcanın rengi" },
      { word: "PEMBE", hint: "Tatlı bir kız rengi" },
    ],
    medium: [
      { word: "TURUNCU", hint: "Portakalın rengi" },
      { word: "KAHVE", hint: "Çikolata gibi koyu kahverengi" },
      { word: "GUMUS", hint: "Parlak gri metal rengi" },
    ],
    hard: [
      { word: "TURKUAZ", hint: "Deniz mavisiyle yeşil arası" },
      { word: "EFLATUN", hint: "Açık tonlu mor" },
      { word: "BORDO", hint: "Koyu kırmızı şarap rengi" },
    ],
  },
  Doga: {
    easy: [
      { word: "GUNES", hint: "Gündüz parıldar, ısıtır" },
      { word: "AY", hint: "Geceleri gökte parlar" },
      { word: "AGAC", hint: "Yapraklı uzun bitki" },
      { word: "DENIZ", hint: "Büyük tuzlu su" },
      { word: "YILDIZ", hint: "Gece gökte ışıldar" },
    ],
    medium: [
      { word: "DAG", hint: "Yüksek kayalık zirve" },
      { word: "BULUT", hint: "Gökte süzülen beyaz şey" },
      { word: "GOKKUSAGI", hint: "Yağmurdan sonra çıkan renkli yay" },
      { word: "CICEK", hint: "Renkli ve kokulu bitki" },
    ],
    hard: [
      { word: "VOLKAN", hint: "Lav püskürten dağ" },
      { word: "SELALE", hint: "Yüksekten dökülen su" },
      { word: "ORMAN", hint: "Sık ağaçlı geniş alan" },
      { word: "YANARDAG", hint: "Volkan'ın diğer adı" },
    ],
  },
};

const WordGuessGame: React.FC = () => {
  const [category, setCategory] = useState<string>("Hayvanlar");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [entry, setEntry] = useState<WordEntry>(() => WORD_BANK.Hayvanlar.easy[0]);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);

  const maxWrong = difficulty === "easy" ? 8 : difficulty === "medium" ? 6 : 4;

  const pickNew = useCallback((cat: string, diff: Difficulty) => {
    const pool = WORD_BANK[cat][diff];
    const next = pool[Math.floor(Math.random() * pool.length)];
    setEntry(next); setGuessed([]); setWrong(0); setShowHint(false);
  }, []);

  useEffect(() => { pickNew(category, difficulty); }, [category, difficulty, pickNew]);

  const word = entry.word;
  const display = word.split("").map((l) => (l === " " ? " " : guessed.includes(l) ? l : "_")).join(" ");
  const won = word.split("").every((l) => l === " " || guessed.includes(l));
  const lost = wrong >= maxWrong;

  const handleGuess = (letter: string) => {
    if (guessed.includes(letter) || won || lost) return;
    setGuessed((prev) => [...prev, letter]);
    if (!word.includes(letter)) setWrong((w) => w + 1);
  };

  useEffect(() => {
    if (won) { setScore((s) => s + (showHint ? 1 : 2) + (difficulty === "hard" ? 2 : difficulty === "medium" ? 1 : 0)); }
  }, [won]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextRound = () => { setRound((r) => r + 1); pickNew(category, difficulty); };

  const alphabet = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");
  // Hangman parts
  const hangmanParts = ["⭕", "|", "/", "\\", "/", "\\", "👁️", "👄"];
  const visibleParts = Math.min(wrong, hangmanParts.length);

  return (
    <div className="p-4 flex flex-col items-center max-w-md mx-auto">
      <DifficultyBar value={difficulty} onChange={setDifficulty} />

      {/* category pills */}
      <div className="flex gap-1.5 mb-3 flex-wrap justify-center">
        {Object.keys(WORD_BANK).map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${category === c ? "bg-emerald-500 text-white shadow" : "bg-white text-slate-600 hover:bg-emerald-50"}`}>
            {c === "Hayvanlar" ? "🐾" : c === "Meyveler" ? "🍎" : c === "Renkler" ? "🎨" : "🌿"} {c}
          </button>
        ))}
      </div>

      {/* status */}
      <div className="flex gap-3 mb-2 text-xs text-slate-700">
        <span>Tur: <b>{round}</b></span>
        <span>Skor: <b>{score}</b></span>
        <span>Can: <b className={wrong >= maxWrong - 1 ? "text-red-600" : ""}>{maxWrong - wrong}</b>/{maxWrong}</span>
      </div>

      {/* hangman canvas */}
      <div className="w-32 h-20 mb-2 bg-white/70 rounded-xl flex items-center justify-center text-2xl tracking-widest shadow-inner">
        {visibleParts === 0 ? <span className="text-slate-300">🌳</span> :
          hangmanParts.slice(0, visibleParts).join(" ")}
      </div>

      <div className="text-2xl font-mono font-bold tracking-widest mb-2 text-slate-800 bg-white/80 px-4 py-2 rounded-lg shadow">{display}</div>

      {/* hint */}
      <button onClick={() => setShowHint(true)} disabled={showHint || won || lost}
        className="mb-3 text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-200">
        💡 {showHint ? entry.hint : "İpucu Göster (−1 puan)"}
      </button>

      {(won || lost) && (
        <div className="mb-3 text-center">
          <p className="font-bold text-slate-800">{won ? "🎉 Bildin!" : `😢 Kelime: ${word}`}</p>
          <button onClick={nextRound} className="mt-2 px-4 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">Sıradaki ➜</button>
        </div>
      )}

      <div className="flex flex-wrap gap-1 justify-center">
        {alphabet.map((l) => {
          const used = guessed.includes(l);
          const inWord = word.includes(l);
          return (
            <button key={l} onClick={() => handleGuess(l)} disabled={used || won || lost}
              className={`w-7 h-8 text-xs font-bold rounded-md transition ${
                used ? (inWord ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900")
                     : "bg-white hover:bg-emerald-100 text-slate-800 shadow-sm"}`}>
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ===========================================================
 *  COLOR MATCH — difficulty
 * =========================================================== */
const ColorMatchGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const colorMap: Record<string, string> = {
    Kırmızı:"#ef4444", Mavi:"#3b82f6", Yeşil:"#22c55e", Sarı:"#eab308",
    Mor:"#a855f7", Turuncu:"#f97316", Pembe:"#ec4899", Kahve:"#a16207",
  };
  const optCount = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 6;
  const colorNames = Object.keys(colorMap);

  const generateRound = useCallback(() => {
    const textName = colorNames[Math.floor(Math.random() * colorNames.length)];
    const displayColor = colorMap[colorNames[Math.floor(Math.random() * colorNames.length)]];
    const correctColor = colorMap[textName];
    const opts = [correctColor, ...Object.values(colorMap).filter((c) => c !== correctColor).sort(() => Math.random() - 0.5).slice(0, optCount - 1)]
      .sort(() => Math.random() - 0.5);
    return { textName, displayColor, correctColor, options: opts };
  }, [optCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const [round, setRound] = useState(generateRound);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  useEffect(() => { setRound(generateRound()); }, [generateRound]);

  const handlePick = (color: string) => {
    if (color === round.correctColor) {
      setScore((s) => s + 1); setFeedback("✅");
      setTimeout(() => { setRound(generateRound()); setFeedback(""); }, 500);
    } else { setFeedback("❌"); setTimeout(() => setFeedback(""), 500); }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <DifficultyBar value={difficulty} onChange={setDifficulty} />
      <p className="text-sm mb-2 text-slate-700">Skor: <b>{score}</b></p>
      <p className="text-sm mb-1 text-slate-700">Bu kelimenin gerçek rengi hangisi?</p>
      <div className="text-4xl font-bold mb-4" style={{ color: round.displayColor }}>{round.textName}</div>
      <div className="flex gap-3 flex-wrap justify-center max-w-xs">
        {round.options.map((c, i) => (
          <button key={i} onClick={() => handlePick(c)}
            className="w-14 h-14 rounded-full border-4 border-white shadow-md hover:scale-110 active:scale-95 transition-transform"
            style={{ backgroundColor: c }} />
        ))}
      </div>
      {feedback && <p className="mt-2 text-2xl">{feedback}</p>}
    </div>
  );
};

/* ===========================================================
 *  SIMON — difficulty controls speed
 * =========================================================== */
const SimonGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const speed = difficulty === "easy" ? 700 : difficulty === "medium" ? 500 : 320;
  const colors = useMemo(() => [
    { name: "red", bg: "bg-red-500", activeBg: "bg-red-300", emoji: "🔴" },
    { name: "blue", bg: "bg-blue-500", activeBg: "bg-blue-300", emoji: "🔵" },
    { name: "green", bg: "bg-green-500", activeBg: "bg-green-300", emoji: "🟢" },
    { name: "yellow", bg: "bg-yellow-500", activeBg: "bg-yellow-300", emoji: "🟡" },
  ], []);
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [showing, setShowing] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const showSequence = useCallback((seq: string[]) => {
    setShowing(true);
    seq.forEach((color, i) => {
      setTimeout(() => { setActiveColor(color); setTimeout(() => setActiveColor(null), speed * 0.55); }, i * speed);
    });
    setTimeout(() => setShowing(false), seq.length * speed + 100);
  }, [speed]);

  const startGame = useCallback(() => {
    const first = colors[Math.floor(Math.random() * colors.length)].name;
    setSequence([first]); setPlayerIndex(0); setGameOver(false); setStarted(true); setScore(0);
    setTimeout(() => showSequence([first]), 400);
  }, [colors, showSequence]);

  const handleClick = (name: string) => {
    if (showing || gameOver) return;
    setActiveColor(name); setTimeout(() => setActiveColor(null), 200);
    if (name !== sequence[playerIndex]) { setGameOver(true); return; }
    const nx = playerIndex + 1;
    if (nx >= sequence.length) {
      setScore((s) => s + 1);
      const next = colors[Math.floor(Math.random() * colors.length)].name;
      const newSeq = [...sequence, next];
      setSequence(newSeq); setPlayerIndex(0);
      setTimeout(() => showSequence(newSeq), 700);
    } else setPlayerIndex(nx);
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <DifficultyBar value={difficulty} onChange={setDifficulty} />
      <p className="text-sm mb-2 text-slate-700">Seviye: <b>{score}</b></p>
      {!started && !gameOver && (
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-3">Renk sırasını izle ve tekrarla!</p>
          <button onClick={startGame} className="px-6 py-3 bg-sky-600 text-white rounded-xl text-lg font-bold hover:bg-sky-700">🎮 Başla</button>
        </div>
      )}
      {gameOver && (
        <div className="text-center mb-3">
          <p className="text-lg font-bold text-red-600">😢 Oyun Bitti!</p>
          <p className="text-sm text-slate-700">Seviye: {score}</p>
          <button onClick={startGame} className="mt-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">Tekrar Oyna</button>
        </div>
      )}
      {started && !gameOver && (
        <>
          <p className="text-xs text-slate-500 mb-3">{showing ? "👀 İzle..." : `👆 Sıra sende! (${playerIndex + 1}/${sequence.length})`}</p>
          <div className="grid grid-cols-2 gap-3">
            {colors.map((c) => (
              <button key={c.name} onClick={() => handleClick(c.name)} disabled={showing}
                className={`w-20 h-20 rounded-2xl transition-all duration-150 flex items-center justify-center text-3xl ${
                  activeColor === c.name ? c.activeBg + " scale-110 shadow-lg" : c.bg + " hover:opacity-80"
                } ${showing ? "cursor-not-allowed" : "cursor-pointer"}`}>
                {c.emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ===========================================================
 *  SLIDING PUZZLE — 3x3 / 4x4 / 5x5
 * =========================================================== */
const SlidingPuzzle: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const size = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const initPuzzle = useCallback(() => {
    const arr = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
    arr.push(0);
    let blank = arr.indexOf(0);
    const shuffles = size * size * 20;
    for (let i = 0; i < shuffles; i++) {
      const neighbors: number[] = [];
      const row = Math.floor(blank / size), col = blank % size;
      if (row > 0) neighbors.push(blank - size);
      if (row < size - 1) neighbors.push(blank + size);
      if (col > 0) neighbors.push(blank - 1);
      if (col < size - 1) neighbors.push(blank + 1);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      [arr[blank], arr[pick]] = [arr[pick], arr[blank]]; blank = pick;
    }
    setTiles(arr); setMoves(0); setWon(false);
  }, [size]);

  useEffect(() => { initPuzzle(); }, [initPuzzle]);

  const handleClick = (index: number) => {
    if (won) return;
    const blank = tiles.indexOf(0);
    const row = Math.floor(index / size), col = index % size;
    const br = Math.floor(blank / size), bc = blank % size;
    if (Math.abs(row - br) + Math.abs(col - bc) !== 1) return;
    const nt = [...tiles];
    [nt[index], nt[blank]] = [nt[blank], nt[index]];
    setTiles(nt); setMoves((m) => m + 1);
    const goal = Array.from({ length: size * size - 1 }, (_, i) => i + 1).concat(0);
    if (nt.every((t, i) => t === goal[i])) setWon(true);
  };

  const tilePx = size === 3 ? 70 : size === 4 ? 56 : 44;

  return (
    <div className="p-4 flex flex-col items-center">
      <DifficultyBar value={difficulty} onChange={setDifficulty} />
      <p className="text-sm mb-2 text-slate-700">Hamle: <b>{moves}</b> · <b>{size}×{size}</b></p>
      {won && (
        <div className="mb-3 text-center">
          <p className="text-green-600 font-bold">🎉 {moves} hamlede çözdün!</p>
          <button onClick={initPuzzle} className="mt-1 px-3 py-1 bg-sky-600 text-white text-sm rounded">Yeni Oyun</button>
        </div>
      )}
      <div className="grid gap-1 bg-sky-200 p-1 rounded-xl" style={{ gridTemplateColumns: `repeat(${size}, ${tilePx}px)` }}>
        {tiles.map((tile, i) => (
          <button key={i} onClick={() => handleClick(i)}
            style={{ width: tilePx, height: tilePx }}
            className={`rounded-lg flex items-center justify-center font-bold transition-all ${
              tile === 0 ? "bg-sky-200" : "bg-white shadow-md hover:bg-sky-50 text-slate-800"
            } ${size === 5 ? "text-base" : size === 4 ? "text-lg" : "text-2xl"}`}>
            {tile === 0 ? "" : tile}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ===========================================================
 *  NUMBER PUZZLE — fixed; difficulty
 * =========================================================== */
const NumberPuzzle: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [target, setTarget] = useState(0);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [streak, setStreak] = useState(0);

  const ops = useMemo(() => difficulty === "easy" ? ["+", "-"] : difficulty === "medium" ? ["+", "-", "×"] : ["+", "-", "×"], [difficulty]);

  const generate = useCallback(() => {
    const maxNum = difficulty === "easy" ? 9 : difficulty === "medium" ? 15 : 20;
    const numCount = difficulty === "easy" ? 4 : 5;
    const nums = Array.from({ length: numCount }, () => Math.floor(Math.random() * maxNum) + 1);
    // pick two distinct numbers and an op to define a guaranteed-reachable target
    const i1 = 0, i2 = 1;
    const op = ops[Math.floor(Math.random() * ops.length)];
    const a = nums[i1], b = nums[i2];
    let answer: number;
    if (op === "+") answer = a + b;
    else if (op === "-") answer = Math.abs(a - b);
    else answer = a * b;
    setTarget(answer);
    setNumbers([...nums].sort(() => Math.random() - 0.5));
    setSelectedIndices([]); setSelectedOp(null); setFeedback("");
  }, [difficulty, ops]);

  useEffect(() => { generate(); }, [generate]);

  const handleNumberClick = (index: number) => {
    if (selectedIndices.includes(index)) { setSelectedIndices(selectedIndices.filter((i) => i !== index)); return; }
    if (selectedIndices.length >= 2) return;
    setSelectedIndices((prev) => [...prev, index]);
  };
  const handleOpClick = (op: string) => setSelectedOp(selectedOp === op ? null : op);

  const checkAnswer = () => {
    if (selectedIndices.length < 2 || !selectedOp) return;
    const a = numbers[selectedIndices[0]], b = numbers[selectedIndices[1]];
    let r: number;
    if (selectedOp === "+") r = a + b;
    else if (selectedOp === "-") r = Math.abs(a - b);
    else r = a * b;
    if (r === target) {
      const newStreak = streak + 1, bonus = newStreak >= 3 ? 2 : 1;
      setScore((s) => s + bonus); setStreak(newStreak);
      setFeedback(`✅ Doğru! ${bonus > 1 ? "🔥 ×2!" : ""}`);
      setTimeout(generate, 900);
    } else {
      setStreak(0); setFeedback(`❌ ${a} ${selectedOp} ${b} = ${r}, hedef ${target}`);
      setSelectedIndices([]); setSelectedOp(null);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <DifficultyBar value={difficulty} onChange={setDifficulty} />
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm text-slate-700">Skor: <b>{score}</b></span>
        {streak >= 2 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full animate-pulse">🔥 {streak} seri</span>}
      </div>
      <p className="text-sm text-slate-600 mb-1">İki sayı ve bir işlem seç:</p>
      <div className="text-4xl font-bold text-sky-800 bg-white rounded-xl px-6 py-3 mb-3 shadow">🎯 {target}</div>
      <div className="flex gap-2 mb-3">
        {ops.map((op) => (
          <button key={op} onClick={() => handleOpClick(op)}
            className={`w-12 h-10 rounded-lg text-lg font-bold flex items-center justify-center transition ${
              selectedOp === op ? "bg-sky-500 text-white scale-110 shadow-lg" : "bg-white border-2 border-sky-200 text-slate-800 hover:border-sky-400"}`}>{op}</button>
        ))}
      </div>
      <div className="flex gap-3 mb-4 flex-wrap justify-center">
        {numbers.map((num, i) => (
          <button key={i} onClick={() => handleNumberClick(i)}
            className={`w-14 h-14 rounded-xl text-xl font-bold flex items-center justify-center transition ${
              selectedIndices.includes(i) ? "bg-sky-500 text-white scale-110 shadow-lg ring-2 ring-sky-300" : "bg-white border-2 border-sky-200 text-slate-800 hover:border-sky-400"}`}>{num}</button>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-2">
        {selectedIndices.length === 2 && selectedOp ? (
          <span className="text-sm text-slate-700">{numbers[selectedIndices[0]]} {selectedOp} {numbers[selectedIndices[1]]} = ?</span>
        ) : (
          <span className="text-sm text-slate-400">
            {selectedIndices.length === 0 ? "İlk sayıyı seç" : selectedIndices.length === 1 ? "İkinci sayıyı seç" : "İşlem seç"}
          </span>
        )}
        {selectedIndices.length === 2 && selectedOp && (
          <button onClick={checkAnswer} className="px-4 py-1 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 ml-2">✓ Kontrol Et</button>
        )}
      </div>
      {feedback && <p className="text-sm font-bold text-slate-700">{feedback}</p>}
      <button onClick={() => { setSelectedIndices([]); setSelectedOp(null); setFeedback(""); }} className="mt-1 text-xs text-sky-600 underline">Seçimi Sıfırla</button>
    </div>
  );
};

export default KidsGames;
