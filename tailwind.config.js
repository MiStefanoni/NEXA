/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "rgb(var(--color-ivory) / <alpha-value>)",
        charcoal: "rgb(var(--color-charcoal) / <alpha-value>)",
        clay: "rgb(var(--color-clay) / <alpha-value>)",
        teal: "rgb(var(--color-teal) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "sans-serif"],
        display: ["var(--font-display)", "DM Sans", "sans-serif"],
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
      },
    },
  },
  plugins: [],
};
