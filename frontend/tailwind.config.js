/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: "#0a0a0f",
        surface: "#13131f",
        primary: "#6d28d9", // Deep purple
        secondary: "#db2777", // Pink
        accent: "#22d3ee", // Cyan
        "surface-light": "#1c1c2e",
        // Keeping the brand colors just in case they are used elsewhere, but fixing the structure
        brand: {
          50: '#f4f5ff',
          100: '#e4e5ff',
          200: '#c4c7ff',
          300: '#a0a4ff',
          400: '#7375ff',
          500: '#4f4bff',
          600: '#3a36db',
          700: '#2c28af',
          800: '#211f83',
          900: '#18165f',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2a2a35 0deg, #0a0a0f 360deg)',
        'hero-gradient': 'radial-gradient(circle at top left, rgba(180, 83, 9, 0.4), transparent 55%), radial-gradient(circle at top right, rgba(59, 130, 246, 0.45), transparent 55%), radial-gradient(circle at bottom, rgba(244, 63, 94, 0.35), transparent 55%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        glass: '0 18px 45px rgba(15, 23, 42, 0.65)',
      },
    },
  },
  plugins: [],
}
