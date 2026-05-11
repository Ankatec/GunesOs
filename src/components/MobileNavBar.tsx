import React from "react";

interface Props {
  onBack: () => void;
  onHome: () => void;
  onRecents: () => void;
  hasActive: boolean;
}

/**
 * Android tarzı, alta yapışık 3 tuşlu şeffaf navigasyon barı.
 * Sadece mobil/tablet + nostalji KAPALI iken render edilir.
 */
const MobileNavBar: React.FC<Props> = ({ onBack, onHome, onRecents, hasActive }) => {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[8998] flex items-center justify-around py-2 px-4 backdrop-blur-xl bg-black/25 border-t border-white/10"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
    >
      {/* Recents (kare) */}
      <button
        onClick={onRecents}
        className="w-12 h-12 flex items-center justify-center text-white/90 active:scale-90 transition-transform"
        aria-label="Son uygulamalar"
      >
        <span className="block w-5 h-5 border-2 border-white/90 rounded-[3px]" />
      </button>

      {/* Home (oval) */}
      <button
        onClick={onHome}
        className="w-16 h-12 flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Ev"
      >
        <span className="block w-10 h-3 rounded-full bg-white/90 shadow" />
      </button>

      {/* Back (kuyruklu ok) */}
      <button
        onClick={onBack}
        disabled={!hasActive}
        className={`w-12 h-12 flex items-center justify-center text-white/90 active:scale-90 transition-transform ${hasActive ? "" : "opacity-40"}`}
        aria-label="Geri"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H6" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
};

export default MobileNavBar;
