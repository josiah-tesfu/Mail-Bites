import { useEffect } from 'react';

import type { ViewContext } from '../viewTracker';
import { syncConversations } from '../gmail/syncConversations';

const SYNC_THROTTLE_MS = 300;

/**
 * Synchronizes Gmail conversations whenever the tracked main container mutates.
 * Throttles DOM-heavy parsing to avoid spamming Zustand with updates while Gmail
 * renders incremental changes.
 */
export function useGmailConversations(context: ViewContext | null): void {
  useEffect(() => {
    if (!context || !context.mainElement) {
      syncConversations(context);
      return;
    }

    let disposed = false;
    let lastRun = 0;
    let pendingTimeout: number | null = null;

    const runSync = () => {
      if (disposed) {
        return;
      }
      pendingTimeout = null;
      lastRun = Date.now();
      syncConversations(context);
    };

    const scheduleSync = () => {
      if (disposed) {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastRun;

      if (elapsed >= SYNC_THROTTLE_MS) {
        runSync();
        return;
      }

      if (pendingTimeout !== null) {
        return;
      }

      pendingTimeout = window.setTimeout(() => {
        runSync();
      }, SYNC_THROTTLE_MS - elapsed);
    };

    // Initial run when context is ready.
    scheduleSync();

    const observer = new MutationObserver(scheduleSync);
    observer.observe(context.mainElement, {
      childList: true,
      subtree: true
    });

    return () => {
      disposed = true;
      observer.disconnect();
      if (pendingTimeout !== null) {
        window.clearTimeout(pendingTimeout);
      }
    };
  }, [context]);
}
