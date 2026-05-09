import React from "react";

/**
 * Modern "squircle" app icon for Mesajlar (Messages).
 * iOS-like rounded square, green gradient body, white chat bubble with tail,
 * subtle gloss highlight and a small unread badge.
 */
const MesajlarIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span
      className={`inline-block ${className ?? ""}`}
      style={{
        width: "1.1em",
        height: "1.1em",
        filter:
          "drop-shadow(0 6px 10px rgba(34, 197, 94, 0.45)) drop-shadow(0 2px 3px rgba(0,0,0,0.35))",
      }}
      aria-label="Mesajlar"
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mesajBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="55%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="mesajGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Squircle body */}
        <rect x="2" y="2" width="60" height="60" rx="16" ry="16" fill="url(#mesajBody)" />
        {/* Gloss */}
        <rect x="2" y="2" width="60" height="34" rx="16" ry="16" fill="url(#mesajGloss)" />
        {/* Inner border */}
        <rect
          x="2.5" y="2.5" width="59" height="59" rx="15.5" ry="15.5"
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"
        />

        {/* Chat bubble with tail */}
        <path
          d="M14 22c0-3.3 2.7-6 6-6h24c3.3 0 6 2.7 6 6v14c0 3.3-2.7 6-6 6H28l-8 7v-7c-3.3 0-6-2.7-6-6V22z"
          fill="rgba(255,255,255,0.96)"
        />
        {/* Three dots */}
        <circle cx="24" cy="29" r="2.4" fill="#16a34a" />
        <circle cx="32" cy="29" r="2.4" fill="#16a34a" />
        <circle cx="40" cy="29" r="2.4" fill="#16a34a" />

        {/* Unread badge */}
        <circle cx="50" cy="14" r="7" fill="#ef4444" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
        <text x="50" y="17.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="system-ui, -apple-system, sans-serif">1</text>
      </svg>
    </span>
  );
};

export default MesajlarIcon;
