/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // All key colors reference CSS variables so the ThemeTweaker can update them live
        playa: 'rgb(var(--c-playa) / <alpha-value>)',
        'playa-light': 'rgb(var(--c-playa-light) / <alpha-value>)',
        'playa-mid': 'rgb(var(--c-playa-mid) / <alpha-value>)',
        plum: 'rgb(var(--c-plum) / <alpha-value>)',
        mauve: 'rgb(var(--c-mauve) / <alpha-value>)',
        neon: 'rgb(var(--c-neon) / <alpha-value>)',
        // Static accents
        cream: '#FFF8F0',
        sand: '#C4A0B0',
        ember: '#FF5722',
        rose: '#FF6B9D',
        mint: '#4ECDC4',
        berry: '#FF6B8A',
      },
      fontFamily: {
        display: ['Boogaloo', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
