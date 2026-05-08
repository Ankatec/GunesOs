import React, { useState, useEffect, useRef, useCallback } from "react";

/* ─── Radyo ─── */
interface RadioStation {
  id: string;
  name: string;
  emoji: string;
  freq: string;
  genre: string;
}

const stations: RadioStation[] = [
  { id: "1", name: "Güneş FM", emoji: "☀️", freq: "92.3", genre: "Pop" },
  { id: "2", name: "Yıldız Radyo", emoji: "⭐", freq: "97.1", genre: "Türk Sanat" },
  { id: "3", name: "Radyo Çocuk", emoji: "🧒", freq: "88.5", genre: "Çocuk" },
  { id: "4", name: "Nostalji FM", emoji: "📻", freq: "101.7", genre: "Nostalji" },
  { id: "5", name: "Doğa Radyo", emoji: "🌿", freq: "105.3", genre: "Doğa Sesleri" },
  { id: "6", name: "Uyku Radyosu", emoji: "🌙", freq: "89.9", genre: "Ninni" },
];

export const RadioApp: React.FC = () => {
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(16).fill(0));

  useEffect(() => {
    if (!isPlaying) {
      setVisualizerBars(Array(16).fill(0));
      return;
    }
    const interval = setInterval(() => {
      setVisualizerBars((prev) =>
        prev.map(() => Math.random() * 100)
      );
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleStation = (id: string) => {
    if (activeStation === id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveStation(id);
      setIsPlaying(true);
    }
  };

  const currentStation = stations.find((s) => s.id === activeStation);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Visualizer */}
      <div className="flex items-end justify-center gap-[3px] h-24 px-4 pt-3">
        {visualizerBars.map((h, i) => (
          <div
            key={i}
            className="w-3 rounded-t transition-all duration-150"
            style={{
              height: `${Math.max(4, h * 0.8)}%`,
              background: `hsl(${200 + i * 10}, 80%, ${50 + h * 0.3}%)`,
            }}
          />
        ))}
      </div>

      {/* Now Playing */}
      <div className="text-center py-3">
        <span className="text-4xl">{currentStation?.emoji || "📻"}</span>
        <h3 className="text-lg font-bold mt-1">{currentStation?.name || "Radyo"}</h3>
        {currentStation && (
          <p className="text-xs text-gray-400">
            {currentStation.freq} MHz • {currentStation.genre}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={() => {
            if (activeStation) {
              const idx = stations.findIndex((s) => s.id === activeStation);
              const prev = stations[(idx - 1 + stations.length) % stations.length];
              setActiveStation(prev.id);
              setIsPlaying(true);
            }
          }}
          className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 text-lg"
        >
          ⏮
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-400 text-2xl"
        >
          {isPlaying ? "⏸" : "▶️"}
        </button>
        <button
          onClick={() => {
            if (activeStation) {
              const idx = stations.findIndex((s) => s.id === activeStation);
              const next = stations[(idx + 1) % stations.length];
              setActiveStation(next.id);
              setIsPlaying(true);
            }
          }}
          className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 text-lg"
        >
          ⏭
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 px-6 py-1">
        <span className="text-xs">🔈</span>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 h-1 accent-blue-500"
        />
        <span className="text-xs">🔊</span>
      </div>

      {/* Station List */}
      <div className="flex-1 overflow-auto px-3 py-2">
        {stations.map((s) => (
          <button
            key={s.id}
            onClick={() => toggleStation(s.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
              activeStation === s.id
                ? "bg-blue-600/40 border border-blue-400/50"
                : "hover:bg-gray-700/50"
            }`}
          >
            <span className="text-2xl">{s.emoji}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-[10px] text-gray-400">{s.freq} MHz • {s.genre}</p>
            </div>
            {activeStation === s.id && isPlaying && (
              <span className="text-green-400 text-xs animate-pulse">● CANLI</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── Seyret (Video Player) ─── */
const videoCategories = [
  { id: "cartoons", label: "Çizgi Film", emoji: "🎬", items: [
    { id: "v1", title: "Pepee - Macera Zamanı", thumb: "🦁", duration: "12:30" },
    { id: "v2", title: "Keloğlan ve Dev", thumb: "👹", duration: "8:45" },
    { id: "v3", title: "Nasreddin Hoca", thumb: "🐴", duration: "6:20" },
    { id: "v4", title: "Keloğlan ve Tüccar", thumb: "💰", duration: "10:15" },
  ]},
  { id: "nature", label: "Doğa", emoji: "🌿", items: [
    { id: "v5", title: "Orman Keşfi", thumb: "🌲", duration: "15:00" },
    { id: "v6", title: "Deniz Altı Dünyası", thumb: "🐠", duration: "22:30" },
    { id: "v7", title: "Kuşların Uçuşu", thumb: "🦅", duration: "9:10" },
  ]},
  { id: "space", label: "Uzay", emoji: "🚀", items: [
    { id: "v8", title: "Güneş Sistemi", thumb: "☀️", duration: "18:00" },
    { id: "v9", title: "Ay'a Yolculuk", thumb: "🌙", duration: "14:20" },
    { id: "v10", title: "Yıldızlar ve Gezegenler", thumb: "⭐", duration: "20:00" },
  ]},
];

export const SeyretApp: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("cartoons");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!playingVideo) { setProgress(0); return; }
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { setPlayingVideo(null); return 0; }
        return p + 0.5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playingVideo]);

  const currentCategory = videoCategories.find((c) => c.id === activeCategory);
  const currentVideo = currentCategory?.items.find((v) => v.id === playingVideo);

  if (playingVideo && currentVideo) {
    return (
      <div className="h-full flex flex-col bg-black text-white">
        <div className="flex-1 flex items-center justify-center relative">
          <span className="text-8xl animate-pulse">{currentVideo.thumb}</span>
          <div className="absolute top-2 right-2 text-xs bg-black/60 px-2 py-1 rounded">
            ▶ Oynatılıyor
          </div>
        </div>
        <div className="p-3 bg-gray-900">
          <p className="text-sm font-medium mb-2">{currentVideo.title}</p>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">{Math.floor(progress * 0.15)}:00</span>
            <span className="text-[10px] text-gray-400">{currentVideo.duration}</span>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <button onClick={() => setPlayingVideo(null)} className="text-lg hover:scale-110">⏮</button>
            <button onClick={() => setPlayingVideo(null)} className="text-lg hover:scale-110">⏹</button>
            <button onClick={() => setPlayingVideo(null)} className="text-lg hover:scale-110">⏭</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Category Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {videoCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 py-2 text-[11px] font-medium flex items-center justify-center gap-1 ${
              activeCategory === cat.id
                ? "text-red-600 border-b-2 border-red-500 bg-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div className="flex-1 overflow-auto p-3 grid grid-cols-2 gap-3 auto-rows-min">
        {currentCategory?.items.map((video) => (
          <button
            key={video.id}
            onClick={() => { setPlayingVideo(video.id); setProgress(0); }}
            className="flex flex-col rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow bg-white"
          >
            <div className="h-20 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
              <span className="text-4xl">{video.thumb}</span>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity">
                <span className="text-3xl">▶️</span>
              </div>
              <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white px-1 rounded">
                {video.duration}
              </span>
            </div>
            <div className="p-2">
              <p className="text-[11px] font-medium text-gray-800 text-left truncate">{video.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── Yazeka (Word Game) ─── */
interface WordPuzzle {
  word: string;
  hint: string;
  category: string;
}

const wordPuzzles: WordPuzzle[] = [
  { word: "GÜNEŞ", hint: "Gökyüzünde parlar", category: "Doğa" },
  { word: "KEDİ", hint: "Miyav der", category: "Hayvanlar" },
  { word: "KİTAP", hint: "Okunur", category: "Eşyalar" },
  { word: "ARABA", hint: "Yolda gider", category: "Ulaşım" },
  { word: "ÇİÇEK", hint: "Bahçede açar", category: "Doğa" },
  { word: "BULUT", hint: "Gökyüzünde süzülür", category: "Doğa" },
  { word: "OKUL", hint: "Öğrenilen yer", category: "Yerler" },
  { word: "DENİZ", hint: "Dalgaları vardır", category: "Doğa" },
  { word: "UÇAK", hint: "Gökyüzünde uçar", category: "Ulaşım" },
  { word: "BALIK", hint: "Suda yüzer", category: "Hayvanlar" },
];

export const YazekaApp: React.FC = () => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");

  const puzzle = wordPuzzles[puzzleIndex];
  const maxWrong = 6;

  const checkLetter = (letter: string) => {
    if (guessedLetters.has(letter) || gameStatus !== "playing") return;
    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!puzzle.word.includes(letter)) {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= maxWrong) setGameStatus("lost");
    } else {
      const allFound = puzzle.word.split("").every((l) => newGuessed.has(l));
      if (allFound) setGameStatus("won");
    }
  };

  const nextPuzzle = () => {
    setPuzzleIndex((prev) => (prev + 1) % wordPuzzles.length);
    setGuessedLetters(new Set());
    setWrongCount(0);
    setGameStatus("playing");
  };

  const turkishLetters = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");

  const hangmanParts = ["😵", "👕", "🤚", "✋", "🦵", "🦶"];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-amber-50 to-white p-3">
      {/* Header */}
      <div className="text-center mb-2">
        <h3 className="text-lg font-bold text-amber-800">📝 Yazeka</h3>
        <p className="text-[10px] text-gray-500">Kelime Oyunu</p>
      </div>

      {/* Hangman Display */}
      <div className="flex justify-center gap-1 mb-2">
        {hangmanParts.map((part, i) => (
          <span
            key={i}
            className={`text-2xl transition-opacity ${i < wrongCount ? "opacity-100" : "opacity-20"}`}
          >
            {part}
          </span>
        ))}
      </div>

      {/* Category & Hint */}
      <div className="text-center mb-2">
        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          {puzzle.category}
        </span>
        <p className="text-[11px] text-gray-600 mt-1">İpucu: {puzzle.hint}</p>
      </div>

      {/* Word Display */}
      <div className="flex justify-center gap-2 mb-3">
        {puzzle.word.split("").map((letter, i) => (
          <div
            key={i}
            className="w-8 h-10 border-b-2 border-amber-400 flex items-end justify-center pb-1"
          >
            <span className="text-lg font-bold text-amber-900">
              {guessedLetters.has(letter) || gameStatus === "lost" ? letter : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Game Status */}
      {gameStatus !== "playing" && (
        <div className={`text-center p-2 rounded-lg mb-2 ${gameStatus === "won" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          <p className="text-sm font-bold">{gameStatus === "won" ? "🎉 Tebrikler!" : "😢 Tekrar Dene!"}</p>
          <button
            onClick={nextPuzzle}
            className="mt-1 text-[11px] px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            Sonraki Kelime
          </button>
        </div>
      )}

      {/* Keyboard */}
      <div className="flex-1 flex flex-col justify-end">
        <div className="grid grid-cols-7 gap-1">
          {turkishLetters.map((letter) => {
            const isGuessed = guessedLetters.has(letter);
            const isCorrect = isGuessed && puzzle.word.includes(letter);
            const isWrong = isGuessed && !puzzle.word.includes(letter);
            return (
              <button
                key={letter}
                onClick={() => checkLetter(letter)}
                disabled={isGuessed || gameStatus !== "playing"}
                className={`h-8 rounded text-[11px] font-bold transition-colors ${
                  isCorrect
                    ? "bg-green-500 text-white"
                    : isWrong
                    ? "bg-gray-300 text-gray-500"
                    : "bg-amber-200 text-amber-800 hover:bg-amber-300"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─── Posta Ankara ─── */
interface Mail {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  emoji: string;
}

const defaultMails: Mail[] = [
  { id: "1", from: "Anne", subject: "Yarın gelecek misin?", body: "Merhaba yavrum, yarın bize gelecek misin? Yemek hazırlıyorum. Sevgiler.", date: "Bugün", read: false, emoji: "💌" },
  { id: "2", from: "Okul", subject: "Yarın tatil!", body: "Sevgili öğrenciler, yarın okul tatildir. İyi tatiller dileriz.", date: "Dün", read: false, emoji: "🏫" },
  { id: "3", from: "GüneşOS", subject: "Hoş Geldiniz!", body: "GüneşOS'u tercih ettiğiniz için teşekkürler! Yeni temaları denemeyi unutmayın.", date: "2 gün önce", read: true, emoji: "☀️" },
  { id: "4", from: "Baba", subject: "Fotoğraflar", body: "Tatil fotoğraflarını gönderdim, beğenmeni umuyorum! Baba.", date: "3 gün önce", read: true, emoji: "📸" },
];

export const PostaAnkaraApp: React.FC = () => {
  const [mails, setMails] = useState<Mail[]>(defaultMails);
  const [selectedMail, setSelectedMail] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const selectMail = (id: string) => {
    setSelectedMail(id);
    setMails((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  const sendMail = () => {
    if (!composeTo.trim()) return;
    const newMail: Mail = {
      id: `mail-${Date.now()}`,
      from: "Ben",
      subject: composeSubject || "(Konu yok)",
      body: composeBody,
      date: "Az önce",
      read: true,
      emoji: "📤",
    };
    setMails((prev) => [newMail, ...prev]);
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setIsComposing(false);
  };

  const currentMail = mails.find((m) => m.id === selectedMail);
  const unreadCount = mails.filter((m) => !m.read).length;

  if (isComposing) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
          <button onClick={() => setIsComposing(false)} className="text-[11px] text-blue-600">← Geri</button>
          <span className="text-[11px] font-bold text-gray-700">Yeni Mesaj</span>
        </div>
        <div className="flex-1 p-3 space-y-2">
          <input value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="Kime" className="w-full text-[11px] border border-gray-300 rounded px-2 py-1.5 text-black" />
          <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Konu" className="w-full text-[11px] border border-gray-300 rounded px-2 py-1.5 text-black" />
          <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Mesajınız..." className="w-full flex-1 text-[11px] border border-gray-300 rounded px-2 py-1.5 min-h-[120px] resize-none text-black" />
          <button onClick={sendMail} className="w-full py-2 bg-blue-500 text-white text-[11px] rounded hover:bg-blue-600">📤 Gönder</button>
        </div>
      </div>
    );
  }

  if (currentMail) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
          <button onClick={() => setSelectedMail(null)} className="text-[11px] text-blue-600">← Geri</button>
          <span className="text-[11px] font-bold text-gray-700 truncate">{currentMail.subject}</span>
        </div>
        <div className="flex-1 p-3 overflow-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{currentMail.emoji}</span>
            <div>
              <p className="text-[12px] font-bold text-gray-800">{currentMail.from}</p>
              <p className="text-[10px] text-gray-400">{currentMail.date}</p>
            </div>
          </div>
          <p className="text-[12px] text-gray-700 leading-relaxed">{currentMail.body}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-700">📬 Posta Ankara</span>
          {unreadCount > 0 && (
            <span className="text-[9px] bg-red-500 text-white px-1.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <button onClick={() => setIsComposing(true)} className="text-[10px] px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">+ Yeni</button>
      </div>
      <div className="flex-1 overflow-auto">
        {mails.map((mail) => (
          <button
            key={mail.id}
            onClick={() => selectMail(mail.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 hover:bg-blue-50 text-left ${
              !mail.read ? "bg-blue-50/50" : ""
            }`}
          >
            <span className="text-xl">{mail.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-[11px] truncate ${!mail.read ? "font-bold text-gray-900" : "text-gray-600"}`}>{mail.from}</p>
                <span className="text-[9px] text-gray-400">{mail.date}</span>
              </div>
              <p className={`text-[11px] truncate ${!mail.read ? "text-gray-800" : "text-gray-500"}`}>{mail.subject}</p>
            </div>
            {!mail.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── Telankara (Phone) ─── */
export const TelankaraApp: React.FC = () => {
  const [number, setNumber] = useState("");
  const [calling, setCalling] = useState(false);
  const [callTime, setCallTime] = useState(0);

  useEffect(() => {
    if (!calling) { setCallTime(0); return; }
    const interval = setInterval(() => setCallTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [calling]);

  const pressKey = (key: string) => {
    if (number.length < 15) setNumber((prev) => prev + key);
  };

  const deleteKey = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
  const keyLetters: Record<string, string> = {
    "1": "", "2": "ABC", "3": "DEF", "4": "GHI", "5": "JKL", "6": "MNO",
    "7": "PQRS", "8": "TUV", "9": "WXYZ", "*": "", "0": "+", "#": "",
  };

  if (calling) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-pulse">
          <span className="text-4xl">📞</span>
        </div>
        <p className="text-lg font-bold text-gray-800 mb-1">{number}</p>
        <p className="text-sm text-gray-500 mb-6">{formatTime(callTime)}</p>
        <button
          onClick={() => { setCalling(false); setNumber(""); }}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl hover:bg-red-600 shadow-lg"
        >
          📵
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white p-3">
      {/* Display */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3 text-center min-h-[50px] flex items-center justify-center">
        <span className="text-2xl font-mono text-gray-800 tracking-wider">{number || "Numara girin"}</span>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2 flex-1">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => pressKey(key)}
            className="rounded-full bg-gray-100 hover:bg-gray-200 flex flex-col items-center justify-center py-2 transition-colors"
          >
            <span className="text-xl font-bold text-gray-800">{key}</span>
            <span className="text-[8px] text-gray-400 tracking-widest">{keyLetters[key]}</span>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <button
          onClick={deleteKey}
          className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg hover:bg-gray-300"
        >
          ⌫
        </button>
        <button
          onClick={() => number && setCalling(true)}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg ${
            number ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          📞
        </button>
        <button
          onClick={() => setNumber("")}
          className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg hover:bg-gray-300"
        >
          ✕
        </button>
      </div>
    </div>
  );
};