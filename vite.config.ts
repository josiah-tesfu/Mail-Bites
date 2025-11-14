import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs/promises';
import path from 'path';

const EXTENSION_DIR = path.resolve(__dirname, 'extension');
const SOURCE_CSS = path.resolve(__dirname, 'src/content/styles/content.css');
const CSS_TARGETS = [
  {
    source: SOURCE_CSS,
    target: path.resolve(EXTENSION_DIR, 'content.css')
  },
  {
    source: path.resolve(__dirname, 'src/content/styles/animations.css'),
    target: path.resolve(EXTENSION_DIR, 'animations.css')
  }
];

const STATIC_ASSETS = [
  'archive-button.svg',
  'attachments-button.svg',
  'delete-button.svg',
  'reply-button.svg',
  'forward-button.svg',
  'send-button.svg',
  'new-email-button.svg',
  'search-button.svg',
  'close-draft.svg',
  'draft-button.svg',
  'read-button.svg',
  'unread-button.svg'
].map((filename) => ({
  source: path.resolve(__dirname, 'assets/icons', filename),
  target: path.resolve(EXTENSION_DIR, filename)
}));

function staticAssetPlugin() {
  return {
    name: 'mail-bites-static-assets',
    async closeBundle() {
      await fs.mkdir(EXTENSION_DIR, { recursive: true });

      const copySets = [...CSS_TARGETS, ...STATIC_ASSETS];

      await Promise.all(
        copySets.map(async ({ source, target }) => {
          try {
            await fs.copyFile(source, target);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
              console.warn('[mail-bites] Missing asset, skipping copy:', source);
              return;
            }
            throw error;
          }
        })
      );
    }
  };
}

export default defineConfig({
  plugins: [react(), staticAssetPlugin()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    global: 'window'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'chrome109',
    sourcemap: true,
    outDir: 'extension',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/content/index.tsx'),
      name: 'MailBitesApp',
      formats: ['iife'],
      fileName: () => 'content-script.js'
    },
    rollupOptions: {
      output: {
        extend: true
      }
    }
  }
});
