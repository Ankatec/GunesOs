// Centralized messaging helpers for the Mesajlar app.
// All threads are persisted in localStorage under "gunesOS-mesajlar".
// A custom "gunesos-mesajlar-changed" event is dispatched so other components
// (e.g. desktop badge) can update reactively in the same tab.

export interface Message {
  id: string;
  from: "system" | "me";
  text: string;
  time: string;
}

export interface Thread {
  id: string;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unread: number;
  messages: Message[];
}

const KEY = "gunesOS-mesajlar";
export const MESSAGE_SOUND_KEY = "gunesOS-message-sound";
export const MSG_EVENT = "gunesos-mesajlar-changed";

export type MessageSoundId = "gunes" | "crystal" | "bubble" | "bell";

export const MESSAGE_SOUNDS: { id: MessageSoundId; label: string }[] = [
  { id: "gunes", label: "Güneş Parıltısı" },
  { id: "crystal", label: "Kristal" },
  { id: "bubble", label: "Baloncuk" },
  { id: "bell", label: "Yumuşak Zil" },
];

const now = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

export function readThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Thread[]) : [];
  } catch {
    return [];
  }
}

export function writeThreads(threads: Thread[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(threads));
  window.dispatchEvent(new CustomEvent(MSG_EVENT));
}

let pendingSoundId: MessageSoundId | null = null;
let unlockBound = false;

function selectedSound(): MessageSoundId {
  if (typeof window === "undefined") return "gunes";
  const saved = localStorage.getItem(MESSAGE_SOUND_KEY) as MessageSoundId | null;
  return MESSAGE_SOUNDS.some((s) => s.id === saved) ? saved! : "gunes";
}

function bindUnlock(soundId: MessageSoundId) {
  if (typeof window === "undefined") return;
  pendingSoundId = soundId;
  if (unlockBound) return;
  unlockBound = true;
  const unlock = () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("click", unlock);
    unlockBound = false;
    const id = pendingSoundId || selectedSound();
    pendingSoundId = null;
    void playMessageSound(id);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  window.addEventListener("click", unlock, { once: true });
}

export async function playMessageSound(soundId: MessageSoundId = selectedSound()) {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    await ctx.resume();
    if (ctx.state !== "running") {
      bindUnlock(soundId);
      window.setTimeout(() => ctx.close(), 250);
      return;
    }

    const patterns: Record<
      MessageSoundId,
      { notes: number[]; gap: number; type: OscillatorType; gain: number; dur: number }
    > = {
      gunes: {
        notes: [523.25, 659.25, 783.99, 1046.5],
        gap: 0.11,
        type: "sine",
        gain: 0.18,
        dur: 0.42,
      },
      crystal: {
        notes: [880, 1174.66, 1318.51],
        gap: 0.09,
        type: "triangle",
        gain: 0.14,
        dur: 0.35,
      },
      bubble: { notes: [392, 523.25, 659.25], gap: 0.075, type: "sine", gain: 0.16, dur: 0.24 },
      bell: { notes: [659.25, 987.77], gap: 0.16, type: "triangle", gain: 0.13, dur: 0.75 },
    };
    const p = patterns[soundId] || patterns.gunes;
    p.notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * p.gap;
      osc.type = p.type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(p.gain, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + p.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + p.dur + 0.02);
    });
    window.setTimeout(() => ctx.close(), 1400);
  } catch {
    bindUnlock(soundId);
  }
}

export function totalUnread(): number {
  return readThreads().reduce((s, t) => s + (t.unread || 0), 0);
}

/**
 * Append a system message to a thread (creates the thread if missing).
 * Increases unread count and updates preview/time. Triggers a notification event.
 */
export function pushSystemMessage(opts: {
  threadId: string;
  name: string;
  avatar: string;
  text: string;
}) {
  const { threadId, name, avatar, text } = opts;
  const t = now();
  const threads = readThreads();
  const idx = threads.findIndex((x) => x.id === threadId);
  const msg: Message = {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from: "system",
    text,
    time: t,
  };
  if (idx === -1) {
    threads.unshift({
      id: threadId,
      name,
      avatar,
      preview: text,
      time: t,
      unread: 1,
      messages: [msg],
    });
  } else {
    const th = threads[idx];
    threads[idx] = {
      ...th,
      preview: text,
      time: t,
      unread: (th.unread || 0) + 1,
      messages: [...th.messages, msg],
    };
  }
  writeThreads(threads);
  void playMessageSound();
}
