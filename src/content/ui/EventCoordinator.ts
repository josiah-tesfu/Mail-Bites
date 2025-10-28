import type { ActionType, PreviewActionType, ComposerActionType } from './types/actionTypes.js';
import type { ConversationData } from './conversationParser.js';
import { UIState } from './UIState.js';
import { AnimationController } from './AnimationController.js';
import { ToolbarBuilder } from './builders/ToolbarBuilder.js';
import { logger } from '../logger.js';

/**
 * EventCoordinator - Coordinates all event handling
 * Phase 4.1: Class created with method stubs, not yet integrated
 * Phase 4.2: Implemented conversation item event handlers
 * Phase 4.4: Added toolbar event handlers
 */
export class EventCoordinator {
  private mouseDownTarget: HTMLElement | null = null;

  constructor(
    private state: UIState,
    private animator: AnimationController,
    private triggerRender: () => void,
    private toolbarBuilder: ToolbarBuilder
  ) {}

  /**
   * Phase 4.2: Handle conversation item click to toggle expansion
   */
  handleItemClick(conversationId: string): void {
    // Close search if active
    if (this.state.getIsSearchActive()) {
      const searchInput = this.state.getContainer()?.querySelector('.mail-bites-search-input') as HTMLInputElement;
      if (searchInput) {
        this.handleSearchClose(searchInput);
      }
    }
    
    const article = this.state.getContainer()?.querySelector<HTMLElement>(
      `article.mail-bites-item[data-conversation-id="${conversationId}"]`
    );
    const hovered = article?.matches(':hover') ?? false;

    if (this.state.getExpandedId() && this.state.getExpandedId() !== conversationId) {
      const conversationModes = this.state.getConversationModes();
      const previousMode = conversationModes.get(this.state.getExpandedId()!);
      if (previousMode && previousMode !== 'read') {
        conversationModes.set(this.state.getExpandedId()!, 'read');
        this.state.setConversationModes(conversationModes);
        const previousConversation = this.state.getConversations().find(
          (entry) => entry.id === this.state.getExpandedId()
        );
        if (previousConversation) {
          previousConversation.mode = 'read';
        }
      }
    }

    const isCurrentlyExpanded = this.state.getExpandedId() === conversationId;
    if (isCurrentlyExpanded && article) {
      const details = article.querySelector<HTMLElement>(
        '.mail-bites-item-details'
      );
      if (details) {
        details.classList.remove('is-visible');
      }
      
      article.classList.remove('is-expanded');
      article.classList.add('is-collapsing');
      this.state.setCollapsingId(conversationId);
      void article.offsetHeight;
      
      const conversationModes = this.state.getConversationModes();
      conversationModes.set(conversationId, 'read');
      this.state.setConversationModes(conversationModes);
      const current = this.state.getConversations().find(
        (entry) => entry.id === conversationId
      );
      if (current) {
        current.mode = 'read';
      }

      const composer = this.state.getContainer()?.querySelector<HTMLElement>(
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
        this.state.setExpandedId(null);
        this.state.setHighlightedId(null);
        this.state.setPendingHoverId(stillHovered ? conversationId : null);
        this.state.setCollapseAnimationId(conversationId);
        this.triggerRender();
      };

      if (details) {
        details.addEventListener(
          'transitionend',
          () => {
            finalizeCollapse();
          },
          { once: true }
        );
        this.animator.scheduleCollapseTimeout(finalizeCollapse);
      } else {
        finalizeCollapse();
      }
      return;
    }

    this.state.setExpandedId(conversationId);
    this.state.setHighlightedId(this.state.getExpandedId());
    this.state.setPendingHoverId(hovered ? conversationId : null);
    this.triggerRender();
  }

  /**
   * Phase 4.2: Handle conversation item hover events
   */
  handleItemHover(conversationId: string, isEntering: boolean): void {
    const article = this.state.getContainer()?.querySelector<HTMLElement>(
      `article.mail-bites-item[data-conversation-id="${conversationId}"]`
    );
    
    if (!article) {
      return;
    }

    if (isEntering) {
      article.classList.add('is-hovered');
    } else {
      const conversation = this.state.getConversations().find(c => c.id === conversationId);
      if (this.state.getCollapsingId() === conversationId || conversation?.mode !== 'read') {
        return;
      }
      article.classList.remove('is-hovered');
    }
  }

