import { beforeEach, describe, expect, it } from 'vitest';

import {
  resetComposerStore,
  resetConversationStore,
  resetToolbarStore,
  useComposerStore,
  useConversationStore,
  useToolbarStore
} from '@/content/store';
import type { ConversationData } from '@/content/ui/conversationParser';
import type { DraftData } from '@/content/types/draft';

describe('useConversationStore', () => {
  const sampleConversations: ConversationData[] = [
    {
      id: 'thread-1',
      sender: 'Sender A',
      subject: 'Subject A',
      snippet: 'Snippet A',
      date: 'Jan 1',
      isUnread: true,
      mode: 'read'
    },
    {
      id: 'thread-2',
      sender: 'Sender B',
      subject: 'Subject B',
      snippet: 'Snippet B',
      date: 'Jan 2',
      isUnread: false,
      mode: 'read'
    }
  ];

  beforeEach(() => {
    resetConversationStore();
  });

  it('sets conversations and expands/collapses correctly', () => {
    const { setConversations, expandConversation, collapseConversation } =
      useConversationStore.getState();

    setConversations(sampleConversations);

    expect(useConversationStore.getState().conversations).toHaveLength(2);

    expandConversation('thread-1');
    expect(useConversationStore.getState().expandedId).toBe('thread-1');

    collapseConversation('thread-1');
    expect(useConversationStore.getState().expandedId).toBeNull();
    expect(useConversationStore.getState().collapsingId).toBe('thread-1');
  });

  it('dismisses conversations and manages modes', () => {
    const {
      setConversations,
      dismissConversation,
      finalizeDismiss,
      setConversationMode
    } = useConversationStore.getState();

    setConversations(sampleConversations);
    setConversationMode('thread-1', 'reply');

    expect(
      useConversationStore.getState().conversationModes.get('thread-1')
    ).toBe('reply');

    dismissConversation('thread-1');

    expect(useConversationStore.getState().fadingOutIds.has('thread-1')).toBe(
      true
    );
    expect(useConversationStore.getState().dismissedIds.has('thread-1')).toBe(
      false
    );

    finalizeDismiss('thread-1');
    expect(useConversationStore.getState().dismissedIds.has('thread-1')).toBe(
      true
    );
    expect(
      useConversationStore.getState().conversationModes.has('thread-1')
    ).toBe(false);
  });

  it('tracks highlighted and pending hover states and resets', () => {
    const { setHighlightedId, setPendingHoverId, clearCollapseState, reset } =
      useConversationStore.getState();

    setHighlightedId('thread-1');
    setPendingHoverId('thread-2');
    expect(useConversationStore.getState().highlightedId).toBe('thread-1');
    expect(useConversationStore.getState().pendingHoverId).toBe('thread-2');

    clearCollapseState();
    expect(useConversationStore.getState().pendingHoverId).toBeNull();
    expect(useConversationStore.getState().collapsingId).toBeNull();

    reset();
    expect(useConversationStore.getState().conversations).toHaveLength(0);
    expect(useConversationStore.getState().dismissedIds.size).toBe(0);
  });
});

