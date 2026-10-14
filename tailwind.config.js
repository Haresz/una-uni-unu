/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
      },
      colors: {
        felt: {
          900: '#0b3d2e',
          800: '#0f5138',
          700: '#14724c',
        },
        card: {
          red: '#e0483c',
          yellow: '#f2b632',
          green: '#3fa34d',
          blue: '#2f6fdb',
          wild: '#1f2430',
        },
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};
