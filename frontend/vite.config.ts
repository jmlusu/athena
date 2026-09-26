import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: Number(process.env.PORT) || 1111,
    allowedHosts: true,
    proxy: {
      '/api/v1/athena': process.env.ATHENA_BACKEND_URL || 'http://127.0.0.1:8000'
    }
  }
});