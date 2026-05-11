import React from "react";

/**
 * Ega Tarayıcı — modern lacivert squircle ikon.
 * - Lacivert kutu, sağ üstte parlayan kalkan rozeti
 * - Ortada beyaz "E" + globe çizgileri (tarayıcı + Ega imzası)
 */
const EgaIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span
      className={`inline-block ${className ?? ""}`}
      style={{
        width: "1.25em",
        height: "1.25em",
        filter:
          "drop-shadow(0 6px 10px rgba(30, 58, 138, 0.55)) drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
      }}
      aria-label="Ega"
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="egaBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="55%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#0c1e54" />
          </linearGradient>
          <linearGradient id="egaGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="egaShield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Squircle gövde */}
        <rect x="2" y="2" width="60" height="60" rx="16" ry="16" fill="url(#egaBody)" />
        <rect x="2" y="2" width="60" height="32" rx="16" ry="16" fill="url(#egaGloss)" />
        <rect x="2.5" y="2.5" width="59" height="59" rx="15.5" ry="15.5"
          fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

        {/* Globe çizgileri */}
        <circle cx="32" cy="34" r="14" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
        <ellipse cx="32" cy="34" rx="6" ry="14" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
        <line x1="18" y1="34" x2="46" y2="34" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />

        {/* Beyaz "E" harfi */}
        <g fill="#ffffff">
          <rect x="24" y="24" width="4" height="20" rx="1" />
          <rect x="24" y="24" width="14" height="4" rx="1" />
          <rect x="24" y="32" width="11" height="4" rx="1" />
          <rect x="24" y="40" width="14" height="4" rx="1" />
        </g>

        {/* Sağ üst kalkan rozeti */}
        <g transform="translate(46 10)">
          <path d="M0 0 L9 0 L9 6 C9 10 4.5 12 4.5 12 C4.5 12 0 10 0 6 Z"
            fill="url(#egaShield)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />
          <path d="M3 5.5 L4.2 7 L6.5 4" stroke="#1e3a8a" strokeWidth="1.1" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </span>
  );
};

export default EgaIcon;
