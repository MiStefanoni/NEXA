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
        ivory: "#F7F6F4",
        charcoal: "#2B2B2B",
        clay: "#843088",
        teal: "#E47E4A",
        mist: "#F9E1CF",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        soft: "0 16px 40px rgba(43, 43, 43, 0.08)",
      },
    },
  },
  plugins: [],
};
