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
        // ─── Design System v2: Verified Intelligence Direction ─────────────
        void:                     '#08090C',
        panel: {
          DEFAULT:                '#111318',
          raised:                 '#1A1D24',
        },
        'panel-raised':           '#1A1D24',
        border:                   '#2A2E38',
        'text-primary':           '#F4F5F7',
        'text-muted':             '#8B90A0',

        // Accents & Signals
        'bridge-teal':            '#2F8C82',
        'signal-amber':           '#E8A23C',
        'signal-green':           '#4CC38A',
        'signal-red':             '#E5637C',

        // ─── Cyber-Luminescent Obsidian System (remapped for backward compatibility) ─
        'cyber-primary':          '#2F8C82',
        'cyber-primary-hover':    '#3aa398',
        'cyber-primary-active':   '#236b63',
        'cyber-primary-glow':     'rgba(47, 140, 130, 0.45)',

        'cyber-cyan':             '#2F8C82',
        'cyber-cyan-glow':        'rgba(47, 140, 130, 0.4)',
        'cyber-emerald':          '#4CC38A',
        'cyber-violet':           '#5B7FE0',
        'cyber-amber':            '#E8A23C',

        // Canvas Ladder mapped to Design System v2
        'cyber-canvas':           '#08090C',
        'cyber-surface-1':        '#111318',
        'cyber-surface-2':        '#1A1D24',
        'cyber-surface-3':        '#1f242d',
        'cyber-surface-glass':    'rgba(17, 19, 24, 0.8)',

        'cyber-hairline':         '#2A2E38',
        'cyber-hairline-strong':  '#3d4352',
        'cyber-hairline-glow':    'rgba(47, 140, 130, 0.35)',

        'cyber-ink':              '#F4F5F7',
        'cyber-ink-muted':        '#8B90A0',
        'cyber-ink-subtle':       '#8B90A0',
        'cyber-ink-tertiary':     '#6b7280',

        // ─── Linear remapped to Design System v2 ────────────────────────────
        'linear-primary':         '#2F8C82',
        'linear-primary-hover':   '#3aa398',
        'linear-primary-focus':   '#236b63',
        'linear-brand-secure':    '#2F8C82',

        'linear-canvas':          '#08090C',
        'linear-surface-1':       '#111318',
        'linear-surface-2':       '#1A1D24',
        'linear-surface-3':       '#1f242d',
        'linear-surface-4':       '#2A2E38',

        'linear-hairline':          '#2A2E38',
        'linear-hairline-strong':   '#3d4352',
        'linear-hairline-tertiary': '#4f5669',

        'linear-ink':          '#F4F5F7',
        'linear-ink-muted':    '#8B90A0',
        'linear-ink-subtle':   '#8B90A0',
        'linear-ink-tertiary': '#6b7280',

        'linear-inverse-canvas': '#ffffff',
        'linear-inverse-ink':    '#000000',
        'linear-success':        '#4CC38A',

        // Legacy public-marketing tokens mapped to v2
        paper:           '#08090C',
        ink: {
          DEFAULT: '#F4F5F7',
          muted:   '#8B90A0',
        },
        'campus-blue':    '#5B7FE0',
        'industry-amber': '#E8A23C',
        line:             '#2A2E38',

        // Console tokens — remapped to Design System v2 values
        console: {
          bg:             '#08090C',
          panel:          '#111318',
          'panel-raised': '#1A1D24',
          border:         '#2A2E38',
          text:           '#F4F5F7',
          'text-muted':   '#8B90A0',
        },
        canvas: {
          DEFAULT: '#08090C',
          subtle:  '#111318',
          raised:  '#1A1D24',
          border:  '#2A2E38',
        },

        // Status colors mapped to v2 signals
        status: {
          amber:  '#E8A23C',
          green:  '#4CC38A',
          blue:   '#5B7FE0',
          red:    '#E5637C',
        },
      },

      backgroundImage: {
        'bridge-gradient': 'linear-gradient(135deg, #2F8C82 0%, #5B7FE0 100%)',
      },

      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans:  ['Inter', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono:  ['"IBM Plex Mono"', '"JetBrains Mono"', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },

      letterSpacing: {
        'display-xl': '-0.0375em',
        'display-lg': '-0.032em',
        'display-md': '-0.025em',
        'headline':   '-0.021em',
        'card-title': '-0.018em',
        'subhead':    '-0.01em',
        'eyebrow':    '0.04em',
      },

      borderRadius: {
        'linear-xs':  '4px',
        'linear-sm':  '6px',
        'linear-md':  '8px',
        'linear-lg':  '12px',
        'linear-xl':  '16px',
        'linear-xxl': '24px',
        '2xl':        '24px',
        '3xl':        '32px',
        'pill':       '9999px',
      },

      boxShadow: {
        'campus-card':      '0 8px 24px rgba(20, 20, 30, 0.06)',
        'console-glow':     '0 0 24px rgba(37, 99, 235, 0.25)',
        'linear-card':      '0 0 0 1px #1e293b',
        'linear-focus':     '0 0 0 2px #030712, 0 0 0 4px rgba(37, 99, 235, 0.7)',
        'cyber-glow':       '0 0 24px rgba(37, 99, 235, 0.45)',
        'cyber-glow-lg':    '0 0 36px rgba(37, 99, 235, 0.65)',
        'cyber-cyan-glow':  '0 0 24px rgba(6, 182, 212, 0.4)',
        'cyber-card':       '0 8px 32px -8px rgba(37, 99, 235, 0.25)',
      },

      animation: {
        'bridge-draw': 'bridgeDraw 0.8s ease-out forwards',
        'pulse-glow':  'pulseGlow 2s infinite ease-in-out',
        'fade-in':     'fadeIn 0.15s ease-out forwards',
      },

      keyframes: {
        bridgeDraw: {
          '0%':   { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
