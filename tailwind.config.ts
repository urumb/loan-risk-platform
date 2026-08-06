import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ledger: {
          navy: "#0b1f33",
          ink: "#142033",
          paper: "#f7f4ed",
          line: "#d8d0c1",
          green: "#2f7d52",
          amber: "#b87820",
          brick: "#a13d32"
        }
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "SFMono-Regular", "monospace"],
        display: ["Fraunces", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
