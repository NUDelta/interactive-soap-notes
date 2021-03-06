module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    colors: {
      'note-yellow': '#ecdca4',
    }
  },
  plugins: [require("@tailwindcss/typography")],
};
