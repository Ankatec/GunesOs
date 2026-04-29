import React, { useState, useEffect, useCallback } from "react";

type GameId = "memory" | "math" | "pattern" | "wordguess" | "colorMatch";

const KidsGames: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsLocked(hour >= 21 || hour < 7);
    };
    checkTime();
    const interval = setInterval(checkTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLocked) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-indigo-900 to-purple-900 text-white p-6">
        <span className="text-6xl mb-4">🌙</span>
        <h2 className="text-xl font-bold mb-2">Uyku Zamanı!</h2>
        <p className="text-sm text-center opacity-80">
          Oyun Merkezi saat 21:00 - 07:00 arası kapalıdır.
        </p>
        <p className="text-xs mt-2 opacity-60">İyi geceler! 💤</p>
      </div>
    );
  }

  if (activeGame) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center gap-2 p-2 bg-purple-100 border-b">
          <button onClick={() => setActiveGame(null)} className="text-sm px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">
            ← Geri
          </button>
          <span className="text-sm font-bold text-purple-800">
            {activeGame === "memory" && "🧠 Hafıza Oyunu"}
            {activeGame === "math" && "🔢 Matematik Yarışması"}
            {activeGame === "pattern" && "🔷 Desen Tamamla"}
            {activeGame === "wordguess" && "📝 Kelime Tahmin"}
            {activeGame === "colorMatch" && "🎨 Renk Eşleştir"}
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          {activeGame === "memory" && <MemoryGame />}
          {activeGame === "math" && <MathGame />}
          {activeGame === "pattern" && <PatternGame />}
          {activeGame === "wordguess" && <WordGuessGame />}
          {activeGame === "colorMatch" && <ColorMatchGame />}
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
  ];

  return (
    <div className="w-full h-full bg-gradient-to-b from-purple-50 to-pink-50 p-4 overflow-auto">
      <h2 className="text-xl font-bold text-purple-800 mb-1 text-center">🧩 Oyun Merkezi</h2>
      <p className="text-xs text-center text-purple-500 mb-4">Zeka ve akıl oyunları</p>
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

// Memory Game
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
      <p className="text-sm mb-2">Hamle: {moves}</p>
      {allMatched && <p className="text-green-600 font-bold mb-2">🎉 Tebrikler!</p>}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, i) => (
          <button
            key={i}
            onClick={() => handleFlip(i)}
            className={`w-14 h-14 rounded-lg text-2xl flex items-center justify-center transition-all ${
              card.flipped || card.matched ? "bg-white border-2 border-purple-300" : "bg-purple-500 hover:bg-purple-600"
            }`}
          >
            {card.flipped || card.matched ? card.emoji : "?"}
          </button>
        ))}
      </div>
    </div>
  );
};

// Math Game
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
      <p className="text-sm mb-2">Skor: {score}</p>
      <div className="text-3xl font-bold text-purple-800 mb-4">{question.text}</div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-24 px-3 py-2 border-2 border-purple-300 rounded text-center text-lg outline-none focus:border-purple-500"
          autoFocus
        />
        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">✓</button>
      </form>
    </div>
  );
};

// Pattern Game
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
      <p className="text-sm mb-2">Skor: {score}</p>
      <p className="text-sm mb-3">Sıradaki ne olmalı?</p>
      <div className="flex gap-2 mb-4 text-2xl">
        {pattern.map((s, i) => (<span key={i}>{s}</span>))}
        <span className="text-2xl">❓</span>
      </div>
      <div className="flex gap-3">
        {options.map((o, i) => (
          <button key={i} onClick={() => handleAnswer(o)} className="text-3xl p-2 bg-white rounded-lg border-2 border-purple-200 hover:border-purple-500">{o}</button>
        ))}
      </div>
      {feedback && <p className="mt-2 text-sm font-bold">{feedback}</p>}
    </div>
  );
};

// Word Guess Game
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
      <p className="text-sm mb-1">Yanlış: {wrong}/6</p>
      <div className="text-2xl font-mono font-bold tracking-widest mb-4">{display}</div>
      {(won || lost) && (
        <div className="mb-3 text-center">
          <p className="font-bold">{won ? "🎉 Kazandınız!" : `😢 Kelime: ${word}`}</p>
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
                : "bg-gray-100 hover:bg-purple-100"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
};

// Color Match Game
const ColorMatchGame: React.FC = () => {
  const colorMap: Record<string, string> = {
    Kırmızı: "#ef4444", Mavi: "#3b82f6", Yeşil: "#22c55e", Sarı: "#eab308", Mor: "#a855f7", Turuncu: "#f97316",
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
      <p className="text-sm mb-2">Skor: {score}</p>
      <p className="text-sm mb-1">Bu kelimenin gerçek rengi hangisi?</p>
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

export default KidsGames;