import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // HMR MUST use localhost for WebSocket connection
    hmr: {
      host: 'localhost',
      port: 3000,
    }
  },
});