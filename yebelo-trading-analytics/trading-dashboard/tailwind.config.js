/**
 * Tailwind CSS Configuration
 * Customizes the default Tailwind theme for the trading dashboard
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Specify which files to scan for Tailwind classes
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  theme: {
    extend: {
      // Custom color palette
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          500: '#3b82f6',
          600: '#2563eb',
        },
        secondary: {
          DEFAULT: '#8b5cf6',
          500: '#8b5cf6',
        },
        success: {
          DEFAULT: '#10b981',
          500: '#10b981',
        },
        warning: {
          DEFAULT: '#f59e0b',
        },
        danger: {
          DEFAULT: '#ef4444',
        },
      },
      
      // Custom animations
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  
  // Enable dark mode with class strategy
  darkMode: 'class',
  
  // Plugins
  plugins: [],
}