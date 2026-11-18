/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: {
          50: 'rgb(var(--site-amber-50) / <alpha-value>)',
          100: 'rgb(var(--site-amber-100) / <alpha-value>)',
          200: 'rgb(var(--site-amber-200) / <alpha-value>)',
          300: 'rgb(var(--site-amber-300) / <alpha-value>)',
          400: 'rgb(var(--site-amber-400) / <alpha-value>)',
          500: 'rgb(var(--site-amber-500) / <alpha-value>)',
          600: 'rgb(var(--site-amber-600) / <alpha-value>)',
          700: 'rgb(var(--site-amber-700) / <alpha-value>)',
          800: 'rgb(var(--site-amber-800) / <alpha-value>)',
          900: 'rgb(var(--site-amber-900) / <alpha-value>)',
          950: 'rgb(var(--site-amber-950) / <alpha-value>)',
        },
        orange: {
          50: 'rgb(var(--site-orange-50) / <alpha-value>)',
          100: 'rgb(var(--site-orange-100) / <alpha-value>)',
          200: 'rgb(var(--site-orange-200) / <alpha-value>)',
          300: 'rgb(var(--site-orange-300) / <alpha-value>)',
          400: 'rgb(var(--site-orange-400) / <alpha-value>)',
          500: 'rgb(var(--site-orange-500) / <alpha-value>)',
          600: 'rgb(var(--site-orange-600) / <alpha-value>)',
          700: 'rgb(var(--site-orange-700) / <alpha-value>)',
          800: 'rgb(var(--site-orange-800) / <alpha-value>)',
          900: 'rgb(var(--site-orange-900) / <alpha-value>)',
          950: 'rgb(var(--site-orange-950) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
