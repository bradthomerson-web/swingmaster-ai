/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- The line that scans your components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
