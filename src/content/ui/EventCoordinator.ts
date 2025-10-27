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
  constructor(
    private state: UIState,
    private animator: AnimationController,
    private triggerRender: () => void,
    private toolbarBuilder: ToolbarBuilder
  ) {}

  /**
   * Phase 4.2: Handle conversation item click (toggle expand/collapse)
   */
  handleItemClick(conversationId: string): void {
    // Cancel any ongoing collapse animation before toggling
    this.animator.cancelAnimation('collapse-timeout');
    
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
  handleComposerActionClick(type: ComposerActionType, conversation: ConversationData | null): void {
    if (type === 'delete') {
      if (conversation) {
        // Deleting from reply/forward composer - revert to read mode
        const conversationModes = this.state.getConversationModes();
        conversationModes.set(conversation.id, 'read');
        this.state.setConversationModes(conversationModes);
        conversation.mode = 'read';
        this.state.setExpandedId(conversation.id);
        this.state.setHighlightedId(conversation.id);
        this.state.setPendingHoverId(conversation.id);
      } else {
        // Deleting standalone compose box
        this.state.setIsComposing(false);
      }
      this.triggerRender();
    }
    // TODO: Handle 'send' type
  }

  /**
   * Handle new email button click
   */
  handleNewEmailClick(): void {
    const newEmailButton = this.state.getContainer()?.querySelector<HTMLButtonElement>(
      '.mail-bites-toolbar-action-new-email'
    );
    
    const willBeComposing = !this.state.getIsComposing();
    
    if (!newEmailButton) {
      this.state.setIsComposing(willBeComposing);
      this.triggerRender();
      return;
    }

    if (willBeComposing) {
      // Opening: open box immediately then animate
      this.state.setIsComposing(true);
      this.triggerRender();
      
      // Start animation after render
      requestAnimationFrame(() => {
        const btn = this.state.getContainer()?.querySelector<HTMLButtonElement>(
          '.mail-bites-toolbar-action-new-email'
        );
        if (btn) {
          this.state.setIsComposingAnimating(true);
          btn.classList.add('mail-bites-anim-rotate-close');
          
          btn.addEventListener('animationend', () => {
            btn.classList.remove('mail-bites-anim-rotate-close');
            btn.classList.add('is-rotated');
            this.state.setIsComposingAnimating(false);
          }, { once: true });
        }
      });
    } else {
      // Closing: close box immediately then animate
      this.state.setIsComposing(false);
      this.triggerRender();
      
      // Start animation after render
      requestAnimationFrame(() => {
        const btn = this.state.getContainer()?.querySelector<HTMLButtonElement>(
          '.mail-bites-toolbar-action-new-email'
        );
        if (btn) {
          this.state.setIsComposingAnimating(true);
          btn.classList.add('mail-bites-anim-rotate-open');
          
          btn.addEventListener('animationend', () => {
            btn.classList.remove('mail-bites-anim-rotate-open');
            btn.classList.remove('is-rotated');
            this.state.setIsComposingAnimating(false);
          }, { once: true });
        }
      });
    }
  }

  /**
   * Phase 4.4: Handle more-things button click
   */
  handleMoreThingsClick(button: HTMLButtonElement): void {
    if (this.state.getIsMoreThingsExpanded()) {
      return;
    }

    // Cancel any previous more-things animation
    this.animator.cancelAnimation('more-things-icon-show');

    // Add animation class for sliding right and fading out
    button.classList.add('is-sliding-out');
    
    // Start showing icons halfway through button slide-out
    this.animator.scheduleMoreThingsIconShow(() => {
      this.state.setIsMoreThingsExpanded(true);
      this.triggerRender();
    });
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
      // Use AnimationController for search restore delay
      this.animator.scheduleSearchRestore(() => {
        this.restoreSearchButton(searchInput);
      });
    });
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

    // Note: We manually rebuild the toolbar here instead of calling triggerRender()
    // because we want to add the appearing animation class to the search button.
    // The event handlers will be attached when the user next interacts with the toolbar,
    // or we can trigger a full re-render after replacing the toolbar.
    const newToolbar = this.toolbarBuilder.build(
      this.state.getIsMoreThingsExpanded(),
      () => {}, // No-op: toolbar will be replaced on next render
      () => {}  // No-op: toolbar will be replaced on next render
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
    this.triggerRender();
  }

  /**
   * Phase 4.5: Handle click-outside to collapse expanded email or compose box
   */
  handleClickOutside(event: MouseEvent, overlayRoot: HTMLElement): void {
    const target = event.target as HTMLElement;
    const closestItem = target.closest('.mail-bites-item');
    const closestResponseBox = target.closest('.mail-bites-response-box');
    
    // If click is inside an email item or response box, don't collapse
    if (closestItem || closestResponseBox) {
      return;
    }
    
    // Close compose box if open
    if (this.state.getIsComposing()) {
      logger.info('Closing compose box via click-outside');
      
      // Close box immediately
      this.state.setIsComposing(false);
      this.triggerRender();
      
      // Start animation after render
      requestAnimationFrame(() => {
        const newEmailButton = this.state.getContainer()?.querySelector<HTMLButtonElement>(
          '.mail-bites-toolbar-action-new-email'
        );
        
        if (newEmailButton) {
          this.state.setIsComposingAnimating(true);
          newEmailButton.classList.add('mail-bites-anim-rotate-open');
          
          newEmailButton.addEventListener('animationend', () => {
            newEmailButton.classList.remove('mail-bites-anim-rotate-open');
            newEmailButton.classList.remove('is-rotated');
            this.state.setIsComposingAnimating(false);
          }, { once: true });
        }
      });
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
    overlayRoot.addEventListener('click', (event) => {
      this.handleClickOutside(event, overlayRoot);
    });
    this.state.setClickOutsideHandlerAttached(true);
  }
}
