import React, { useState, useRef, useEffect } from "react";

interface Line {
  type: "input" | "output" | "system";
  text: string;
}

interface TerminalProps {
  onSystemCommand?: (cmd: string, args: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ onSystemCommand }) => {
  const [lines, setLines] = useState<Line[]>([
    { type: "system", text: "╔══════════════════════════════════════╗" },
    { type: "system", text: "║       GüneşOS Terminal v1.0         ║" },
    { type: "system", text: "║  Yardım için 'help' yazın           ║" },
    { type: "system", text: "╚══════════════════════════════════════╝" },
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

  const processCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    const parts = trimmed.split(" ");
    const command = parts[0]?.toLowerCase() || "";
    const args = parts.slice(1).join(" ");

    const inputLine: Line = { type: "input", text: `C:\\GüneşOS> ${trimmed}` };

    switch (command) {
      case "help":
        addLines([
          inputLine,
          { type: "output", text: "" },
          { type: "system", text: "═══ KOMUT LİSTESİ ═══" },
          { type: "output", text: "  help          - Bu yardım mesajını gösterir" },
          { type: "output", text: "  date          - Tarih ve saati gösterir" },
          { type: "output", text: "  clear         - Ekranı temizler" },
          { type: "output", text: "  echo [mesaj]  - Mesaj yazdırır" },
          { type: "output", text: "  whoami        - Kullanıcı bilgisi" },
          { type: "output", text: "  ver           - Sürüm bilgisi" },
          { type: "output", text: "  dir           - Dosyaları listeler" },
          { type: "output", text: "  kapat         - Terminali kapatır" },
          { type: "output", text: "  aç [uygulama] - Uygulama açar (tarayıcı, notepad, paint, terminal, mayın, oyun)" },
          { type: "output", text: "  renk [renk]   - Terminal rengini değiştirir (yeşil, mavi, beyaz, sarı)" },
          { type: "output", text: "  hakkında      - Sistem hakkında bilgi" },
          { type: "output", text: "  hesapla [ifade] - Basit matematik hesaplar" },
          { type: "output", text: "  saat          - Saati gösterir" },
          { type: "output", text: "" },
        ]);
        break;

      case "date":
        addLines([
          inputLine,
          {
            type: "output",
            text: new Date().toLocaleString("tr-TR", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit", second: "2-digit",
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
          { type: "system", text: "GüneşOS [Sürüm 1.0.2026]" },
          { type: "output", text: "(c) 2026 GüneşOS. Tüm hakları saklıdır." },
          { type: "output", text: "" },
        ]);
        break;

      case "dir":
        addLines([
          inputLine,
          { type: "output", text: " C:\\GüneşOS dizini" },
          { type: "output", text: "" },
          { type: "output", text: "28.04.2026  12:00    <DIR>          Belgelerim" },
          { type: "output", text: "28.04.2026  12:00    <DIR>          Masaüstü" },
          { type: "output", text: "28.04.2026  12:00    <DIR>          Resimler" },
          { type: "output", text: "28.04.2026  12:00    <DIR>          İndirilenler" },
          { type: "output", text: "28.04.2026  12:00         1.024     sistem.ini" },
          { type: "output", text: "28.04.2026  12:00         2.048     ayarlar.cfg" },
          { type: "output", text: "               2 Dosya          3.072 bayt" },
          { type: "output", text: "               4 Dizin   4.096.000 bayt boş" },
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
          tarayıcı: "browser", tarayici: "browser", browser: "browser",
          notepad: "notepad", "not defteri": "notepad", notdefteri: "notepad",
          paint: "paint", terminal: "terminal",
          mayın: "minesweeper", mayin: "minesweeper", minesweeper: "minesweeper",
          oyun: "kidsgames", "oyun merkezi": "kidsgames",
          dosya: "files", "dosya gezgini": "files",
          ayarlar: "settings", settings: "settings",
        };
        const appName = args.toLowerCase();
        const appId = appMap[appName];
        if (appId) {
          addLines([inputLine, { type: "system", text: `${args} açılıyor...` }]);
          onSystemCommand?.("open", appId);
        } else {
          addLines([inputLine, { type: "output", text: `Uygulama bulunamadı: '${args}'` }, { type: "output", text: "Kullanılabilir: tarayıcı, notepad, paint, terminal, mayın, oyun, dosya, ayarlar" }]);
        }
        break;
      }

      case "renk": {
        const colorMap: Record<string, string> = { yeşil: "#00ff00", yesil: "#00ff00", mavi: "#00bfff", beyaz: "#ffffff", sarı: "#ffff00", sari: "#ffff00" };
        const c = colorMap[args.toLowerCase()];
        if (c) {
          addLines([inputLine, { type: "system", text: `Renk değiştirildi: ${args}` }]);
        } else {
          addLines([inputLine, { type: "output", text: "Geçerli renkler: yeşil, mavi, beyaz, sarı" }]);
        }
        break;
      }

      case "hakkında":
      case "hakkinda":
        addLines([
          inputLine,
          { type: "output", text: "" },
          { type: "system", text: "╔══════════════════════════════════════╗" },
          { type: "system", text: "║         GüneşOS Hakkında            ║" },
          { type: "system", text: "╠══════════════════════════════════════╣" },
          { type: "output", text: "║  Sürüm: 1.0.2026                    " },
          { type: "output", text: "║  Çekirdek: GüneşKernel 5.0          " },
          { type: "output", text: "║  Bellek: 4 GB RAM                    " },
          { type: "output", text: "║  Disk: 120 GB SSD                    " },
          { type: "system", text: "╚══════════════════════════════════════╝" },
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
        if (newIndex >= history.length) { setHistoryIndex(-1); setInput(""); }
        else { setHistoryIndex(newIndex); setInput(history[newIndex]); }
      }
    }
  };

  return (
    <div
      className="w-full h-full bg-black font-mono text-[13px] p-2 overflow-y-auto cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={
            line.type === "input" ? "text-white" : line.type === "system" ? "text-[#00c0c0]" : "text-[#c0c0c0]"
          }
        >
          {line.text || "\u00A0"}
        </div>
      ))}
      <form onSubmit={handleSubmit} className="flex">
        <span className="text-white whitespace-pre">{"C:\\GüneşOS> "}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-white outline-none border-none font-mono text-[13px] caret-[#00c0c0]"
          autoFocus
          spellCheck={false}
        />
      </form>
      <div ref={bottomRef} />
    </div>
  );
};

export default Terminal;