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
import { ToolbarBuilder } from './builders/ToolbarBuilder';
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
  // Phase 3.6: ToolbarBuilder instance for toolbar DOM building
  private toolbarBuilder = new ToolbarBuilder();
  // Phase 3.7: ResponseBoxBuilder instance for response box DOM building
  private responseBoxBuilder = new ResponseBoxBuilder();
  // Phase 4.1: EventCoordinator instance for event handling
  private eventCoordinator: EventCoordinator;

  constructor() {
    // Phase 4.2: Initialize EventCoordinator with dependencies
    // Phase 4.4: Added toolbarBuilder dependency
    this.eventCoordinator = new EventCoordinator(
      this.state,
      this.animator,
      () => this.renderList(),
      this.toolbarBuilder
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
    
    // Check if we're re-rendering an already expanded email (to prevent flicker)
    const wasAlreadyExpanded = this.state.getExpandedId() &&  // Phase 1.5: Read from UIState
      container.querySelector(`article.mail-bites-item[data-conversation-id="${this.state.getExpandedId()}"]`) !== null; // Phase 1.5: Read from UIState

    // Preserve the existing toolbar when search is active or new email button is animating
    const existingToolbar = container.querySelector('.mail-bites-toolbar');
    const shouldPreserveToolbar = this.state.getIsSearchActive() || 
      existingToolbar?.querySelector('.mail-bites-anim-rotate-close') ||
      this.state.getIsComposingAnimating();
    const toolbarToReuse = shouldPreserveToolbar ? existingToolbar : null;
    
    container.innerHTML = '';
    
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
    if (this.state.getHighlightedId()) { // Phase 1.5: Read from UIState
      container.dataset.highlightId = this.state.getHighlightedId()!; // Phase 1.5: Read from UIState
    } else {
      delete container.dataset.highlightId;
    }

    // Reuse existing toolbar if available, otherwise build a new one
    const toolbar = toolbarToReuse || this.buildToolbar();
    
    container.appendChild(toolbar);

    // Render standalone compose boxes
    if (this.state.getIsComposing()) {
      const composeBoxCount = this.state.getComposeBoxCount();
      const expandedComposeIndex = this.state.getExpandedComposeIndex();
      const composeDrafts = this.state.getComposeDrafts();
      
      for (let i = 0; i < composeBoxCount; i++) {
        const isExpanded = expandedComposeIndex === i;
        const draft = composeDrafts.get(i);
        const composeBox = this.buildComposeBox(i, draft, isExpanded);
        container.appendChild(composeBox);
      }
    }

    if (this.state.getConversations().length === 0) { // Phase 1.5: Read from UIState
      const emptyState = document.createElement('p');
      emptyState.className = 'mail-bites-empty';
      emptyState.textContent =
        'No unread emails in the Primary inbox.';
      container.appendChild(emptyState);
      this.state.setPendingHoverId(null); // Phase 1.5: Write to UIState only
      this.state.setCollapseAnimationId(null); // Phase 1.5: Write to UIState only
      return;
    }

    for (const conversation of this.state.getConversations()) { // Phase 1.3: Read from UIState
      const isRerender = Boolean(wasAlreadyExpanded && conversation.id === this.state.getExpandedId()); // Phase 1.3: Read from UIState
      const item = this.buildItem(conversation, isRerender);
      if (pendingHoverId && conversation.id === pendingHoverId) {
        item.classList.add('is-hovered');
      }
      if (
        this.state.getCollapseAnimationId() === conversation.id &&
        this.state.getCollapsingId() !== conversation.id
      ) { // Phase 1.5: Read from UIState
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
      container.appendChild(item);

      if (conversation.mode !== 'read') {
        const responseBox = this.buildResponseBox(conversation);
        container.appendChild(responseBox);
      }
    }
    this.state.setPendingHoverId(null); // Phase 1.5: Write to UIState only
    this.state.setCollapseAnimationId(null); // Phase 1.5: Write to UIState only
    this.state.setCollapsingId(null); // Phase 1.5: Write to UIState only
  }

  // Phase 3.5: Delegate to ConversationItemBuilder.build()
  // Phase 4.2: Added onHover callback delegation
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

  // Phase 3.7: Delegate to ResponseBoxBuilder.build()
  private buildResponseBox(conversation: ConversationData): HTMLElement {
    return this.responseBoxBuilder.build(
      conversation,
      conversation.mode as 'reply' | 'forward',
      (type: ComposerActionType, conv: ConversationData | null) => this.handleComposerAction(type, conv)
    );
  }

  // Build standalone compose box
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

  // Phase 3.6: Delegate to ToolbarBuilder.build()
  private buildToolbar(): HTMLElement {
    return this.toolbarBuilder.build(
      this.state.getFilterPrimaryAction(),
      this.state.getIsFilterCollapsed(),
      (type, button) => this.handleToolbarButtonClick(type, button)
    );
  }

  // Phase 3.6: Toolbar button click coordinator
  // Phase 4.4: Delegate to EventCoordinator
  private handleToolbarButtonClick(type: ToolbarActionType, button: HTMLButtonElement): void {
    // Close search if active
    if (this.state.getIsSearchActive()) {
      const searchInput = this.state.getContainer()?.querySelector('.mail-bites-search-input') as HTMLInputElement;
      if (searchInput) {
        this.eventCoordinator.handleSearchClose(searchInput);
      }
    }
    
    // Collapse any expanded email when clicking toolbar buttons
    if (this.state.getExpandedId()) {
      this.toggle(this.state.getExpandedId()!);
    }
    
    if (type === 'search') {
      this.eventCoordinator.handleSearchButtonClick(button);
    } else if (type === 'new-email') {
      this.eventCoordinator.handleNewEmailClick();
    } else if (type === 'unread' || type === 'read' || type === 'draft') {
      this.eventCoordinator.handleFilterButtonClick(type, button);
    }
  }

  // Phase 3.6: buildToolbarButton and buildExpandedIcon moved to ToolbarBuilder
  // Phase 4.4: handleMoreThingsClick, handleSearchButtonClick, transformToSearchBar, restoreSearchButton moved to EventCoordinator
}
