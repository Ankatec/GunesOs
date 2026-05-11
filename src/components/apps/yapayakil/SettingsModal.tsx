import { X, Sparkles, BookOpen } from "lucide-react";

export type AIMode = "library";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  // Kept for backward compatibility with existing callers; no longer used.
  apiKey?: string;
  onApiKeyChange?: (key: string) => void;
  aiMode?: AIMode;
  onAIModeChange?: (mode: AIMode) => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-[460px] max-h-[80vh] bg-panel rounded-2xl border border-border/60 shadow-panel-strong overflow-hidden"
        style={{
          boxShadow:
            "0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(124,92,255,0.15), 0 0 60px -15px rgba(124,92,255,0.3)",
        }}
      >
        <div className="h-12 flex items-center justify-between px-4 border-b border-border/60 bg-gradient-to-b from-[#181d30] to-transparent">
          <span className="text-sm font-semibold text-foreground">Ayarlar</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          <div className="p-4 rounded-xl border border-primary/40 bg-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Yapayakıl — Bağımsız Yapay Zekâ</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Yapayakıl artık hiçbir dış API'ye bağlı değil. Tüm bilgisini{" "}
              <strong className="text-foreground/90">Yapayakıl Kütüphanesi</strong>'nden (MDN, webref, snippets) alır
              ve tarayıcıda çalışır. Sunucusuz, anahtarsız, tamamen bizim.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-secondary/20 border border-border/40 text-[11px] text-foreground/80 leading-relaxed flex gap-2">
            <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground/90 mb-1">Bilgi Kaynağı</div>
              <code className="text-[10px] text-primary/90 break-all">
                cdn.jsdelivr.net/gh/Ankatec/yapayakilkutuphanesi
              </code>
              <p className="mt-1 text-muted-foreground">
                Kütüphane 24 saat tarayıcıda önbelleklenir. Geliştirdikçe Yapayakıl da akıllanır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
