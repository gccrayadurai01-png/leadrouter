/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b8fc',
          400: '#818cf8',
          500: '#667eea',
          600: '#764ba2',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b1a7e',
        },
      },
    },
  },
  plugins: [],
}

