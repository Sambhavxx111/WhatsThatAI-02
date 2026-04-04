/** @type {import('"'"'tailwindcss'"'"').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './App/**/*.{js,jsx,ts,tsx,mdx}',
    './src/app/**/*.{js,jsx,ts,tsx,mdx}',
    './Components/**/*.{js,jsx,ts,tsx,mdx}',
    './hooks/**/*.{js,jsx,ts,tsx,mdx}',
    './lib/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-manrope)', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.05), 0 12px 40px rgba(0, 0, 0, 0.4)',
        card: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 40px -10px rgba(0,0,0,0.5)',
        elevated: '0 0 0 1px rgba(255,255,255,0.08), 0 30px 60px -20px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top, rgba(255,255,255,0.03), transparent 30%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.02), transparent 32%), radial-gradient(circle at bottom, rgba(10,10,12,0.95), rgba(5,5,5,1))',
      },
    },
  },
  plugins: [],
}

