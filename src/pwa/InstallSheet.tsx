import React, { useEffect, useState } from "react";
import { isStandalone } from "./serviceWorkerRegistration";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Download, Share2, Plus } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "gunesos_install_dismissed_at";
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 30_000;

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  // @ts-ignore
  !window.MSStream;

export const InstallSheet: React.FC = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const recently = dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400_000;
    if (recently) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    let iosTimer: number | undefined;
    if (isIOS()) {
      iosTimer = window.setTimeout(() => {
        setIosMode(true);
        setOpen(true);
      }, SHOW_DELAY_MS);
    }

    const onInstalled = () => {
      setOpen(false);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "dismissed") dismiss();
    setDeferred(null);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && dismiss()}>
      <SheetContent side="bottom" className="bg-gradient-to-b from-[#1a2f5a] to-[#0b1d3a] text-white border-amber-500/30 rounded-t-3xl">
        <SheetHeader className="text-center items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-orange-700 shadow-[0_0_60px_rgba(245,158,11,0.4)] mb-2 flex items-center justify-center">
            <span className="text-4xl">☀️</span>
          </div>
          <SheetTitle className="text-white text-xl">GüneşOS'u telefonuna ekle</SheetTitle>
          <SheetDescription className="text-amber-100/80">
            Çevrimdışı çalışsın, daha hızlı açılsın, tam ekran görünsün.
          </SheetDescription>
        </SheetHeader>

        {iosMode ? (
          <div className="mt-6 space-y-3 text-sm text-amber-50/90">
            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl">
              <Share2 className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
              <div>1. Safari'nin alt çubuğundaki <b>Paylaş</b> butonuna bas</div>
            </div>
            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl">
              <Plus className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
              <div>2. Açılan menüde <b>"Ana Ekrana Ekle"</b>yi seç</div>
            </div>
            <Button onClick={dismiss} variant="ghost" className="w-full text-amber-200 hover:text-white hover:bg-white/10">
              Anladım
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={install}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0b1d3a] font-semibold h-12 text-base"
            >
              <Download className="w-4 h-4 mr-2" /> Telefonuma yükle
            </Button>
            <Button onClick={dismiss} variant="ghost" className="text-amber-200 hover:text-white hover:bg-white/10">
              Şimdi değil
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
