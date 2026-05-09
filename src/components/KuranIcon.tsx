import React from "react";

/**
 * Premium "squircle" icon for Kuran app.
 * - Rounded-square (iOS-like) shape with EXCLUSIVE pulsing green halo (only Kuran).
 * - Deep emerald → jade → mint gradient body with golden mihrab silhouette.
 * - Open Quran with crescent + star and subtle Arabic-style flourish.
 */
const KuranIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span
      className={`inline-block kuran-icon-pulse ${className ?? ""}`}
      style={{
        width: "1.25em",
        height: "1.25em",
      }}
      aria-label="Vakit & Kuran"
    >
      <style>{`
        @keyframes kuranPulse {
          0%, 100% {
            filter:
              drop-shadow(0 0 8px rgba(34, 197, 94, 0.55))
              drop-shadow(0 0 18px rgba(16, 185, 129, 0.45))
              drop-shadow(0 4px 6px rgba(0,0,0,0.45));
          }
          50% {
            filter:
              drop-shadow(0 0 16px rgba(74, 222, 128, 0.95))
              drop-shadow(0 0 30px rgba(34, 197, 94, 0.75))
              drop-shadow(0 4px 8px rgba(0,0,0,0.5));
          }
        }
        .kuran-icon-pulse svg { animation: kuranPulse 2.2s ease-in-out infinite; }
      `}</style>
      <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="kuranBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>
          <linearGradient id="kuranGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="kuranBook" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <radialGradient id="kuranStar" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#fde68a" />
          </radialGradient>
        </defs>

        {/* Squircle body */}
        <rect x="2" y="2" width="60" height="60" rx="16" ry="16" fill="url(#kuranBody)" />
        {/* Top gloss highlight */}
        <rect x="2" y="2" width="60" height="32" rx="16" ry="16" fill="url(#kuranGloss)" />
        {/* Inner gold border */}
        <rect
          x="2.5"
          y="2.5"
          width="59"
          height="59"
          rx="15.5"
          ry="15.5"
          fill="none"
          stroke="rgba(253, 230, 138, 0.55)"
          strokeWidth="1"
        />

        {/* Crescent + star (top) */}
        <path
          d="M44 12 a6 6 0 1 1 -5.2 9 a4.5 4.5 0 1 0 5.2 -9z"
          fill="#fde68a"
          opacity="0.95"
        />
        <circle cx="51" cy="14" r="1.6" fill="url(#kuranStar)" />

        {/* Open book (Mushaf) */}
        <path
          d="M12 36c4-2 8-2 12 0v16c-4-2-8-2-12 0V36z"
          fill="url(#kuranBook)"
          stroke="#92400e"
          strokeWidth="0.8"
        />
        <path
          d="M40 36c4-2 8-2 12 0v16c-4-2-8-2-12 0V36z"
          fill="url(#kuranBook)"
          stroke="#92400e"
          strokeWidth="0.8"
        />
        {/* Center spine + pages */}
        <path
          d="M24 36c2.5-1.2 5.5-1.2 8 0v16c-2.5-1.2-5.5-1.2-8 0V36z"
          fill="#fffbeb"
          stroke="#92400e"
          strokeWidth="0.6"
        />
        <path
          d="M32 36v16"
          stroke="#92400e"
          strokeWidth="0.6"
        />
        {/* Arabic-style decorative lines on pages */}
        <path d="M16 41h6 M16 44h6 M16 47h5" stroke="#78350f" strokeWidth="0.5" opacity="0.7" fill="none" />
        <path d="M44 41h6 M44 44h6 M44 47h5" stroke="#78350f" strokeWidth="0.5" opacity="0.7" fill="none" />
        {/* Tiny gold ornament */}
        <circle cx="28" cy="44" r="1.2" fill="#d97706" />
        <circle cx="36" cy="44" r="1.2" fill="#d97706" />
      </svg>
    </span>
  );
};

export default KuranIcon;
