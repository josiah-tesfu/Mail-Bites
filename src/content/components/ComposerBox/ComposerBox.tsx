import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ConversationData } from '../../ui/conversationParser';
import type { ComposerMode, ComposerActionType } from '../../ui/types/actionTypes';
import type { DraftData } from '../../types/draft';
import { useComposerStore } from '../../store/useComposerStore';
import CollapsedDraft from './CollapsedDraft';
import ComposerActions from './ComposerActions';
import ComposerField from './ComposerField';

interface ComposerBoxProps {
  conversation: ConversationData | null;
  mode: ComposerMode;
  composeIndex?: number;
  isExpanded?: boolean;
  draft?: DraftData;
  onDraftChange?: (draft: DraftData) => void;
  onAction: (
    type: ComposerActionType,
    conversation: ConversationData | null,
    composeIndex?: number
  ) => void;
  onExpandCollapsed?: () => void;
}

/**
 * ComposerBox.tsx
 * 
 * Email composer with expanded/collapsed states.
 * 
 * Responsibilities:
 * - Render expanded composer (recipients, subject, message fields)
 * - Render collapsed draft preview
 * - Handle bezel surface animation on expand
 * - Track draft state and auto-save
 * - Render composer action buttons (send, delete, attachments)
 * - Apply animation classes (mail-bites-anim-bezel-surface, is-collapsing)
 */
const ComposerBox: React.FC<ComposerBoxProps> = memo(({
  conversation,
  mode,
  composeIndex,
  isExpanded = true,
  draft,
  onDraftChange,
  onAction,
  onExpandCollapsed
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [localDraft, setLocalDraft] = useState<DraftData>(() => ({
    to: draft?.to || '',
    subject: draft?.subject || '',
    body: draft?.body || '',
    attachments: draft?.attachments,
    isDirty: draft?.isDirty || false,
    timestamp: draft?.timestamp || Date.now()
  }));
  const isInlineComposer = Boolean(conversation && mode !== 'compose');

  // Store actions
  const saveDraft = useComposerStore((state) => state.saveDraft);

  // Update local draft when prop changes
  useEffect(() => {
    if (draft) {
      setLocalDraft(draft);
    }
  }, [draft]);

  // Auto-save draft on field change (standalone compose only)
  useEffect(() => {
    if (composeIndex !== undefined && localDraft.isDirty) {
      saveDraft(composeIndex, {
        ...localDraft,
        isDirty: false,
        timestamp: Date.now()
      });
    }
  }, [localDraft, composeIndex, saveDraft]);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof DraftData, value: string) => {
    setLocalDraft((prev) => ({
      ...prev,
      [field]: value,
      isDirty: true,
      timestamp: Date.now()
    }));
  }, []);

  const latestDraftRef = useRef(localDraft);
  useEffect(() => {
    latestDraftRef.current = localDraft;
  }, [localDraft]);

  const inlineDraftContextRef = useRef({
    conversation,
    onDraftChange,
    isInlineComposer
  });

  useEffect(() => {
    inlineDraftContextRef.current = {
      conversation,
      onDraftChange,
      isInlineComposer
    };
  }, [conversation, onDraftChange, isInlineComposer]);

  const persistInlineDraft = useCallback(() => {
    const { conversation: conv, onDraftChange: draftCb, isInlineComposer: inline } = inlineDraftContextRef.current;
    if (inline && draftCb && conv) {
      draftCb({
        ...latestDraftRef.current,
        isDirty: false,
        timestamp: Date.now()
      });
    }
  }, []);

  useEffect(() => {
    if (!isExpanded) {
      persistInlineDraft();
    }
  }, [isExpanded, persistInlineDraft]);

  useEffect(() => {
    return () => {
      persistInlineDraft();
    };
  }, [persistInlineDraft]);

  // Trigger bezel surface animation on mount (expanded state only)
  useEffect(() => {
    if (isExpanded && boxRef.current) {
      const box = boxRef.current;
      box.classList.remove('mail-bites-anim-bezel-surface');
      void box.offsetWidth; // Force reflow
      box.classList.add('mail-bites-anim-bezel-surface');
      
      const handleAnimationEnd = () => {
        box.classList.remove('mail-bites-anim-bezel-surface');
      };
      
      box.addEventListener('animationend', handleAnimationEnd, { once: true });
      return () => {
        box.removeEventListener('animationend', handleAnimationEnd);
      };
    }
  }, [isExpanded]);

  // Handle action button clicks
  const handleAction = useCallback((type: ComposerActionType) => {
    if (type === 'close') {
      persistInlineDraft();
    }
    onAction(type, conversation, composeIndex);
  }, [onAction, conversation, composeIndex, persistInlineDraft]);

  // Handle expand request
  const handleExpand = useCallback(() => {
    if (onExpandCollapsed) {
      onExpandCollapsed();
    }
  }, [onExpandCollapsed]);

  // Render collapsed draft preview
  const [isCollapsedHovered, setIsCollapsedHovered] = useState(false);

  useEffect(() => {
    if (isExpanded || !isInlineComposer) {
      setIsCollapsedHovered(false);
    }
  }, [isExpanded, isInlineComposer]);

  if (!isExpanded) {
    const collapsedClasses = [
      'mail-bites-response-box',
      'mail-bites-response-box--collapsed',
      'mail-bites-item',
      'mail-bites-card',
      'mail-bites-card--collapsed'
    ];

    if (isInlineComposer) {
      collapsedClasses.push('is-expanded', 'is-active');
      if (isCollapsedHovered) {
        collapsedClasses.push('is-hovered');
      }
    }

    const collapsedHandlers: React.HTMLAttributes<HTMLDivElement> = isInlineComposer
      ? {
          onClick: handleExpand,
          onMouseEnter: () => setIsCollapsedHovered(true),
          onMouseLeave: () => setIsCollapsedHovered(false)
        }
      : {};

    return (
      <div
        ref={boxRef}
        className={collapsedClasses.join(' ')}
        data-conversation-id={conversation?.id}
        data-compose-index={composeIndex}
        data-response-mode={mode}
        {...collapsedHandlers}
      >
        <CollapsedDraft
          recipient={localDraft.to || ''}
          subject={localDraft.subject || ''}
          timestamp={localDraft.timestamp}
          onDelete={() => handleAction('delete')}
        />
      </div>
    );
  }

  // Render expanded composer
  return (
    <div
      ref={boxRef}
      className="mail-bites-response-box mail-bites-card"
      data-conversation-id={conversation?.id}
      data-compose-index={composeIndex}
      data-response-mode={mode}
    >
      <div className="mail-bites-composer-body">
        {/* Recipients field */}
        <ComposerField
          name="to"
          label="Recipients"
          value={localDraft.to}
          onChange={(value) => handleFieldChange('to', value)}
        />

        {/* Subject field */}
        <ComposerField
          name="subject"
          label="Subject"
          value={localDraft.subject}
          onChange={(value) => handleFieldChange('subject', value)}
        />

        {/* Message field */}
        <ComposerField
          name="body"
          label="Message body"
          value={localDraft.body}
          onChange={(value) => handleFieldChange('body', value)}
          isTextarea={true}
        />

        {/* Action buttons */}
        <ComposerActions
          onSend={() => handleAction('send')}
          onClose={() => handleAction('close')}
          onDelete={() => handleAction('delete')}
          onAttach={() => handleAction('attachments')}
        />
      </div>
    </div>
  );
});

ComposerBox.displayName = 'ComposerBox';

export { ComposerBox };
export default ComposerBox;
