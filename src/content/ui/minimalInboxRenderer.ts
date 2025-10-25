import type { ViewContext } from '../viewTracker';
import { logger } from '../logger';
import {
  ConversationData,
  extractConversationData
} from './conversationParser';
import type { ConversationRow } from './types';

type ActionType = 'archive' | 'delete';
type PreviewActionType = 'reply' | 'forward';
type ComposerActionType = 'send' | 'delete';
type ToolbarActionType = 'new-email' | 'search' | 'more-things';

const ACTION_ICON_MAP: Record<ActionType, string> = {
  archive: 'archive-button.png',
  delete: 'delete-button.png'
};

const ACTION_LABELS: Record<ActionType, string> = {
  archive: 'Archive conversation',
  delete: 'Delete conversation'
};

const PREVIEW_ACTION_ICON_MAP: Record<PreviewActionType, string> = {
  reply: 'reply-button.png',
  forward: 'forward-button.png'
};

const PREVIEW_ACTION_LABELS: Record<PreviewActionType, string> = {
  reply: 'Reply to conversation',
  forward: 'Forward conversation'
};

const COMPOSER_ACTION_ICON_MAP: Record<ComposerActionType, string> = {
  send: 'send-button.png',
  delete: 'delete-button.png'
};

const COMPOSER_ACTION_LABELS: Record<ComposerActionType, string> = {
  send: 'Send message',
  delete: 'Discard message'
};

const TOOLBAR_ACTION_ICON_MAP: Record<ToolbarActionType, string> = {
  'new-email': 'new-email-button.png',
  search: 'search-button.png',
  'more-things': 'more-things.png'
};

const TOOLBAR_ACTION_LABELS: Record<ToolbarActionType, string> = {
  'new-email': 'Compose new email',
  search: 'Search emails',
  'more-things': 'More actions'
};

function resolveAssetPath(filename: string): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(filename);
  }
  return filename;
}

/**
 * Renders a minimalist inbox overlay listing conversations in Gmail's Primary
 * tab. Each item shows sender, subject, and date, with expandable snippets to
 * validate the Mail Bites architecture.
 */
export class MinimalInboxRenderer {
  private container: HTMLElement | null = null;
  private expandedId: string | null = null;
  private conversations: ConversationData[] = [];
  private highlightedId: string | null = null;
  private dismissedIds = new Set<string>();
  private pendingHoverId: string | null = null;
  private collapseAnimationId: string | null = null;
  private collapsingId: string | null = null;
  private conversationModes = new Map<string, ConversationData['mode']>();
  private isSearchActive = false;
  private isMoreThingsExpanded = false;
  private clickOutsideHandlerAttached = false;

  /**
   * Renders the overlay into the provided root. Repeated calls will re-render
   * based on the latest Gmail DOM state.
   */
  render(context: ViewContext, overlayRoot: HTMLElement): void {
    if (!context.mainElement) {
      logger.warn('MinimalInboxRenderer: Missing mainElement; skipping render.');
      return;
    }

    const conversations = this.collectConversations(context.mainElement)
      .filter((conversation) => conversation.isUnread)
      .filter((conversation) => !this.dismissedIds.has(conversation.id));

    // NOTE: Read conversations are intentionally filtered out for now. This
    // prepares the ground for a future "show read" toggle that will append
    // the suppressed rows beneath the unread block.

    logger.info('MinimalInboxRenderer: Rendering conversations.', {
      count: conversations.length,
      url: context.url
    });

    this.conversations = conversations.map((conversation) => {
      const storedMode = this.conversationModes.get(conversation.id);
      if (storedMode) {
        conversation.mode = storedMode;
      }
      this.conversationModes.set(conversation.id, conversation.mode);
      return conversation;
    });
    if (
      this.expandedId &&
      !conversations.some((conversation) => conversation.id === this.expandedId)
    ) {
      this.expandedId = null;
    }

    this.ensureContainer(overlayRoot);
    this.ensureClickOutsideHandler(overlayRoot);
    this.renderList();
  }

  /**
   * Clears the overlay contents.
   */
  reset(): void {
    this.expandedId = null;
    this.conversations = [];
    this.highlightedId = null;
    this.dismissedIds.clear();
    this.pendingHoverId = null;
    this.conversationModes.clear();
    this.isSearchActive = false;
    this.isMoreThingsExpanded = false;
    if (this.container) {
      this.container.classList.remove('has-highlight');
      delete this.container.dataset.highlightId;
      this.container.innerHTML = '';
    }
  }