  /**
   * Phase 4.3: Handle action button clicks (archive/delete)
   */
  handleActionClick(button: HTMLButtonElement, type: ActionType): void {
    const article = button.closest<HTMLDivElement>('article.mail-bites-item');
    const conversationId = article?.dataset.conversationId;

    if (!article || !conversationId) {
      logger.warn('Action button could not resolve conversation context.', {
        type
      });
      return;
    }

    const dismissedIds = this.state.getDismissedIds();
    dismissedIds.add(conversationId);
    this.state.setDismissedIds(dismissedIds);
    
    const conversationModes = this.state.getConversationModes();
    conversationModes.delete(conversationId);
    this.state.setConversationModes(conversationModes);
    
    this.state.setConversations(
      this.state.getConversations().filter(
        (conversation) => conversation.id !== conversationId
      )
    );
    if (this.state.getExpandedId() === conversationId) {
      this.state.setExpandedId(null);
      this.state.setHighlightedId(null);
    }

    this.triggerRender();
  }

  /**
   * Phase 4.3: Handle preview action clicks (reply/forward)
   */
  handlePreviewActionClick(type: PreviewActionType, conversation: ConversationData): void {
    const conversationModes = this.state.getConversationModes();
    conversationModes.set(conversation.id, type);
    this.state.setConversationModes(conversationModes);
    conversation.mode = type;
    this.state.setExpandedId(conversation.id);
    this.state.setHighlightedId(conversation.id);
    this.state.setPendingHoverId(conversation.id);
    this.triggerRender();
  }

  /**
   * Phase 4.3: Handle composer action clicks (send/delete)
   */
  handleComposerActionClick(type: ComposerActionType, conversation: ConversationData | null, composeIndex?: number): void {
    if (type === 'delete') {
      if (conversation) {
        // Closing reply/forward composer - revert to read mode
        const conversationModes = this.state.getConversationModes();
        conversationModes.set(conversation.id, 'read');
        this.state.setConversationModes(conversationModes);
        conversation.mode = 'read';
        this.state.setExpandedId(conversation.id);
        this.state.setHighlightedId(conversation.id);
        this.state.setPendingHoverId(conversation.id);
      } else {
        // Closing standalone compose box - save draft and remove box
        if (composeIndex !== undefined) {
          // Save draft before closing
          this.saveDraft(composeIndex);
          
          // Decrement count to remove box
          const currentCount = this.state.getComposeBoxCount();
          const newCount = Math.max(0, currentCount - 1);
          this.state.setComposeBoxCount(newCount);
          
          // If closed box was expanded, clear expanded index
          if (this.state.getExpandedComposeIndex() === composeIndex) {
            this.state.setExpandedComposeIndex(null);
          }
          
          // If no boxes left, close composer mode
          if (newCount === 0) {
            this.state.setIsComposing(false);
            this.state.setExpandedComposeIndex(-1);
          }
        }
      }
      this.triggerRender();
    } else if (type === 'send') {
      // Handle send action
      if (composeIndex !== undefined) {
        // Mark as sent
        const sentEmails = this.state.getSentEmails();
        sentEmails.add(composeIndex);
        this.state.setSentEmails(sentEmails);
        
        // Remove draft
        const composeDrafts = this.state.getComposeDrafts();
        composeDrafts.delete(composeIndex);
        this.state.setComposeDrafts(composeDrafts);
        
        // Decrement count
        const currentCount = this.state.getComposeBoxCount();
        const newCount = Math.max(0, currentCount - 1);
        this.state.setComposeBoxCount(newCount);
        
        // If sent box was expanded, clear expanded index
        if (this.state.getExpandedComposeIndex() === composeIndex) {
          this.state.setExpandedComposeIndex(null);
        }
        
        // If no boxes left, close composer mode
        if (newCount === 0) {
          this.state.setIsComposing(false);
          this.state.setExpandedComposeIndex(-1);
          
          // Animate button back
          const btn = this.state.getContainer()?.querySelector<HTMLButtonElement>(
            '.mail-bites-toolbar-action-new-email'
          );
          if (btn && btn.classList.contains('is-rotated')) {
            this.state.setIsComposingAnimating(true);
            btn.classList.add('mail-bites-anim-rotate-open');
            
            btn.addEventListener('animationend', () => {
              btn.classList.remove('mail-bites-anim-rotate-open');
              btn.classList.remove('is-rotated');
              this.state.setIsComposingAnimating(false);
            }, { once: true });
          }
        }
      }
      this.triggerRender();
    }
  }

