import { useEffect } from 'react';

import type { ViewContext } from '../viewTracker';
import { syncConversations } from '../gmail/syncConversations';

/**
 * React hook that synchronizes Gmail's DOM rows with the conversation store.
 * Runs whenever the Gmail view context changes (URL/hash/mutations) and
 * normalizes `tr.zA` rows into ConversationData objects for React to render.
 */
export function useGmailConversations(context: ViewContext | null): void {
  useEffect(() => {
    syncConversations(context);
  }, [context]);
}
