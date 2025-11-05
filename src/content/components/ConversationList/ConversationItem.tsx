import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ConversationData } from '../../ui/conversationParser';
import type { ComposerActionType } from '../../ui/types/actionTypes';
import { useConversationStore } from '../../store/useConversationStore';
import { useAnimations } from '../../hooks/useAnimations';
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
  const { scheduleCollapseTimeout } = useAnimations();
  
  // Store subscriptions
  const expandedId = useConversationStore((state) => state.expandedId);
  const collapsingId = useConversationStore((state) => state.collapsingId);
  const highlightedId = useConversationStore((state) => state.highlightedId);
  const fadingOutIds = useConversationStore((state) => state.fadingOutIds);
  const conversationModes = useConversationStore((state) => state.conversationModes);
  const expandConversation = useConversationStore((state) => state.expandConversation);
  const collapseConversation = useConversationStore((state) => state.collapseConversation);
  const dismissConversation = useConversationStore((state) => state.dismissConversation);
  const finalizeDismiss = useConversationStore((state) => state.finalizeDismiss);

  // Local state
  const [isHovered, setIsHovered] = useState(false);
  const collapseTimeoutRef = useRef<(() => void) | null>(null);

  // Derived state
  const isExpanded = expandedId === conversation.id;
  const isCollapsing = collapsingId === conversation.id;
  const isHighlighted = highlightedId === conversation.id;
  const isFadingOut = fadingOutIds.has(conversation.id);
  const mode = conversationModes.get(conversation.id) || null;

  // Handle card click to toggle expand/collapse
  const handleClick = useCallback(() => {
    if (isExpanded) {
      collapseConversation(conversation.id);
    } else {
      expandConversation(conversation.id);
    }
  }, [isExpanded, expandConversation, collapseConversation, conversation.id]);

  // Handle mouse enter - cancel scheduled collapse
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    
    // Cancel any pending collapse
    if (collapseTimeoutRef.current) {
      collapseTimeoutRef.current();
      collapseTimeoutRef.current = null;
    }
  }, []);

  // Handle mouse leave - clear hover state only (no auto-collapse)
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Handle action button clicks (archive/delete)
  const handleDismiss = useCallback((type: 'archive' | 'delete') => {
    dismissConversation(conversation.id);
  }, [dismissConversation, conversation.id]);

  // Handle composer actions (send/delete/attachments)
  const handleComposerAction = useCallback((
    type: ComposerActionType,
    conv: ConversationData | null
  ) => {
    // TODO: Implement composer actions in Phase 4
    console.log('Composer action:', type, conv?.id);
  }, []);

  // Trigger bezel animation on expand
  const itemRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (isExpanded && itemRef.current && mode === 'read') {
      const item = itemRef.current;
      item.classList.remove('mail-bites-anim-bezel');
      void item.offsetWidth; // Force reflow
      item.classList.add('mail-bites-anim-bezel');
      
      const handleAnimationEnd = () => {
        item.classList.remove('mail-bites-anim-bezel');
      };
      
      item.addEventListener('animationend', handleAnimationEnd, { once: true });
      return () => {
        item.removeEventListener('animationend', handleAnimationEnd);
      };
    }
  }, [isExpanded, mode]);

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

  // Cleanup collapse timeout on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        collapseTimeoutRef.current();
      }
    };
  }, []);

  // Build CSS class names
  const classNames = [
    'mail-bites-item',
    isExpanded && 'is-expanded',
    isCollapsing && 'is-collapsing',
    isHovered && 'is-hovered',
    isHighlighted && 'is-active',
    isExpanded && mode !== 'read' && 'is-composer-active',
    isFadingOut && 'is-fading-out'
  ]
    .filter(Boolean)
    .join(' ');

  return (
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
                handleDismiss('archive');
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
                handleDismiss('delete');
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

      {/* Composer box when in reply/forward mode */}
      {mode && (mode === 'reply' || mode === 'forward') && (
        <ComposerBox
          conversation={conversation}
          mode={mode}
          isExpanded={true}
          onAction={handleComposerAction}
        />
      )}
    </article>
  );
});

ConversationItem.displayName = 'ConversationItem';

export { ConversationItem };
export default ConversationItem;
