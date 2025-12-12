import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // This part is CRITICAL
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Your Express server port
        changeOrigin: true,
      },
    }
  }
});