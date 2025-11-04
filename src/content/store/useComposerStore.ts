import { create } from 'zustand';

import type { DraftData } from '../types/draft';

interface ComposerState {
  composeBoxCount: number;
  expandedComposeIndex: number | null;
  composeDrafts: Map<number, DraftData>;
  sentEmails: Set<number>;
  isComposingAnimating: boolean;
}

interface ComposerActions {
  addComposeBox: () => number;
  removeComposeBox: (index: number) => void;
  setExpandedComposeIndex: (index: number | null) => void;
  saveDraft: (index: number, draft: DraftData) => void;
  sendEmail: (index: number) => void;
  setComposeAnimationState: (isAnimating: boolean) => void;
  reset: () => void;
}

type ComposerStore = ComposerState & ComposerActions;

const createEmptyDraft = (): DraftData => ({
  to: '',
  subject: '',
  body: '',
  attachments: undefined,
  isDirty: false,
  timestamp: Date.now()
});

const createInitialState = (): ComposerState => ({
  composeBoxCount: 0,
  expandedComposeIndex: null,
  composeDrafts: new Map<number, DraftData>(),
  sentEmails: new Set<number>(),
  isComposingAnimating: false
});

export const useComposerStore = create<ComposerStore>((set, get) => ({
  ...createInitialState(),
  addComposeBox: () => {
    const { composeBoxCount } = get();
    const nextIndex = composeBoxCount;

    set((state) => {
      const composeDrafts = new Map(state.composeDrafts);
      if (!composeDrafts.has(nextIndex)) {
        composeDrafts.set(nextIndex, createEmptyDraft());
      }

      const sentEmails = new Set(state.sentEmails);
      sentEmails.delete(nextIndex);

      return {
        composeBoxCount: state.composeBoxCount + 1,
        composeDrafts,
        sentEmails,
        expandedComposeIndex: nextIndex,
        isComposingAnimating: true
      };
    });

    return nextIndex;
  },
  removeComposeBox: (index) => {
    set((state) => {
      if (index < 0 || index >= state.composeBoxCount) {
        return state;
      }

      const composeDrafts = new Map<number, DraftData>();
      const sentEmails = new Set<number>();
      let nextPosition = 0;

      for (let i = 0; i < state.composeBoxCount; i++) {
        if (i === index) {
          continue;
        }

        const draft = state.composeDrafts.get(i);
        if (draft) {
          composeDrafts.set(nextPosition, draft);
        }

        if (state.sentEmails.has(i)) {
          sentEmails.add(nextPosition);
        }

        nextPosition++;
      }

      const composeBoxCount = Math.max(0, state.composeBoxCount - 1);
      const currentExpanded = state.expandedComposeIndex;
      let expandedComposeIndex: number | null = currentExpanded;

      if (currentExpanded === null) {
        expandedComposeIndex = null;
      } else if (currentExpanded === index) {
        expandedComposeIndex = null;
      } else if (currentExpanded > index) {
        expandedComposeIndex = currentExpanded - 1;
      }

      return {
        composeBoxCount,
        composeDrafts,
        sentEmails,
        expandedComposeIndex
      };
    });
  },
  setExpandedComposeIndex: (index) => {
    set((state) => {
      if (index === null) {
        return { expandedComposeIndex: null };
      }

      if (index < 0 || index >= state.composeBoxCount) {
        return state;
      }

      return { expandedComposeIndex: index };
    });
  },
  saveDraft: (index, draft) => {
    set((state) => {
      if (index < 0 || index >= state.composeBoxCount) {
        return state;
      }

      const composeDrafts = new Map(state.composeDrafts);
      composeDrafts.set(index, { ...draft });

      return { composeDrafts };
    });
  },
  sendEmail: (index) => {
    set((state) => {
      if (index < 0 || index >= state.composeBoxCount) {
        return state;
      }

      const composeDrafts = new Map(state.composeDrafts);
      const existingDraft = composeDrafts.get(index);
      if (existingDraft) {
        composeDrafts.set(index, {
          ...existingDraft,
          isDirty: false,
          timestamp: Date.now()
        });
      }

      const sentEmails = new Set(state.sentEmails);
      sentEmails.add(index);

      return {
        composeDrafts,
        sentEmails
      };
    });
  },
  setComposeAnimationState: (isAnimating) => {
    set({ isComposingAnimating: isAnimating });
  },
  reset: () => {
    set(() => ({
      ...createInitialState()
    }));
  }
}));

export const resetComposerStore = () => {
  const { reset } = useComposerStore.getState();
  reset();
};
