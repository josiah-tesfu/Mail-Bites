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

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter out dismissed conversations (but keep fading out ones visible)
    filtered = filtered.filter((conv) => !dismissedIds.has(conv.id));

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        return (
          conv.sender.toLowerCase().includes(query) ||
          conv.subject.toLowerCase().includes(query) ||
          conv.snippet.toLowerCase().includes(query)
        );
      });
    }

    // Apply filter type (unread/read/draft)
    // Note: Legacy code filters in render() based on isUnread and readIds
    // For now, we keep it simple based on conversation.isUnread state
    if (activeFilter === 'unread') {
      filtered = filtered.filter((conv) => conv.isUnread);
    } else if (activeFilter === 'read') {
      filtered = filtered.filter((conv) => !conv.isUnread);
    } else if (activeFilter === 'draft') {
      // Draft filtering logic - currently no draft conversations exist
      // This is a placeholder for future implementation
      filtered = [];
    }

    return filtered;
  }, [conversations, dismissedIds, searchQuery, activeFilter]);

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
          {searchQuery.trim() 
            ? 'No conversations match your search.'
            : 'No conversations to display.'}
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
