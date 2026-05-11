import React, { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  MESSAGE_SOUND_KEY,
  MESSAGE_SOUNDS,
  MSG_EVENT,
  playMessageSound,
  type MessageSoundId,
  type Thread,
} from "@/lib/messaging";

const now = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

const Mesajlar: React.FC = () => {
  const [threads, setThreads] = useLocalStorage<Thread[]>("gunesOS-mesajlar", []);
  const [soundId, setSoundId] = useLocalStorage<MessageSoundId>(MESSAGE_SOUND_KEY, "gunes");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Diğer kaynaklardan (GunesOS, Sohbeto iframe) gelen değişikliklere canlı uyum.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => {
      try {
        const raw = localStorage.getItem("gunesOS-mesajlar");
        setThreads(raw ? JSON.parse(raw) : []);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener(MSG_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(MSG_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [setThreads]);

  const active = threads.find((t) => t.id === activeId);

  const openThread = (id: string) => {
    setThreads((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t));
      if (typeof window !== "undefined")
        window.setTimeout(() => window.dispatchEvent(new CustomEvent(MSG_EVENT)), 0);
      return next;
    });
    setActiveId(id);
  };

  const changeSound = (id: MessageSoundId) => {
    setSoundId(id);
    void playMessageSound(id);
  };

  const sendMessage = () => {
    if (!input.trim() || !active) return;
    const text = input.trim();
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? {
              ...t,
              preview: text,
              time: now(),
              messages: [...t.messages, { id: `me-${Date.now()}`, from: "me", text, time: now() }],
            }
          : t,
      ),
    );
    setInput("");
  };

  const deleteThread = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (typeof window !== "undefined")
        window.setTimeout(() => window.dispatchEvent(new CustomEvent(MSG_EVENT)), 0);
      return next;
    });
    setConfirmDelete(null);
    if (activeId === id) setActiveId(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#f5f7fa] to-[#e8ecf1] text-black">
      {!active ? (
        <>
          <div className="px-4 pt-3 pb-2 bg-white/80 backdrop-blur border-b border-black/5">
            <h2 className="text-[20px] font-bold text-[#0f172a]">Mesajlar</h2>
            <p className="text-[11px] text-slate-500">Tüm sohbetlerin burada</p>
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
              {MESSAGE_SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => changeSound(s.id)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border transition ${
                    soundId === s.id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  🔊 {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 && (
              <div className="text-center text-slate-400 text-[12px] mt-10 px-6">
                Henüz mesaj yok. Sohbeto'ya kayıt olduğunda mesajların burada görünecek.
              </div>
            )}
            {threads.map((t) => (
              <div key={t.id} className="relative group">
                <button
                  onClick={() => openThread(t.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 border-b border-black/5 hover:bg-emerald-50 active:bg-emerald-100 transition text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-2xl shadow-md">
                    {t.avatar}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[14px] truncate">{t.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{t.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-[12px] text-slate-500 truncate">{t.preview}</span>
                      {t.unread > 0 && (
                        <span className="shrink-0 bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center">
                          {t.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(t.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-base"
                  aria-label="Sohbeti sil"
                  title="Sohbeti sil"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="px-3 py-2 bg-white/90 backdrop-blur border-b border-black/5 flex items-center gap-2">
            <button
              onClick={() => setActiveId(null)}
              className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded text-[13px] font-semibold"
            >
              ← Geri
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-lg shadow">
              {active.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px] truncate">{active.name}</div>
              <div className="text-[10px] text-emerald-600">çevrimiçi</div>
            </div>
            <button
              onClick={() => setConfirmDelete(active.id)}
              className="w-8 h-8 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center"
              title="Sohbeti sil"
              aria-label="Sohbeti sil"
            >
              🗑️
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {active.messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] px-3 py-2 rounded-2xl text-[13px] leading-snug shadow-sm whitespace-pre-wrap ${
                    m.from === "me"
                      ? "bg-emerald-500 text-white rounded-br-sm"
                      : "bg-white text-slate-800 rounded-bl-sm border border-black/5"
                  }`}
                >
                  <div>{m.text}</div>
                  <div
                    className={`text-[9px] mt-1 ${
                      m.from === "me" ? "text-emerald-100" : "text-slate-400"
                    } text-right`}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 bg-white/90 backdrop-blur border-t border-black/5 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Bir mesaj yaz..."
              className="flex-1 px-3 py-2 rounded-full bg-slate-100 text-[13px] text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-300 placeholder:text-slate-400"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-emerald-600 transition"
              aria-label="Gönder"
            >
              ➤
            </button>
          </div>
        </>
      )}

      {confirmDelete && (
        <div
          className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-bold text-slate-800 mb-1">Sohbeti sil?</h3>
            <p className="text-[12px] text-slate-500 mb-4">
              Bu sohbet ve içindeki tüm mesajlar kalıcı olarak silinecek.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 text-[13px] rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Vazgeç
              </button>
              <button
                onClick={() => deleteThread(confirmDelete)}
                className="flex-1 py-2 text-[13px] rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mesajlar;
