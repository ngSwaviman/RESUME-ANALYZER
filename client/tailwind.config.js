/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff5ff',
          100: '#dbe8ff',
          200: '#bfd5ff',
          300: '#93b7ff',
          400: '#5f8fff',
          500: '#3b6cf6',
          600: '#2453e6',
          700: '#1c41c4',
          800: '#1b389e',
          900: '#1b337d',
        },
        mint: {
          50: '#edfffb',
          100: '#d1fff6',
          200: '#a4fbe9',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        night: {
          950: '#050b16',
          900: '#070f1d',
          850: '#091425',
          800: '#0b182b',
          700: '#102138',
          600: '#16283f',
        },
        ink: {
          950: '#04010f',
          900: '#080320',
          850: '#0c0629',
          800: '#120a38',
          700: '#1a0f4d',
        },
        iris: {
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        navy: {
          900: '#0b1220',
          800: '#111c31',
          700: '#16233c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 18px 40px -24px rgba(15, 23, 42, 0.25)',
        lift: '0 24px 48px -24px rgba(36, 83, 230, 0.35)',
        glow: '0 0 80px -20px rgba(94, 234, 212, 0.45)',
        'glow-violet': '0 0 90px -25px rgba(139, 92, 246, 0.65)',
        'panel': '0 50px 120px -50px rgba(109, 40, 217, 0.75), 0 0 0 1px rgba(255,255,255,0.06)',
        'night-card': '0 30px 60px -30px rgba(0, 0, 0, 0.9)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(0.4deg)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0) rotate(-0.3deg)' },
          '50%': { transform: 'translateY(-16px) rotate(0.3deg)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.65', transform: 'scale(1.07)' },
        },
        drawRing: {
          '0%': { strokeDashoffset: '339' },
          '100%': { strokeDashoffset: '75' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(0, -26px, 0) scale(1.08)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%) skewX(-12deg)' },
          '60%, 100%': { transform: 'translateX(220%) skewX(-12deg)' },
        },
        pulseLine: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.9' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fadeIn 0.9s ease-out both',
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'floatSlow 9s ease-in-out infinite',
        'glow-pulse': 'glowPulse 7s ease-in-out infinite',
        'draw-ring': 'drawRing 1.9s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both',
        shimmer: 'shimmer 1.6s infinite',
        drift: 'drift 18s ease-in-out infinite',
        'drift-slow': 'drift 26s ease-in-out infinite',
        sheen: 'sheen 4.5s ease-in-out infinite',
        'pulse-line': 'pulseLine 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
