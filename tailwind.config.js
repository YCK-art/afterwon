/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 다크모드 활성화
  theme: {
    extend: {
      colors: {
        // 다크모드용 커스텀 색상
        dark: {
          bg: '#121212',
          surface: '#1E1E1E',
          card: '#2D2D2D',
          primary: '#4F46E5',
          text: '#FFFFFF',
          'text-secondary': '#E5E7EB',
          border: '#374151'
        }
      }
    },
  },
  plugins: [],
} 