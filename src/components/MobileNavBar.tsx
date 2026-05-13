import React from "react";

interface Props {
  onBack: () => void;
  onHome: () => void;
  onRecents: () => void;
  hasActive: boolean;
}

/**
 * Android tarzı, alta yapışık 3 tuşlu navigasyon barı.
 * - Solid koyu zemin: hangi uygulama açık olursa olsun aynı görünür.
 * - Yüksekliği CSS değişkeni olarak yayılır (--gunesos-navbar-h)
 *   böylece pencere içerikleri altına saklanmaz.
 * - PWA standalone'da telefonun sistem barı zaten safe-area-inset-bottom
 *   kadar altta — biz onun üstüne otururuz, üst üste binme olmaz.
 */
const MobileNavBar: React.FC<Props> = ({ onBack, onHome, onRecents, hasActive }) => {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[9999] flex items-center justify-around bg-black border-t border-white/10"
      style={{
        paddingTop: 8,
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
      }}
    >
      {/* Recents (kare) */}
      <button
        onClick={onRecents}
        className="w-14 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
        aria-label="Son uygulamalar"
      >
        <span className="block w-4 h-4 border-2 border-white rounded-[3px]" />
      </button>

      {/* Home (oval) */}
      <button
        onClick={onHome}
        className="w-16 h-10 flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Ev"
      >
        <span className="block w-9 h-2.5 rounded-full bg-white" />
      </button>

      {/* Back */}
      <button
        onClick={onBack}
        disabled={!hasActive}
        className={`w-14 h-10 flex items-center justify-center active:scale-90 transition-transform ${hasActive ? "" : "opacity-50"}`}
        aria-label="Geri"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H6" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
};

export default MobileNavBar;
