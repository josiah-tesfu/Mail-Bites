/**
 * Mail Bites content script entry point.
 *
 * The file wires together the high-level `MailBitesApp` and defers execution
 * until Gmail's DOM is ready. The exported global (`window.mailBites`) is a
 * convenience for manual debugging via DevTools.
 */

import { MailBitesApp } from './app';

declare global {
  interface Window {
    mailBites?: {
      app: MailBitesApp;
    };
  }
}

const app = new MailBitesApp();

function bootstrap() {
  app.start();
  window.mailBites = { app };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
