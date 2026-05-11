import { useMemo } from "react";
import { FileCode2, Circle } from "lucide-react";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  filename: string;
}

export default function CodeEditor({ code, onChange, filename }: CodeEditorProps) {
  const lineCount = useMemo(() => code.split("\n").length, [code]);
  const lineNumbers = useMemo(
    () => Array.from({ length: Math.max(lineCount, 25) }, (_, i) => i + 1),
    [lineCount]
  );

  return (
    <section className="h-full flex flex-col bg-panel rounded-xl shadow-panel-strong overflow-hidden border border-border/60">
      {/* Tabs */}
      <div className="h-11 flex items-center border-b border-border/60 bg-gradient-to-b from-[#151a2b] to-[#10152300] px-2">
        <div className="flex items-center gap-2 h-9 px-3 rounded-t-md bg-[#0e1322] border-t border-l border-r border-border/40 -mb-px">
          <FileCode2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">{filename}</span>
          <Circle className="w-2 h-2 fill-primary text-primary ml-1" />
        </div>
        <div className="ml-auto mr-2 text-[10px] text-muted-foreground font-mono">
          UTF-8 • HTML • {lineCount} satır
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden bg-[#0a0e1a] relative">
        {/* Line numbers */}
        <div className="w-12 shrink-0 bg-[#0a0e1a] border-r border-border/40 text-right select-none py-3 overflow-hidden">
          {lineNumbers.map((n) => (
            <div
              key={n}
              className="px-2 text-[11px] font-mono leading-6 text-muted-foreground/50"
            >
              {n}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 bg-transparent text-foreground/90 font-mono text-[13px] leading-6 p-3 resize-none outline-none placeholder:text-muted-foreground/40"
          placeholder="// Kodunuzu buraya yazın veya Yapayakıl'a yazdırın..."
        />
      </div>

      {/* Status bar */}
      <div className="h-6 flex items-center justify-between px-3 bg-[#0e1322] border-t border-border/60 text-[10px] text-muted-foreground font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
            Bağlı
          </span>
          <span>Ln 1, Col 1</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Spaces: 2</span>
          <span>HTML</span>
        </div>
      </div>
    </section>
  );
}