import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bank: {
          bg: "#061A2D",
          bgAlt: "#0B2239",
          panel: "#0F2A44",
          panelLight: "#F7F8FA",
          text: "#F8FAFC",
          muted: "#CBD5E1",
          graphite: "#2F3A45",
          steel: "#4E6E8E",
          blue: "#1E5A8A",
          cyan: "#38A3C7",
          gold: "#C8A45D",
          amber: "#D9902F",
          green: "#2E7D5B",
          red: "#B94A48",
          border: "#1F3A55"
        }
      },
      boxShadow: {
        banker: "0 18px 50px rgba(0, 0, 0, 0.28)",
        card: "0 8px 24px rgba(0, 0, 0, 0.18)"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"]
      },
      backgroundImage: {
        "bank-grid":
          "linear-gradient(rgba(200,164,93,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(200,164,93,0.05) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
