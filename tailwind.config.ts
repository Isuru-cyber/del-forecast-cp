import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070D1B",
          900: "#0B132B",
          850: "#0F1A3A",
          800: "#132238",
          700: "#1B304F",
          600: "#243E66",
        },
      },
    },
  },
  plugins: [],
};
export default config;
