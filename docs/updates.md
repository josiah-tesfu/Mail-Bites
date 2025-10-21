# Mail Bites Change Log

## 2024-06-05
- Introduced esbuild-based build pipeline with TypeScript sources under `src/` and generated assets in `extension/`.
- Enhanced Gmail view detection via History API patches + mutation tracking, wrapped inside `MailBitesApp` for easier future UI work.
- Expanded documentation (`docs/setup.md`, `docs/architecture.md`) and added thorough inline comments across the codebase for clarity and extensibility.

## 2024-06-06
- Added testing scaffolding: Vitest for unit tests with Chrome API mocks, Playwright configuration for integration testing, and supporting directory structure.
- Documented testing strategy and workflow updates (`docs/testing.md`, updates to `docs/setup.md`).
- Implemented subject-only overlay renderer for architecture sanity check and refreshed extension styling to support fullscreen overlays.
