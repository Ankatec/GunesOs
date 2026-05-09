import React, { useState } from "react";

/* ─── Yapım Aşamasında shared component ─── */
const UnderConstruction: React.FC<{ emoji: string; name: string; desc: string; gradient: string }> = ({
  emoji,
  name,
  desc,
  gradient,
}) => (
  <div className={`h-full w-full flex flex-col items-center justify-center text-center px-6 ${gradient}`}>
    <div className="relative mb-5">
      <span className="text-7xl">{emoji}</span>
      <span className="absolute -bottom-2 -right-2 text-3xl animate-bounce">🚧</span>
    </div>
    <h2 className="text-xl font-bold text-gray-800 mb-1">{name}</h2>
    <p className="text-sm text-gray-600 mb-4">{desc}</p>
    <div className="px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-300">
      🛠️ Yapım Aşamasında
    </div>
    <p className="text-[11px] text-gray-500 mt-4 max-w-xs">
      Bu uygulama yakında kullanıma sunulacak. Şimdilik sabırla bekleyin!
    </p>
  </div>
);

export const RadioApp: React.FC = () => (
  <UnderConstruction
    emoji="📻"
    name="Radyo"
    desc="Canlı radyo istasyonları geliyor."
    gradient="bg-gradient-to-b from-slate-50 to-slate-100"
  />
);

export const SeyretApp: React.FC = () => (
  <UnderConstruction
    emoji="🎬"
    name="Seyret"
    desc="Çocuk dostu video kütüphanesi yakında."
    gradient="bg-gradient-to-b from-rose-50 to-rose-100"
  />
);

export const PostaAnkaraApp: React.FC = () => (
  <UnderConstruction
    emoji="✉️"
    name="Posta Ankara"
    desc="E-posta servisi hazırlanıyor."
    gradient="bg-gradient-to-b from-blue-50 to-blue-100"
  />
);

export const TelankaraApp: React.FC = () => (
  <UnderConstruction
    emoji="📱"
    name="Telankara"
    desc="Sesli arama ve mesajlaşma yakında."
    gradient="bg-gradient-to-b from-green-50 to-green-100"
  />
);

/* ─── Yazeka (Word Game) — aktif ─── */
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
      <div className="text-center mb-2">
        <h3 className="text-lg font-bold text-amber-800">📝 Yazeka</h3>
        <p className="text-[10px] text-gray-500">Kelime Oyunu</p>
      </div>
      <div className="flex justify-center gap-1 mb-2">
        {hangmanParts.map((part, i) => (
          <span key={i} className={`text-2xl transition-opacity ${i < wrongCount ? "opacity-100" : "opacity-20"}`}>
            {part}
          </span>
        ))}
      </div>
      <div className="text-center mb-2">
        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{puzzle.category}</span>
        <p className="text-[11px] text-gray-600 mt-1">İpucu: {puzzle.hint}</p>
      </div>
      <div className="flex justify-center gap-2 mb-3">
        {puzzle.word.split("").map((letter, i) => (
          <div key={i} className="w-8 h-10 border-b-2 border-amber-400 flex items-end justify-center pb-1">
            <span className="text-lg font-bold text-amber-900">
              {guessedLetters.has(letter) || gameStatus === "lost" ? letter : ""}
            </span>
          </div>
        ))}
      </div>
      {gameStatus !== "playing" && (
        <div className={`text-center p-2 rounded-lg mb-2 ${gameStatus === "won" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          <p className="text-sm font-bold">{gameStatus === "won" ? "🎉 Tebrikler!" : "😢 Tekrar Dene!"}</p>
          <button onClick={nextPuzzle} className="mt-1 text-[11px] px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600">
            Sonraki Kelime
          </button>
        </div>
      )}
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
                  isCorrect ? "bg-green-500 text-white" : isWrong ? "bg-gray-300 text-gray-500" : "bg-amber-200 text-amber-800 hover:bg-amber-300"
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
