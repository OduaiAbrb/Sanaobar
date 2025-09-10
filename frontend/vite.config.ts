import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom plugin to disable host checking
const disableHostCheck = () => ({
  name: 'disable-host-check',
  configureServer(server) {
    server.middlewares.use('/', (req, res, next) => {
      // Allow all hosts
      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), disableHostCheck()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: {
      port: 3000
    }
  }
});
