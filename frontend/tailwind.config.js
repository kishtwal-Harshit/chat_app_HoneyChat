import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slower': 'pulse-slower 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'diamond-glow': 'diamond-glow 6s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '0.9' }
        },
        'pulse-slower': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' }
        },
        'diamond-glow': {
          '0%': {
            'box-shadow': '0 0 5px theme(colors.primary/30)',
            'border-color': 'theme(colors.primary/40)'
          },
          '100%': {
            'box-shadow': '0 0 20px theme(colors.primary/50)',
            'border-color': 'theme(colors.primary/70)'
          }
        }
      },
      boxShadow: {
        'diamond-light': '0 0 8px theme(colors.primary/20)',
        'diamond-dark': '0 0 15px theme(colors.primary/40)'
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#6366f1",
          "primary-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f3f4f6"
        }
      },
      {
        dark: {
          "primary": "#818cf8",
          "primary-content": "#ffffff",
          "base-100": "#1e1e2d",
          "base-200": "#2a2a3a"
        }
      },
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      "dim",
      "nord",
      "sunset"
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    logs: true
  }
};