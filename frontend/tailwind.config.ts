import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3F1EC",
        surface: "#FFFFFF",
        ink: "#1E2A38",
        "ink-soft": "#4A5768",
        line: "#DFDAD0",
        brass: {
          DEFAULT: "#B4793A",
          dark: "#93602A",
          light: "#EADFCB",
        },
        moss: {
          DEFAULT: "#4B6B4E",
          light: "#E4EBE1",
        },
        rust: {
          DEFAULT: "#A8433A",
          light: "#F3E1DE",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-plex-sans)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(30, 42, 56, 0.06), 0 4px 14px rgba(30, 42, 56, 0.04)",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
