import React, { useState, useEffect, useRef } from "react";
import SohbetoIcon from "@/components/SohbetoIcon";

/**
 * Sohbeto: BASE_URL takes care of "/gunesos/" prefix on GitHub Pages and "/" in dev.
 *
 * Adım 7 — Açılış akışı:
 *  1) Önce "So" ikonlu splash görünür (iframe DOM'u biraz boş kalsa bile arayüz
 *     anlık parlamaz, kullanıcı önce ikonu görür).
 *  2) iframe load + ek 350ms ısınma sonrası splash fade-out.
 *  3) iframe içindeki adapter zaten kayıtlı kullanıcıyı sohbetlere yönlendirir.
 */
const Sohbeto: React.FC = () => {
  const src = `${import.meta.env.BASE_URL}apps/sohbetoOO.html`;
  const [splashVisible, setSplashVisible] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeReady) return;
    // Adapter'ın splash kapanışı + ilk ekran kararı 600ms civarı; ona biraz pay ver.
    const t = window.setTimeout(() => setSplashVisible(false), 350);
    return () => window.clearTimeout(t);
  }, [iframeReady]);

  // Güvence: 4 saniye içinde load olmazsa yine de splash'ı kaldır.
  useEffect(() => {
    const t = window.setTimeout(() => setSplashVisible(false), 4000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0e1621]">
      <iframe
        ref={iframeRef}
        title="Sohbeto"
        src={src}
        onLoad={() => setIframeReady(true)}
        className="w-full h-full border-0 bg-[#0e1621]"
        allow="camera; microphone; clipboard-write; clipboard-read; autoplay"
        style={{
          opacity: splashVisible ? 0 : 1,
          transition: "opacity 220ms ease-out",
        }}
      />
      {splashVisible && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, #1a2638 0%, #0e1621 70%)",
            transition: "opacity 220ms ease-out",
          }}
        >
          <div
            style={{
              fontSize: "92px",
              animation: "sohbeto-splash-pop 600ms ease-out",
            }}
          >
            <SohbetoIcon />
          </div>
          <style>{`
            @keyframes sohbeto-splash-pop {
              0%   { transform: scale(0.6); opacity: 0; }
              60%  { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Sohbeto;
