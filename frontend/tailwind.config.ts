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
        water: {
          50: "#effaff",
          100: "#dff5ff",
          200: "#b8ebff",
          300: "#7edcff",
          400: "#3cc8f0",
          500: "#13addb",
          600: "#078dbb",
          700: "#087197",
          800: "#0b5d7c",
          900: "#104e67",
        },
      },

      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },

      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },

      keyframes: {
        "pulse-soft": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.65",
          },
        },
      },
    },
  },

  plugins: [],
};

export default config;