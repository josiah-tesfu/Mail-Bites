# Mail Bites Project Roadmap

_Last updated: 2024-06-06._

This roadmap captures the near-term development plan for Mail Bites, outlining both functional milestones and infrastructural steps. Update it as priorities evolve.

## Phase 0 – Current MVP Foundation
- ✅ Content script scaffolding with robust Gmail view tracking (History API hooks + MutationObserver).
- ✅ Minimalist inbox overlay rendering sender / subject / date with expandable snippets.
- ✅ Tooling: esbuild build pipeline, Vitest unit tests, Playwright scaffold, documentation.

## Phase 1 – Minimalist UI Polish
- Refine inbox presentation (spacing, typography, hover/selection states, keyboard navigation).
- Introduce actionable affordances (archive, delete, mark as read) by piggybacking on Gmail DOM interactions.
- Establish architecture for reusable UI modules (e.g., dedicated renderer classes, state stores) to keep complexity manageable.
- Expand unit/integration test coverage around UI behaviours as they grow.
- Add a "Show read emails" toggle so users can append processed conversations below the unread list when needed.
- Render reply and forward buttons alongside existing actions.
- Wire reply and forward functionality (opening Gmail compose/reply flows).
- Support composing new emails directly from Mail Bites.
- Introduce user customization and settings persistence.

## Phase 2 – Gmail API Integration
- Implement OAuth 2.0 sign-in flow within the extension (background/service worker + consent screen).
- Request least-privilege scopes (e.g., `gmail.readonly`) to fetch full message bodies safely.
- Build a data layer that caches conversations and handles quota/ratelimiting logic.
- Update renderers to consume API-derived data (full message content, metadata beyond snippets).
- Add integration tests that validate authenticated flows (potentially with mocked Gmail endpoints or recorded fixtures).

## Phase 3 – AI Summarisation & Advanced Features
- Connect to summarisation services (OpenAI, custom models, etc.) to produce condensed email views.
- Surface summarised content in the overlay, with toggles to view original vs. summary.
- Introduce user preferences stored via `chrome.storage` (summary length, tone, etc.).
- Consider background processing or batch summarisation to keep the UI responsive.

## Ongoing Workstreams
- **Testing**: Grow unit tests alongside new modules; add Playwright specs once interactions require end-to-end validation.
- **Documentation**: Keep `docs/architecture.md`, this roadmap, and `docs/updates.md` aligned with code changes.
- **Performance**: Monitor DOM manipulation and API usage to ensure the extension stays lightweight.
- **Security & Privacy**: Revisit permissions and data handling regularly, especially when introducing API access or third-party integrations.

## Backlog / Known Issues
- Collapse animation should play out even when the pointer leaves mid-click; avoid hover transform snapping after the fact.


Keep this roadmap in sync with project goals so implementation aligns with long-term strategy.
