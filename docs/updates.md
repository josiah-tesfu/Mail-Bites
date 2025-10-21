# Mail Bites Change Log

## 2024-06-05
- Introduced esbuild-based build pipeline with TypeScript sources under `src/` and generated assets in `extension/`.
- Enhanced Gmail view detection via History API patches + mutation tracking, wrapped inside `MailBitesApp` for easier future UI work.
- Expanded documentation (`docs/setup.md`, `docs/architecture.md`) and added thorough inline comments across the codebase for clarity and extensibility.

## 2024-06-06
- Added testing scaffolding: Vitest for unit tests with Chrome API mocks, Playwright configuration for integration testing, and supporting directory structure.
- Documented testing strategy and workflow updates (`docs/testing.md`, updates to `docs/setup.md`).
- Implemented the minimalist inbox MVP: Gmail conversations now render with sender, subject, date, hover styling, and expandable previews parsed via `conversationParser`.
- Added `docs/project_roadmap.md` to outline near-term phases and removed roadmap content from `docs/architecture.md` to keep responsibilities clear.
