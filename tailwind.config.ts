import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111f",
        panel: "#0f1c2e",
        panelSoft: "#16253c",
        borderSoft: "rgba(148, 163, 184, 0.16)",
        accent: "#7dd3fc",
        aurora: "#38bdf8",
        signal: "#f59e0b",
        success: "#34d399",
      },
      boxShadow: {
        glow: "0 18px 60px rgba(8, 15, 28, 0.28)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(125, 211, 252, 0.18), transparent 32%), radial-gradient(circle at 85% 12%, rgba(52, 211, 153, 0.14), transparent 26%), linear-gradient(135deg, rgba(15, 28, 46, 0.94), rgba(7, 17, 31, 0.98))",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
