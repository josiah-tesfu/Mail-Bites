1. **Disconnect Legacy DOM Renderer**  
   Retire `MinimalInboxRenderer`’s DOM-building responsibilities (`src/content/ui/minimalInboxRenderer.ts`). Replace Gmail-row parsing plus UIState mutations with a thin data-harvesting layer (likely a hook) that only feeds normalized data into the shared Zustand stores. Remove or quarantine unused modules in `src/content/ui/builders` once React owns rendering.

2. **Unify State Management**  
   Choose Zustand as the single source of truth. Port any remaining `UIState` fields (click-outside flags, compose animation state, etc.) into `useConversationStore`, `useToolbarStore`, or `useComposerStore`, then delete `UIState.ts`. Update all consumers and utilities to read/write exclusively through the stores.

3. **Reimplement Event Handling in React**  
   Move conversation hover, expand/collapse, dismiss, and click-outside handling from `EventCoordinator.ts` into React components/hooks (e.g., `ConversationItem`, `MailBitesApp`). Remove the additional listeners once React-driven handlers cover every scenario to avoid conflicting state updates.

4. **Finish Toolbar & Filtering**  
   Wire toolbar buttons to real filtering logic by ensuring `ConversationList` receives both unread and read conversations from the store. Remove the unread-only gating in `MinimalInboxRenderer.render()`, honor the toolbar’s filter order, and keep search debounced across the full list.

5. **Complete Composer Functionality**  
   Implement the composer action handlers: `handleStandaloneComposerAction` inside `MailBitesApp`, plus per-conversation composer actions in `ConversationItem`. Actions should persist drafts through `useComposerStore`, update conversation modes, remove compose boxes on delete/send, and drop reliance on `ComposerBox builder (legacy)`.

6. **Modernize Gmail Data Refresh**  
   Extract the DOM parsing in `conversationParser.ts` into a dedicated Gmail-sync service or hook invoked from the tracker effect. Keep `GmailViewTracker` focused on notifying when Gmail changes, while the new layer updates Zustand without going through `MinimalInboxRenderer.render()`.

7. **Cleanup & Tests**  
   Delete unused legacy files (`EventCoordinator.ts`, builder classes, redundant CSS selectors) once parity is confirmed. Add Vitest coverage for store transitions, toolbar filtering, and composer behaviors, plus optional Playwright smoke tests to ensure the overlay reacts correctly to mocked Gmail DOM changes.

8. **Documentation & Styles**  
   Update README/docs to describe the React architecture, including how Gmail data flows into Zustand and how to add new UI features. Audit `src/content/styles` to remove selectors aimed at the legacy DOM and ensure build tooling copies only the styles and assets required by the React implementation.
