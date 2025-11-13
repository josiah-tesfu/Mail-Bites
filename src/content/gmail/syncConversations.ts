import { logger } from '../logger';
import { useConversationStore, resetConversationStore, resetToolbarStore, resetComposerStore } from '../store';
import type { ConversationData } from '../ui/conversationParser';
import { extractConversationData } from '../ui/conversationParser';
import type { ConversationRow } from '../ui/types/types';
import type { ViewContext } from '../viewTracker';

export function syncConversations(context: ViewContext | null): void {
  const setConversations = useConversationStore.getState().setConversations;

  if (!context || !context.mainElement) {
    setConversations([]);
    resetConversationStore();
    resetToolbarStore();
    resetComposerStore();
    return;
  }

  const rows = Array.from(
    context.mainElement.querySelectorAll<ConversationRow>('tr.zA')
  );

  const conversations = rows
    .map((row, index) =>
      extractConversationData(row, `conversation-${index}`)
    )
    .filter((conversation): conversation is ConversationData =>
      Boolean(conversation)
    );

  logger.info('Synced Gmail conversations via service.', {
    count: conversations.length,
    url: context.url
  });

  setConversations(conversations);
}
