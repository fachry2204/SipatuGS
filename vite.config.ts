import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Menyediakan env variable process.env agar kompatibel dengan kode yang ada
    'process.env': process.env
  }
});