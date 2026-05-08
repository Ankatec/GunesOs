import React, { useState, useEffect, useCallback, useRef } from "react";

type GameId = "memory" | "math" | "pattern" | "wordguess" | "colorMatch" | "simon" | "sliding" | "numberPuzzle";

// Note frequencies for lullaby melodies
const NF: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25,
  D5: 587.33, E5: 659.25, REST: 0,
};

interface LullabyTrack {
  id: string;
  title: string;
  artist: string;
  emoji: string;
  melody: number[];
  tempo: number;
}

const LULLABY_TRACKS: LullabyTrack[] = [
  {
    id: "twinkle-star",
    title: "Twinkle Twinkle Little Star",
    artist: "GüneşOS Müzik Kutusu",
    emoji: "🌙",
    melody: [
      NF.C4, NF.C4, NF.G4, NF.G4, NF.A4, NF.A4, NF.G4, NF.REST,
      NF.F4, NF.F4, NF.E4, NF.E4, NF.D4, NF.D4, NF.C4, NF.REST,
      NF.G4, NF.G4, NF.F4, NF.F4, NF.E4, NF.E4, NF.D4, NF.REST,
      NF.G4, NF.G4, NF.F4, NF.F4, NF.E4, NF.E4, NF.D4, NF.REST,
      NF.C4, NF.C4, NF.G4, NF.G4, NF.A4, NF.A4, NF.G4, NF.REST,
      NF.F4, NF.F4, NF.E4, NF.E4, NF.D4, NF.D4, NF.C4, NF.REST,
    ],
    tempo: 100,
  },
  {
    id: "brahms-lullaby",
    title: "Brahms Ninnisi",
    artist: "GüneşOS Müzik Kutusu",
    emoji: "🎵",
    melody: [
      NF.G4, NF.A4, NF.G4, NF.E4, NF.REST,
      NF.G4, NF.A4, NF.G4, NF.E4, NF.REST,
      NF.D5, NF.D5, NF.C5, NF.C5, NF.REST,
      NF.B4, NF.B4, NF.A4, NF.REST,
      NF.G4, NF.A4, NF.G4, NF.E4, NF.REST,
      NF.G4, NF.A4, NF.G4, NF.E4, NF.REST,
      NF.D5, NF.D5, NF.C5, NF.C5, NF.REST,
      NF.B4, NF.B4, NF.A4, NF.REST,
    ],
    tempo: 80,
  },
];

