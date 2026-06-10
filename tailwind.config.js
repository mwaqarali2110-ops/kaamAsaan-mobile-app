/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        kaam: {
          cream: '#FFF7E6',
          surface: '#F8F1E5',
          card: '#FFFFFF',
          navy: '#10243C',
          muted: '#6B7280',
          line: '#E9DEC9',
          yellow: '#FACC15',
          amber: '#F59E0B',
          green: '#128A3E',
          red: '#E11D48'
        }
      },
      borderRadius: {
        xl2: '22px'
      },
      fontFamily: {
        sans: ['System']
      }
    }
  },
  plugins: []
};
