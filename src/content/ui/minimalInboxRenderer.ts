import type { ViewContext } from '../viewTracker';
import { logger } from '../logger';
import {
  ConversationData,
  extractConversationData
} from './conversationParser';
import type { ConversationRow } from './types/types';
import type {
  ActionType,
  PreviewActionType,
  ComposerActionType,
  ToolbarActionType
} from './types/actionTypes';
import { AnimationController } from './AnimationController';
import { UIState } from './UIState';
import { ConversationItemBuilder } from './builders/ConversationItemBuilder';
import { ResponseBoxBuilder } from './builders/ResponseBoxBuilder';
import { EventCoordinator } from './EventCoordinator';

/**
 * Renders a minimalist inbox overlay listing conversations in Gmail's Primary
 * tab. Each item shows sender, subject, and date, with expandable snippets to
 * validate the Mail Bites architecture.
 */
export class MinimalInboxRenderer {
  // Phase 1.5: All state now managed by UIState class
  private state = new UIState();
  // Phase 2.3: AnimationController instance for animation management
  private animator = new AnimationController();
  // Phase 3.2: ConversationItemBuilder instance for DOM building
  private itemBuilder = new ConversationItemBuilder();
  // Phase 3.7: ResponseBoxBuilder instance for response box DOM building
  private responseBoxBuilder = new ResponseBoxBuilder();
  // Phase 4.1: EventCoordinator instance for event handling
  private eventCoordinator: EventCoordinator;

  constructor() {
    // Phase 4.2: Initialize EventCoordinator with dependencies
    this.eventCoordinator = new EventCoordinator(
      this.state,
      this.animator,
      () => this.renderList()
    );
  }

  /**
   * Renders the overlay into the provided root. Repeated calls will re-render
   * based on the latest Gmail DOM state.
   */
  render(context: ViewContext, overlayRoot: HTMLElement): void {
    if (!context.mainElement) {
      logger.warn('MinimalInboxRenderer: Missing mainElement; skipping render.');
      return;
    }

    const dismissedIds = this.state.getDismissedIds();
    const readIds = this.state.getReadIds();
    const hoveredIds = this.state.getHoveredIds();
    const expandedId = this.state.getExpandedId();
    const pendingHoverId = this.state.getPendingHoverId();
    const collapsingId = this.state.getCollapsingId();
    const collapseAnimationId = this.state.getCollapseAnimationId();

    const conversations = this.collectConversations(context.mainElement)
      .filter((conversation) => conversation.isUnread)
      .filter((conversation) => !dismissedIds.has(conversation.id)) // Phase 1.5: Read from UIState
      .filter((conversation) => {
        if (!readIds.has(conversation.id)) {
          return true;
        }

        if (expandedId === conversation.id) {
          return true;
        }

        if (hoveredIds.has(conversation.id)) {
          return true;
        }

        if (pendingHoverId === conversation.id) {
          return true;
        }

        if (collapsingId === conversation.id) {
          return true;
        }

        if (collapseAnimationId === conversation.id) {
          return true;
        }

        return false;
      });

    // NOTE: Read conversations are intentionally filtered out for now. This
    // prepares the ground for a future "show read" toggle that will append
    // the suppressed rows beneath the unread block.

    logger.info('MinimalInboxRenderer: Rendering conversations.', {
      count: conversations.length,
      url: context.url
    });

    const conversationModes = this.state.getConversationModes(); // Phase 1.5: Read from UIState
    const processedConversations = conversations.map((conversation) => {
      const storedMode = conversationModes.get(conversation.id);
      if (storedMode) {
        conversation.mode = storedMode;
      }
      conversationModes.set(conversation.id, conversation.mode);
      return conversation;
    });
    this.state.setConversations(processedConversations); // Phase 1.5: Write to UIState
    this.state.setConversationModes(conversationModes); // Phase 1.5: Write to UIState
    if (
      this.state.getExpandedId() && // Phase 1.3: Read from UIState
      !conversations.some((conversation) => conversation.id === this.state.getExpandedId()) // Phase 1.3: Read from UIState
    ) {
      this.state.setExpandedId(null); // Phase 1.4: Write to UIState only
    }

    this.ensureContainer(overlayRoot);
    this.ensureClickOutsideHandler(overlayRoot);
    this.renderList();
  }

  /**
   * Clears the overlay contents.
   */
  reset(): void {
    // Phase 2.5: Cancel all animations before state reset
    this.animator.cancelAllAnimations();
    
    this.state.setExpandedId(null); // Phase 1.5: Write to UIState only
    this.state.setConversations([]); // Phase 1.5: Write to UIState only
    this.state.setHighlightedId(null); // Phase 1.5: Write to UIState only
    this.state.setIsComposing(false);
    this.state.setComposeBoxCount(0);
    this.state.setExpandedComposeIndex(-1);
    
    const composeDrafts = this.state.getComposeDrafts();
    composeDrafts.clear();
    this.state.setComposeDrafts(composeDrafts);
    
    const sentEmails = this.state.getSentEmails();
    sentEmails.clear();
    this.state.setSentEmails(sentEmails);
    
    const dismissedIds = this.state.getDismissedIds(); // Phase 1.5: Read from UIState
    dismissedIds.clear();
    this.state.setDismissedIds(dismissedIds); // Phase 1.5: Write to UIState
    
    const readIds = this.state.getReadIds();
    readIds.clear();
    this.state.setReadIds(readIds);

    const hoveredIds = this.state.getHoveredIds();
    hoveredIds.clear();
    this.state.setHoveredIds(hoveredIds);

    this.state.setPendingHoverId(null); // Phase 1.5: Write to UIState only
    
    const conversationModes = this.state.getConversationModes(); // Phase 1.5: Read from UIState
    conversationModes.clear();
    this.state.setConversationModes(conversationModes); // Phase 1.5: Write to UIState
    
    this.state.setIsSearchActive(false); // Phase 1.5: Write to UIState only
    this.state.setFilterPrimaryAction('unread');
    this.state.setIsFilterCollapsed(true);
    if (this.state.getContainer()) {
      this.state.getContainer()!.classList.remove('has-highlight');
      delete this.state.getContainer()!.dataset.highlightId;
      this.state.getContainer()!.innerHTML = '';
    }
  }

