import React, { useMemo, useRef } from 'react';
import { useConversationStore } from '../../store/useConversationStore';
import { useToolbarStore } from '../../store/useToolbarStore';
import ConversationItem from './ConversationItem';

interface ConversationListProps {
  composeBoxes?: React.ReactNode;
}

/**
 * ConversationList.tsx
 * 
 * Container for conversation cards. Applies filtering based on search query and 
 * active filter type. Passive container that manages scroll behavior.
 * 
 * Responsibilities:
 * - Filter conversations by search query
 * - Filter conversations by active filter type (unread/read/draft)
 * - Exclude dismissed conversations
 * - Provide container for scroll restoration
 * - Render ConversationItem children (deferred to Phase 3)
 * - Render standalone compose boxes at top of list
 */
const ConversationList: React.FC<ConversationListProps> = ({ composeBoxes }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Store subscriptions
  const conversations = useConversationStore((state) => state.conversations);
  const dismissedIds = useConversationStore((state) => state.dismissedIds);
  const fadingOutIds = useConversationStore((state) => state.fadingOutIds);
  const highlightedId = useConversationStore((state) => state.highlightedId);
  const searchQuery = useToolbarStore((state) => state.searchQuery);
  const filterButtonOrder = useToolbarStore((state) => state.filterButtonOrder);

  // Active filter is the first button in the order
  const activeFilter = filterButtonOrder[0];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasSearchQuery = normalizedQuery.length > 0;

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter out dismissed conversations (but keep fading out ones visible)
    filtered = filtered.filter((conv) => !dismissedIds.has(conv.id));

    if (normalizedQuery) {
      filtered = filtered.filter((conv) => {
        const sender = conv.sender.toLowerCase();
        const subject = conv.subject.toLowerCase();
        const snippet = conv.snippet.toLowerCase();
        return (
          sender.includes(normalizedQuery) ||
          subject.includes(normalizedQuery) ||
          snippet.includes(normalizedQuery)
        );
      });
    }

    if (activeFilter === 'unread') {
      filtered = filtered.filter((conv) => conv.isUnread);
    } else if (activeFilter === 'read') {
      filtered = filtered.filter((conv) => !conv.isUnread);
    } else if (activeFilter === 'draft') {
      filtered = [];
    }

    return filtered;
  }, [conversations, dismissedIds, normalizedQuery, activeFilter]);

  return (
    <div
      ref={containerRef}
      className={`mail-bites-inbox ${highlightedId ? 'has-highlight' : ''}`}
      data-highlight-id={highlightedId || undefined}
    >
      {/* Standalone compose boxes render at top of list */}
      {composeBoxes}
      
      {filteredConversations.length === 0 ? (
        <div
          className="mail-bites-empty-state"
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#5f6368',
            fontSize: '14px'
          }}
        >
          {hasSearchQuery
            ? 'No conversations match your search.'
            : activeFilter === 'draft'
              ? 'No drafts to display.'
              : 'No conversations match this filter.'}
        </div>
      ) : (
        filteredConversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
          />
        ))
      )}
    </div>
  );
};

export default ConversationList;
