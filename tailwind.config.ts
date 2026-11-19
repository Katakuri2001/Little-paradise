import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#090B12",
        "midnight-2": "#111522",
        glass: "rgba(255,255,255,0.065)",
        accent: "#A78BFA",
        accent2: "#8BC5FF",
        highlight: "#C4B5FD",
        ink: "#F8FAFC",
        muted: "#9299AB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        glass: "28px",
      },
      boxShadow: {
        glass: "inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.18)",
        glow: "0 0 40px rgba(167,139,250,0.25)",
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
      },
      // Custom easing curves per emil-design-eng skill
      // Never use ease-in for UI animations - use ease-out for responsiveness
      transitionTimingFunction: {
        // Strong ease-out for UI interactions - starts fast, feels responsive
        "ease-out": "cubic-bezier(0.23, 1, 0.32, 1)",
        // Strong ease-in-out for on-screen movement
        "ease-in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        // iOS-like drawer curve
        "ease-drawer": "cubic-bezier(0.32, 0.72, 0, 1)",
        // Spring-like ease for subtle animations
        "ease-spring": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
        fast: "150ms",
        slow: "250ms",
        slower: "400ms",
      },
    },
  },
  plugins: [],
};
export default config;