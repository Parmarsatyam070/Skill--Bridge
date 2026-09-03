/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Campus (light - marketing / public)
        paper: '#FBFAF7',
        ink: {
          DEFAULT: '#181B22',
          muted: '#5B6270',
        },
        'campus-blue': '#2B4C7E',
        'industry-amber': '#E8963C',
        'bridge-teal': '#2F8C82',
        line: '#E4E1D9',

        // Console (dark - logged in workspaces)
        console: {
          bg: '#12141C',
          panel: '#1B1E29',
          'panel-raised': '#242836',
          border: '#2E3241',
          text: '#EDEFF3',
          'text-muted': '#8A90A3',
        },
        status: {
          amber: '#F0A94E',
          green: '#4CC38A',
          blue: '#5B9BD9',
          red: '#E5637C',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'campus-card': '0 8px 24px rgba(20, 20, 30, 0.06)',
        'console-glow': '0 0 20px rgba(47, 140, 130, 0.15)',
      },
      animation: {
        'bridge-draw': 'bridgeDraw 0.8s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
      },
      keyframes: {
        bridgeDraw: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        }
      }
    },
  },
  plugins: [],
}
