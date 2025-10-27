import type { ConversationData } from './conversationParser';

/**
 * UIState - Centralized state management for MinimalInboxRenderer
 */
export class UIState {
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
  private isComposing = false;
  private isComposingAnimating = false;

  // Getters
  getContainer(): HTMLElement | null {
    return this.container;
  }

  getExpandedId(): string | null {
    return this.expandedId;
  }

  getConversations(): ConversationData[] {
    return this.conversations;
  }

  getHighlightedId(): string | null {
    return this.highlightedId;
  }

  getDismissedIds(): Set<string> {
    return this.dismissedIds;
  }

  getPendingHoverId(): string | null {
    return this.pendingHoverId;
  }

  getCollapseAnimationId(): string | null {
    return this.collapseAnimationId;
  }

  getCollapsingId(): string | null {
    return this.collapsingId;
  }

  getConversationModes(): Map<string, ConversationData['mode']> {
    return this.conversationModes;
  }

  getIsSearchActive(): boolean {
    return this.isSearchActive;
  }

  getIsMoreThingsExpanded(): boolean {
    return this.isMoreThingsExpanded;
  }

  getClickOutsideHandlerAttached(): boolean {
    return this.clickOutsideHandlerAttached;
  }

  getIsComposing(): boolean {
    return this.isComposing;
  }

  getIsComposingAnimating(): boolean {
    return this.isComposingAnimating;
  }

  // Setters
  setContainer(value: HTMLElement | null): void {
    this.container = value;
  }

  setExpandedId(value: string | null): void {
    this.expandedId = value;
  }

  setConversations(value: ConversationData[]): void {
    this.conversations = value;
  }

  setHighlightedId(value: string | null): void {
    this.highlightedId = value;
  }

  setDismissedIds(value: Set<string>): void {
    this.dismissedIds = value;
  }

  setPendingHoverId(value: string | null): void {
    this.pendingHoverId = value;
  }

  setCollapseAnimationId(value: string | null): void {
    this.collapseAnimationId = value;
  }

  setCollapsingId(value: string | null): void {
    this.collapsingId = value;
  }

  setConversationModes(value: Map<string, ConversationData['mode']>): void {
    this.conversationModes = value;
  }

  setIsSearchActive(value: boolean): void {
    this.isSearchActive = value;
  }

  setIsMoreThingsExpanded(value: boolean): void {
    this.isMoreThingsExpanded = value;
  }

  setClickOutsideHandlerAttached(value: boolean): void {
    this.clickOutsideHandlerAttached = value;
  }

  setIsComposing(value: boolean): void {
    this.isComposing = value;
  }

  setIsComposingAnimating(value: boolean): void {
    this.isComposingAnimating = value;
  }
}
