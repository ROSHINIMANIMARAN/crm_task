/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#effaff',
          100: '#d9f3ff',
          200: '#b8e9ff',
          300: '#7bd7ff',
          400: '#38bff4',
          500: '#01a0e2',
          600: '#008bc9',
          700: '#0075ad',
          800: '#00618f',
          900: '#064f73',
          950: '#07364d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'count-up': 'countUp 0.6s ease-out forwards',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
