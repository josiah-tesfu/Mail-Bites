#!/usr/bin/env node

/**
 * Builds the Mail Bites Chrome extension assets.
 *
 * The script bundles the TypeScript entry point for the content script and
 * mirrors the companion stylesheet into the `extension/` directory so the
 * unpacked extension can be reloaded without manual copying.
 *
 * Usage:
 *   - `npm run build`       → single compilation
 *   - `npm run build:watch` → rebuild on file changes
 */

const path = require('path');
const fs = require('fs/promises');
const process = require('process');
const esbuild = require('esbuild');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXTENSION_DIR = path.join(PROJECT_ROOT, 'extension');
const ENTRY_POINT = path.join(PROJECT_ROOT, 'src', 'content', 'index.ts');
const OUTPUT_JS = path.join(EXTENSION_DIR, 'content-script.js');
const SOURCE_CSS = path.join(PROJECT_ROOT, 'src', 'content', 'content.css');
const OUTPUT_CSS = path.join(EXTENSION_DIR, 'content.css');
const STATIC_ASSETS = [
  {
    source: path.join(PROJECT_ROOT, 'archive-button.png'),
    target: path.join(EXTENSION_DIR, 'archive-button.png')
  },
  {
    source: path.join(PROJECT_ROOT, 'delete-button.png'),
    target: path.join(EXTENSION_DIR, 'delete-button.png')
  }
];

const isWatchMode = process.argv.includes('--watch');

/**
 * Copies the content stylesheet into the extension directory so Chrome can
 * ingest the latest styles without bundling them into JavaScript.
 */
async function copyStylesheet() {
  await fs.mkdir(path.dirname(OUTPUT_CSS), { recursive: true });
  await fs.copyFile(SOURCE_CSS, OUTPUT_CSS);
  console.info('[build] Synced content stylesheet to extension directory.');
}

async function copyStaticAssets() {
  await Promise.all(
    STATIC_ASSETS.map(async ({ source, target }) => {
      try {
        await fs.copyFile(source, target);
      } catch (error) {
        if (error && error.code === 'ENOENT') {
          console.warn('[build] Static asset missing, skipping:', source);
        } else {
          throw error;
        }
      }
    })
  );
  console.info('[build] Synced static assets to extension directory.');
}

/**
 * Shared esbuild configuration that produces an easily debuggable bundle
 * targeted at modern Chromium versions (aligned with Gmail's support matrix).
 */
const buildOptions = {
  entryPoints: [ENTRY_POINT],
  outfile: OUTPUT_JS,
  bundle: true,
  sourcemap: true,
  format: 'iife',
  target: ['chrome109'],
  platform: 'browser',
  logLevel: 'info',
  plugins: [
    {
      name: 'mail-bites-copy-css',
      setup(build) {
        build.onEnd(async (result) => {
          if (result.errors.length === 0) {
            await copyStylesheet();
            await copyStaticAssets();
          }
        });
      }
    }
  ]
};

async function run() {
  await fs.mkdir(EXTENSION_DIR, { recursive: true });

  if (isWatchMode) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.info('[build] Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
  }
}

run().catch((error) => {
  console.error('[build] Build failed:', error);
  process.exitCode = 1;
});
