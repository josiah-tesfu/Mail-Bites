# Testing Strategy

This document outlines how Mail Bites will be validated as the project evolves. Keep it updated as new components and workflows arrive.

## Tooling overview
- **Unit tests**: Powered by Vitest (`npm run test:unit`). Executes TypeScript modules in a JSDOM environment with mocked Chrome APIs. Source files live under `src/`, while test files should reside in `tests/unit/`.
- **Integration tests**: Powered by Playwright (`npm run test:integration`). Launches Chromium with the unpacked extension (`extension/`) to validate real Gmail interactions and end-to-end UI flows. Place Playwright specs inside `tests/integration/`.

## Scope & responsibilities

### Unit tests
Focus on pure logic and small DOM helpers that do not require a full Gmail environment.

Expected coverage:
- `src/content/navigation.ts`: history patching, listener registration, teardown behaviour.
- `src/content/viewTracker.ts`: debounce logic, detection of URL changes, handling of missing DOM nodes (using mocked DOM fragments).
- Utility modules (`logger`, future helper utilities).
- Any future state management or data transformation utilities (summarisation pipelines, settings serialization).

Guidelines:
- Avoid heavy DOM rendering; rely on lightweight fixtures or document fragments.
- Use the provided Chrome API mocks for `runtime`, `storage`, etc. Extend the mocks in `tests/setup/vitest.setup.ts` when new APIs are consumed.
- Keep tests deterministic; avoid real timers by leveraging Vitest’s fake timers if necessary.

### Integration tests
Exercise workflows that depend on Gmail’s dynamic environment or require coordination between multiple modules.

Candidate scenarios:
- Extension bootstraps correctly inside Gmail, injects `#mail-bites-root`, and responds to navigation events.
- Minimalist UI modules (once implemented) re-render consistently when switching between inbox, labels, or conversations.
- AI summarization flows (future) trigger background/service worker interactions and update the DOM accordingly.

Guidelines:
- Ensure the extension bundle is fresh (`npm run build`) before running Playwright.
- Scope tests to realistic user journeys; prefer fewer high-value scenarios over numerous brittle cases.
- When Gmail UI dependencies are heavy, consider using feature flags or mock Gmail environments for faster runs.

## Maintenance expectations
- Add or update tests alongside code changes.
- Record notable additions or changes to the testing approach in `docs/updates.md`.
- Periodically review test coverage to balance confidence and runtime.
