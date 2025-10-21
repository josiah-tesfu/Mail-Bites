import type { ViewContext } from '../viewTracker';
import { logger } from '../logger';
import {
  ConversationData,
  extractConversationData
} from './conversationParser';
import type { ConversationRow } from './types';

type ActionType = 'archive' | 'delete';

const ACTION_ICON_MAP: Record<ActionType, string> = {
  archive: 'archive-button.png',
  delete: 'delete-button.png'
};

const ACTION_LABELS: Record<ActionType, string> = {
  archive: 'Archive conversation',
  delete: 'Delete conversation'
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

  /**
   * Renders the overlay into the provided root. Repeated calls will re-render
   * based on the latest Gmail DOM state.
   */
  render(context: ViewContext, overlayRoot: HTMLElement): void {
    if (!context.mainElement) {
      logger.warn('MinimalInboxRenderer: Missing mainElement; skipping render.');
      return;
    }

    const conversations = this.collectConversations(context.mainElement);

    logger.info('MinimalInboxRenderer: Rendering conversations.', {
      count: conversations.length,
      url: context.url
    });

    this.conversations = conversations;
    if (
      this.expandedId &&
      !conversations.some((conversation) => conversation.id === this.expandedId)
    ) {
      this.expandedId = null;
    }

    this.ensureContainer(overlayRoot);
    this.renderList();
  }

  /**
   * Clears the overlay contents.
   */
  reset(): void {
    this.expandedId = null;
    this.conversations = [];
    this.highlightedId = null;
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

  private renderList(): void {
    if (!this.container) {
      return;
    }

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

    if (this.conversations.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.className = 'mail-bites-empty';
      emptyState.textContent =
        'No conversations detected in the Primary inbox.';
      this.container.appendChild(emptyState);
      return;
    }

    for (const conversation of this.conversations) {
      const item = this.buildItem(conversation);
      this.container.appendChild(item);
    }
  }

  private buildItem(conversation: ConversationData): HTMLElement {
    const item = document.createElement('article');
    item.className = 'mail-bites-item';
    item.dataset.conversationId = conversation.id;

    if (this.highlightedId === conversation.id) {
      item.classList.add('is-active');
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
      const details = document.createElement('div');
      details.className = 'mail-bites-item-details';
      details.textContent =
        conversation.snippet || 'No preview available for this conversation.';
      item.appendChild(details);
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
    });

    return button;
  }

  private toggle(conversationId: string): void {
    const isCurrentlyExpanded = this.expandedId === conversationId;
    this.expandedId = isCurrentlyExpanded ? null : conversationId;
    this.highlightedId = this.expandedId;
    this.renderList();
  }
}
