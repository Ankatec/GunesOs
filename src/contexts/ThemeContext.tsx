import React, { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export interface ThemeColors {
  name: string;
  label: string;
  emoji: string;
  primary: string;
  secondary: string;
  accent: string;
  titleBar: string;
  titleBarEnd: string;
  bg: string;
  text: string;
  wallpaper: string;
}

export const themes: ThemeColors[] = [
  {
    name: "teal",
    label: "Deniz",
    emoji: "🌊",
    primary: "#008080",
    secondary: "#00b3b3",
    accent: "#005555",
    titleBar: "#000080",
    titleBarEnd: "#1084d0",
    bg: "#c0c0c0",
    text: "#000000",
    wallpaper: "linear-gradient(135deg, #008080 0%, #00b3b3 50%, #005555 100%)",
  },
  {
    name: "ocean",
    label: "Okyanus",
    emoji: "🐋",
    primary: "#006994",
    secondary: "#0099cc",
    accent: "#004466",
    titleBar: "#003366",
    titleBarEnd: "#0099cc",
    bg: "#c0c0c0",
    text: "#000000",
    wallpaper: "linear-gradient(135deg, #006994 0%, #0099cc 50%, #003366 100%)",
  },
  {
    name: "purple",
    label: "Mor",
    emoji: "💜",
    primary: "#6b21a8",
    secondary: "#9333ea",
    accent: "#581c87",
    titleBar: "#4c1d95",
    titleBarEnd: "#8b5cf6",
    bg: "#c0c0c0",
    text: "#000000",
    wallpaper: "linear-gradient(135deg, #6b21a8 0%, #9333ea 50%, #581c87 100%)",
  },
  {
    name: "pink",
    label: "Pembe",
    emoji: "🌸",
    primary: "#be185d",
    secondary: "#ec4899",
    accent: "#9d174d",
    titleBar: "#831843",
    titleBarEnd: "#f472b6",
    bg: "#c0c0c0",
    text: "#000000",
    wallpaper: "linear-gradient(135deg, #be185d 0%, #ec4899 50%, #9d174d 100%)",
  },
  {
    name: "sunset",
    label: "Gün Batımı",
    emoji: "🌅",
    primary: "#c2410c",
    secondary: "#f97316",
    accent: "#9a3412",
    titleBar: "#7c2d12",
    titleBarEnd: "#fb923c",
    bg: "#c0c0c0",
    text: "#000000",
    wallpaper: "linear-gradient(135deg, #c2410c 0%, #f97316 40%, #fbbf24 100%)",
  },
  {
    name: "forest",
    label: "Orman",
    emoji: "🌲",
    primary: "#166534",
    secondary: "#22c55e",
    accent: "#14532d",
    titleBar: "#14532d",
    titleBarEnd: "#4ade80",
    bg: "#c0c0c0",
    text: "#000000",
    wallpaper: "linear-gradient(135deg, #166534 0%, #22c55e 50%, #14532d 100%)",
  },
  {
    name: "dark",
    label: "Karanlık",
    emoji: "🌑",
    primary: "#1e1e1e",
    secondary: "#3a3a3a",
    accent: "#000000",
    titleBar: "#1a1a2e",
    titleBarEnd: "#16213e",
    bg: "#2d2d2d",
    text: "#e0e0e0",
    wallpaper: "linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 50%, #0a0a0a 100%)",
  },
  {
    name: "rosegold",
    label: "Gül Altını",
    emoji: "🌹",
    primary: "#9d4553",
    secondary: "#d4838f",
    accent: "#7a3340",
    titleBar: "#7a3340",
    titleBarEnd: "#d4838f",
    bg: "#c0c0c0",
    text: "#000000",
    wallpaper: "linear-gradient(135deg, #9d4553 0%, #d4838f 50%, #7a3340 100%)",
  },
  {
    name: "midnight",
    label: "Gece Yarısı",
    emoji: "🌃",
    primary: "#1e1b4b",
    secondary: "#312e81",
    accent: "#0f0d2e",
    titleBar: "#0f0d2e",
    titleBarEnd: "#4338ca",
    bg: "#c0c0c0",
    text: "#000000",
    wallpaper: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f0d2e 100%)",
  },
  {
    name: "lavender",
    label: "Lavanta",
    emoji: "💜",
    primary: "#7c3aed",
    secondary: "#a78bfa",
    accent: "#5b21b6",
    titleBar: "#5b21b6",
    titleBarEnd: "#a78bfa",
    bg: "#c0c0c0",
    text: "#000000",
    wallpaper: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #5b21b6 100%)",
  },
];

export interface AppSettings {
  themeName: string;
  customWallpaper: string | null;
  nostalgiaMode: boolean;
  autoAlignIcons: boolean;
  singleClickOpen: boolean;
}

const defaultSettings: AppSettings = {
  themeName: "teal",
  customWallpaper: null,
  nostalgiaMode: true,
  autoAlignIcons: true,
  singleClickOpen: false,
};

interface ThemeContextType {
  theme: ThemeColors;
  settings: AppSettings;
  setSettings: (value: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<AppSettings>("gunesOS-settings", defaultSettings);

  const theme = themes.find((t) => t.name === settings.themeName) || themes[0];

  return (
    <ThemeContext.Provider value={{ theme, settings, setSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}