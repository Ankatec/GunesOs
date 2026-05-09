import React from "react";

/**
 * Modern "squircle" icon for Yapay Akıl.
 * Cosmic indigo→cyan gradient, glossy top, neural-net brain silhouette
 * with glowing nodes. Soft double drop-shadow.
 */
const YapayAkilIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span
      className={`inline-block ${className ?? ""}`}
      style={{
        width: "1.25em",
        height: "1.25em",
        filter:
          "drop-shadow(0 6px 10px rgba(99, 102, 241, 0.5)) drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
      }}
      aria-label="Yapay Akıl"
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="yaBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="50%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="yaGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <radialGradient id="yaNode" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#67e8f9" />
          </radialGradient>
        </defs>

        {/* Squircle body */}
        <rect x="2" y="2" width="60" height="60" rx="16" ry="16" fill="url(#yaBody)" />
        <rect x="2" y="2" width="60" height="32" rx="16" ry="16" fill="url(#yaGloss)" />
        <rect x="2.5" y="2.5" width="59" height="59" rx="15.5" ry="15.5"
          fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

        {/* Brain outline (left + right hemispheres) */}
        <path
          d="M22 22c-4 0-7 3-7 7 0 2 1 4 2.5 5-1.5 1-2.5 3-2.5 5 0 4 3 7 7 7h2v-24h-2z"
          fill="rgba(255,255,255,0.12)"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.2"
        />
        <path
          d="M42 22c4 0 7 3 7 7 0 2-1 4-2.5 5 1.5 1 2.5 3 2.5 5 0 4-3 7-7 7h-2v-24h2z"
          fill="rgba(255,255,255,0.12)"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.2"
        />
        {/* Center divider */}
        <line x1="32" y1="22" x2="32" y2="46" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />

        {/* Neural nodes + connections */}
        <line x1="20" y1="28" x2="28" y2="34" stroke="#a5f3fc" strokeWidth="0.8" opacity="0.7" />
        <line x1="20" y1="40" x2="28" y2="34" stroke="#a5f3fc" strokeWidth="0.8" opacity="0.7" />
        <line x1="44" y1="28" x2="36" y2="34" stroke="#a5f3fc" strokeWidth="0.8" opacity="0.7" />
        <line x1="44" y1="40" x2="36" y2="34" stroke="#a5f3fc" strokeWidth="0.8" opacity="0.7" />
        <line x1="28" y1="34" x2="36" y2="34" stroke="#a5f3fc" strokeWidth="0.8" opacity="0.7" />

        <circle cx="20" cy="28" r="1.8" fill="url(#yaNode)" />
        <circle cx="20" cy="40" r="1.8" fill="url(#yaNode)" />
        <circle cx="44" cy="28" r="1.8" fill="url(#yaNode)" />
        <circle cx="44" cy="40" r="1.8" fill="url(#yaNode)" />
        <circle cx="28" cy="34" r="2.2" fill="url(#yaNode)" />
        <circle cx="36" cy="34" r="2.2" fill="url(#yaNode)" />

        {/* AI spark (top-right) */}
        <g transform="translate(48 14)">
          <path d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z" fill="#fde68a" />
        </g>
      </svg>
    </span>
  );
};

export default YapayAkilIcon;
