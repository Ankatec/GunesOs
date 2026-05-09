import React, { useState, useMemo } from "react";

interface Message {
  id: string;
  from: "system" | "me";
  text: string;
  time: string;
}

interface Thread {
  id: string;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unread: number;
  messages: Message[];
}

const now = () =>
  new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

const Mesajlar: React.FC = () => {
  const initialThreads = useMemo<Thread[]>(
    () => [
      {
        id: "sohbeto-welcome",
        name: "Sohbeto",
        avatar: "💬",
        preview: "Hoş geldin! Sohbeto'ya kayıt oldun 🎉",
        time: now(),
        unread: 1,
        messages: [
          {
            id: "m1",
            from: "system",
            text: "👋 Merhaba ve hoş geldin!",
            time: now(),
          },
          {
            id: "m2",
            from: "system",
            text:
              "Sohbeto'ya başarıyla kaydoldun. Artık güvenli, hızlı ve uçtan uca şifreli mesajlaşmanın keyfini çıkarabilirsin.",
            time: now(),
          },
          {
            id: "m3",
            from: "system",
            text:
              "İpucu: Profil resmini ve adını Sohbeto > Ayarlar bölümünden güncelleyebilirsin. İyi sohbetler! ✨",
            time: now(),
          },
        ],
      },
      {
        id: "gunesos-team",
        name: "GüneşOS Ekibi",
        avatar: "☀️",
        preview: "GüneşOS'a hoş geldin! Keşfetmek için masaüstüne göz at.",
        time: now(),
        unread: 0,
        messages: [
          {
            id: "g1",
            from: "system",
            text: "GüneşOS'a hoş geldin! 🌞 Tüm uygulamalar masaüstünde seni bekliyor.",
            time: now(),
          },
        ],
      },
    ],
    []
  );

  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const active = threads.find((t) => t.id === activeId);

  const openThread = (id: string) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
    setActiveId(id);
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
              messages: [
                ...t.messages,
                { id: `me-${Date.now()}`, from: "me", text, time: now() },
              ],
            }
          : t
      )
    );
    setInput("");
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#f5f7fa] to-[#e8ecf1] text-black">
      {!active ? (
        <>
          <div className="px-4 pt-3 pb-2 bg-white/80 backdrop-blur border-b border-black/5">
            <h2 className="text-[20px] font-bold text-[#0f172a]">Mesajlar</h2>
            <p className="text-[11px] text-slate-500">Tüm sohbetlerin burada</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => openThread(t.id)}
                className="w-full flex items-center gap-3 px-3 py-3 border-b border-black/5 hover:bg-emerald-50 active:bg-emerald-100 transition text-left"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-2xl shadow-md">
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
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
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {active.messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] px-3 py-2 rounded-2xl text-[13px] leading-snug shadow-sm ${
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
    </div>
  );
};

export default Mesajlar;
