import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/exelearning-style-converter/',
  root: 'web',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'web/index.html')
      }
    }
  },
  server: {
    port: 3000
  }
});
