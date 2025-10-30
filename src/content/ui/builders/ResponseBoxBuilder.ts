import type { ComposerActionType, ComposerMode } from '../types/actionTypes.js';
import type { ConversationData } from '../conversationParser.js';
import {
  COMPOSER_ACTION_ICON_MAP,
  COMPOSER_ACTION_LABELS,
  resolveAssetPath
} from '../utils/constants.js';

/**
 * ResponseBoxBuilder - Builds response box DOM elements
 * Phase 3.1: Class created with method stubs, not yet integrated
 * Phase 3.7: Implemented response box building methods
 */
export class ResponseBoxBuilder {
  /**
   * Phase 3.7: Build complete response box
   * @param conversation Conversation data (null for standalone compose)
   * @param mode Composer mode (reply, forward, or compose)
   * @param onComposerAction Callback when composer action clicked
   * @param composeIndex Index for standalone compose boxes
   * @param isExpanded Whether compose box is expanded
   * @param draft Draft data for compose box
   */
  build(
    conversation: ConversationData | null,
    mode: ComposerMode,
    onComposerAction: (type: ComposerActionType, conversation: ConversationData | null, composeIndex?: number) => void,
    composeIndex?: number,
    _isExpanded?: boolean,
    draft?: { recipients: string; subject: string; message: string }
  ): HTMLElement {
    const box = document.createElement('div');
    box.className = 'mail-bites-response-box';
    if (conversation) {
      box.dataset.conversationId = conversation.id;
    }
    if (composeIndex !== undefined) {
      box.dataset.composeIndex = String(composeIndex);
    }
    box.dataset.responseMode = mode;
    
    const shouldAnimateSurface = true;
    if (shouldAnimateSurface) {
      box.classList.add('mail-bites-anim-bezel-surface');
      box.addEventListener(
        'animationend',
        () => {
          box.classList.remove('mail-bites-anim-bezel-surface');
        },
        { once: true }
      );
    }
    
    const body = document.createElement('div');
    body.className = 'mail-bites-composer-body';

    const recipientsSection = this.buildFieldSection('Recipients', 'recipients', draft?.recipients);
    const subjectSection = this.buildFieldSection('Subject', 'subject', draft?.subject);
    const messageSection = this.buildMessageSection(draft?.message);
    const actions = this.buildComposerActions(conversation, onComposerAction, composeIndex);
    
    body.appendChild(recipientsSection);
    body.appendChild(subjectSection);
    body.appendChild(messageSection);
    body.appendChild(actions);

    box.appendChild(body);
    
    return box;
  }

  /**
   * Build field section (Recipients or Subject)
   */
  private buildFieldSection(label: string, fieldName: string, defaultValue?: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'mail-bites-composer-section';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'mail-bites-composer-field-wrapper';
    
    const labelEl = document.createElement('label');
    labelEl.className = 'mail-bites-composer-label';
    labelEl.textContent = label;
    labelEl.htmlFor = `composer-${fieldName}`;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `composer-${fieldName}`;
    input.className = 'mail-bites-composer-input';
    input.setAttribute('aria-label', label);
    input.name = fieldName;
    if (defaultValue) {
      input.value = defaultValue;
    }
    
    // Hide label when input has value
    input.addEventListener('input', () => {
      if (input.value.length > 0) {
        wrapper.classList.add('has-value');
      } else {
        wrapper.classList.remove('has-value');
      }
    });
    
    // Set initial has-value state
    if (defaultValue && defaultValue.length > 0) {
      wrapper.classList.add('has-value');
    }
    
    wrapper.appendChild(labelEl);
    wrapper.appendChild(input);
    section.appendChild(wrapper);
    
    return section;
  }

  /**
   * Build message section
   */
  private buildMessageSection(defaultValue?: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'mail-bites-composer-section';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'mail-bites-composer-textarea';
    textarea.setAttribute('aria-label', 'Message body');
    if (defaultValue) {
      textarea.value = defaultValue;
    }
    
    // Auto-resize textarea on input
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
    
    // Set initial height if there's a default value
    if (defaultValue) {
      requestAnimationFrame(() => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      });
    }
    
    section.appendChild(textarea);
    
    return section;
  }

  /**
   * Build textarea input for composing email
   */
  private buildTextarea(): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.className = 'mail-bites-composer-textarea';
    textarea.placeholder = 'Type your message...';
    textarea.setAttribute('aria-label', 'Compose email');
    
    return textarea;
  }

  /**
   * Phase 3.7: Build composer action row
   */
  private buildComposerActions(
    conversation: ConversationData | null,
    onAction: (type: ComposerActionType, conversation: ConversationData | null, composeIndex?: number) => void,
    composeIndex?: number
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'mail-bites-action-row mail-bites-action-row--composer';

    const sendButton = this.buildComposerActionButton('send', conversation, onAction, composeIndex);
    const attachmentsButton = this.buildComposerActionButton('attachments', conversation, onAction, composeIndex);

    container.appendChild(sendButton);
    if (conversation) {
      const deleteButton = this.buildComposerActionButton('delete', conversation, onAction, composeIndex);
      container.appendChild(deleteButton);
    }
    container.appendChild(attachmentsButton);

    return container;
  }

  /**
   * Phase 3.7: Build individual composer action button
   */
  private buildComposerActionButton(
    type: ComposerActionType,
    conversation: ConversationData | null,
    onAction: (type: ComposerActionType, conversation: ConversationData | null, composeIndex?: number) => void,
    composeIndex?: number
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mail-bites-action-button mail-bites-composer-action-${type}`;
    button.title = COMPOSER_ACTION_LABELS[type] || '';
    button.setAttribute('aria-label', COMPOSER_ACTION_LABELS[type] || '');

    const icon = document.createElement('img');
    icon.src = resolveAssetPath(COMPOSER_ACTION_ICON_MAP[type] || '');
    icon.alt = '';
    icon.decoding = 'async';
    icon.loading = 'lazy';

    button.appendChild(icon);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      onAction(type, conversation, composeIndex);
    });

    return button;
  }
}
