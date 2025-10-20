# Mail Bites Chrome Extension MVP Setup

This guide explains how to run and extend the minimal Mail Bites Chrome extension that targets Gmail. The current build focuses on giving you a safe, lightweight foundation where you can inject UI changes without yet altering the inbox.

## Requirements
- Google Chrome 109 or newer (any Chromium browser with Manifest V3 support works).
- A Gmail account for testing. The extension only activates on `https://mail.google.com/*`.

## Project Layout
```
extension/
├── content-script.js   # Watches Gmail for view changes and boots Mail Bites
├── content.css         # Empty stylesheet reserved for layout/theme tweaks
└── manifest.json       # Chrome extension manifest (MV3)
docs/
└── setup.md            # This guide
README.md               # High-level project overview
```

### Key files
- `extension/manifest.json` registers the content script and declares Gmail host permissions. Update this if you add background scripts, options pages, or additional permissions.
- `extension/content-script.js` observes Gmail’s single-page navigation and exposes stubs (`initMailBites`, `cleanup`, `onViewUpdated`) for future UI rewrites.
- `extension/content.css` is intentionally empty—drop Gmail overrides or new layout styles here when you build the minimalist UI.

## Load the extension
1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked** and choose the `extension/` directory from this repository.
4. Gmail (any tab at `https://mail.google.com/*`) automatically receives the content script on reload. Open Chrome DevTools → **Console** to confirm the log `"[Mail Bites] Initialized on Gmail view."`.

> Tip: Pin the extension from Chrome’s toolbar so you can quickly access the built-in reload button while iterating.

## Development workflow
1. Edit the files under `extension/`.
2. In `chrome://extensions`, press **Reload** on the Mail Bites card.
3. Refresh your Gmail tab and use DevTools to validate any DOM/CSS changes.

Because the extension runs as a content script, the page console is the most convenient place to debug. The script establishes a `MutationObserver` on `document.body`, so it will re-run `initMailBites` when Gmail swaps the inbox or conversation views.

## Extending the MVP
- Implement the minimalist inbox by replacing the placeholder logic inside `onViewUpdated` with DOM rewrites or overlays rendered into `#mail-bites-root`.
- If you need persistent user settings, wire up `chrome.storage.sync` or `chrome.storage.local` from the content script.
- For heavier UI, consider mounting a framework app inside `#mail-bites-root` and bundling assets with a build step (Vite, Webpack, etc.).

Phase 2 (AI summarization) can reuse the same content script entry point: add background scripts or service workers once you integrate API calls.
