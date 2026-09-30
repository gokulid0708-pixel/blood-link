/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          dark: '#080C16',
          panel: '#0F172A',
          card: '#131D36',
          border: '#1E293B',
          glow: 'rgba(214, 40, 57, 0.25)'
        },
        primary: {
          red: '#D62839',
          crimson: '#E63946',
          dark: '#991B1B'
        },
        emergency: {
          critical: '#EF4444',
          urgent: '#F59E0B',
          normal: '#10B981'
        }
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite'
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' }
        }
      }
    },
  },
  plugins: [],
}
