import React, { useEffect, useState } from "react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "gunesos_pwa_dismissed_at";
const DISMISS_HOURS = 72;

const InstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-ignore iOS Safari
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const dismissedRecently = dismissedAt && Date.now() - dismissedAt < DISMISS_HOURS * 3600_000;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      if (!dismissedRecently) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari has no beforeinstallprompt — show manual hint
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
    if (isIOS && !standalone && !dismissedRecently) {
      setTimeout(() => setIosHint(true), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setIosHint(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
    setVisible(false);
  };

  if (installed) return null;
  if (!visible && !iosHint) return null;

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-sm">
      <div className="bg-white border-2 border-[#000080] rounded-xl shadow-2xl p-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
        <div className="text-3xl">🌞</div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-[#000080]">GüneşOS'u Yükle</p>
          <p className="text-[10px] text-gray-600">
            {iosHint
              ? "Safari'de paylaş → Ana Ekrana Ekle"
              : "Cihazına uygulama olarak ekle, çevrimdışı aç."}
          </p>
        </div>
        {visible && (
          <button
            onClick={install}
            className="text-[11px] bg-[#000080] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#0000a0]"
          >
            Yükle
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Kapat"
          className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
