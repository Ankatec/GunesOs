import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, User, Loader2, Code2, Wand2, BookOpen } from "lucide-react";
import { useYapayakilLibrary } from "@/hooks/useYapayakilLibrary";
import { useWebref } from "@/hooks/useWebref";
import { parseIntent, generateSite } from "@/lib/yapayakil/siteGenerator";

// Common HTML element names — detected first to short-circuit element queries
const HTML_ELEMENT_NAMES = new Set([
  "a","abbr","address","area","article","aside","audio","b","base","bdi","bdo","blockquote","body",
  "br","button","canvas","caption","cite","code","col","colgroup","data","datalist","dd","del",
  "details","dfn","dialog","div","dl","dt","em","embed","fieldset","figcaption","figure","footer",
  "form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","iframe","img",
  "input","ins","kbd","label","legend","li","link","main","map","mark","menu","meta","meter","nav",
  "noscript","object","ol","optgroup","option","output","p","picture","pre","progress","q","rp",
  "rt","ruby","s","samp","script","search","section","select","slot","small","source","span",
  "strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th",
  "thead","time","title","tr","track","u","ul","var","video","wbr",
]);

function detectElementQuery(text: string): string | null {
  const lower = text.toLowerCase();
  // <tagname> pattern
  const tagMatch = lower.match(/<\/?([a-z][a-z0-9-]*)/);
  if (tagMatch && HTML_ELEMENT_NAMES.has(tagMatch[1])) return tagMatch[1];
  // attribute / nitelik / öznitelik kelimesi geçiyorsa element ara
  const isAttrAsk = /(attribute|nitelik|öznitelik|özellik|attr)/i.test(text);
  for (const word of lower.split(/[^a-z0-9-]+/).filter(Boolean)) {
    if (HTML_ELEMENT_NAMES.has(word)) {
      if (isAttrAsk) return word;
    }
  }
  return null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  hasCode?: boolean;
}

interface YapayakilChatProps {
  onCodeSuggestion: (code: string) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "ai",
    content:
      "Merhaba! Ben Yapayakıl — bağımsız, sunucusuz bir yapay zekâyım. Bilgimi tamamen Yapayakıl Kütüphanesi'nden alırım (MDN, webref, snippet'ler). Bana ne yazmamı istediğini söyle: 'grid kalıbı', 'debounce fonksiyonu', 'kart bileşeni' gibi.",
  },
];

const QUICK_ACTIONS = [
  { icon: Wand2, label: "Modern site", prompt: "modern bir ürün sitesi yap, başlığı Lumen" },
  { icon: Wand2, label: "Kahve sitesi", prompt: "sıcak temalı bir kahve sitesi yap, ismi Mocha" },
  { icon: Code2, label: "Portfolyo", prompt: "minimal koyu temalı portfolyo sitesi yap" },
  { icon: Code2, label: "Debounce", prompt: "debounce fonksiyonu" },
];

