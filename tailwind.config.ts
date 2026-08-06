import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ledger: {
          mint: "#A8F0DF",
          ink: "#111111",
          paper: "#ffffff",
          line: "#111111",
          soft: "#effbf7",
          yellow: "#FFD84D",
          green: "#43A047",
          amber: "#F9A825",
          brick: "#E53935",
          blue: "#3F7CFF",
          lilac: "#C7B7FF"
        }
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "SFMono-Regular", "monospace"],
        display: ["Familjen Grotesk", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
