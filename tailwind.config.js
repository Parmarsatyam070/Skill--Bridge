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
        // ─── Design System: Black & Blue Theme (Landing & Registration aligned) ───
        void:                     '#030712',
        panel: {
          DEFAULT:                '#0b1329',
          raised:                 '#0f172a',
        },
        'panel-raised':           '#0f172a',
        border:                   '#1e293b',
        'text-primary':           '#ffffff',
        'text-muted':             '#94a3b8',

        // Accents & Signals
        'bridge-teal':            '#2563eb',
        'bridge-panel':           '#0b1329',
        'bridge-panel-raised':    '#0f172a',
        'bridge-border':          '#1e293b',
        'bridge-text':            '#ffffff',
        'bridge-text-muted':      '#94a3b8',
        'signal-amber':           '#E8A23C',
        'signal-green':           '#4CC38A',
        'signal-red':             '#E5637C',

        // ─── Cyber-Luminescent Obsidian System (remapped for backward compatibility) ─
        'cyber-primary':          '#2563eb',
        'cyber-primary-hover':    '#1d4ed8',
        'cyber-primary-active':   '#1e40af',
        'cyber-primary-glow':     'rgba(37, 99, 235, 0.45)',

        'cyber-cyan':             '#38bdf8',
        'cyber-cyan-glow':        'rgba(56, 189, 248, 0.4)',
        'cyber-emerald':          '#4CC38A',
        'cyber-violet':           '#6366f1',
        'cyber-amber':            '#E8A23C',

        // Canvas Ladder mapped to Black & Blue System
        'cyber-canvas':           '#030712',
        'cyber-surface-1':        '#0b1329',
        'cyber-surface-2':        '#0f172a',
        'cyber-surface-3':        '#131f37',
        'cyber-surface-glass':    'rgba(11, 19, 41, 0.85)',

        'cyber-hairline':         '#1e293b',
        'cyber-hairline-strong':  '#334155',
        'cyber-hairline-glow':    'rgba(37, 99, 235, 0.35)',

        'cyber-ink':              '#ffffff',
        'cyber-ink-muted':        '#94a3b8',
        'cyber-ink-subtle':       '#94a3b8',
        'cyber-ink-tertiary':     '#64748b',

        // ─── Linear remapped to Black & Blue System ────────────────────────────
        'linear-primary':         '#2563eb',
        'linear-primary-hover':   '#1d4ed8',
        'linear-primary-focus':   '#1e40af',
        'linear-brand-secure':    '#2563eb',

        'linear-canvas':          '#030712',
        'linear-surface-1':       '#0b1329',
        'linear-surface-2':       '#0f172a',
        'linear-surface-3':       '#131f37',
        'linear-surface-4':       '#1e293b',

        'linear-hairline':          '#1e293b',
        'linear-hairline-strong':   '#334155',
        'linear-hairline-tertiary': '#475569',

        'linear-ink':          '#ffffff',
        'linear-ink-muted':    '#94a3b8',
        'linear-ink-subtle':   '#94a3b8',
        'linear-ink-tertiary': '#64748b',

        'linear-inverse-canvas': '#ffffff',
        'linear-inverse-ink':    '#000000',
        'linear-success':        '#4CC38A',

        // Legacy public-marketing tokens mapped to v2
        paper:           '#030712',
        ink: {
          DEFAULT: '#ffffff',
          muted:   '#94a3b8',
        },
        'campus-blue':    '#2563eb',
        'industry-amber': '#E8A23C',
        line:             '#1e293b',

        // Console tokens — remapped to Black & Blue values
        console: {
          bg:             '#030712',
          panel:          '#0b1329',
          'panel-raised': '#0f172a',
          border:         '#1e293b',
          text:           '#ffffff',
          'text-muted':   '#94a3b8',
        },
        canvas: {
          DEFAULT: '#030712',
          subtle:  '#0b1329',
          raised:  '#0f172a',
          border:  '#1e293b',
        },

        // Status colors mapped to signals
        status: {
          amber:  '#E8A23C',
          green:  '#4CC38A',
          blue:   '#2563eb',
          red:    '#E5637C',
        },
      },

      backgroundImage: {
        'bridge-gradient': 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
      },

      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans:  ['"Instrument Sans"', 'Inter', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono:  ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
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