  /**
   * Handle new email button click
   */
  handleNewEmailClick(): void {
    const newEmailButton = this.state.getContainer()?.querySelector<HTMLButtonElement>(
      '.mail-bites-toolbar-action-new-email'
    );
    
    // Always add a new compose box
    const currentCount = this.state.getComposeBoxCount();
    const newIndex = currentCount;
    this.state.setComposeBoxCount(currentCount + 1);
    
    // Set the new box as expanded
    this.state.setExpandedComposeIndex(newIndex);
    
    if (!this.state.getIsComposing()) {
      this.state.setIsComposing(true);
    }
    
    this.triggerRender();
    
    if (!newEmailButton) {
      return;
    }

    // Animate button rotation
    requestAnimationFrame(() => {
      const btn = this.state.getContainer()?.querySelector<HTMLButtonElement>(
        '.mail-bites-toolbar-action-new-email'
      );
      if (btn && !this.state.getIsComposingAnimating()) {
        this.state.setIsComposingAnimating(true);
        btn.classList.add('mail-bites-anim-rotate-close');
        
        btn.addEventListener('animationend', () => {
          btn.classList.remove('mail-bites-anim-rotate-close');
          btn.classList.add('is-rotated');
          this.state.setIsComposingAnimating(false);
        }, { once: true });
      }
    });
  }

  /**
   * Filter conversations without re-rendering
   */
  private filterConversations(): void {
    const container = this.state.getContainer();
    if (!container) {
      return;
    }

    const query = this.state.getSearchQuery().toLowerCase().trim();
    const items = container.querySelectorAll('.mail-bites-item');
    
    items.forEach((item) => {
      const conversationId = (item as HTMLElement).dataset.conversationId;
      if (!conversationId) {
        return;
      }
      
      const conversation = this.state.getConversations().find(c => c.id === conversationId);
      if (!conversation) {
        return;
      }
      
      const matches = !query || this.matchesSearchQuery(conversation, query);
      (item as HTMLElement).style.display = matches ? '' : 'none';
    });
  }

  /**
   * Check if conversation matches search query
   */
  private matchesSearchQuery(conversation: ConversationData, query: string): boolean {
    const sender = conversation.sender.toLowerCase();
    const subject = conversation.subject.toLowerCase();
    const snippet = conversation.snippet.toLowerCase();
    
    return sender.includes(query) || subject.includes(query) || snippet.includes(query);
  }

  /**
   * Phase 4.4: Handle search button click
   */
  handleSearchButtonClick(button: HTMLButtonElement): void {
    if (this.state.getIsSearchActive()) {
      return;
    }

    this.state.setIsSearchActive(true);
    
    // Use AnimationController for compound search animation
    this.animator.animateSearchButtonToInput(
      button,
      () => {
        // Halfway through rotation, start shrinking
        button.classList.add('is-shrinking');
      },
      () => {
        // After rotation completes, transform to search bar
        this.transformToSearchBar(button);
      }
    );
  }

  /**
   * Phase 4.4: Transform search button to search input
   */
  private transformToSearchBar(button: HTMLButtonElement): void {
    const toolbar = button.closest('.mail-bites-toolbar');
    if (!toolbar) {
      this.state.setIsSearchActive(false);
      return;
    }

    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'mail-bites-search-container';

    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'mail-bites-search-input';
    searchInput.placeholder = '';
    searchInput.setAttribute('aria-label', 'Search emails');

    searchContainer.appendChild(searchInput);

    // Replace button with container
    button.replaceWith(searchContainer);
    
    // Focus the input
    requestAnimationFrame(() => {
      searchInput.focus();
    });

    // Handle input for real-time filtering
    searchInput.addEventListener('input', () => {
      this.state.setSearchQuery(searchInput.value);
      this.filterConversations();
    });
  }

  /**
   * Close search and restore button
   */
  handleSearchClose(searchInput: HTMLInputElement): void {
    this.restoreSearchButton(searchInput);
  }

