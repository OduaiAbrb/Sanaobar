import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'receipt-tracker-29.preview.emergentagent.com',
      '.preview.emergentagent.com' // Allow all preview subdomains
    ]
  }
});
