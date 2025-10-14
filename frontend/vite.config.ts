import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      '3157ec7a-ef6d-48ad-a63f-716b708882a0.preview.emergentagent.com',
      'localhost',
      '127.0.0.1'
    ],
    hmr: {
      host: '3157ec7a-ef6d-48ad-a63f-716b708882a0.preview.emergentagent.com',
      protocol: 'wss'
    }
  },
});