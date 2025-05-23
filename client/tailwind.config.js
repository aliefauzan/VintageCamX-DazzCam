/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vintage: {
          sepia: '#D4C19C',
          cream: '#F5F0E6',
          brown: '#8C7A64',
          red: '#A45A52',
          blue: '#5D7B93',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      animation: {
        'film-strip': 'film-strip 2s linear infinite',
      },
      keyframes: {
        'film-strip': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}; 