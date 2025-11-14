## React Migration Completion Plan

### 1. Gmail Data Flow & Rendering
- Emit view updates on DOM mutations in `GmailViewTracker` so `useGmailConversations` can refresh when Gmail changes without navigation.
- Replace the current fire-once hook with the planned throttled `useConversations` observer that watches `div[role="main"]` and feeds Zustand incrementally.
- Guard store resets so navigation doesn’t purge state (especially compose drafts) unless Gmail’s main container truly changes.

### 2. UI Hooks & Interaction Parity
- Extract the documented `useClickOutside` helper and wire it into the root overlay instead of manual event bookkeeping.
- Finish the toolbar/search story: remove the stale TODO and ensure search state flows strictly through `useToolbarStore`.
- Reconcile planned composer behavior with code: standalone drafts should remain inline at the top of the conversation list (current behavior is correct) and documentation must reflect that.

### 3. Conversation & Composer Actions
- Replace archive/delete placeholders with real Gmail integrations (or clear stubs plus tracked issues) so actions affect the mailbox.
- Flesh out inline composer send/delete flows, updating conversation state (read status, dismissals) in tandem with Gmail.
- Persist standalone compose drafts (local storage or chrome.storage) so reloads/navigation don’t drop user work.

### 4. Styling & Assets Cleanup
- Fix the malformed `mail-bites-rotate-open` keyframe in `src/content/styles/animations.css` (extra braces currently break the animation).
- Remove the unused legacy builders/animation controller (`src/content/ui/**/*Builder.ts`, `AnimationController.ts`, `content.css`, etc.) and stop referencing them in `docs/planning/dependencies.md`.
- Stop copying orphaned assets (e.g., `assets/templates/composer-divider.html`) if the React components never load them.

### 5. Documentation Reliability
- Rebuild empty or stale docs (`docs/architecture.md`, `docs/project_roadmap.md`, `docs/updates.md`) so newcomers can trust the plan.
- Clean `docs/react-interface-map.md` (remove the stray external PDF link) and update sections that still describe unimplemented hooks/components.
- Refresh composer docs (`docs/composer-implementation.md`) to note the inline-at-top layout as the intended design.
- Audit `docs/planning/dependencies.md` to match the React codebase (drop `minimalInboxRenderer`, legacy builders, etc.).

### 6. Build & Tooling
- Adopt the Vite build so bundles ship minified with the correct React env flags (esbuild helper removed).
- Ensure Dev/Prod parity: document how to run a fast-refresh dev server and how to ship the optimized extension bundle.

### 7. Testing & Quality Gates
- Add the missing unit coverage for `navigation.ts`, `viewTracker.ts`, `useAnimations`, and at least the React components that hold core logic (Toolbar, ConversationItem, ComposerBox).
- Stand up the Playwright suite described in `tests/integration/README.md`, covering bootstrap + inbox interactions.
- Update `docs/testing.md` once the above tests exist so guidance matches reality.
