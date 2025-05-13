/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'lagree': '#10B981',
        'strength': '#3B82F6',
        'boxing': '#EF4444',
        'stretch': '#F59E0B',
        'pt': '#8B5CF6'
      }
    },
  },
  plugins: [],
}
