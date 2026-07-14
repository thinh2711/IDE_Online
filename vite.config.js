// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:3000';

export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/health': apiProxyTarget,
      '/api': apiProxyTarget,
    },
  },
});
