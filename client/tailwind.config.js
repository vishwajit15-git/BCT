/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        mayo: {
          navy: '#00205b',        // Mayo deep navy blue
          blue: '#003087',        // Mayo primary corporate blue
          accent: '#0b66c3',      // Mayo bright action blue
          light: '#eef4fa',       // Mayo subtle tint background
          card: '#f7f9fa',        // Mayo neutral light gray surface
          border: '#d1dbe5',      // Mayo crisp clinical border
          darkText: '#1a202c',    // High-contrast charcoal text
          mutedText: '#4a5568',   // Accessible secondary text
          green: '#15803d',       // Verification green
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
    },
  },
  plugins: [],
}
