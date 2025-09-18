/** @type {import('tailwindcss').Config} */
export default {
  content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ed',
          100: '#fdedd3',
          200: '#fbd7a5',
          300: '#f8ba6d',
          400: '#f59433',
          500: '#f2730b',
          600: '#e35a01',
          700: '#bc4207',
          800: '#95350c',
          900: '#782d0d'
        }
      }
    }
  },
  plugins: []
};