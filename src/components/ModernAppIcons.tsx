import React from "react";

const Shell: React.FC<{
  className?: string;
  label: string;
  children: React.ReactNode;
  glow?: string;
}> = ({ className, label, children, glow = "rgba(15, 23, 42, 0.35)" }) => (
  <span
    className={`inline-block ${className ?? ""}`}
    style={{
      width: "1.1em",
      height: "1.1em",
      filter: `drop-shadow(0 6px 10px ${glow}) drop-shadow(0 2px 3px rgba(0,0,0,0.28))`,
    }}
    aria-label={label}
  >
    {children}
  </span>
);

export const GunterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Shell className={className} label="Günter" glow="rgba(245, 158, 11, 0.42)">
    <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gunterSun" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fff7ad" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </radialGradient>
        <linearGradient id="gunterCut" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#gunterSun)" />
      <circle cx="24" cy="20" r="9" fill="rgba(255,255,255,.4)" />
      <path
        d="M20 17 38 32 20 47"
        fill="none"
        stroke="url(#gunterCut)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36 15h8c4.4 0 8 3.6 8 8v18c0 4.4-3.6 8-8 8h-8"
        fill="none"
        stroke="rgba(15,23,42,.82)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  </Shell>
);

export const MusicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Shell className={className} label="Müzik" glow="rgba(236, 72, 153, 0.4)">
    <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="musicBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="52%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="17" fill="url(#musicBg)" />
      <path
        d="M26 18v25.5a7.2 7.2 0 1 1-4.4-6.6V23l23-4v20.5a7.2 7.2 0 1 1-4.4-6.6V15.8L26 18z"
        fill="white"
        opacity=".95"
      />
      <path
        d="M8 10c8 3 21 2 31-2"
        stroke="rgba(255,255,255,.33)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  </Shell>
);

export const ContactsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Shell className={className} label="Kişiler" glow="rgba(59, 130, 246, 0.36)">
    <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="contactsBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="15" fill="url(#contactsBg)" />
      <path
        d="M18 18h28c2.2 0 4 1.8 4 4v25c0 2.2-1.8 4-4 4H18c-2.2 0-4-1.8-4-4V22c0-2.2 1.8-4 4-4z"
        fill="rgba(255,255,255,.18)"
        stroke="rgba(255,255,255,.35)"
      />
      <circle cx="32" cy="30" r="7" fill="white" />
      <path d="M20 47c2.1-6.5 6.4-10 12-10s9.9 3.5 12 10" fill="white" />
      <path
        d="M14 24h-4M14 33h-4M14 42h-4"
        stroke="rgba(255,255,255,.75)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  </Shell>
);

export const SettingsGearIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Shell className={className} label="Ayarlar" glow="rgba(71, 85, 105, 0.4)">
    <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="settingsBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="52%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="settingsGear" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="17" fill="url(#settingsBg)" />
      <path
        d="M35.8 12.5 38 18c1.1.4 2.2.8 3.2 1.3l5.3-2.4 4.6 4.6-2.4 5.3c.5 1 .9 2.1 1.3 3.2l5.5 2.2v6.6L50 41c-.4 1.1-.8 2.2-1.3 3.2l2.4 5.3-4.6 4.6-5.3-2.4c-1 .5-2.1.9-3.2 1.3l-2.2 5.5h-6.6L27 53c-1.1-.4-2.2-.8-3.2-1.3l-5.3 2.4-4.6-4.6 2.4-5.3c-.5-1-.9-2.1-1.3-3.2l-5.5-2.2v-6.6L15 30c.4-1.1.8-2.2 1.3-3.2l-2.4-5.3 4.6-4.6 5.3 2.4c1-.5 2.1-.9 3.2-1.3l2.2-5.5h6.6z"
        fill="url(#settingsGear)"
      />
      <circle cx="32" cy="35.5" r="10" fill="rgba(255,255,255,.95)" />
      <circle cx="32" cy="35.5" r="4.8" fill="#334155" />
    </svg>
  </Shell>
);
