import React from "react";

interface Props {
  onBack: () => void;
  onHome: () => void;
  onRecents: () => void;
  hasActive: boolean;
}

/**
 * Android tarzı, alta yapışık 3 tuşlu (arka plansız) navigasyon barı.
 * Sadece mobil/tablet + nostalji KAPALI iken render edilir.
 */
const MobileNavBar: React.FC<Props> = ({ onBack, onHome, onRecents, hasActive }) => {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[9999] flex items-center justify-around py-2 px-4 pointer-events-none"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
    >
      {/* Recents (kare) */}
      <button
        onClick={onRecents}
        className="pointer-events-auto w-12 h-12 flex items-center justify-center text-white active:scale-90 transition-transform"
        aria-label="Son uygulamalar"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
      >
        <span className="block w-5 h-5 border-2 border-white rounded-[3px]" />
      </button>

      {/* Home (oval) */}
      <button
        onClick={onHome}
        className="pointer-events-auto w-16 h-12 flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Ev"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
      >
        <span className="block w-10 h-3 rounded-full bg-white" />
      </button>

      {/* Back (kuyruklu ok) */}
      <button
        onClick={onBack}
        disabled={!hasActive}
        className={`pointer-events-auto w-12 h-12 flex items-center justify-center active:scale-90 transition-transform ${hasActive ? "" : "opacity-80"}`}
        aria-label="Geri"
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.7))" }}
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H6" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
};

export default MobileNavBar;
