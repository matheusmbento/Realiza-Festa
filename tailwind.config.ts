import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ouro:   '#FFB400',
          rosa:   '#FF6B9D',
          roxo:   '#7C3AED',
          verde:  '#4ADE80',
          red:    '#F87171',
          bg:     '#0F0F14',
          card:   '#1A1A24',
          border: '#2A2A38',
          muted:  '#3A3A50',
          text:   '#E8E8F0',
          sub:    '#8888AA',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
