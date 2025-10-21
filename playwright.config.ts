import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const extensionPath = path.resolve(__dirname, 'extension');

export default defineConfig({
  testDir: path.resolve(__dirname, 'tests/integration'),
  timeout: 60 * 1000,
  workers: process.env.CI ? 1 : undefined,
  use: {
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        launchOptions: {
          args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`
          ]
        }
      }
    }
  ]
});
