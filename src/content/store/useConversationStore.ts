import { create } from 'zustand';

import type { ConversationData } from '../ui/conversationParser';
import type { DraftData } from '../types/draft';

export type ConversationMode = 'read' | 'reply' | 'forward';

interface ConversationState {
  conversations: ConversationData[];
  expandedId: string | null;
  highlightedId: string | null;
  dismissedIds: Set<string>;
  fadingOutIds: Set<string>; // Conversations that are animating out but not yet dismissed
  conversationModes: Map<string, ConversationMode>;
  collapsingId: string | null;
  pendingHoverId: string | null;
  readIds: Set<string>;
  hoveredIds: Set<string>;
  collapseAnimationId: string | null;
  inlineDrafts: Map<string, DraftData>;
  inlineComposerCollapsed: Set<string>;
}

interface ConversationActions {
  setConversations: (conversations: ConversationData[]) => void;
  expandConversation: (id: string) => void;
  collapseConversation: (id: string) => void;
  dismissConversation: (id: string) => void;
  finalizeDismiss: (id: string) => void; // Called after fade-out animation completes
  setConversationMode: (id: string, mode: ConversationMode) => void;
  setHighlightedId: (id: string | null) => void;
  setPendingHoverId: (id: string | null) => void;
  clearCollapseState: () => void;
  setCollapsingId: (id: string | null) => void;
  setReadIds: (ids: Set<string>) => void;
  markAsRead: (id: string) => void;
  setHoveredIds: (ids: Set<string>) => void;
  addHoveredId: (id: string) => void;
  removeHoveredId: (id: string) => void;
  setCollapseAnimationId: (id: string | null) => void;
  setInlineDraft: (id: string, draft: DraftData) => void;
  clearInlineDraft: (id: string) => void;
  setInlineComposerCollapsed: (id: string, collapsed: boolean) => void;
  reset: () => void;
}

type ConversationStore = ConversationState & ConversationActions;

const createInitialState = (): ConversationState => ({
  conversations: [],
  expandedId: null,
  highlightedId: null,
  dismissedIds: new Set<string>(),
  fadingOutIds: new Set<string>(),
  conversationModes: new Map<string, ConversationMode>(),
  collapsingId: null,
  pendingHoverId: null,
  readIds: new Set<string>(),
  hoveredIds: new Set<string>(),
  collapseAnimationId: null,
  inlineDrafts: new Map<string, DraftData>(),
  inlineComposerCollapsed: new Set<string>()
});

export const useConversationStore = create<ConversationStore>((set, get) => ({
  ...createInitialState(),
  setConversations: (conversations) => {
    set(() => ({
      conversations: conversations.map((conversation) => ({ ...conversation }))
    }));
  },
  expandConversation: (id) => {
    const { conversationModes, expandedId } = get();
    if (!conversationModes.has(id)) {
      const nextModes = new Map(conversationModes);
      nextModes.set(id, 'read');
      set({ conversationModes: nextModes });
    }

    // If switching from one expanded conversation to another, skip collapse animation
    set((state) => ({
      expandedId: id,
      highlightedId: id, // Set highlighted for opacity dimming
      collapsingId: null, // Clear collapsing state to skip animation
      pendingHoverId: state.pendingHoverId === id ? null : state.pendingHoverId
    }));
  },
  collapseConversation: (id) => {
    set((state) => ({
      expandedId: state.expandedId === id ? null : state.expandedId,
      highlightedId: null, // Clear highlight to remove opacity dimming
      collapsingId: id
    }));
  },
  dismissConversation: (id) => {
    set((state) => {
      const fadingOutIds = new Set(state.fadingOutIds);
      fadingOutIds.add(id);

      return {
        fadingOutIds,
        expandedId: state.expandedId === id ? null : state.expandedId,
        highlightedId: state.highlightedId === id ? null : state.highlightedId
      };
    });
  },
  finalizeDismiss: (id) => {
    set((state) => {
      const dismissedIds = new Set(state.dismissedIds);
      dismissedIds.add(id);

      const fadingOutIds = new Set(state.fadingOutIds);
      fadingOutIds.delete(id);

      const conversationModes = new Map(state.conversationModes);
      conversationModes.delete(id);

      return {
        dismissedIds,
        fadingOutIds,
        conversationModes
      };
    });
  },
  setConversationMode: (id, mode) => {
    set((state) => {
      const conversationModes = new Map(state.conversationModes);
      conversationModes.set(id, mode);

      return { conversationModes };
    });
  },
  setHighlightedId: (id) => {
    set({ highlightedId: id });
  },
  setPendingHoverId: (id) => {
    set({ pendingHoverId: id });
  },
  clearCollapseState: () => {
    set({
      collapsingId: null,
      pendingHoverId: null
    });
  },
  setCollapsingId: (id) => {
    set({ collapsingId: id });
  },
  setReadIds: (ids) => {
    set({ readIds: new Set(ids) });
  },
  markAsRead: (id) => {
    set((state) => {
      const readIds = new Set(state.readIds);
      readIds.add(id);

      const conversations = state.conversations.map((conversation) =>
        conversation.id === id
          ? {
              ...conversation,
              isUnread: false
            }
          : conversation
      );

      return { readIds, conversations };
    });
  },
  setHoveredIds: (ids) => {
    set({ hoveredIds: new Set(ids) });
  },
  addHoveredId: (id) => {
    set((state) => {
      const next = new Set(state.hoveredIds);
      next.add(id);
      return { hoveredIds: next };
    });
  },
  removeHoveredId: (id) => {
    set((state) => {
      if (!state.hoveredIds.has(id)) {
        return state;
      }
      const next = new Set(state.hoveredIds);
      next.delete(id);
      return { hoveredIds: next };
    });
  },
  setCollapseAnimationId: (id) => {
    set({ collapseAnimationId: id });
  },
  setInlineDraft: (id, draft) => {
    set((state) => {
      const inlineDrafts = new Map(state.inlineDrafts);
      inlineDrafts.set(id, { ...draft });
      return { inlineDrafts };
    });
  },
  clearInlineDraft: (id) => {
    set((state) => {
      if (!state.inlineDrafts.has(id)) {
        return state;
      }
      const inlineDrafts = new Map(state.inlineDrafts);
      inlineDrafts.delete(id);
      return { inlineDrafts };
    });
  },
  setInlineComposerCollapsed: (id, collapsed) => {
    set((state) => {
      const inlineComposerCollapsed = new Set(state.inlineComposerCollapsed);
      if (collapsed) {
        inlineComposerCollapsed.add(id);
      } else {
        inlineComposerCollapsed.delete(id);
      }
      return { inlineComposerCollapsed };
    });
  },
  reset: () => {
    set(() => ({
      ...createInitialState()
    }));
  }
}));

export const resetConversationStore = () => {
  const { reset } = useConversationStore.getState();
  reset();
};
