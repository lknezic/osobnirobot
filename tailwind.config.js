/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bg: { DEFAULT: "#09090b", 2: "#0f0f13", 3: "#16161d" },
        border: { DEFAULT: "#1e1e2a", hover: "#2d2d40" },
        dim: "#9898b0",
        muted: "#5a5a72",
        accent: { DEFAULT: "#7c6bf0", light: "#a78bfa" },
      },
    },
  },
  plugins: [],
};
