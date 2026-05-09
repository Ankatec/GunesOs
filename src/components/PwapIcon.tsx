import React from "react";

/**
 * Modern "squircle" icon for Pwap — uygulama marketi.
 * Vibrant pink→orange gradient, glossy top highlight, shopping bag silhouette
 * with a sparkle. Soft drop-shadow (no pulse, only Kuran has the pulse).
 */
const PwapIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span
      className={`inline-block ${className ?? ""}`}
      style={{
        width: "1.25em",
        height: "1.25em",
        filter:
          "drop-shadow(0 6px 10px rgba(244, 114, 182, 0.45)) drop-shadow(0 2px 3px rgba(0,0,0,0.35))",
      }}
      aria-label="Pwap"
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pwapBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="55%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
          <linearGradient id="pwapGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="pwapBag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
        </defs>

        {/* Squircle body */}
        <rect x="2" y="2" width="60" height="60" rx="16" ry="16" fill="url(#pwapBody)" />
        {/* Top gloss */}
        <rect x="2" y="2" width="60" height="32" rx="16" ry="16" fill="url(#pwapGloss)" />
        {/* Inner border */}
        <rect x="2.5" y="2.5" width="59" height="59" rx="15.5" ry="15.5"
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />

        {/* Shopping bag */}
        <path
          d="M22 24h20l-2 30c-.2 2-1.8 3.5-3.8 3.5H27.8c-2 0-3.6-1.5-3.8-3.5L22 24z"
          fill="url(#pwapBag)"
          stroke="rgba(180, 60, 30, 0.5)"
          strokeWidth="0.8"
        />
        {/* Bag handles */}
        <path
          d="M27 24v-3a5 5 0 0 1 10 0v3"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Lightning / spark inside bag — "app" feel */}
        <path
          d="M33 32l-5 9h4l-1 7 6-10h-4l1-6z"
          fill="#f97316"
          stroke="#c2410c"
          strokeWidth="0.4"
        />
        {/* Sparkle top-right */}
        <g transform="translate(48 14)">
          <path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#ffffff" />
        </g>
        <circle cx="14" cy="14" r="1.5" fill="rgba(255,255,255,0.85)" />
      </svg>
    </span>
  );
};

export default PwapIcon;
