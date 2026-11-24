/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090D14",
        surface: "#101620",
        "surface-elevated": "#171F2C",
        border: "#263142",
        foreground: "#E8EDF5",
        muted: "#8995A8",
        source: "#38C5F4", // DIII-D Cyan
        target: "#FB9162", // MAST Warm Orange
        accent: "#8D91FF",
        positive: "#45D6AE",
        warning: "#F2C66D",
        negative: "#F16E87",
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
