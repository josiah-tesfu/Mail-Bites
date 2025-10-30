import type { ConversationData } from './conversationParser';

export interface ComposeDraftData {
  recipients: string;
  subject: string;
  message: string;
}

type FilterButton = 'unread' | 'read' | 'draft';

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
  private searchQuery = '';
  private clickOutsideHandlerAttached = false;
  private isComposing = false;
  private isComposingAnimating = false;
  private composeBoxCount = 0;
  private expandedComposeIndex: number | null = null;
  private composeDrafts = new Map<number, ComposeDraftData>();
  private archivedComposeDrafts: ComposeDraftData[] = [];
  private sentEmails = new Set<number>();
  private isFilterCollapsed = true;
  private filterPrimaryAction: FilterButton = 'unread';

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

  getSearchQuery(): string {
    return this.searchQuery;
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

  getComposeBoxCount(): number {
    return this.composeBoxCount;
  }

  getExpandedComposeIndex(): number | null {
    return this.expandedComposeIndex;
  }

  getComposeDrafts(): Map<number, ComposeDraftData> {
    return this.composeDrafts;
  }

  getSentEmails(): Set<number> {
    return this.sentEmails;
  }

  getIsFilterCollapsed(): boolean {
    return this.isFilterCollapsed;
  }

  getFilterPrimaryAction(): FilterButton {
    return this.filterPrimaryAction;
  }

  getArchivedComposeDrafts(): ComposeDraftData[] {
    return this.archivedComposeDrafts;
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

  setSearchQuery(value: string): void {
    this.searchQuery = value;
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

  setComposeBoxCount(value: number): void {
    this.composeBoxCount = value;
  }

  setExpandedComposeIndex(value: number | null): void {
    this.expandedComposeIndex = value;
  }

  setComposeDrafts(value: Map<number, ComposeDraftData>): void {
    this.composeDrafts = value;
  }

  setSentEmails(value: Set<number>): void {
    this.sentEmails = value;
  }

  setIsFilterCollapsed(value: boolean): void {
    this.isFilterCollapsed = value;
  }

  setFilterPrimaryAction(value: FilterButton): void {
    this.filterPrimaryAction = value;
  }

  addArchivedComposeDraft(draft: ComposeDraftData): void {
    this.archivedComposeDrafts = [...this.archivedComposeDrafts, draft];
  }
}
