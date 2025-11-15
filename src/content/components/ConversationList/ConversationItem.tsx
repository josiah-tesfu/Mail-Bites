import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ConversationData } from '../../ui/conversationParser';
import type { DraftData } from '../../types/draft';
import type { ComposerActionType } from '../../ui/types/actionTypes';
import { useConversationStore } from '../../store/useConversationStore';
import { logger } from '../../logger';
import { animationTimings } from '../../hooks/useAnimations';
import ConversationDetails from './ConversationDetails';
import ComposerBox from '../ComposerBox';

interface ConversationItemProps {
  conversation: ConversationData;
}

/**
 * ConversationItem.tsx
 * 
 * Individual conversation card with expand/collapse, action buttons, and nested composer.
 * 
 * Responsibilities:
 * - Expand conversation on click (if collapsed)
 * - Schedule collapse on mouse leave (600ms delay)
 * - Cancel collapse on mouse enter
 * - Render header (sender, subject, date)
 * - Render action buttons (archive, delete) on hover
 * - Render expanded details (snippet)
 * - Apply animation classes (is-expanded, is-collapsing, is-hovered)
 */
const ConversationItem: React.FC<ConversationItemProps> = memo(({ conversation }) => {
  // Store subscriptions
  const expandedId = useConversationStore((state) => state.expandedId);
  const collapsingId = useConversationStore((state) => state.collapsingId);
  const highlightedId = useConversationStore((state) => state.highlightedId);
  const fadingOutIds = useConversationStore((state) => state.fadingOutIds);
  const conversationModes = useConversationStore((state) => state.conversationModes);
  const setConversationMode = useConversationStore((state) => state.setConversationMode);
  const expandConversation = useConversationStore((state) => state.expandConversation);
  const collapseConversation = useConversationStore((state) => state.collapseConversation);
  const dismissConversation = useConversationStore((state) => state.dismissConversation);
  const finalizeDismiss = useConversationStore((state) => state.finalizeDismiss);
  const markAsRead = useConversationStore((state) => state.markAsRead);
  const addHoveredId = useConversationStore((state) => state.addHoveredId);
  const removeHoveredId = useConversationStore((state) => state.removeHoveredId);
  const clearCollapseState = useConversationStore((state) => state.clearCollapseState);
  const inlineDraft = useConversationStore((state) => state.inlineDrafts.get(conversation.id));
  const clearInlineDraft = useConversationStore((state) => state.clearInlineDraft);
  const isComposerCollapsed = useConversationStore((state) => state.inlineComposerCollapsed.has(conversation.id));
  const setInlineComposerCollapsed = useConversationStore((state) => state.setInlineComposerCollapsed);

  // Local state
  const [isHovered, setIsHovered] = useState(false);
  const pendingReadRef = useRef(false);

  // Derived state
  const conversationId = conversation.id;
  const isExpanded = expandedId === conversationId;
  const isCollapsing = collapsingId === conversation.id;
  const isHighlighted = highlightedId === conversation.id;
  const isFadingOut = fadingOutIds.has(conversation.id);
  const mode = conversationModes.get(conversation.id) || null;

  const handleInlineDraftChange = useCallback((nextDraft: DraftData) => {
    useConversationStore.getState().setInlineDraft(conversationId, nextDraft);
  }, [conversationId]);

  const handleInlineExpand = useCallback(() => {
    setInlineComposerCollapsed(conversationId, false);
  }, [setInlineComposerCollapsed, conversationId]);

  // Handle card click to toggle expand/collapse
  const handleClick = useCallback(() => {
    if (isCollapsing) {
      return;
    }

    if (isExpanded) {
      setIsHovered(false);
      removeHoveredId(conversation.id);
      if (mode && mode !== 'read') {
        setInlineComposerCollapsed(conversation.id, true);
      }
      collapseConversation(conversation.id);
    } else {
      expandConversation(conversation.id);
      setIsHovered(true);
      addHoveredId(conversation.id);
    }
  }, [isCollapsing, isExpanded, expandConversation, collapseConversation, conversation.id, mode, setInlineComposerCollapsed, removeHoveredId, addHoveredId]);

  // Handle mouse enter - cancel scheduled collapse
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    addHoveredId(conversation.id);
  }, [addHoveredId, conversation.id]);

  // Handle mouse leave - clear hover state only (no auto-collapse)
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    removeHoveredId(conversation.id);
  }, [removeHoveredId, conversation.id]);

  // Handle action button clicks (archive/delete)
  const handleDismiss = useCallback(() => {
    dismissConversation(conversation.id);
    removeHoveredId(conversation.id);
  }, [dismissConversation, removeHoveredId, conversation.id]);

  // Handle composer actions (send/delete/attachments)
  const handleComposerAction = useCallback((
    type: ComposerActionType,
    conv: ConversationData | null
  ) => {
    if (!conv) {
      return;
    }

    if (type === 'close') {
      setInlineComposerCollapsed(conv.id, true);
      return;
    }

    if (type === 'delete') {
      setConversationMode(conv.id, 'read');
      setInlineComposerCollapsed(conv.id, false);
      clearInlineDraft(conv.id);
      return;
    }

    if (type === 'send') {
      markAsRead(conv.id);
      setConversationMode(conv.id, 'read');
      setInlineComposerCollapsed(conv.id, false);
      clearInlineDraft(conv.id);
      logger.info('Inline reply sent (placeholder).', { conversationId: conv.id });
      return;
    }

    logger.info('Inline composer action not implemented.', { type, conversationId: conv.id });
  }, [markAsRead, setConversationMode, setInlineComposerCollapsed, clearInlineDraft]);

  // Trigger bezel animation on expand
  const itemRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mode || mode === 'read') {
      if (isComposerCollapsed) {
        setInlineComposerCollapsed(conversation.id, false);
      }
      setIsHovered(false);
      removeHoveredId(conversation.id);
    }
  }, [mode, conversation.id, removeHoveredId, setInlineComposerCollapsed, isComposerCollapsed]);

  useEffect(() => {
    if (!isExpanded) {
      setIsHovered(false);
      removeHoveredId(conversation.id);
    }
  }, [isExpanded, conversation.id, removeHoveredId]);

  useEffect(() => {
    if (isExpanded && conversation.isUnread) {
      pendingReadRef.current = true;
    }
  }, [isExpanded, conversation.isUnread]);

  useEffect(() => {
    if (!conversation.isUnread) {
      pendingReadRef.current = false;
    }
  }, [conversation.isUnread]);

  useEffect(() => {
    if (
      pendingReadRef.current &&
      !isExpanded &&
      !isCollapsing &&
      conversation.isUnread
    ) {
      pendingReadRef.current = false;
      markAsRead(conversationId);
    }
  }, [conversation.isUnread, conversationId, isCollapsing, isExpanded, markAsRead]);

  // Handle fade-out animation
  useEffect(() => {
    if (isFadingOut && itemRef.current) {
      const item = itemRef.current;
      
      // Disable pointer events during fade-out
      item.style.pointerEvents = 'none';
      
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        item.removeEventListener('transitionend', onTransitionEnd);
        finalizeDismiss(conversation.id);
      };
      
      // Fallback timeout (100ms per legacy AnimationController.ITEM_FADE_OUT_DURATION)
      const fallbackId = window.setTimeout(cleanup, 100);
      
      const onTransitionEnd = (event: TransitionEvent) => {
        if (event.propertyName !== 'opacity') return;
        window.clearTimeout(fallbackId);
        cleanup();
      };
      
      item.addEventListener('transitionend', onTransitionEnd);
      
      return () => {
        window.clearTimeout(fallbackId);
        item.removeEventListener('transitionend', onTransitionEnd);
        item.style.pointerEvents = '';
      };
    }
  }, [isFadingOut, finalizeDismiss, conversation.id]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!isCollapsing) {
      if (container) {
        container.style.removeProperty('height');
        container.style.removeProperty('overflow');
      }
      return;
    }

    if (!container) {
      clearCollapseState();
      return;
    }

    const measuredHeight =
      container.scrollHeight || container.getBoundingClientRect().height;

    let finished = false;
    const finishCollapse = () => {
      if (finished) {
        return;
      }
      finished = true;
      container.style.removeProperty('height');
      container.style.removeProperty('overflow');
      if (useConversationStore.getState().collapsingId === conversation.id) {
        clearCollapseState();
      }
    };

    const fallbackDuration = animationTimings.COLLAPSE_TRANSITION_DURATION;

    if (measuredHeight > 0) {
      container.style.height = `${measuredHeight}px`;
      container.style.overflow = 'hidden';

      const rafId = window.requestAnimationFrame(() => {
        container.style.height = '0px';
      });

      const handleTransitionEnd = (event: TransitionEvent) => {
        if (event.target !== container || event.propertyName !== 'height') {
          return;
        }
        finishCollapse();
      };

      container.addEventListener('transitionend', handleTransitionEnd);
      const fallbackId = window.setTimeout(finishCollapse, fallbackDuration);

      return () => {
        window.cancelAnimationFrame(rafId);
        container.removeEventListener('transitionend', handleTransitionEnd);
        window.clearTimeout(fallbackId);
      };
    }

    const fallbackId = window.setTimeout(finishCollapse, fallbackDuration);
    return () => {
      window.clearTimeout(fallbackId);
    };
  }, [isCollapsing, clearCollapseState, conversation.id]);

  const showExpandedStyles = isExpanded || isCollapsing;
  const forceHoverState = isCollapsing && (isHovered || isHighlighted);
  const effectiveHovered = isHovered || forceHoverState;
  const effectiveHighlighted = isHighlighted || forceHoverState;

  // Build CSS class names
  const classNames = [
    'mail-bites-item',
    'mail-bites-card',
    showExpandedStyles && 'is-expanded',
    isCollapsing && 'is-collapsing',
    effectiveHovered && 'is-hovered',
    effectiveHighlighted && 'is-active',
    showExpandedStyles && mode !== 'read' && 'is-composer-active',
    isFadingOut && 'is-fading-out'
  ]
    .filter(Boolean)
    .join(' ');

  const threadClasses = [
    'mail-bites-thread',
    isCollapsing && 'is-collapsing'
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={threadClasses}
      data-conversation-id={conversation.id}
    >
      <article
        ref={itemRef}
        className={classNames}
        data-conversation-id={conversation.id}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="mail-bites-item-header">
          <div className="mail-bites-header-main">
            <span className="mail-bites-sender">
              {conversation.sender || 'Unknown sender'}
            </span>
            <span className="mail-bites-subject">
              {conversation.subject || '(No subject)'}
            </span>
          </div>
          
          <div className="mail-bites-header-right">
            <span className="mail-bites-date">{conversation.date}</span>
            
            {/* Action buttons (archive/delete) */}
            <div className="mail-bites-actions">
              <button
                type="button"
                className="mail-bites-action mail-bites-action-archive"
                title="Archive"
                aria-label="Archive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
              >
                <img
                  src={chrome.runtime.getURL('archive-button.svg')}
                  alt=""
                  decoding="async"
                  loading="lazy"
                />
              </button>
              <button
                type="button"
                className="mail-bites-action mail-bites-action-delete"
                title="Delete"
                aria-label="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
              >
                <img
                  src={chrome.runtime.getURL('delete-button.svg')}
                  alt=""
                  decoding="async"
                  loading="lazy"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded details with reply/forward actions */}
        <ConversationDetails
          conversation={conversation}
          isExpanded={isExpanded}
          isCollapsing={isCollapsing}
          mode={mode}
        />
      </article>

      {/* Composer box when in reply/forward mode */}
      {(isExpanded || isCollapsing) && mode && (mode === 'reply' || mode === 'forward') && (
        <div className="mail-bites-inline-composer">
          <ComposerBox
            conversation={conversation}
            mode={mode}
            isExpanded={!isComposerCollapsed}
            draft={inlineDraft}
            onDraftChange={handleInlineDraftChange}
            onExpandCollapsed={handleInlineExpand}
            onAction={handleComposerAction}
          />
        </div>
      )}
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

export { ConversationItem };
export default ConversationItem;
