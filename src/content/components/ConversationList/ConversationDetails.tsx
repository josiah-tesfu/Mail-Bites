import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ConversationData } from '../../ui/conversationParser';
import { useConversationStore } from '../../store/useConversationStore';

interface ConversationDetailsProps {
  conversation: ConversationData;
  isExpanded: boolean;
  isCollapsing: boolean;
  mode: 'read' | 'reply' | 'forward' | null;
}

/**
 * ConversationDetails.tsx
 * 
 * Expanded conversation preview with sender, subject, snippet, and action links.
 * 
 * Responsibilities:
 * - Display conversation snippet in expanded state
 * - Render reply/forward action buttons when in 'read' mode
 * - Handle mode transitions (read → reply, read → forward)
 * - Stop event propagation on action clicks
 */
const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  conversation,
  isExpanded,
  isCollapsing,
  mode
}) => {
  const setConversationMode = useConversationStore((state) => state.setConversationMode);
  const setInlineComposerCollapsed = useConversationStore((state) => state.setInlineComposerCollapsed);
  const markAsRead = useConversationStore((state) => state.markAsRead);
  const [isVisible, setIsVisible] = useState(isExpanded);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the expanded height available as a CSS variable so collapsed transitions
  // (read collapse) can animate from the real height instead of a large fallback.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      const measuredHeight =
        container.scrollHeight || container.getBoundingClientRect().height;
      container.style.setProperty(
        '--details-expanded-max-height',
        `${measuredHeight}px`
      );
    };

    updateHeight();

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => {
        updateHeight();
      });
      observer.observe(container);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [conversation.snippet, isExpanded, mode]);

  // Handle expand/collapse animation
  useEffect(() => {
    if (isExpanded) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      requestAnimationFrame(() => setIsVisible(false));
    }
  }, [isExpanded]);

  const handleReplyClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setConversationMode(conversation.id, 'reply');
      setInlineComposerCollapsed(conversation.id, false);
    },
    [setConversationMode, setInlineComposerCollapsed, conversation.id]
  );

  const handleForwardClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setConversationMode(conversation.id, 'forward');
      setInlineComposerCollapsed(conversation.id, false);
    },
    [setConversationMode, setInlineComposerCollapsed, conversation.id]
  );

  return (
    <div
      ref={containerRef}
      className={`mail-bites-details-container ${isVisible ? 'is-expanded' : ''}`}
    >
      {/* Snippet preview */}
      <div className="mail-bites-item-details">
        {conversation.snippet || 'No preview available for this conversation.'}
      </div>

      {/* Action buttons (reply/forward) - only show in read mode */}
      {mode === 'read' && (
        <div className="mail-bites-action-row mail-bites-action-row--card">
          <button
            type="button"
            className="mail-bites-action-button mail-bites-preview-action-reply"
            title="Reply to conversation"
            aria-label="Reply to conversation"
            onClick={handleReplyClick}
          >
            <img
              src={chrome.runtime.getURL('reply-button.svg')}
              alt=""
              decoding="async"
              loading="lazy"
            />
          </button>
          <button
            type="button"
            className="mail-bites-action-button mail-bites-preview-action-forward"
            title="Forward conversation"
            aria-label="Forward conversation"
            onClick={handleForwardClick}
          >
            <img
              src={chrome.runtime.getURL('forward-button.svg')}
              alt=""
              decoding="async"
              loading="lazy"
            />
          </button>
        </div>
      )}
    </div>
  );
};

export { ConversationDetails };
export default ConversationDetails;