  private ensureContainer(overlayRoot: HTMLElement): void {
    if (this.state.getContainer() && overlayRoot.contains(this.state.getContainer()!)) { // Phase 1.5: Read from UIState
      return;
    }

    const container = document.createElement('div');
    container.className = 'mail-bites-inbox';
    this.state.setContainer(container); // Phase 1.5: Write to UIState only
    overlayRoot.appendChild(container);
  }

  private ensureClickOutsideHandler(overlayRoot: HTMLElement): void {
    // Phase 4.5: Delegate to EventCoordinator
    this.eventCoordinator.attachClickOutsideHandler(overlayRoot);
  }

  private renderList(): void {
    const container = this.state.getContainer(); // Phase 1.5: Read from UIState
    if (!container) {
      return;
    }

    const pendingHoverId = this.state.getPendingHoverId(); // Phase 1.5: Read from UIState
    
    // LEGACY RENDERING DISABLED - React components handle conversation rendering
    // Only manage container classes for highlight state
    
    // Only show highlight if there's an expanded email or expanded compose box
    const hasExpandedEmail = Boolean(this.state.getHighlightedId());
    const hasExpandedCompose = this.state.getIsComposing() && this.state.getExpandedComposeIndex() !== -1;
    
    container.classList.toggle(
      'has-highlight',
      hasExpandedEmail || hasExpandedCompose
    );
    container.classList.toggle(
      'is-composing-animating',
      this.state.getIsComposingAnimating()
    );
    if (this.state.getHighlightedId()) {
      container.dataset.highlightId = this.state.getHighlightedId()!;
    } else {
      delete container.dataset.highlightId;
    }

    // Clear pending animation state
    this.state.setPendingHoverId(null);
    this.state.setCollapseAnimationId(null);
    this.state.setCollapsingId(null);
  }

  // LEGACY METHOD - No longer used, React components handle conversation rendering
  // Kept for potential rollback during migration
  private buildItem(conversation: ConversationData, skipExpandAnimation = false): HTMLElement {
    return this.itemBuilder.build(
      conversation,
      skipExpandAnimation,
      this.state.getHighlightedId(),
      this.state.getCollapsingId(),
      this.state.getExpandedId(),
      (button, type) => this.handleConversationDismiss(button, type),
      (type, conv) => this.handlePreviewAction(type, conv),
      (conversationId) => this.toggle(conversationId),
      (conversationId, isEntering) => this.eventCoordinator.handleItemHover(conversationId, isEntering)
    );
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

  // Phase 3.4: buildActions and buildActionButton moved to ConversationItemBuilder

  // Phase 4.2: Delegate to EventCoordinator.handleItemClick()
  private toggle(conversationId: string): void {
    this.eventCoordinator.handleItemClick(conversationId);
  }

  // Phase 4.3: Delegate to EventCoordinator.handleActionClick()
  private handleConversationDismiss(
    button: HTMLButtonElement,
    type: ActionType
  ): void {
    this.eventCoordinator.handleActionClick(button, type);
  }

  /**
   * Phase 3.4: Handle preview action (reply/forward) clicks
   * Phase 4.3: Delegate to EventCoordinator.handlePreviewActionClick()
   */
  private handlePreviewAction(
    type: PreviewActionType,
    conversation: ConversationData
  ): void {
    this.eventCoordinator.handlePreviewActionClick(type, conversation);
  }

  // Phase 3.4: buildPreviewActions and buildPreviewActionButton moved to ConversationItemBuilder

  // LEGACY METHOD - No longer used, React components handle composer rendering
  private buildResponseBox(conversation: ConversationData): HTMLElement {
    return this.responseBoxBuilder.build(
      conversation,
      conversation.mode as 'reply' | 'forward',
      (type: ComposerActionType, conv: ConversationData | null) => this.handleComposerAction(type, conv)
    );
  }

  // LEGACY METHOD - No longer used, React components handle standalone compose boxes
  private buildComposeBox(
    composeIndex: number,
    draft: { recipients: string; subject: string; message: string } | undefined,
    isExpanded: boolean
  ): HTMLElement {
    return this.responseBoxBuilder.build(
      null,
      'compose',
      (type: ComposerActionType, conv: ConversationData | null, idx?: number) => this.handleComposerAction(type, conv, idx),
      composeIndex,
      isExpanded,
      draft
    );
  }

  // Phase 3.7: Composer action coordinator
  // Phase 4.3: Delegate to EventCoordinator.handleComposerActionClick()
  private handleComposerAction(type: ComposerActionType, conversation: ConversationData | null, composeIndex?: number): void {
    this.eventCoordinator.handleComposerActionClick(type, conversation, composeIndex);
  }

  // Phase 3.7: buildComposerActions and buildComposerActionButton moved to ResponseBoxBuilder
  // Toolbar rendering removed - now handled by React components
}
