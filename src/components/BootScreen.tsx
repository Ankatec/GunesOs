import React, { useState, useEffect } from "react";

interface BootScreenProps {
  onComplete: () => void;
}

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"logo" | "loading" | "done">("logo");

  useEffect(() => {
    const logoTimer = setTimeout(() => setPhase("loading"), 1200);
    return () => clearTimeout(logoTimer);
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase("done");
          setTimeout(onComplete, 400);
          return 100;
        }
        return p + Math.random() * 8 + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [phase, onComplete]);

  return (
    <div className="fixed inset-0 bg-[#000080] flex flex-col items-center justify-center z-[9999] select-none">
      <div
        className={`transition-all duration-700 ${
          phase === "logo" ? "scale-110 opacity-100" : "scale-100 opacity-100"
        }`}
      >
        <img
          src="/assets/gunesOS-logo-sun.png"
          alt="GüneşOS"
          className="w-48 h-48 object-contain mb-6 drop-shadow-[0_0_30px_rgba(255,200,0,0.5)]"
        />
      </div>

      <h1 className="text-white text-3xl font-bold mb-2 tracking-wider">GüneşOS</h1>
      <p className="text-blue-200 text-sm mb-8">Sürüm 1.0 • Hoş Geldiniz</p>

      {phase !== "logo" && (
        <div className="w-64 flex flex-col items-center gap-3">
          <div className="w-full h-5 bg-[#000040] border-2 border-t-[#404080] border-l-[#404080] border-b-[#8080c0] border-r-[#8080c0] p-[2px]">
            <div
              className="h-full bg-[#00c0c0] transition-all duration-100"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-blue-200 text-xs animate-pulse">Sistem yükleniyor...</p>
        </div>
      )}

      <div className="absolute bottom-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#00c0c0] animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default BootScreen;