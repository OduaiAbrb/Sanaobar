import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '10.219.68.118',
      'receipt-tracker-29.preview.emergentagent.com',
      '.preview.emergentagent.com',
      'all'
    ],
    hmr: {
      port: 3000
    }
  }
});
