import { useEffect, useRef } from 'react';

import type { ViewContext } from '../viewTracker';
import { resetComposerStore, resetConversationStore, resetToolbarStore } from '../store';

/**
 * Guards global store resets so they only fire when Gmail truly swaps out its
 * primary `div[role="main"]` container (which indicates a full render cycle).
 * Temporary DOM gaps (common during SPA navigation) no longer wipe compose
 * drafts or toolbar state.
 */
export function useMainElementReset(viewContext: ViewContext | null): void {
  const lastMainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const nextMain = viewContext?.mainElement ?? null;
    if (!nextMain) {
      return;
    }

    const previousMain = lastMainRef.current;
    if (previousMain && previousMain !== nextMain) {
      resetConversationStore();
      resetToolbarStore();
      resetComposerStore();
    }

    lastMainRef.current = nextMain;
  }, [viewContext?.mainElement]);
}
