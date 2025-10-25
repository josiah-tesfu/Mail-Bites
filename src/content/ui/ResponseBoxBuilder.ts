import type { ComposerActionType } from './types/actionTypes.js';
import type { ConversationData } from './conversationParser.js';
import {
  COMPOSER_ACTION_ICON_MAP,
  COMPOSER_ACTION_LABELS,
  resolveAssetPath
} from './constants.js';

/**
 * ResponseBoxBuilder - Builds response box DOM elements
 * Phase 3.1: Class created with method stubs, not yet integrated
 * Phase 3.7: Implemented response box building methods
 */
export class ResponseBoxBuilder {
  /**
   * Phase 3.7: Build complete response box
   * @param conversation Conversation data
   * @param onComposerAction Callback when composer action clicked
   */
  build(
    conversation: ConversationData,
    onComposerAction: (type: ComposerActionType, conversation: ConversationData) => void
  ): HTMLElement {
    const box = document.createElement('div');
    box.className = 'mail-bites-response-box mail-bites-anim-bezel-surface';
    box.dataset.conversationId = conversation.id;
    box.dataset.responseMode = conversation.mode;
    
    box.addEventListener('animationend', () => {
      box.classList.remove('mail-bites-anim-bezel-surface');
    }, { once: true });
    
    const actions = this.buildComposerActions(conversation, onComposerAction);
    const filler = document.createElement('div');
    filler.className = 'mail-bites-response-body';
    
    box.appendChild(filler);
    box.appendChild(actions);
    
    return box;
  }

  /**
   * Phase 3.7: Build composer action row
   */
  private buildComposerActions(
    conversation: ConversationData,
    onAction: (type: ComposerActionType, conversation: ConversationData) => void
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'mail-bites-action-row mail-bites-action-row--composer';

    const sendButton = this.buildComposerActionButton('send', conversation, onAction);
    const deleteButton = this.buildComposerActionButton('delete', conversation, onAction);

    container.appendChild(sendButton);
    container.appendChild(deleteButton);

    return container;
  }

  /**
   * Phase 3.7: Build individual composer action button
   */
  private buildComposerActionButton(
    type: ComposerActionType,
    conversation: ConversationData,
    onAction: (type: ComposerActionType, conversation: ConversationData) => void
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
      onAction(type, conversation);
    });

    return button;
  }
}
