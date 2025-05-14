/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // New dark theme colors
        'dark': '#121212',
        'dark-surface': '#1E1E1E',
        'dark-card': '#252525',
        'dark-hover': '#2C2C2C',
        'dark-border': '#333333',
        
        // Vibrant accent colors
        'accent-turquoise': '#0BCEAF',
        'accent-blue': '#3A86FF',
        'accent-green': '#00F260',
        
        // Class type colors (darker, more vibrant versions)
        'lagree': '#00D68F',
        'strength': '#0066FF',
        'boxing': '#FF2D55',
        'stretch': '#FF9500',
        'pt': '#AF52DE'
      },
      fontFamily: {
        'sans': ['Inter', 'Montserrat', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.15)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0BCEAF 0%, #3A86FF 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #00F260 0%, #0BCEAF 100%)',
        'gradient-dark': 'linear-gradient(135deg, #121212 0%, #2C2C2C 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