describe('useToolbarStore', () => {
  beforeEach(() => {
    resetToolbarStore();
  });

  it('toggles search and clears query on close', () => {
    const { toggleSearch, setSearchQuery } = useToolbarStore.getState();

    toggleSearch();
    expect(useToolbarStore.getState().isSearchActive).toBe(true);

    setSearchQuery('hello');
    expect(useToolbarStore.getState().searchQuery).toBe('hello');

    toggleSearch();
    expect(useToolbarStore.getState().isSearchActive).toBe(false);
    expect(useToolbarStore.getState().searchQuery).toBe('');
  });

  it('rotates filter buttons and toggles collapse', () => {
    const { rotateFilterButtons, toggleFilterCollapse, setFilterOrder, reset } =
      useToolbarStore.getState();

    rotateFilterButtons('draft');
    expect(useToolbarStore.getState().filterButtonOrder[0]).toBe('draft');

    toggleFilterCollapse();
    expect(useToolbarStore.getState().isFilterCollapsed).toBe(false);

    setFilterOrder(['read', 'unread']);
    expect(useToolbarStore.getState().filterButtonOrder).toEqual([
      'read',
      'unread',
      'draft'
    ]);

    reset();
    expect(useToolbarStore.getState().filterButtonOrder).toEqual([
      'unread',
      'read',
      'draft'
    ]);
  });

  it('sets primary filter and collapse state explicitly', () => {
    const { setPrimaryFilter, setFilterCollapsed } = useToolbarStore.getState();

    setPrimaryFilter('draft', { collapse: true });
    expect(useToolbarStore.getState().filterButtonOrder[0]).toBe('draft');
    expect(useToolbarStore.getState().isFilterCollapsed).toBe(true);

    setFilterCollapsed(false);
    expect(useToolbarStore.getState().isFilterCollapsed).toBe(false);
  });
});

describe('useComposerStore', () => {
  beforeEach(() => {
    resetComposerStore();
  });

  const sampleDraft = (): DraftData => ({
    to: 'user@example.com',
    subject: 'Subject',
    body: 'Body text',
    isDirty: true,
    timestamp: Date.now()
  });

  it('adds compose boxes and tracks expanded index', () => {
    const { addComposeBox, setComposeAnimationState } =
      useComposerStore.getState();

    const index = addComposeBox();
    expect(index).toBe(0);
    expect(useComposerStore.getState().composeBoxCount).toBe(1);
    expect(useComposerStore.getState().expandedComposeIndex).toBe(0);
    expect(useComposerStore.getState().isComposingAnimating).toBe(true);
    expect(useComposerStore.getState().isComposing).toBe(true);

    setComposeAnimationState(false);
    expect(useComposerStore.getState().isComposingAnimating).toBe(false);
  });

  it('saves drafts and marks emails as sent', () => {
    const { addComposeBox, saveDraft, sendEmail } = useComposerStore.getState();
    addComposeBox();
    saveDraft(0, sampleDraft());

    expect(useComposerStore.getState().composeDrafts.get(0)?.subject).toBe(
      'Subject'
    );
    expect(useComposerStore.getState().composeDrafts.get(0)?.isDirty).toBe(false);

    sendEmail(0);
    expect(useComposerStore.getState().sentEmails.has(0)).toBe(true);
    expect(useComposerStore.getState().composeDrafts.get(0)?.isDirty).toBe(
      false
    );
  });

  it('removes compose boxes and reindexes drafts', () => {
    const {
      addComposeBox,
      saveDraft,
      removeComposeBox,
      setExpandedComposeIndex,
      addArchivedDraft,
      clearArchivedDrafts
    } = useComposerStore.getState();

    addComposeBox();
    addComposeBox();
    saveDraft(0, sampleDraft());
    saveDraft(1, { ...sampleDraft(), subject: 'Second' });

    setExpandedComposeIndex(1);
    removeComposeBox(0);

    expect(useComposerStore.getState().composeBoxCount).toBe(1);
    expect(useComposerStore.getState().composeDrafts.get(0)?.subject).toBe(
      'Second'
    );
    expect(useComposerStore.getState().expandedComposeIndex).toBe(0);

    removeComposeBox(0);
    expect(useComposerStore.getState().composeBoxCount).toBe(0);
    expect(useComposerStore.getState().isComposing).toBe(false);
    expect(useComposerStore.getState().archivedDrafts).toHaveLength(2);

    clearArchivedDrafts();
    expect(useComposerStore.getState().archivedDrafts).toHaveLength(0);

    addComposeBox();
    saveDraft(0, sampleDraft());
    removeComposeBox(0, { archive: false });
    expect(useComposerStore.getState().archivedDrafts).toHaveLength(0);

    addArchivedDraft(sampleDraft());
    expect(useComposerStore.getState().archivedDrafts).toHaveLength(1);
  });
});
