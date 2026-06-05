import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/**/*.{html,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mapped to CSS variables defined in index.css for light/dark theming
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-muted': 'rgb(var(--ink-muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        // Semantic clipboard type colors
        type: {
          text: '#2563eb',
          image: '#16a34a',
          link: '#ea580c',
          file: '#9333ea'
        }
      },
      borderRadius: {
        window: '22px'
      },
      boxShadow: {
        floating: '0 24px 60px -12px rgba(0,0,0,0.28), 0 8px 24px -8px rgba(0,0,0,0.18)',
        card: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)'
      },
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Segoe UI"',
          'system-ui',
          '-apple-system',
          'sans-serif'
        ],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'Consolas', 'monospace']
      }
    }
  },
  plugins: []
} satisfies Config
