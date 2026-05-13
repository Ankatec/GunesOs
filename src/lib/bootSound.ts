// GüneşOS açılış sesleri — Web Audio API ile sentezlenir, dış dosya gerekmez.
// Tarayıcının autoplay politikası gereği BootScreen mount sonrası kısa bir
// gecikmeyle çağırırız; AudioContext kullanıcı etkileşimsiz açılırsa "suspended"
// dönebilir, biz de sessizce yutar veya resume() deneriz.

export type BootSoundId = "gong-double" | "chime" | "bell" | "none";

export const BOOT_SOUND_OPTIONS: { id: BootSoundId; label: string; emoji: string; desc: string }[] = [
  { id: "gong-double", label: "Çift Gong", emoji: "🔔", desc: "İki tonlu sıcak gong (varsayılan)" },
  { id: "chime", label: "Şıngırtı", emoji: "🎐", desc: "Yumuşak üç notalı şıngırtı" },
  { id: "bell", label: "Tek Çan", emoji: "🛎️", desc: "Kısa, net çan vuruşu" },
  { id: "none", label: "Sessiz", emoji: "🔇", desc: "Hiç ses çalma" },
];

let cachedCtx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!cachedCtx) cachedCtx = new AC();
  if (cachedCtx.state === "suspended") {
    cachedCtx.resume().catch(() => undefined);
  }
  return cachedCtx;
};

const playGong = (ctx: AudioContext, freq: number, startAt: number, duration = 2.4, gain = 0.32) => {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, startAt);
  master.gain.exponentialRampToValueAtTime(gain, startAt + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  master.connect(ctx.destination);

  // Birkaç harmonik ile zengin gong tınısı
  const partials = [
    { mult: 1, gain: 1 },
    { mult: 2.01, gain: 0.55 },
    { mult: 2.97, gain: 0.32 },
    { mult: 4.13, gain: 0.18 },
    { mult: 5.4, gain: 0.1 },
  ];
  partials.forEach((p) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * p.mult;
    const g = ctx.createGain();
    g.gain.value = p.gain;
    osc.connect(g);
    g.connect(master);
    osc.start(startAt);
    osc.stop(startAt + duration);
  });
};

const playBell = (ctx: AudioContext, freq: number, startAt: number, duration = 1.6, gain = 0.28) => {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, startAt);
  master.gain.exponentialRampToValueAtTime(gain, startAt + 0.005);
  master.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  master.connect(ctx.destination);

  [1, 2.76, 5.4, 8.93].forEach((mult, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * mult;
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 1 : 0.4 / (i + 1);
    osc.connect(g);
    g.connect(master);
    osc.start(startAt);
    osc.stop(startAt + duration);
  });
};

export const playBootSound = (id: BootSoundId): void => {
  if (id === "none") return;
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime + 0.05;
  try {
    if (id === "gong-double") {
      playGong(ctx, 196, t, 2.6); // Sol3
      playGong(ctx, 261.63, t + 0.55, 3.0); // Do4 — sıcak çift gong
    } else if (id === "chime") {
      playBell(ctx, 523.25, t, 1.4); // Do5
      playBell(ctx, 659.25, t + 0.18, 1.4); // Mi5
      playBell(ctx, 783.99, t + 0.36, 1.8); // Sol5
    } else if (id === "bell") {
      playBell(ctx, 587.33, t, 1.8, 0.34); // Re5
    }
  } catch {
    // Otomatik oynatma engellendiyse sessizce yut.
  }
};
