import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Served from the custom domain sol.igroza.su at the root.
  base: '/',
  build: {
    assetsDir: '',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.slice(-4) === '.css') {
            return 'index.css';
          }
          return '[name][extname]';
        },
      },
    },
  },
});
