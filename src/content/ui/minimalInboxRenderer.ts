import type { ViewContext } from '../viewTracker';
import { logger } from '../logger';
import {
  ConversationData,
  extractConversationData
} from './conversationParser';
import type { ConversationRow } from './types';

/**
 * Renders a minimalist inbox overlay listing conversations in Gmail's Primary
 * tab. Each item shows sender, subject, and date, with expandable snippets to
 * validate the Mail Bites architecture.
 */
export class MinimalInboxRenderer {
  private container: HTMLElement | null = null;
  private expandedId: string | null = null;
  private conversations: ConversationData[] = [];

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
    if (this.container) {
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

    const header = document.createElement('div');
    header.className = 'mail-bites-item-header';

    const main = document.createElement('div');
    main.className = 'mail-bites-header-main';

    const sender = document.createElement('span');
    sender.className = 'mail-bites-sender';
    sender.textContent = conversation.sender || 'Unknown sender';

    const separator = document.createElement('span');
    separator.className = 'mail-bites-separator';
    separator.textContent = '•';

    const subject = document.createElement('span');
    subject.className = 'mail-bites-subject';
    subject.textContent = conversation.subject || '(No subject)';

    main.appendChild(sender);
    main.appendChild(separator);
    main.appendChild(subject);

    const date = document.createElement('span');
    date.className = 'mail-bites-date';
    date.textContent = conversation.date || '';

    header.appendChild(main);
    header.appendChild(date);
    item.appendChild(header);

    const isExpanded = this.expandedId === conversation.id;
    if (isExpanded) {
      item.classList.add('is-expanded');
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

  private toggle(conversationId: string): void {
    this.expandedId =
      this.expandedId === conversationId ? null : conversationId;
    this.renderList();
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
}