  /**
   * Phase 4.4: Restore search button from search input
   */
  private restoreSearchButton(searchInput: HTMLInputElement): void {
    const toolbar = searchInput.closest('.mail-bites-toolbar');
    if (!toolbar) {
      this.state.setIsSearchActive(false);
      return;
    }

    // Cancel any ongoing search animations
    this.animator.cancelAnimation('search-shrink');
    this.animator.cancelAnimation('search-transform');
    this.animator.cancelAnimation('search-restore');

    const newToolbar = this.toolbarBuilder.build(
      (type, button) => {} // No-op: toolbar will be replaced on next render
    );
    const searchButton = newToolbar.querySelector('.mail-bites-toolbar-action-search');
    
    if (searchButton) {
      // Add appearing animation class
      searchButton.classList.add('is-appearing');
    }
    
    // Replace entire toolbar
    toolbar.replaceWith(newToolbar);
    
    // Reset state and trigger re-render to attach event handlers
    this.state.setIsSearchActive(false);
    this.state.setSearchQuery('');
    this.triggerRender();
  }

  /**
   * Phase 4.5: Handle click-outside to collapse expanded email or compose box
   */
  handleClickOutside(event: MouseEvent, overlayRoot: HTMLElement): void {
    const target = event.target as HTMLElement;
    
    // Check if clicking inside search container
    const searchContainer = target.closest('.mail-bites-search-container');
    if (!searchContainer && this.state.getIsSearchActive()) {
      // If search is active and clicking outside search container, restore search button
      const searchInput = overlayRoot.querySelector('.mail-bites-search-input') as HTMLInputElement;
      if (searchInput) {
        this.restoreSearchButton(searchInput);
      }
      return;
    }
    
    // Don't collapse if clicking a composer action button
    const composerAction = target.closest('.mail-bites-action-button');
    if (composerAction) {
      return;
    }
    
    // Check if mousedown started inside a compose box or email item
    const mouseDownInItem = this.mouseDownTarget?.closest('.mail-bites-item');
    const mouseDownInResponseBox = this.mouseDownTarget?.closest('.mail-bites-response-box');
    
    // If mousedown was inside, don't collapse (user is dragging)
    if (mouseDownInItem || mouseDownInResponseBox) {
      return;
    }
    
    const closestItem = target.closest('.mail-bites-item');
    const closestResponseBox = target.closest('.mail-bites-response-box');
    
    // If click is inside an email item or response box, don't collapse
    if (closestItem || closestResponseBox) {
      return;
    }
    
    // Collapse all compose boxes if any are open
    if (this.state.getIsComposing() && this.state.getExpandedComposeIndex() !== -1) {
      // Save all drafts before collapsing
      logger.info('Collapsing compose boxes via click-outside');
      this.saveDraftsBeforeCollapse();
      
      // Set to -1 to collapse all (no box matches index -1)
      this.state.setExpandedComposeIndex(-1);
      this.triggerRender();
      return;
    }
    
    // If there's an expanded email, collapse it
    if (this.state.getExpandedId()) {
      logger.info('Collapsing email via click-outside', { 
        expandedId: this.state.getExpandedId(),
        targetElement: target.className 
      });
      this.handleItemClick(this.state.getExpandedId()!);
    }
  }

  /**
   * Phase 4.5: Attach click-outside handler to overlay root
   */
  attachClickOutsideHandler(overlayRoot: HTMLElement): void {
    if (this.state.getClickOutsideHandlerAttached()) {
      return;
    }

    logger.info('Attaching click-outside handler to overlay root');
    
    // Track mousedown target to prevent collapse on drag
    overlayRoot.addEventListener('mousedown', (event) => {
      this.mouseDownTarget = event.target as HTMLElement;
    });
    
    overlayRoot.addEventListener('click', (event) => {
      this.handleClickOutside(event, overlayRoot);
      this.handleComposeBoxClick(event);
    });
    this.state.setClickOutsideHandlerAttached(true);
  }

  /**
   * Handle compose box click to toggle expansion
   */
  private handleComposeBoxClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const composeBox = target.closest('.mail-bites-response-box');
    
    if (!composeBox) {
      return;
    }
    
    const composeIndexStr = (composeBox as HTMLElement).dataset.composeIndex;
    if (composeIndexStr === undefined) {
      return;
    }
    
    const composeIndex = parseInt(composeIndexStr, 10);
    const currentExpandedIndex = this.state.getExpandedComposeIndex();
    
