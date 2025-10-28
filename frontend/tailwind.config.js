/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Maroon/Red Theme
        maroon: {
          50: '#FDF5F5',
          100: '#FAE5E5',
          200: '#F0B8B8',
          300: '#DC8585',
          400: '#C84848',
          500: '#B22222',
          600: '#A52A2A',
          700: '#8B0000',  // Main brand color
          800: '#700000',
          900: '#5F0000',
          950: '#450000',
        },
        // Keep existing for compatibility
        primary: '#8B0000',
        secondary: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      animation: {
        'blob': 'blob 7s infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        blob: {
          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
        },
        shake: {
          '0%, 100%': {
            transform: 'translateX(0)',
          },
          '25%': {
            transform: 'translateX(-10px)',
          },
          '75%': {
            transform: 'translateX(10px)',
          },
        },
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}