/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        daret: {
          dark: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          muted: '#8b949e',
          green: '#22c55e',
          'green-dim': '#16a34a',
          'green-bright': '#4ade80',
        },
      },
    },
  },
  plugins: [],
}
