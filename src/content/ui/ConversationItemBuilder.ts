import type { ActionType, PreviewActionType } from './types/actionTypes.js';
import type { ConversationData } from './conversationParser.js';
import {
  ACTION_ICON_MAP,
  ACTION_LABELS,
  PREVIEW_ACTION_ICON_MAP,
  PREVIEW_ACTION_LABELS,
  resolveAssetPath
} from './constants.js';

/**
 * ConversationItemBuilder - Builds conversation item DOM elements
 * Phase 3.1: Class created with method stubs, not yet integrated
 */
export class ConversationItemBuilder {
  /**
   * Phase 3.2: Extract header building logic
   * Phase 3.4: Updated to call buildActions directly
   */
  buildHeader(
    conversation: ConversationData,
    onDismiss: (button: HTMLButtonElement, type: ActionType) => void
  ): HTMLElement {
    const header = document.createElement('div');
    header.className = 'mail-bites-item-header';

    const main = document.createElement('div');
    main.className = 'mail-bites-header-main';

    const sender = document.createElement('span');
    sender.className = 'mail-bites-sender';
    sender.textContent = conversation.sender || 'Unknown sender';

    const subject = document.createElement('span');
    subject.className = 'mail-bites-subject';
    subject.textContent = conversation.subject || '(No subject)';

    main.appendChild(sender);
    main.appendChild(subject);

    const date = document.createElement('span');
    date.className = 'mail-bites-date';
    date.textContent = conversation.date || '';

    // Phase 3.4: Call buildActions directly
    const actions = this.buildActions(onDismiss);

    const right = document.createElement('div');
    right.className = 'mail-bites-header-right';
    right.appendChild(date);
    right.appendChild(actions);

    header.appendChild(main);
    header.appendChild(right);

    return header;
  }

  // Phase 3.3: Extract details building logic
  buildDetails(conversation: ConversationData, skipExpandAnimation: boolean): HTMLElement {
    const details = document.createElement('div');
    details.className = 'mail-bites-item-details';
    details.textContent =
      conversation.snippet || 'No preview available for this conversation.';

    // Animation timing maintained in renderer
    // If re-rendering an already expanded email, add is-visible immediately to prevent flicker
    // If initial expansion, delay adding is-visible for smooth fade-in animation
    if (skipExpandAnimation) {
      details.classList.add('is-visible');
    } else {
      requestAnimationFrame(() => {
        details.classList.add('is-visible');
      });
    }

    return details;
  }

  /**
   * Phase 3.4: Build header action buttons (archive, delete)
   * @param onDismiss Callback when action button is clicked
   */
  buildActions(onDismiss: (button: HTMLButtonElement, type: ActionType) => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'mail-bites-actions';

    const archiveButton = this.buildActionButton('archive', onDismiss);
    const deleteButton = this.buildActionButton('delete', onDismiss);

    container.appendChild(archiveButton);
    container.appendChild(deleteButton);

    return container;
  }

  /**
   * Phase 3.4: Build individual action button
   */
  private buildActionButton(
    type: ActionType,
    onDismiss: (button: HTMLButtonElement, type: ActionType) => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mail-bites-action mail-bites-action-${type}`;
    button.title = ACTION_LABELS[type] || '';
    button.setAttribute('aria-label', ACTION_LABELS[type] || '');

    const icon = document.createElement('img');
    icon.src = resolveAssetPath(ACTION_ICON_MAP[type] || '');
    icon.alt = '';
    icon.decoding = 'async';
    icon.loading = 'lazy';

    button.appendChild(icon);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      onDismiss(button, type);
    });

    return button;
  }

  /**
   * Phase 3.4: Build preview action row (reply, forward)
   * @param conversation Conversation data
   * @param onActionClick Callback when preview action is clicked
   */
  buildPreviewActions(
    conversation: ConversationData,
    onActionClick: (type: PreviewActionType, conversation: ConversationData) => void
  ): HTMLElement | null {
    if (conversation.mode !== 'read') {
      return null;
    }

    const container = document.createElement('div');
    container.className = 'mail-bites-action-row mail-bites-action-row--card';

    const replyButton = this.buildPreviewActionButton('reply', conversation, onActionClick);
    const forwardButton = this.buildPreviewActionButton('forward', conversation, onActionClick);

    container.appendChild(replyButton);
    container.appendChild(forwardButton);

    return container;
  }

  /**
   * Phase 3.4: Build individual preview action button
   */
  private buildPreviewActionButton(
    type: PreviewActionType,
    conversation: ConversationData,
    onActionClick: (type: PreviewActionType, conversation: ConversationData) => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mail-bites-action-button mail-bites-preview-action-${type}`;
    button.title = PREVIEW_ACTION_LABELS[type] || '';
    button.setAttribute('aria-label', PREVIEW_ACTION_LABELS[type] || '');

    const icon = document.createElement('img');
    icon.src = resolveAssetPath(PREVIEW_ACTION_ICON_MAP[type] || '');
    icon.alt = '';
    icon.decoding = 'async';
    icon.loading = 'lazy';

    button.appendChild(icon);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      onActionClick(type, conversation);
    });

    return button;
  }

  /**
   * Phase 3.5: Build complete conversation item
   * Phase 4.2: Added onHover callback for event coordination
   * @param conversation Conversation data
   * @param skipExpandAnimation Whether to skip expand animation
   * @param highlightedId Currently highlighted conversation ID
   * @param collapsingId Currently collapsing conversation ID
   * @param expandedId Currently expanded conversation ID
   * @param onDismiss Callback when action button clicked
   * @param onPreviewAction Callback when preview action clicked
   * @param onToggle Callback when item clicked
   * @param onHover Callback when item hovered
   * @returns Complete conversation item element
   */
  build(
    conversation: ConversationData,
    skipExpandAnimation: boolean,
    highlightedId: string | null,
    collapsingId: string | null,
    expandedId: string | null,
    onDismiss: (button: HTMLButtonElement, type: ActionType) => void,
    onPreviewAction: (type: PreviewActionType, conversation: ConversationData) => void,
    onToggle: (conversationId: string) => void,
    onHover: (conversationId: string, isEntering: boolean) => void
  ): HTMLElement {
    const item = document.createElement('article');
    item.className = 'mail-bites-item';
    item.dataset.conversationId = conversation.id;

    if (highlightedId === conversation.id) {
      item.classList.add('is-active');
    }
    
    if (collapsingId === conversation.id) {
      item.classList.add('is-collapsing');
    }

    const header = this.buildHeader(conversation, onDismiss);
    item.appendChild(header);

    const isExpanded = expandedId === conversation.id;
    if (isExpanded) {
      item.classList.add('is-expanded');
      item.classList.add('is-active');
      if (conversation.mode !== 'read') {
        item.classList.add('is-composer-active');
      } else {
        item.classList.add('mail-bites-anim-bezel');
      }
      
      const details = this.buildDetails(conversation, skipExpandAnimation);
      item.appendChild(details);

      const previewActions = this.buildPreviewActions(conversation, onPreviewAction);
      if (previewActions) {
        item.appendChild(previewActions);
      }
    }

    item.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onToggle(conversation.id);
    });

    item.addEventListener('mouseenter', () => {
      onHover(conversation.id, true);
    });

    item.addEventListener('mouseleave', () => {
      onHover(conversation.id, false);
    });

    return item;
  }
}
