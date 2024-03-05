/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './node_modules/flowbite-react/lib/**/*.js'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('@tailwindcss/typography'), require('flowbite/plugin')]
};