  private ensureContainer(overlayRoot: HTMLElement): void {
    if (this.container && overlayRoot.contains(this.container)) {
      return;
    }

    const container = document.createElement('div');
    container.className = 'mail-bites-inbox';
    this.container = container;
    overlayRoot.appendChild(container);
  }

  private ensureClickOutsideHandler(overlayRoot: HTMLElement): void {
    if (this.clickOutsideHandlerAttached) {
      return;
    }

    logger.info('Attaching click-outside handler to overlay root');
    overlayRoot.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const closestItem = target.closest('.mail-bites-item');
      const closestResponseBox = target.closest('.mail-bites-response-box');
      
      // If there's no expanded email, nothing to do
      if (!this.expandedId) {
        return;
      }
      
      // If click is inside an email item or response box, don't collapse
      if (closestItem || closestResponseBox) {
        return;
      }
      
      // Click is outside any email item or response box - collapse the expanded email
      logger.info('Collapsing email via click-outside', { 
        expandedId: this.expandedId,
        targetElement: target.className 
      });
      this.toggle(this.expandedId);
    });
    this.clickOutsideHandlerAttached = true;
  }

  private renderList(): void {
    if (!this.container) {
      return;
    }

    const pendingHoverId = this.pendingHoverId;
    
    // Check if we're re-rendering an already expanded email (to prevent flicker)
    const wasAlreadyExpanded = this.expandedId && 
      this.container.querySelector(`article.mail-bites-item[data-conversation-id="${this.expandedId}"]`) !== null;

    // Preserve the existing toolbar ONLY when search is active
    // (to prevent animation interruption). For more-things expansion,
    // we need to rebuild to show the animated transition.
    const existingToolbar = this.isSearchActive ? this.container.querySelector('.mail-bites-toolbar') : null;
    
    this.container.innerHTML = '';
    this.container.classList.toggle(
      'has-highlight',
      Boolean(this.highlightedId)
    );
    if (this.highlightedId) {
      this.container.dataset.highlightId = this.highlightedId;
    } else {
      delete this.container.dataset.highlightId;
    }

    // Reuse existing toolbar if available, otherwise build a new one
    const toolbar = existingToolbar || this.buildToolbar();
    
    this.container.appendChild(toolbar);

    if (this.conversations.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.className = 'mail-bites-empty';
      emptyState.textContent =
        'No unread emails in the Primary inbox.';
      this.container.appendChild(emptyState);
      this.pendingHoverId = null;
      this.collapseAnimationId = null;
      return;
    }

    for (const conversation of this.conversations) {
      const isRerender = Boolean(wasAlreadyExpanded && conversation.id === this.expandedId);
      const item = this.buildItem(conversation, isRerender);
      if (pendingHoverId && conversation.id === pendingHoverId) {
        item.classList.add('is-hovered');
      }
      if (this.collapseAnimationId === conversation.id) {
        item.classList.remove('mail-bites-anim-bezel');
        void item.offsetWidth;
        item.classList.add('mail-bites-anim-bezel');
        item.addEventListener(
          'animationend',
          () => {
            item.classList.remove('mail-bites-anim-bezel');
          },
          { once: true }
        );
      }
      this.container.appendChild(item);

      if (conversation.mode !== 'read') {
        const responseBox = this.buildResponseBox(conversation);
        this.container.appendChild(responseBox);
      }
    }
    this.pendingHoverId = null;
    this.collapseAnimationId = null;
    this.collapsingId = null;
  }

  private buildItem(conversation: ConversationData, skipExpandAnimation = false): HTMLElement {
    const item = document.createElement('article');
    item.className = 'mail-bites-item';
    item.dataset.conversationId = conversation.id;

    if (this.highlightedId === conversation.id) {
      item.classList.add('is-active');
    }
    
    // Add collapsing class if this item is being collapsed
    if (this.collapsingId === conversation.id) {
      item.classList.add('is-collapsing');
    }

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

    const actions = this.buildActions();

    const right = document.createElement('div');
    right.className = 'mail-bites-header-right';
    right.appendChild(date);
    right.appendChild(actions);

    header.appendChild(main);
    header.appendChild(right);
    item.appendChild(header);

    const isExpanded = this.expandedId === conversation.id;
    if (isExpanded) {
      item.classList.add('is-expanded');
      item.classList.add('is-active');
      if (conversation.mode !== 'read') {
        item.classList.add('is-composer-active');
      } else {
        item.classList.add('mail-bites-anim-bezel');
      }
      const details = document.createElement('div');
      details.className = 'mail-bites-item-details';
      details.textContent =
        conversation.snippet || 'No preview available for this conversation.';
      item.appendChild(details);

      const previewActions = this.buildPreviewActions(conversation);
      if (previewActions) {
        item.appendChild(previewActions);
      }

      // If re-rendering an already expanded email, add is-visible immediately to prevent flicker
      // If initial expansion, delay adding is-visible for smooth fade-in animation
      if (skipExpandAnimation) {
        details.classList.add('is-visible');
      } else {
        requestAnimationFrame(() => {
          details.classList.add('is-visible');
        });
      }
    }

    item.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggle(conversation.id);
    });

    item.addEventListener('mouseenter', () => {
      item.classList.add('is-hovered');
    });

    item.addEventListener('mouseleave', () => {
      if (this.collapsingId === conversation.id || conversation.mode !== 'read') {
        return;
      }
      item.classList.remove('is-hovered');
    });

    return item;
  }

  private collectConversations(mainElement: HTMLElement): ConversationData[] {
    const rows = Array.from(
      mainElement.querySelectorAll<ConversationRow>('tr.zA')
    );

    return rows
      .map((row, index) =>
        extractConversationData(row, `conversation-${index}`)
      )
      .filter((conversation): conversation is ConversationData => Boolean(conversation));
  }

  private buildActions(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'mail-bites-actions';

    const archiveButton = this.buildActionButton('archive');
    const deleteButton = this.buildActionButton('delete');

    container.appendChild(archiveButton);
    container.appendChild(deleteButton);

    return container;
  }

  private buildActionButton(type: ActionType): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mail-bites-action mail-bites-action-${type}`;
    button.title = ACTION_LABELS[type];
    button.setAttribute('aria-label', ACTION_LABELS[type]);

    const icon = document.createElement('img');
    icon.src = resolveAssetPath(ACTION_ICON_MAP[type]);
    icon.alt = '';
    icon.decoding = 'async';
    icon.loading = 'lazy';

    button.appendChild(icon);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.handleConversationDismiss(button, type);
    });

    return button;
  }

  private toggle(conversationId: string): void {
    const article = this.container?.querySelector<HTMLElement>(
      `article.mail-bites-item[data-conversation-id="${conversationId}"]`
    );
    const hovered = article?.matches(':hover') ?? false;

    if (this.expandedId && this.expandedId !== conversationId) {
      const previousMode = this.conversationModes.get(this.expandedId);
      if (previousMode && previousMode !== 'read') {
        this.conversationModes.set(this.expandedId, 'read');
        const previousConversation = this.conversations.find(
          (entry) => entry.id === this.expandedId
        );
        if (previousConversation) {
          previousConversation.mode = 'read';
        }
      }
    }

    const isCurrentlyExpanded = this.expandedId === conversationId;
    if (isCurrentlyExpanded && article) {
      const details = article.querySelector<HTMLElement>(
        '.mail-bites-item-details'
      );
      if (details) {
        details.classList.remove('is-visible');
      }
      
      // Always transition scale to 1.0 when collapsing to prevent pop
      // Remove is-expanded to prevent scale 1.01, add is-collapsing for smooth scale 1.0 transition
      article.classList.remove('is-expanded');
      article.classList.add('is-collapsing');
      this.collapsingId = conversationId;
      // Force a reflow to ensure the state change is applied before animation
      void article.offsetHeight;
      
      this.conversationModes.set(conversationId, 'read');
      const current = this.conversations.find(
        (entry) => entry.id === conversationId
      );
      if (current) {
        current.mode = 'read';
      }

      const composer = this.container?.querySelector<HTMLElement>(
        `.mail-bites-response-box[data-conversation-id="${conversationId}"]`
      );
      composer?.remove();

      let handled = false;
      const finalizeCollapse = () => {
        if (handled) {
          return;
        }
        handled = true;
        const stillHovered = article.matches(':hover');
        this.expandedId = null;
        this.highlightedId = null;
        this.pendingHoverId = stillHovered ? conversationId : null;
        this.collapseAnimationId = conversationId;
        this.renderList();
      };

      if (details) {
        details.addEventListener(
          'transitionend',
          () => {
            finalizeCollapse();
          },
          { once: true }
        );
        window.setTimeout(finalizeCollapse, 360);
      } else {
        finalizeCollapse();
      }
      return;
    }

    this.expandedId = conversationId;
    this.highlightedId = this.expandedId;
    this.pendingHoverId = hovered ? conversationId : null;
    this.renderList();
  }

  private handleConversationDismiss(
    button: HTMLButtonElement,
    type: ActionType
  ): void {
    const article = button.closest<HTMLDivElement>('article.mail-bites-item');
    const conversationId = article?.dataset.conversationId;

    if (!article || !conversationId) {
      logger.warn('Action button could not resolve conversation context.', {
        type
      });
      return;
    }

    this.dismissedIds.add(conversationId);
    this.conversationModes.delete(conversationId);
    this.conversations = this.conversations.filter(
      (conversation) => conversation.id !== conversationId
    );
    if (this.expandedId === conversationId) {
      this.expandedId = null;
      this.highlightedId = null;
    }

    // future animation hook for dismissal transition
    this.renderList();
  }

  private buildPreviewActions(
    conversation: ConversationData
  ): HTMLElement | null {
    if (conversation.mode !== 'read') {
      return null;
    }

    const container = document.createElement('div');
    container.className = 'mail-bites-action-row mail-bites-action-row--card';

    const replyButton = this.buildPreviewActionButton('reply', conversation);
    const forwardButton = this.buildPreviewActionButton('forward', conversation);

    container.appendChild(replyButton);
    container.appendChild(forwardButton);

    return container;
  }

  private buildPreviewActionButton(
    type: PreviewActionType,
    conversation: ConversationData
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mail-bites-action-button mail-bites-preview-action-${type}`;
    button.title = PREVIEW_ACTION_LABELS[type];
    button.setAttribute('aria-label', PREVIEW_ACTION_LABELS[type]);

    const icon = document.createElement('img');
    icon.src = resolveAssetPath(PREVIEW_ACTION_ICON_MAP[type]);
    icon.alt = '';
    icon.decoding = 'async';
    icon.loading = 'lazy';

    button.appendChild(icon);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.conversationModes.set(conversation.id, type);
      conversation.mode = type;
      this.expandedId = conversation.id;
      this.highlightedId = conversation.id;
      this.pendingHoverId = conversation.id;
      this.renderList();
    });

    return button;
  }

  private buildResponseBox(conversation: ConversationData): HTMLElement {
    const box = document.createElement('div');
    box.className = 'mail-bites-response-box mail-bites-anim-bezel-surface';
    box.dataset.conversationId = conversation.id;
    box.dataset.responseMode = conversation.mode;
    box.addEventListener('animationend', () => {
      box.classList.remove('mail-bites-anim-bezel-surface');
    }, { once: true });
    const actions = this.buildComposerActions(conversation);
    const filler = document.createElement('div');
    filler.className = 'mail-bites-response-body';
    box.appendChild(filler);
    box.appendChild(actions);
    return box;
  }

  private buildComposerActions(conversation: ConversationData): HTMLElement {
    const container = document.createElement('div');
    container.className = 'mail-bites-action-row mail-bites-action-row--composer';

    const sendButton = this.buildComposerActionButton('send', conversation);
    const deleteButton = this.buildComposerActionButton('delete', conversation);

    container.appendChild(sendButton);
    container.appendChild(deleteButton);

    return container;
  }

  private buildComposerActionButton(
    type: ComposerActionType,
    conversation: ConversationData
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mail-bites-action-button mail-bites-composer-action-${type}`;
    button.title = COMPOSER_ACTION_LABELS[type];
    button.setAttribute('aria-label', COMPOSER_ACTION_LABELS[type]);

    const icon = document.createElement('img');
    icon.src = resolveAssetPath(COMPOSER_ACTION_ICON_MAP[type]);
    icon.alt = '';
    icon.decoding = 'async';
    icon.loading = 'lazy';

    button.appendChild(icon);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();

      if (type === 'delete') {
        this.conversationModes.set(conversation.id, 'read');
        conversation.mode = 'read';
        this.expandedId = conversation.id;
        this.highlightedId = conversation.id;
        this.pendingHoverId = conversation.id;
        this.renderList();
        return;
      }
    });

    return button;
  }

  private buildToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'mail-bites-toolbar';

    const newEmailButton = this.buildToolbarButton('new-email');
    const searchButton = this.buildToolbarButton('search');

    toolbar.appendChild(newEmailButton);
    toolbar.appendChild(searchButton);

    if (this.isMoreThingsExpanded) {
      // Show the 3 expanded icons (using delete-button.png as placeholder)
      const icon1 = this.buildExpandedIcon('icon1');
      const icon2 = this.buildExpandedIcon('icon2');
      const icon3 = this.buildExpandedIcon('icon3');
      
      toolbar.appendChild(icon1);
      toolbar.appendChild(icon2);
      toolbar.appendChild(icon3);
    } else {
      // Show the more-things button
      const moreThingsButton = this.buildToolbarButton('more-things');
      toolbar.appendChild(moreThingsButton);
    }

    return toolbar;
  }

  private buildToolbarButton(type: ToolbarActionType): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mail-bites-action mail-bites-toolbar-action-${type}`;
    button.title = TOOLBAR_ACTION_LABELS[type];
    button.setAttribute('aria-label', TOOLBAR_ACTION_LABELS[type]);

    const icon = document.createElement('img');
    icon.src = resolveAssetPath(TOOLBAR_ACTION_ICON_MAP[type]);
    icon.alt = '';
    icon.decoding = 'async';
    icon.loading = 'lazy';

    button.appendChild(icon);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      
      // Collapse any expanded email when clicking toolbar buttons
      if (this.expandedId) {
        this.toggle(this.expandedId);
      }
      
      if (type === 'search') {
        this.handleSearchButtonClick(button);
      } else if (type === 'more-things') {
        this.handleMoreThingsClick(button);
      }
    });

    return button;
  }

  private buildExpandedIcon(id: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mail-bites-action mail-bites-expanded-icon is-appearing-expanded';
    button.title = 'Action';
    button.setAttribute('aria-label', 'Action');

    const icon = document.createElement('img');
    icon.src = resolveAssetPath('delete-button.png'); // Placeholder
    icon.alt = '';
    icon.decoding = 'async';
    icon.loading = 'lazy';

    button.appendChild(icon);

    // Remove animation class after it completes so button behaves like normal toolbar buttons
    button.addEventListener('animationend', () => {
      button.classList.remove('is-appearing-expanded');
    }, { once: true });

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      
      // Collapse any expanded email when clicking toolbar buttons
      if (this.expandedId) {
        this.toggle(this.expandedId);
      }
      
      // TODO: Add specific action for each icon
    });

    return button;
  }

  private handleMoreThingsClick(button: HTMLButtonElement): void {
    if (this.isMoreThingsExpanded) {
      return;
    }

    // Add animation class for sliding right and fading out
    button.classList.add('is-sliding-out');
    
    // Start showing icons halfway through button slide-out (150ms)
    setTimeout(() => {
      this.isMoreThingsExpanded = true;
      this.renderList();
    }, 150); // 50% of slide-out animation (300ms total)
  }

  private handleSearchButtonClick(button: HTMLButtonElement): void {
    if (this.isSearchActive) {
      return;
    }

    this.isSearchActive = true;
    
    // Start rotation immediately (flows from click release)
    button.classList.add('is-rotating');
    
    // Halfway through rotation (150ms), start shrinking
    setTimeout(() => {
      button.classList.add('is-shrinking');
    }, 150); // Start shrinking halfway through rotation
    
    // After rotation completes (300ms), transform to search bar
    setTimeout(() => {
      this.transformToSearchBar(button);
    }, 300); // Duration of rotation animation
  }

  private transformToSearchBar(button: HTMLButtonElement): void {
    const toolbar = button.closest('.mail-bites-toolbar');
    if (!toolbar) {
      this.isSearchActive = false;
      return;
    }

    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'mail-bites-search-input';
    searchInput.placeholder = '';
    searchInput.setAttribute('aria-label', 'Search emails');

    // Replace button with input
    button.replaceWith(searchInput);
    
    // Focus the input
    requestAnimationFrame(() => {
      searchInput.focus();
    });

    // Handle blur to restore button when clicking outside
    searchInput.addEventListener('blur', () => {
      // Small delay to allow the input to be removed before restoring button
      setTimeout(() => {
        this.restoreSearchButton(searchInput);
      }, 10);
    });
  }

  private restoreSearchButton(searchInput: HTMLInputElement): void {
    const toolbar = searchInput.closest('.mail-bites-toolbar');
    if (!toolbar) {
      this.isSearchActive = false;
      return;
    }

    // Create fresh search button
    const newButton = this.buildToolbarButton('search');
    
    // Add appearing animation class
    newButton.classList.add('is-appearing');
    
    // Replace input with button instantly
    searchInput.replaceWith(newButton);
    
    // Reset state
    this.isSearchActive = false;
  }
}
