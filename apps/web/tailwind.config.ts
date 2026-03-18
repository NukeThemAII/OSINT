import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#04070d',
        panel: '#08111e',
        grid: '#142235',
        accent: '#38bdf8',
        alert: '#f97316',
        success: '#22c55e',
      },
      boxShadow: {
        panel: '0 24px 80px rgba(2, 6, 23, 0.55)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