    // If clicking collapsed header, expand this box
    const collapsedHeader = target.closest('.mail-bites-composer-collapsed-header');
    if (collapsedHeader) {
      event.stopPropagation();
      
      if (currentExpandedIndex === composeIndex) {
        // Already expanded, do nothing
        return;
      }
      
      // Save draft for currently expanded box
      if (currentExpandedIndex !== null) {
        this.saveDraft(currentExpandedIndex);
      }
      
      // Expand this box
      this.state.setExpandedComposeIndex(composeIndex);
      this.triggerRender();
    }
  }

  /**
   * Save draft for a specific compose box
   */
  private saveDraft(composeIndex: number): void {
    const container = this.state.getContainer();
    if (!container) {
      return;
    }
    
    const composeBox = container.querySelector(
      `.mail-bites-response-box[data-compose-index="${composeIndex}"]`
    ) as HTMLElement;
    
    if (!composeBox) {
      return;
    }
    
    const recipientsInput = composeBox.querySelector<HTMLInputElement>(
      'input[name="recipients"]'
    );
    const subjectInput = composeBox.querySelector<HTMLInputElement>(
      'input[name="subject"]'
    );
    const messageTextarea = composeBox.querySelector<HTMLTextAreaElement>(
      '.mail-bites-composer-textarea'
    );
    
    const draft = {
      recipients: recipientsInput?.value || '',
      subject: subjectInput?.value || '',
      message: messageTextarea?.value || ''
    };
    
    const composeDrafts = this.state.getComposeDrafts();
    composeDrafts.set(composeIndex, draft);
    this.state.setComposeDrafts(composeDrafts);
  }

  /**
   * Save drafts for all expanded compose boxes before collapse
   */
  private saveDraftsBeforeCollapse(): void {
    const container = this.state.getContainer();
    if (!container) {
      return;
    }
    
    const composeBoxes = container.querySelectorAll('.mail-bites-response-box[data-compose-index]');
    
    composeBoxes.forEach((box) => {
      const composeIndexStr = (box as HTMLElement).dataset.composeIndex;
      if (composeIndexStr !== undefined) {
        const composeIndex = parseInt(composeIndexStr, 10);
        this.saveDraft(composeIndex);
      }
    });
  }

  /**
   * Handle filter button clicks to toggle collapse/expand
   */
  handleFilterButtonClick(type: 'unread' | 'read', button: HTMLButtonElement): void {
    // Only unread button toggles
    if (type !== 'unread') {
      return;
    }

    const container = this.state.getContainer();
    if (!container) {
      return;
    }

    const toolbar = container.querySelector('.mail-bites-toolbar');
    if (!toolbar) {
      return;
    }

    const divider = toolbar.querySelector('.mail-bites-toolbar-divider') as HTMLElement;
    const readButton = toolbar.querySelector('.mail-bites-toolbar-action-read') as HTMLElement;
    const draftButton = toolbar.querySelector('.mail-bites-toolbar-action-draft') as HTMLElement;

    if (!divider || !readButton || !draftButton) {
      return;
    }

    const isCollapsed = this.state.getIsFilterCollapsed();

    if (isCollapsed) {
      // Expand: Add expanded class and animate
      divider.classList.add('is-filter-expanding');
      readButton.classList.add('is-filter-expanding');
      draftButton.classList.add('is-filter-expanding');
      
      // After animation, remove animation class and add expanded state class
      setTimeout(() => {
        divider.classList.remove('is-filter-expanding');
        readButton.classList.remove('is-filter-expanding');
        draftButton.classList.remove('is-filter-expanding');
        
        divider.classList.add('is-filter-expanded');
        readButton.classList.add('is-filter-expanded');
        draftButton.classList.add('is-filter-expanded');
      }, 300);
      
      this.state.setIsFilterCollapsed(false);
    } else {
      // Collapse: Remove expanded class and animate
      divider.classList.remove('is-filter-expanded');
      readButton.classList.remove('is-filter-expanded');
      draftButton.classList.remove('is-filter-expanded');
      
      divider.classList.add('is-filter-collapsing');
      readButton.classList.add('is-filter-collapsing');
      draftButton.classList.add('is-filter-collapsing');
      
      // After animation, remove animation class
      setTimeout(() => {
        divider.classList.remove('is-filter-collapsing');
        readButton.classList.remove('is-filter-collapsing');
        draftButton.classList.remove('is-filter-collapsing');
      }, 300);
      
      this.state.setIsFilterCollapsed(true);
    }
  }
}

