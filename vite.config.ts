import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'chrome109',
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/content/index.tsx')
    }
  }
});
