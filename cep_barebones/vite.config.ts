import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { config } from './config.js';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.html') return 'index.html';
          if (assetInfo.name?.endsWith('.css')) return 'css/[name][extname]';
          return 'assets/[name][extname]';
        },
      },
    },
  },
  server: {
    port: config.ports.development,
  },
}); 