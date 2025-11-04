import { create } from 'zustand';

import type { ConversationData } from '../ui/conversationParser';

export type ConversationMode = 'read' | 'reply' | 'forward';

interface ConversationState {
  conversations: ConversationData[];
  expandedId: string | null;
  highlightedId: string | null;
  dismissedIds: Set<string>;
  conversationModes: Map<string, ConversationMode>;
  collapsingId: string | null;
  pendingHoverId: string | null;
}

interface ConversationActions {
  setConversations: (conversations: ConversationData[]) => void;
  expandConversation: (id: string) => void;
  collapseConversation: (id: string) => void;
  dismissConversation: (id: string) => void;
  setConversationMode: (id: string, mode: ConversationMode) => void;
  setHighlightedId: (id: string | null) => void;
  setPendingHoverId: (id: string | null) => void;
  clearCollapseState: () => void;
  setCollapsingId: (id: string | null) => void;
  reset: () => void;
}

type ConversationStore = ConversationState & ConversationActions;

const createInitialState = (): ConversationState => ({
  conversations: [],
  expandedId: null,
  highlightedId: null,
  dismissedIds: new Set<string>(),
  conversationModes: new Map<string, ConversationMode>(),
  collapsingId: null,
  pendingHoverId: null
});

export const useConversationStore = create<ConversationStore>((set, get) => ({
  ...createInitialState(),
  setConversations: (conversations) => {
    set(() => ({
      conversations: conversations.map((conversation) => ({ ...conversation }))
    }));
  },
  expandConversation: (id) => {
    const { conversationModes } = get();
    if (!conversationModes.has(id)) {
      const nextModes = new Map(conversationModes);
      nextModes.set(id, 'read');
      set({ conversationModes: nextModes });
    }

    set((state) => ({
      expandedId: id,
      collapsingId: state.collapsingId === id ? null : state.collapsingId,
      pendingHoverId: state.pendingHoverId === id ? null : state.pendingHoverId
    }));
  },
  collapseConversation: (id) => {
    set((state) => ({
      expandedId: state.expandedId === id ? null : state.expandedId,
      collapsingId: id
    }));
  },
  dismissConversation: (id) => {
    set((state) => {
      const dismissedIds = new Set(state.dismissedIds);
      dismissedIds.add(id);

      const conversationModes = new Map(state.conversationModes);
      conversationModes.delete(id);

      return {
        dismissedIds,
        conversationModes,
        expandedId: state.expandedId === id ? null : state.expandedId
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
