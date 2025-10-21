# Integration Test Skeleton

Integration tests will exercise the Mail Bites Chrome extension inside a real Chromium browser using Playwright. Add test files alongside this README (e.g., `tests/integration/mail-bites.spec.ts`) once end-to-end scenarios are ready.

## Running locally
1. Build the extension: `npm run build`
2. Execute the suite: `npm run test:integration`

The Playwright configuration (`playwright.config.ts`) launches Chrome with the unpacked extension located in the `extension/` directory. Keep the bundle up to date before running tests.
