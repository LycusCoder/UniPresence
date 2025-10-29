import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 3000,
    strictPort: false,
    // CRITICAL FIX: Allow ALL hosts - use 'all' to accept any domain
    // This is safe for development/demo environments
    allowedHosts: 'all',
    // HMR configuration
    hmr: {
      clientPort: 3000,
    },
    cors: true, // Enable CORS
  },
  // Preview config for production build testing
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    cors: true,
  },
});