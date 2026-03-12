/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        'accent-light': '#E8D5B0',
        'accent-dark': 'var(--color-accent-dark)',
        'gold': '#CA9C53',
        'rose': '#C9A196',
        'rose-dark': '#B08878',
        'promo-warm': '#E8D5C4',
        'promo-dark': '#6B5858',
        'dark-bg': 'var(--color-footer-bg)',
        'gray-light': '#F3F3F3',
        'gray-medium': '#e5e5e5',
        'cream': '#ffffff',
        'cream-dark': '#f5f5f5',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
