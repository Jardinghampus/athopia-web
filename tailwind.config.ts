import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-bebas-neue)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        primary: "#1D9E75",
        "primary-dark": "#158A63",
        "primary-light": "#25C48F",
        background: "#0A0A0A",
        surface: "#111111",
        "surface-2": "#1A1A1A",
        "surface-3": "#222222",
        border: "#2A2A2A",
        "border-light": "#333333",
        "text-primary": "#F5F5F5",
        "text-secondary": "#A0A0A0",
        "text-tertiary": "#666666",
        "accent-red": "#E85555",
        "accent-blue": "#5599E8",
        "accent-yellow": "#E8B955",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-green": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 rgba(29,158,117,0)" },
          "50%": { opacity: "0.55", boxShadow: "0 0 16px rgba(29,158,117,0.35)" },
        },
      },
      animation: {
        "fade-in": "fade-in 220ms ease-out both",
        "slide-up": "slide-up 260ms ease-out both",
        "pulse-green": "pulse-green 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

