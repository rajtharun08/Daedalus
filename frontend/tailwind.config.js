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
        space: {
          950: '#060911',
          900: '#0B0F19', // Deep Space Slate
          850: '#101524',
          800: '#161E31',
          700: '#1E2945',
        },
        cyan: {
          400: '#22D3EE',
          500: '#00F0FF', // Electric Cyan
          600: '#0891B2',
        },
        neon: {
          cyan: '#00F0FF',
          violet: '#A855F7',
          purple: '#8A2BE2',
          green: '#00FF88',
          amber: '#FFB800',
          rose: '#FF3366',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 6s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'laser-pulse': 'laserPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.4))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.7))' },
        },
        laserPulse: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        }
      }
    },
  },
  plugins: [],
}
