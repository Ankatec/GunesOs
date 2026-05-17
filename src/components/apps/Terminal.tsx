import React, { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

interface Line {
  type: "input" | "output" | "system";
  text: string;
}

interface TerminalProps {
  onSystemCommand?: (cmd: string, args: string) => void;
}

// GüneşOS / Günter ikon paleti
const SUN_BG = "radial-gradient(circle at 30% 25%, #fff7ad 0%, #fbbf24 45%, #f97316 100%)";
const SUN_INK = "#0f172a"; // Günter okunun koyu lacivert rengi
const SUN_ACCENT = "#1e3a8a"; // Günter ikonundaki ikincil lacivert

const Terminal: React.FC<TerminalProps> = ({ onSystemCommand }) => {
  const [lines, setLines] = useState<Line[]>([
    { type: "output", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const addLines = (newLines: Line[]) => {
    setLines((prev) => [...prev, ...newLines]);
  };

  const PROMPT = "Günter>]";

  const processCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    const parts = trimmed.split(" ");
    const command = parts[0]?.toLowerCase() || "";
    const args = parts.slice(1).join(" ");

    const inputLine: Line = { type: "input", text: `${PROMPT} ${trimmed}` };

    switch (command) {
      case "help":
        addLines([
          inputLine,
          { type: "output", text: "" },
          { type: "system", text: "═══ KOMUT LİSTESİ ═══" },
          { type: "output", text: "  help              - Bu yardım mesajını gösterir" },
          { type: "output", text: "  date              - Tarih ve saati gösterir" },
          { type: "output", text: "  clear             - Ekranı temizler" },
          { type: "output", text: "  echo [mesaj]      - Mesaj yazdırır" },
          { type: "output", text: "  whoami            - Kullanıcı bilgisi" },
          { type: "output", text: "  ver               - Sürüm bilgisi" },
          { type: "output", text: "  dir               - Dosyaları listeler" },
          { type: "output", text: "  kapat             - Terminali kapatır" },
          { type: "output", text: "  aç [uygulama]     - Uygulama açar" },
          { type: "output", text: "  hakkında          - Sistem hakkında bilgi" },
          { type: "output", text: "  hesapla [ifade]   - Basit matematik" },
          { type: "output", text: "  saat              - Saati gösterir" },
          { type: "output", text: "  kaydet [ad] [içerik] - GüneşOS belgesi kaydeder" },
          { type: "output", text: "  yenile            - Masaüstünü yeniler" },
          { type: "output", text: "  gunesos           - GüneşOS hakkında bilgi" },
          { type: "output", text: "  renk [renk]       - Terminal rengini değiştirir" },
          { type: "output", text: "  matrix            - Matrix efekti" },
          { type: "output", text: "" },
        ]);
        break;

      case "date":
        addLines([
          inputLine,
          {
            type: "output",
            text: new Date().toLocaleString("tr-TR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          },
        ]);
        break;

      case "clear":
        setLines([]);
        return;

      case "echo":
        addLines([inputLine, { type: "output", text: args || "" }]);
        break;

      case "whoami":
        addLines([inputLine, { type: "output", text: "GüneşOS\\Kullanıcı" }]);
        break;

      case "ver":
      case "sürüm":
        addLines([
          inputLine,
          { type: "output", text: "" },
          { type: "system", text: "GüneşOS Günter [Sürüm v571]" },
          { type: "output", text: "(c) 2026 GüneşOS. Tüm hakları saklıdır." },
          { type: "output", text: "" },
        ]);
        break;

      case "dir":
        addLines([
          inputLine,
          { type: "output", text: " Günter dizini" },
          { type: "output", text: "" },
          { type: "output", text: "28.04.2026  12:00    <DIR>          Belgelerim" },
          { type: "output", text: "28.04.2026  12:00    <DIR>          Masaüstü" },
          { type: "output", text: "28.04.2026  12:00    <DIR>          Resimler" },
          { type: "output", text: "28.04.2026  12:00         1.024     sistem.ini" },
          { type: "output", text: "" },
        ]);
        break;

      case "kapat":
      case "çıkış":
      case "exit":
        addLines([inputLine, { type: "system", text: "Terminal kapatılıyor..." }]);
        setTimeout(() => onSystemCommand?.("close", ""), 500);
        break;

      case "aç":
      case "ac": {
        const appMap: Record<string, string> = {
          tarayıcı: "browser",
          tarayici: "browser",
          browser: "browser",
          notepad: "notepad",
          "not defteri": "notepad",
          paint: "paint",
          terminal: "terminal",
          mayın: "minesweeper",
          mayin: "minesweeper",
          minesweeper: "minesweeper",
          oyun: "kidsgames",
          "oyun merkezi": "kidsgames",
          dosya: "files",
          ayarlar: "settings",
          settings: "settings",
        };
        const appName = args.toLowerCase();
        const appId = appMap[appName];
        if (appId) {
          addLines([inputLine, { type: "system", text: `${args} açılıyor...` }]);
          onSystemCommand?.("open", appId);
        } else {
          addLines([
            inputLine,
            { type: "output", text: `Uygulama bulunamadı: '${args}'` },
            { type: "output", text: "Kullanılabilir: tarayıcı, notepad, paint, terminal, mayın, oyun, dosya, ayarlar" },
          ]);
        }
        break;
      }

      case "hakkında":
      case "hakkinda":
        addLines([
          inputLine,
          { type: "output", text: "" },
          { type: "system", text: "GüneşOS Hakkında" },
          { type: "output", text: "Sürüm: Günter v571" },
          { type: "output", text: "Çekirdek: GüneşKernel 5.0" },
          { type: "output", text: "Bellek: 4 GB RAM" },
          { type: "output", text: "Disk: 120 GB SSD" },
          { type: "output", text: "" },
        ]);
        break;

      case "hesapla": {
        try {
          const sanitized = args.replace(/[^0-9+\-*/().]/g, "");
          if (!sanitized) throw new Error("Boş");
          const result = new Function(`return ${sanitized}`)();
          addLines([inputLine, { type: "output", text: `= ${result}` }]);
        } catch {
          addLines([inputLine, { type: "output", text: "Geçersiz ifade. Örnek: hesapla 5+3*2" }]);
        }
        break;
      }

      case "saat":
        addLines([inputLine, { type: "output", text: new Date().toLocaleTimeString("tr-TR") }]);
        break;

      case "kaydet": {
        const saveParts = args.split(" ");
        const fileName = saveParts[0] || `belge_${Date.now()}`;
        const content = saveParts.slice(1).join(" ") || "Boş belge";
        const isGunesOS = fileName.endsWith(".gunes.os") || fileName.endsWith(".gos");
        addLines([
          inputLine,
          { type: "system", text: `☀️ ${isGunesOS ? "GüneşOS Belgesi" : "Belge"} kaydediliyor...` },
          { type: "output", text: `  Dosya: ${isGunesOS ? fileName : fileName + ".txt"}` },
          { type: "output", text: `  Boyut: ${content.length} bayt` },
          { type: "output", text: `  Konum: Günter\\Belgelerim\\${isGunesOS ? fileName : fileName + ".txt"}` },
          { type: "system", text: "✅ Kayıt başarılı!" },
        ]);
        onSystemCommand?.("save", JSON.stringify({ name: isGunesOS ? fileName : fileName + ".txt", content, type: isGunesOS ? "gunesos" : "document" }));
        break;
      }

      case "yenile":
        addLines([
          inputLine,
          { type: "system", text: "🔄 Masaüstü yenileniyor..." },
        ]);
        setTimeout(() => window.location.reload(), 800);
        break;

      case "gunesos":
        addLines([
          inputLine,
          { type: "output", text: "" },
          { type: "system", text: "☀️ ══════════════════════════════════════ ☀️" },
          { type: "system", text: "     GüneşOS — Çocuklar için İşletim Sistemi" },
          { type: "system", text: "☀️ ══════════════════════════════════════ ☀️" },
          { type: "output", text: "" },
          { type: "output", text: "  Sürüm:      Günter v571" },
          { type: "output", text: "  Çekirdek:   GüneşKernel 5.0" },
          { type: "output", text: "  Dil:        Türkçe / GüneşOS Script" },
          { type: "output", text: "  Hedef:      7-14 yaş çocuklar" },
          { type: "output", text: "  Özellikler: Ninni Çalar, Oyun Merkezi," },
          { type: "output", text: "             Eğitim Uygulamaları, Güvenli Mod" },
          { type: "output", text: "" },
          { type: "system", text: "  .gunes.os dosyaları GüneşOS Script belgeleridir" },
          { type: "system", text: "  Örnek: kaydet merhaba.gunes.os Merhaba Dünya!" },
          { type: "output", text: "" },
        ]);
        break;

      case "renk": {
        const colorMap: Record<string, string> = {
          kırmızı: "#ff4444", mavi: "#4488ff", yeşil: "#44ff44",
          mor: "#cc44ff", sarı: "#ffff44", beyaz: "#ffffff",
          turuncu: "#ff8844", pembe: "#ff44aa",
        };
        const color = colorMap[args.toLowerCase()];
        if (color) {
          addLines([
            inputLine,
            { type: "system", text: `🎨 Terminal rengi değiştirildi: ${args}` },
          ]);
        } else {
          addLines([
            inputLine,
            { type: "output", text: "Kullanılabilir renkler: kırmızı, mavi, yeşil, mor, sarı, beyaz, turuncu, pembe" },
          ]);
        }
        break;
      }

      case "matrix":
        addLines([
          inputLine,
          { type: "system", text: "🟢 Matrix modu aktif..." },
          { type: "output", text: "01001000 01100101 01101100 01101100 01101111" },
          { type: "output", text: "01010111 01101111 01110010 01101100 01100100" },
          { type: "output", text: "01000111 11110101 01101110 01100101 01110011" },
          { type: "output", text: "00110011 00110010 00110000 00110001 00110110" },
          { type: "output", text: "10110100 11001010 01011010 10101101 01110010" },
          { type: "system", text: "🟢 GüneşOS Matrix — Hoş geldin, Neo! ☀️" },
        ]);
        break;

      case "":
        addLines([inputLine]);
        break;

      default:
        addLines([
          inputLine,
          { type: "output", text: `'${command}' dahili veya harici bir komut olarak tanınmıyor.` },
          { type: "output", text: "Yardım için 'help' yazın." },
        ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setHistory((prev) => [...prev, input]);
      setHistoryIndex(-1);
    }
    processCommand(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    }
  };

  const triggerHelp = () => {
    processCommand("help");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div
      className="w-full h-full font-mono text-[13px] sm:text-[14px] overflow-y-auto cursor-text flex flex-col"
      style={{ background: SUN_BG, color: SUN_INK }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Üst başlık */}
      <div
        className="sticky top-0 z-10 flex flex-col items-center gap-2 px-3 py-2 border-b backdrop-blur-sm"
        style={{
          borderColor: `${SUN_ACCENT}33`,
          background: "linear-gradient(180deg, rgba(255,247,173,.55), rgba(251,191,36,.25))",
        }}
      >
        <span className="font-bold tracking-wide text-[13px] sm:text-[15px]" style={{ color: SUN_INK }}>
          ☀️ GüneşOS Günter v571
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerHelp();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerHelp();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-[12px] sm:text-[13px] active:scale-95 transition-transform select-none touch-manipulation"
          style={{
            color: SUN_INK,
            background: "rgba(255,255,255,0.55)",
            border: `1.5px solid ${SUN_INK}`,
            minHeight: 36,
          }}
          aria-label="Yardım"
        >
          <HelpCircle className="w-4 h-4" />
          Yardım
        </button>
      </div>

      {/* Çıktı alanı */}
      <div className="flex-1 px-3 py-2">
        {lines.map((line, i) => (
          <div
            key={i}
            className="whitespace-pre-wrap"
            style={{
              color: SUN_INK,
              opacity: line.type === "system" ? 0.95 : line.type === "output" ? 0.88 : 1,
              fontWeight: line.type === "input" ? 700 : 500,
            }}
          >
            {line.text || "\u00A0"}
          </div>
        ))}

        <form onSubmit={handleSubmit} className="flex items-center mt-1">
          <span className="whitespace-pre font-bold" style={{ color: SUN_INK }}>
            {PROMPT}&nbsp;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none border-none font-mono text-[13px] sm:text-[14px]"
            style={{ color: SUN_INK, caretColor: SUN_INK }}
            autoFocus
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="text"
            enterKeyHint="send"
          />
        </form>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Terminal;