export default function YapayakilChat({ onCodeSuggestion }: YapayakilChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { ready: libReady, error: libError, findSnippet } = useYapayakilLibrary();
  const { findElement, getElementAttributes } = useWebref();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleAIReply(userText: string) {
    setLoading(true);
    try {
      // 0) SİTE ÜRETİMİ — "modern bir kahve sitesi yap" gibi istekler
      const intent = parseIntent(userText);
      if (intent.isSiteRequest) {
        const html = generateSite(intent);
        onCodeSuggestion(html);
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: "ai",
          content: `🪄 "${intent.title}" adlı ${intent.style} ${intent.category} sitesini ürettim ve önizlemeye yansıttım.\n\n• Tema: ${intent.theme}\n• Bölümler: ${intent.sections.join(", ")}\n\nDeğiştirmek istediğin bir şey var mı? Örn: "rengi neon yap", "başlığı X yap", "fitness sitesi yap".`,
          hasCode: true,
        }]);
        return;
      }

      if (!libReady) {
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: "ai",
          content: libError
            ? `⚠️ Kütüphane yüklenemedi: ${libError}`
            : "📚 Yapayakıl Kütüphanesi henüz yükleniyor, bir saniye bekle ve tekrar dene.",
        }]);
        return;
      }
      // 1) Webref: HTML element sorusu mu?
      const elName = detectElementQuery(userText);
      if (elName) {
        const [el, attrs] = await Promise.all([
          findElement(elName),
          getElementAttributes(elName),
        ]);
        if (el || attrs.length) {
          const lines: string[] = [];
          lines.push(`📖 \`<${elName}>\` (webref / WHATWG HTML)`);
          if (el?.interface) lines.push(`• Interface: \`${el.interface}\``);
          if (el?.href) lines.push(`• Spec: ${el.href}`);
          if (attrs.length) {
            const shown = attrs.slice(0, 40).join(", ");
            lines.push(`• Attribute'lar (${attrs.length}): ${shown}${attrs.length > 40 ? " …" : ""}`);
          }
          setMessages((m) => [...m, {
            id: crypto.randomUUID(),
            role: "ai",
            content: lines.join("\n"),
          }]);
          return;
        }
      }

      const snippet = await findSnippet(userText);
      if (snippet && snippet.code) {
        onCodeSuggestion(snippet.code);
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: "ai",
          content: `📚 Kütüphaneden "${snippet.name}" kalıbını editöre aktardım.`,
          hasCode: true,
        }]);
      } else {
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: "ai",
          content: `🔍 Bu istek için kütüphanede uygun bir kalıp bulamadım. Birlikte yeni snippet ekleyelim — yapayakilkutuphanesi deposuna kalıbını tanımlayabiliriz.`,
        }]);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Bilinmeyen hata";
      setMessages((m) => [...m, {
        id: crypto.randomUUID(),
        role: "ai",
        content: `❌ Hata: ${msg}`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    handleAIReply(content);
  }

  return (
    <section className="h-full flex flex-col bg-panel rounded-xl shadow-panel-strong overflow-hidden border border-border/60 relative">
      <div className="h-11 flex items-center gap-2 px-3 border-b border-border/60 bg-gradient-to-b from-[#181d30] to-[#10152300]">
        <div className="w-7 h-7 rounded-lg gradient-yapayakil flex items-center justify-center shadow-glow-violet animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold gradient-yapayakil-text">Yapayakıl</span>
          <span className="text-[10px] text-muted-foreground -mt-0.5 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${libReady ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" : "bg-yellow-500"}`} />
            {libReady ? "Kütüphane bağlı" : libError ? "Kütüphane offline" : "Yükleniyor..."}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {libReady && (
            <span title="Yapayakıl Kütüphanesi bağlı" className="flex items-center gap-1 text-[10px] text-green-400 px-1.5 py-0.5 rounded-md bg-green-500/10 border border-green-500/30">
              <BookOpen className="w-2.5 h-2.5" /> lib
            </span>
          )}
          <span className="text-[10px] text-muted-foreground font-mono px-2 py-0.5 rounded-md bg-secondary/40 border border-border/40">
            v2.0
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-lg gradient-yapayakil flex items-center justify-center shadow-glow-violet shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 max-w-[85%] px-3 py-2 rounded-2xl bg-secondary/50 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              Yapayakıl düşünüyor...
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => handleSend(a.prompt)}
            className="text-[10px] px-2.5 h-6 rounded-full bg-secondary/50 hover:bg-primary/15 hover:border-primary/40 border border-border/50 text-muted-foreground hover:text-primary transition-all flex items-center gap-1"
          >
            <a.icon className="w-2.5 h-2.5" />
            {a.label}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-border/60 bg-[#0e1322]">
        <div className="relative rounded-xl bg-secondary/40 border border-border/50 focus-within:border-primary/50 focus-within:shadow-glow-violet transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Yapayakıl'a bir kalıp veya bileşen iste..."
            rows={2}
            className="w-full bg-transparent resize-none outline-none p-2.5 pr-11 text-xs text-foreground placeholder:text-muted-foreground/60"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2 bottom-2 w-8 h-8 rounded-lg gradient-yapayakil text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-violet"
            title="Gönder"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground/70 mt-1.5 text-center">
          Enter ile gönder • Shift+Enter ile yeni satır
        </p>
      </div>
    </section>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
          isUser ? "bg-secondary border border-border/60" : "gradient-yapayakil shadow-glow-violet"
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5 text-foreground/80" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
      </div>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
          isUser
            ? "bg-primary/15 border border-primary/25 text-foreground rounded-tr-sm"
            : "bg-secondary/50 border border-border/50 text-foreground/90 rounded-tl-sm"
        }`}
      >
        <span className="whitespace-pre-wrap">{msg.content}</span>
        {msg.hasCode && (
          <div className="mt-2 text-[10px] text-primary flex items-center gap-1">
            <Code2 className="w-3 h-3" />
            Kod editöre aktarıldı
          </div>
        )}
      </div>
    </div>
  );
}