const KidsGames: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [showLullaby, setShowLullaby] = useState(false);

  // Lullaby state
  const [currentTrack, setCurrentTrack] = useState<LullabyTrack>(LULLABY_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const melodyTimeoutRef = useRef<number | null>(null);
  const [currentTime, setCurrentTime] = useState("");

  // Play a single note using Web Audio API
  const playNote = useCallback((freq: number, duration: number, ctx: AudioContext) => {
    if (freq === 0) return; // REST
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration * 0.9);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, []);

  // Play full melody with looping
  const playMelody = useCallback((track: LullabyTrack) => {
    if (melodyTimeoutRef.current) {
      clearTimeout(melodyTimeoutRef.current);
      melodyTimeoutRef.current = null;
    }
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    const noteDuration = 60 / track.tempo; // seconds per beat
    let noteIndex = 0;

    const scheduleNext = () => {
      if (noteIndex >= track.melody.length) {
        noteIndex = 0; // loop
      }
      playNote(track.melody[noteIndex], noteDuration * 0.8, ctx);
      noteIndex++;
      melodyTimeoutRef.current = window.setTimeout(scheduleNext, noteDuration * 1000);
    };
    scheduleNext();
  }, [playNote]);

  const stopMelody = useCallback(() => {
    if (melodyTimeoutRef.current) {
      clearTimeout(melodyTimeoutRef.current);
      melodyTimeoutRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      setIsLocked(hour >= 21 || hour < 9);
      setCurrentTime(now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
    };
    checkTime();
    const interval = setInterval(checkTime, 10000);
    return () => {
      clearInterval(interval);
      stopMelody();
    };
  }, [stopMelody]);

  // Saat 21:00'de otomatik ninni başlat
  useEffect(() => {
    if (!isLocked) return;
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    if (hour === 21 && minute === 0 && !isPlaying) {
      setCurrentTrack(LULLABY_TRACKS[0]);
      setTimeout(() => {
        playMelody(LULLABY_TRACKS[0]);
        setIsPlaying(true);
      }, 500);
    }
  }, [isLocked, isPlaying, playMelody]);

  // Track değiştiğinde melodiyi güncelle
  useEffect(() => {
    if (isPlaying) {
      playMelody(currentTrack);
    }
  }, [currentTrack]);

  const togglePlay = () => {
    if (isPlaying) {
      stopMelody();
      setIsPlaying(false);
    } else {
      playMelody(currentTrack);
      setIsPlaying(true);
    }
  };

  const selectTrack = (track: LullabyTrack) => {
    const wasPlaying = isPlaying;
    if (isPlaying) {
      stopMelody();
    }
    setCurrentTrack(track);
    if (wasPlaying || !isPlaying) {
      playMelody(track);
      setIsPlaying(true);
    }
  };

  if (isLocked) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 text-white p-6 relative overflow-hidden">
        {/* Yıldız animasyonu */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <span
              key={i}
              className="absolute text-yellow-200 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${8 + Math.random() * 12}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            >
              ✦
            </span>
          ))}
        </div>

        <span className="text-7xl mb-4 animate-bounce">🌙</span>
        <h2 className="text-2xl font-bold mb-2">Uyku Zamanı!</h2>
        <p className="text-sm text-center opacity-80 mb-1">Oyun Merkezi saat 21:00 - 09:00 arası kapalıdır.</p>
        <p className="text-xs opacity-60 mb-4">Şu an: {currentTime}</p>
        <p className="text-xs opacity-60 mb-6">İyi geceler! 💤</p>

        {/* Ninni Çalar - Uyku modunda her zaman görünür */}
        <div className="w-full max-w-xs bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{currentTrack.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{currentTrack.title}</p>
              <p className="text-[10px] opacity-60">{currentTrack.artist}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center mb-3">
            <button
              onClick={() => {
                const idx = LULLABY_TRACKS.findIndex(t => t.id === currentTrack.id);
                const prev = (idx - 1 + LULLABY_TRACKS.length) % LULLABY_TRACKS.length;
                selectTrack(LULLABY_TRACKS[prev]);
              }}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg hover:bg-white/30 transition-colors"
            >
              ⏮
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 bg-white/30 rounded-full flex items-center justify-center text-2xl hover:bg-white/40 transition-colors"
            >
              {isPlaying ? "⏸️" : "▶️"}
            </button>
            <button
              onClick={() => {
                const idx = LULLABY_TRACKS.findIndex(t => t.id === currentTrack.id);
                const next = (idx + 1) % LULLABY_TRACKS.length;
                selectTrack(LULLABY_TRACKS[next]);
              }}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg hover:bg-white/30 transition-colors"
            >
              ⏭
            </button>
          </div>
          <div className="space-y-1">
            {LULLABY_TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => selectTrack(track)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                  currentTrack.id === track.id ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <span className="text-lg">{track.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{track.title}</p>
                  <p className="text-[9px] opacity-50">{track.artist}</p>
                </div>
                {currentTrack.id === track.id && isPlaying && (
                  <span className="text-xs animate-pulse">🔊</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showLullaby) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col">
        <div className="flex items-center gap-2 p-2 bg-purple-100 border-b">
          <button
            onClick={() => setShowLullaby(false)}
            className="text-sm px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            ← Geri
          </button>
          <span className="text-sm font-bold text-purple-800">🌙 Ninni Çalar</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <span className="text-6xl mb-4">{currentTrack.emoji}</span>
          <h3 className="text-lg font-bold text-purple-800 mb-1">{currentTrack.title}</h3>
          <p className="text-sm text-gray-500 mb-6">{currentTrack.artist}</p>

          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => {
                const idx = LULLABY_TRACKS.findIndex(t => t.id === currentTrack.id);
                const prev = (idx - 1 + LULLABY_TRACKS.length) % LULLABY_TRACKS.length;
                selectTrack(LULLABY_TRACKS[prev]);
              }}
              className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl hover:bg-purple-200"
            >
              ⏮
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-3xl text-white hover:bg-purple-600 shadow-lg"
            >
              {isPlaying ? "⏸" : "▶️"}
            </button>
            <button
              onClick={() => {
                const idx = LULLABY_TRACKS.findIndex(t => t.id === currentTrack.id);
                const next = (idx + 1) % LULLABY_TRACKS.length;
                selectTrack(LULLABY_TRACKS[next]);
              }}
              className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl hover:bg-purple-200"
            >
              ⏭
            </button>
          </div>

          <div className="w-full max-w-xs space-y-2">
            {LULLABY_TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => selectTrack(track)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  currentTrack.id === track.id
                    ? "bg-purple-200 border-2 border-purple-400 shadow-md"
                    : "bg-white border border-purple-100 hover:border-purple-300 shadow-sm"
                }`}
              >
                <span className="text-2xl">{track.emoji}</span>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-purple-800 truncate">{track.title}</p>
                  <p className="text-[10px] text-gray-500">{track.artist}</p>
                </div>
                {currentTrack.id === track.id && isPlaying && (
                  <div className="flex gap-[2px] items-end h-5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-[3px] bg-purple-500 rounded-full animate-pulse"
                        style={{
                          height: `${8 + Math.random() * 12}px`,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-gray-400 mt-4 text-center">
            💡 Saat 21:00'de ninni otomatik başlar ve sabaha kadar çalar
          </p>
        </div>
      </div>
    );
  }

  if (activeGame) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center gap-2 p-2 bg-purple-100 border-b">
          <button
            onClick={() => setActiveGame(null)}
            className="text-sm px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            ← Geri
          </button>
          <span className="text-sm font-bold text-purple-800">
            {activeGame === "memory" && "🧠 Hafıza Oyunu"}
            {activeGame === "math" && "🔢 Matematik Yarışması"}
            {activeGame === "pattern" && "🔷 Desen Tamamla"}
            {activeGame === "wordguess" && "📝 Kelime Tahmin"}
            {activeGame === "colorMatch" && "🎨 Renk Eşleştir"}
            {activeGame === "simon" && "🔔 Simon Says"}
            {activeGame === "sliding" && "🧩 Kaydırma Bulmacası"}
            {activeGame === "numberPuzzle" && "🔢 Sayı Bulmacası"}
          </span>
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
      </div>
    );
  }

  const games: { id: GameId; emoji: string; name: string; desc: string }[] = [
    { id: "memory", emoji: "🧠", name: "Hafıza Oyunu", desc: "Kartları eşleştir" },
    { id: "math", emoji: "🔢", name: "Matematik", desc: "Hızlı hesapla" },
    { id: "pattern", emoji: "🔷", name: "Desen Tamamla", desc: "Sıradaki şekli bul" },
    { id: "wordguess", emoji: "📝", name: "Kelime Tahmin", desc: "Harfleri tahmin et" },
    { id: "colorMatch", emoji: "🎨", name: "Renk Eşleştir", desc: "Doğru rengi seç" },
    { id: "simon", emoji: "🔔", name: "Simon Says", desc: "Sırayı tekrarla" },
    { id: "sliding", emoji: "🧩", name: "Kaydırma Bulmacası", desc: "Resmi tamamlamak için kaydır" },
    { id: "numberPuzzle", emoji: "🔢", name: "Sayı Bulmacası", desc: "Sayıları sırala" },
  ];

  return (
    <div className="w-full h-full bg-gradient-to-b from-purple-50 to-pink-50 p-4 overflow-auto">
      <h2 className="text-xl font-bold text-purple-800 mb-1 text-center">🧩 Oyun Merkezi</h2>
      <p className="text-xs text-center text-purple-500 mb-3">Zeka ve akıl oyunları</p>

      {/* Ninni Çalar Butonu */}
      <button
        onClick={() => setShowLullaby(true)}
        className="w-full mb-3 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border border-indigo-200 flex items-center gap-3 hover:from-indigo-200 hover:to-purple-200 transition-all"
      >
        <span className="text-2xl">🌙</span>
        <div className="text-left flex-1">
          <p className="text-sm font-bold text-indigo-800">Ninni Çalar</p>
          <p className="text-[10px] text-indigo-500">Dinlemek istediğin ninniyi seç</p>
        </div>
        {isPlaying && (
          <div className="flex gap-[2px] items-end h-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-[2px] bg-indigo-500 rounded-full animate-pulse"
                style={{ height: `${6 + Math.random() * 10}px`, animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}
      </button>

      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGame(g.id)}
            className="flex flex-col items-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-purple-100 hover:border-purple-300"
          >
            <span className="text-3xl mb-2">{g.emoji}</span>
            <span className="text-sm font-bold text-purple-800">{g.name}</span>
            <span className="text-[10px] text-gray-500">{g.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ==================== MEVCUT OYUNLAR ==================== */

const MemoryGame: React.FC = () => {
  const emojis = ["🐶", "🐱", "🐸", "🦊", "🐻", "🐼", "🐨", "🦁"];
  const [cards, setCards] = useState<{ emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji) => ({ emoji, flipped: false, matched: false }));
    setCards(shuffled);
  }, []);

  const handleFlip = (index: number) => {
    if (flippedIndices.length === 2 || cards[index].flipped || cards[index].matched) return;
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      if (newCards[newFlipped[0]].emoji === newCards[newFlipped[1]].emoji) {
        newCards[newFlipped[0]].matched = true;
        newCards[newFlipped[1]].matched = true;
        setCards([...newCards]);
        setFlippedIndices([]);
      } else {
        setTimeout(() => {
          newCards[newFlipped[0]].flipped = false;
          newCards[newFlipped[1]].flipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  const allMatched = cards.length > 0 && cards.every((c) => c.matched);

  return (
    <div className="p-3 flex flex-col items-center">
      <p className="text-sm mb-2 text-black">Hamle: {moves}</p>
      {allMatched && <p className="text-green-600 font-bold mb-2">🎉 Tebrikler!</p>}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, i) => (
          <button
            key={i}
            onClick={() => handleFlip(i)}
            className={`w-14 h-14 rounded-lg text-2xl flex items-center justify-center transition-all ${
              card.flipped || card.matched
                ? "bg-white border-2 border-purple-300"
                : "bg-purple-500 hover:bg-purple-600 text-white"
            }`}
          >
            {card.flipped || card.matched ? card.emoji : "?"}
          </button>
        ))}
      </div>
    </div>
  );
};

const MathGame: React.FC = () => {
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState("");

  const generateQuestion = useCallback(() => {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const ops = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let result: number;
    switch (op) {
      case "+": result = a + b; break;
      case "-": result = a - b; break;
      case "×": result = a * b; break;
      default: result = a + b;
    }
    return { text: `${a} ${op} ${b} = ?`, answer: result };
  }, []);

  const [question, setQuestion] = useState(generateQuestion);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answer) === question.answer) {
      setScore((s) => s + 1);
      setQuestion(generateQuestion());
      setAnswer("");
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <p className="text-sm mb-2 text-black">Skor: {score}</p>
      <div className="text-3xl font-bold text-purple-800 mb-4">{question.text}</div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-24 px-3 py-2 border-2 border-purple-300 rounded text-center text-lg outline-none focus:border-purple-500 text-black"
          autoFocus
        />
        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          ✓
        </button>
      </form>
    </div>
  );
};

const PatternGame: React.FC = () => {
  const shapes = ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠"];
  const [pattern, setPattern] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");

  const generatePattern = useCallback(() => {
    const base = shapes[Math.floor(Math.random() * shapes.length)];
    const base2 = shapes.filter((s) => s !== base)[Math.floor(Math.random() * (shapes.length - 1))];
    const pat = [base, base2, base, base2, base];
    const answer = base2;
    const opts = [answer, ...shapes.filter((s) => s !== answer).slice(0, 2)].sort(() => Math.random() - 0.5);
    setPattern(pat);
    setCorrectAnswer(answer);
    setOptions(opts);
    setFeedback("");
  }, []);

  useEffect(() => { generatePattern(); }, [generatePattern]);

  const handleAnswer = (ans: string) => {
    if (ans === correctAnswer) {
      setScore((s) => s + 1);
      setFeedback("✅ Doğru!");
      setTimeout(generatePattern, 800);
    } else {
      setFeedback("❌ Tekrar dene!");
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <p className="text-sm mb-2 text-black">Skor: {score}</p>
      <p className="text-sm mb-3 text-black">Sıradaki ne olmalı?</p>
      <div className="flex gap-2 mb-4 text-2xl">
        {pattern.map((s, i) => (<span key={i}>{s}</span>))}
        <span className="text-2xl">❓</span>
      </div>
      <div className="flex gap-3">
        {options.map((o, i) => (
          <button key={i} onClick={() => handleAnswer(o)} className="text-3xl p-2 bg-white rounded-lg border-2 border-purple-200 hover:border-purple-500">{o}</button>
        ))}
      </div>
      {feedback && <p className="mt-2 text-sm font-bold text-black">{feedback}</p>}
    </div>
  );
};

const WordGuessGame: React.FC = () => {
  const words = ["GÜNEŞ", "YILDIZ", "BULUT", "DENIZ", "ORMAN", "ÇIÇEK", "KUŞLAR", "BAHAR"];
  const [word, setWord] = useState(() => words[Math.floor(Math.random() * words.length)]);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);

  const handleGuess = (letter: string) => {
    if (guessed.includes(letter)) return;
    setGuessed((prev) => [...prev, letter]);
    if (!word.includes(letter)) setWrong((w) => w + 1);
  };

  const display = word.split("").map((l) => (guessed.includes(l) ? l : "_")).join(" ");
  const won = word.split("").every((l) => guessed.includes(l));
  const lost = wrong >= 6;

  const reset = () => {
    setWord(words[Math.floor(Math.random() * words.length)]);
    setGuessed([]);
    setWrong(0);
  };

  const alphabet = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");

  return (
    <div className="p-4 flex flex-col items-center">
      <p className="text-sm mb-1 text-black">Yanlış: {wrong}/6</p>
      <div className="text-2xl font-mono font-bold tracking-widest mb-4 text-black">{display}</div>
      {(won || lost) && (
        <div className="mb-3 text-center">
          <p className="font-bold text-black">{won ? "🎉 Kazandınız!" : `😢 Kelime: ${word}`}</p>
          <button onClick={reset} className="mt-1 px-3 py-1 bg-purple-600 text-white text-sm rounded">Yeni Oyun</button>
        </div>
      )}
      <div className="flex flex-wrap gap-1 justify-center max-w-xs">
        {alphabet.map((l) => (
          <button
            key={l}
            onClick={() => handleGuess(l)}
            disabled={guessed.includes(l) || won || lost}
            className={`w-7 h-7 text-xs font-bold rounded ${
              guessed.includes(l)
                ? word.includes(l) ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                : "bg-gray-100 hover:bg-purple-100 text-black"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
};

const ColorMatchGame: React.FC = () => {
  const colorMap: Record<string, string> = {
    Kırmızı: "#ef4444", Mavi: "#3b82f6", Yeşil: "#22c55e",
    Sarı: "#eab308", Mor: "#a855f7", Turuncu: "#f97316",
  };
  const colorNames = Object.keys(colorMap);

  const generateRound = useCallback(() => {
    const textName = colorNames[Math.floor(Math.random() * colorNames.length)];
    const displayColor = colorMap[colorNames[Math.floor(Math.random() * colorNames.length)]];
    const correctColor = colorMap[textName];
    const opts = [correctColor, ...Object.values(colorMap).filter((c) => c !== correctColor).slice(0, 2)].sort(() => Math.random() - 0.5);
    return { textName, displayColor, correctColor, options: opts };
  }, []);

  const [round, setRound] = useState(generateRound);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handlePick = (color: string) => {
    if (color === round.correctColor) {
      setScore((s) => s + 1);
      setFeedback("✅");
      setTimeout(() => { setRound(generateRound()); setFeedback(""); }, 500);
    } else {
      setFeedback("❌");
      setTimeout(() => setFeedback(""), 500);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <p className="text-sm mb-2 text-black">Skor: {score}</p>
      <p className="text-sm mb-1 text-black">Bu kelimenin gerçek rengi hangisi?</p>
      <div className="text-4xl font-bold mb-4" style={{ color: round.displayColor }}>{round.textName}</div>
      <div className="flex gap-3">
        {round.options.map((c, i) => (
          <button key={i} onClick={() => handlePick(c)} className="w-14 h-14 rounded-full border-4 border-white shadow-md hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
        ))}
      </div>
      {feedback && <p className="mt-2 text-lg">{feedback}</p>}
    </div>
  );
};

/* ==================== YENİ OYUNLAR ==================== */

const SimonGame: React.FC = () => {
  const colors = [
    { name: "red", bg: "bg-red-500", activeBg: "bg-red-300", emoji: "🔴" },
    { name: "blue", bg: "bg-blue-500", activeBg: "bg-blue-300", emoji: "🔵" },
    { name: "green", bg: "bg-green-500", activeBg: "bg-green-300", emoji: "🟢" },
    { name: "yellow", bg: "bg-yellow-500", activeBg: "bg-yellow-300", emoji: "🟡" },
  ];

  const [sequence, setSequence] = useState<string[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const showSequence = useCallback((seq: string[]) => {
    setIsShowingSequence(true);
    seq.forEach((color, i) => {
      setTimeout(() => {
        setActiveColor(color);
        setTimeout(() => setActiveColor(null), 400);
      }, i * 600);
    });
    setTimeout(() => setIsShowingSequence(false), seq.length * 600 + 200);
  }, []);

  const startGame = useCallback(() => {
    const firstColor = colors[Math.floor(Math.random() * colors.length)].name;
    const newSeq = [firstColor];
    setSequence(newSeq);
    setPlayerIndex(0);
    setGameOver(false);
    setGameStarted(true);
    setTimeout(() => showSequence(newSeq), 500);
  }, [showSequence]);

  const handleColorClick = (colorName: string) => {
    if (isShowingSequence || gameOver) return;

    setActiveColor(colorName);
    setTimeout(() => setActiveColor(null), 200);

    if (colorName !== sequence[playerIndex]) {
      setGameOver(true);
      return;
    }

    const nextIndex = playerIndex + 1;
    if (nextIndex >= sequence.length) {
      // Tur tamamlandı
      const newScore = score + 1;
      setScore(newScore);
      const nextColor = colors[Math.floor(Math.random() * colors.length)].name;
      const newSeq = [...sequence, nextColor];
      setSequence(newSeq);
      setPlayerIndex(0);
      setTimeout(() => showSequence(newSeq), 800);
    } else {
      setPlayerIndex(nextIndex);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <p className="text-sm mb-2 text-black">Seviye: {score}</p>
      {!gameStarted && !gameOver && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">Renk sırasını takip et ve tekrarla!</p>
          <button onClick={startGame} className="px-6 py-3 bg-purple-600 text-white rounded-xl text-lg font-bold hover:bg-purple-700">
            🎮 Başla
          </button>
        </div>
      )}
      {gameOver && (
        <div className="text-center mb-3">
          <p className="text-lg font-bold text-red-600">😢 Oyun Bitti!</p>
          <p className="text-sm text-black">Seviye: {score}</p>
          <button onClick={startGame} className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Tekrar Oyna
          </button>
        </div>
      )}
      {gameStarted && !gameOver && (
        <>
          <p className="text-xs text-gray-500 mb-3">
            {isShowingSequence ? "👀 İzle..." : `👆 Sıra sende! (${playerIndex + 1}/${sequence.length})`}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => handleColorClick(c.name)}
                disabled={isShowingSequence}
                className={`w-20 h-20 rounded-2xl transition-all duration-150 flex items-center justify-center text-3xl ${
                  activeColor === c.name ? c.activeBg + " scale-110 shadow-lg" : c.bg + " hover:opacity-80"
                } ${isShowingSequence ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const SlidingPuzzle: React.FC = () => {
  const size = 3;
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const initPuzzle = useCallback(() => {
    const arr = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
    arr.push(0); // 0 = boş
    // Shuffle with valid moves
    let blank = arr.indexOf(0);
    for (let i = 0; i < 100; i++) {
      const neighbors: number[] = [];
      const row = Math.floor(blank / size);
      const col = blank % size;
      if (row > 0) neighbors.push(blank - size);
      if (row < size - 1) neighbors.push(blank + size);
      if (col > 0) neighbors.push(blank - 1);
      if (col < size - 1) neighbors.push(blank + 1);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      [arr[blank], arr[pick]] = [arr[pick], arr[blank]];
      blank = pick;
    }
    setTiles(arr);
    setMoves(0);
    setWon(false);
  }, []);

  useEffect(() => { initPuzzle(); }, [initPuzzle]);

  const handleClick = (index: number) => {
    if (won) return;
    const blank = tiles.indexOf(0);
    const row = Math.floor(index / size);
    const col = index % size;
    const blankRow = Math.floor(blank / size);
    const blankCol = blank % size;
    const isNeighbor = (Math.abs(row - blankRow) + Math.abs(col - blankCol)) === 1;
    if (!isNeighbor) return;

    const newTiles = [...tiles];
    [newTiles[index], newTiles[blank]] = [newTiles[blank], newTiles[index]];
    setTiles(newTiles);
    setMoves((m) => m + 1);

    // Check win
    const goal = Array.from({ length: size * size - 1 }, (_, i) => i + 1).concat(0);
    if (newTiles.every((t, i) => t === goal[i])) {
      setWon(true);
    }
  };

  const tileEmojis = ["", "🐶", "🐱", "🐸", "🦊", "🐻", "🐼", "🐨", "🦁"];

  return (
    <div className="p-4 flex flex-col items-center">
      <p className="text-sm mb-2 text-black">Hamle: {moves}</p>
      {won && (
        <div className="mb-3 text-center">
          <p className="text-green-600 font-bold">🎉 Tebrikler! {moves} hamlede tamamladın!</p>
          <button onClick={initPuzzle} className="mt-1 px-3 py-1 bg-purple-600 text-white text-sm rounded">Yeni Oyun</button>
        </div>
      )}
      <div className="grid grid-cols-3 gap-1 bg-purple-200 p-1 rounded-xl">
        {tiles.map((tile, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={`w-20 h-20 rounded-lg flex items-center justify-center text-3xl font-bold transition-all ${
              tile === 0
                ? "bg-purple-200"
                : "bg-white shadow-md hover:bg-purple-50 text-black"
            }`}
          >
            {tile === 0 ? "" : tileEmojis[tile] || tile}
          </button>
        ))}
      </div>
    </div>
  );
};

const NumberPuzzle: React.FC = () => {
  const [target, setTarget] = useState(0);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);

  const generatePuzzle = useCallback((currentLevel: number) => {
    const maxNum = currentLevel < 3 ? 9 : currentLevel < 6 ? 15 : 20;
    const numCount = currentLevel < 4 ? 4 : 5;
    const nums = Array.from({ length: numCount }, () => Math.floor(Math.random() * maxNum) + 1);
    const ops = currentLevel < 3 ? ["+", "-"] : ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let answer: number;
    const a = nums[0];
    const b = nums[1];
    switch (op) {
      case "+": answer = a + b; break;
      case "-": answer = a - b; if (answer < 0) { answer = b - a; } break;
      case "×": answer = a * b; break;
      default: answer = a + b;
    }
    setTarget(answer);
    setNumbers(nums.sort(() => Math.random() - 0.5));
    setSelectedIndices([]);
    setSelectedOp(null);
    setFeedback("");
  }, []);

  useEffect(() => { generatePuzzle(level); }, [generatePuzzle, level]);

  const handleNumberClick = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
      return;
    }
    if (selectedIndices.length >= 2) return;
    setSelectedIndices((prev) => [...prev, index]);
  };

  const handleOpClick = (op: string) => {
    setSelectedOp(selectedOp === op ? null : op);
  };

  const checkAnswer = () => {
    if (selectedIndices.length < 2 || !selectedOp) return;
    const a = numbers[selectedIndices[0]];
    const b = numbers[selectedIndices[1]];
    let result: number;
    switch (selectedOp) {
      case "+": result = a + b; break;
      case "-": result = a - b; break;
      case "×": result = a * b; break;
      default: result = a + b;
    }
    if (result === target) {
      const newStreak = streak + 1;
      const bonus = newStreak >= 3 ? 2 : 1;
      setScore((s) => s + bonus);
      setStreak(newStreak);
      setFeedback(`✅ Doğru! ${bonus > 1 ? "🔥 Çarpan x2!" : ""}`);
      if (newStreak % 3 === 0) {
        setLevel((l) => Math.min(l + 1, 10));
      }
      setTimeout(() => generatePuzzle(level), 1000);
    } else {
      setStreak(0);
      setFeedback(`❌ ${a} ${selectedOp} ${b} = ${result}, hedef ${target} değildi`);
      setSelectedIndices([]);
      setSelectedOp(null);
    }
  };

  const ops = level < 3 ? ["+", "-"] : ["+", "-", "×"];

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm text-black">Skor: <b>{score}</b></span>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Seviye {level}</span>
        {streak >= 2 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full animate-pulse">🔥 {streak} seri!</span>}
      </div>
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 mb-1">İşlemi seç ve hedefi bul:</p>
        <div className="text-4xl font-bold text-purple-800 bg-purple-100 rounded-xl px-6 py-3 inline-block">
          🎯 {target}
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        {ops.map((op) => (
          <button
            key={op}
            onClick={() => handleOpClick(op)}
            className={`w-12 h-10 rounded-lg text-lg font-bold flex items-center justify-center transition-all ${
              selectedOp === op
                ? "bg-purple-500 text-white scale-110 shadow-lg"
                : "bg-white border-2 border-purple-200 text-black hover:border-purple-400"
            }`}
          >
            {op}
          </button>
        ))}
      </div>
      <div className="flex gap-3 mb-4">
        {numbers.map((num, i) => (
          <button
            key={i}
            onClick={() => handleNumberClick(i)}
            className={`w-14 h-14 rounded-xl text-xl font-bold flex items-center justify-center transition-all ${
              selectedIndices.includes(i)
                ? "bg-purple-500 text-white scale-110 shadow-lg ring-2 ring-purple-300"
                : "bg-white border-2 border-purple-200 text-black hover:border-purple-400"
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-3">
        {selectedIndices.length === 2 && selectedOp ? (
          <span className="text-sm text-black">
            {numbers[selectedIndices[0]]} {selectedOp} {numbers[selectedIndices[1]]} = ?
          </span>
        ) : (
          <span className="text-sm text-gray-400">
            {selectedIndices.length === 0 ? "İlk sayıyı seç" : selectedIndices.length === 1 ? "İkinci sayıyı seç" : "İşlem seç"}
          </span>
        )}
        {selectedIndices.length === 2 && selectedOp && (
          <button onClick={checkAnswer} className="px-4 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 ml-2">
            ✓ Kontrol Et
          </button>
        )}
      </div>
      {feedback && <p className="text-sm font-bold text-black">{feedback}</p>}
      <button onClick={() => { setSelectedIndices([]); setSelectedOp(null); setFeedback(""); }} className="mt-2 text-xs text-purple-500 underline">
        Seçimi Sıfırla
      </button>
    </div>
  );
};

export default KidsGames;