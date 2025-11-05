import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);
  const [shouldMount, setShouldMount] = useState(isExpanded);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Handle expand/collapse animation
  useEffect(() => {
    if (isExpanded) {
      setShouldMount(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      
      // If not collapsing (switching conversations), unmount immediately
      if (!isCollapsing) {
        setShouldMount(false);
        return;
      }
      
      // Wait for transitionend to unmount (matching legacy behavior)
      const details = detailsRef.current;
      if (details) {
        let handled = false;
        const handleTransitionEnd = () => {
          if (handled) return;
          handled = true;
          setShouldMount(false);
        };
        
        details.addEventListener('transitionend', handleTransitionEnd, { once: true });
        
        // Fallback timeout matching AnimationController.COLLAPSE_TIMEOUT
        const timeoutId = window.setTimeout(handleTransitionEnd, 600);
        
        return () => {
          window.clearTimeout(timeoutId);
          details.removeEventListener('transitionend', handleTransitionEnd);
        };
      } else {
        setShouldMount(false);
      }
    }
  }, [isExpanded, isCollapsing]);

  const handleReplyClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setConversationMode(conversation.id, 'reply');
    },
    [setConversationMode, conversation.id]
  );

  const handleForwardClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setConversationMode(conversation.id, 'forward');
    },
    [setConversationMode, conversation.id]
  );

  if (!shouldMount) {
    return null;
  }

  return (
    <>
      {/* Snippet preview */}
      <div ref={detailsRef} className={`mail-bites-item-details ${isVisible ? 'is-visible' : ''}`}>
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
    </>
  );
};

export { ConversationDetails };
export default ConversationDetails;
