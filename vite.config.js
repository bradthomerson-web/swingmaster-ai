import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // Import the Tailwind Vite plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // Add the Tailwind plugin here
    react(),
  ],
});