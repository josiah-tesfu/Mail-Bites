import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    dir: 'tests/unit',
    globals: true,
    passWithNoTests: true,
    setupFiles: [path.resolve(__dirname, 'tests/setup/vitest.setup.ts')],
    coverage: {
      enabled: false
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
