/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        foreground: '#ffffff',
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#6366f1',
        muted: '#374151',
        border: '#374151',
      },
    },
  },
  plugins: [],
} 