# Mail Bites Architecture

_Last updated: 2024-06-05._

This document captures the current architectural direction of Mail Bites. Update it alongside code changes so the high-level design always reflects reality.

## Guiding principles
- **Modular**: Each concern lives in a focused module so future features can plug in without large refactors.
- **Observable**: Gmail’s SPA behaviour is monitored through a single coordination layer, enabling deterministic UI updates.
- **Non-invasive**: The extension avoids mutating Gmail’s built-in behaviour unless explicitly required. All custom UI mounts in a dedicated root node.
- **Extensible tooling**: The build pipeline is lightweight yet ready for TypeScript, bundling, and future asset processing.

## Runtime flow
1. **Entry point (`src/content/index.ts`)**  
   Waits for `DOMContentLoaded`, instantiates `MailBitesApp`, and exposes the instance on `window.mailBites` for debugging.
2. **Application coordinator (`src/content/app.ts`)**  
   Owns the lifecycle of the content script. It:
   - Boots the `GmailViewTracker`.
   - Ensures an overlay root (`#mail-bites-root`) exists on the page.
   - Receives view updates and orchestrates teardown/re-initialization hooks.
   - Delegates rendering to feature-specific modules (currently `MinimalInboxRenderer`).
3. **View tracking (`src/content/viewTracker.ts`)**  
   Pairs a `MutationObserver` with History API hooks to detect:
   - SPA navigation (pushState/replaceState/popstate).
   - DOM refreshes within the same URL (e.g., Gmail re-rendering conversation threads).
   It emits a `ViewContext` containing the current URL, hash descriptor, timestamp, and the primary `div[role="main"]` element when changes occur.
4. **Navigation patching (`src/content/navigation.ts`)**  
   Abstracts the History API patching so the rest of the code only deals with semantic “navigation events”. Patches are reference counted and restored when the content script stops observing.
5. **Logging (`src/content/logger.ts`)**  
   Provides a consistent `[Mail Bites]` prefix for console output, making it easy to filter logs while debugging in Gmail.
6. **Overlay styling (`src/content/content.css`)**  
   Placeholder stylesheet scoped to `#mail-bites-root`. Future UI work should keep rules contained here to avoid leaking styles into Gmail’s DOM.

7. **Minimal inbox renderer (`src/content/ui/minimalInboxRenderer.ts`)**  
   Temporary proof-of-concept that hides Gmail behind a fullscreen overlay listing subject lines from the Primary inbox. Validates view-change plumbing and rendering hooks without final UI polish.
8. **Conversation parsing (`src/content/ui/conversationParser.ts`)**  
   Converts Gmail table rows into structured `ConversationData` objects (id, sender, subject, snippet, date) that the renderer consumes. A dedicated module keeps parsing logic isolated and easily testable.

## Build pipeline
- **Tooling**: `scripts/build.js` wraps esbuild. It bundles `src/content/index.ts` (and transitive imports) into `extension/content-script.js` and copies the CSS asset.
- **Targets**: Bundles target `chrome109` to match modern Gmail support.
- **Source maps**: Emitted to `extension/content-script.js.map` for TypeScript debugging.
- **Watch mode**: `npm run build:watch` keeps Chrome reload cycles fast during development.

## Testing infrastructure
- **Unit tests**: Vitest (`vitest.config.ts`) runs against files in `tests/unit/` using a JSDOM environment. Chrome APIs are mocked via `tests/setup/vitest.setup.ts`.
- **Integration tests**: Playwright (`playwright.config.ts`) launches Chromium with the unpacked extension in `extension/`. Specs live under `tests/integration/`.
- **Execution**: `npm run test:unit` and `npm run test:integration` are available in `package.json`. The unit suite currently passes with zero tests so contributors can scaffold cases incrementally.

## Extension packaging
- `extension/manifest.json` is intentionally lean: a single content script (`content-script.js`) and stylesheet (`content.css`) injected on `https://mail.google.com/*`.
- The manifest excludes background/service worker scripts for now. Phase 2 (AI summarization) can introduce them alongside API integrations.

Keep this document synchronized with the codebase so new collaborators—and your future self—can reason about Mail Bites at a glance.
