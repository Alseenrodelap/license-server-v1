/******************************
 * Tailwind config
 ******************************/
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
      },
    },
  },
  darkMode: 'class',
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
}
