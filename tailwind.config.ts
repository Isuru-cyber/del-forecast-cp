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
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        navy: {
          950: "rgb(var(--color-navy-950) / <alpha-value>)",
          900: "rgb(var(--color-navy-900) / <alpha-value>)",
          850: "rgb(var(--color-navy-850) / <alpha-value>)",
          800: "rgb(var(--color-navy-800) / <alpha-value>)",
          700: "rgb(var(--color-navy-700) / <alpha-value>)",
          600: "rgb(var(--color-navy-600) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
