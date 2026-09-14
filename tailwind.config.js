/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'green-dark': '#0d2b1e',
        'green-mid': '#1a5236',
        'green-light': '#2d7a52',
        'gold': '#c9a84c',
        'gold-light': '#e8c96e',
        'cream': '#faf8f3',
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
