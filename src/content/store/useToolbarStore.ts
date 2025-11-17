import { create } from 'zustand';

export type ToolbarFilterType = 'unread' | 'read' | 'draft';

interface FilterPulseEvent {
  type: ToolbarFilterType;
  id: number;
}

interface ToolbarState {
  isSearchActive: boolean;
  searchQuery: string;
  filterButtonOrder: ToolbarFilterType[];
  filterPulseEvent: FilterPulseEvent | null;
}

interface ToolbarActions {
  toggleSearch: () => void;
  setSearchQuery: (query: string) => void;
  rotateFilterButtons: (clickedType: ToolbarFilterType) => void;
  setFilterOrder: (order: ToolbarFilterType[]) => void;
  setPrimaryFilter: (filter: ToolbarFilterType) => void;
  triggerFilterPulse: (type: ToolbarFilterType) => void;
  reset: () => void;
}

type ToolbarStore = ToolbarState & ToolbarActions;

const defaultOrder: ToolbarFilterType[] = ['unread', 'read', 'draft'];

const createInitialState = (): ToolbarState => ({
  isSearchActive: false,
  searchQuery: '',
  filterButtonOrder: [...defaultOrder],
  filterPulseEvent: null
});

export const useToolbarStore = create<ToolbarStore>((set) => ({
  ...createInitialState(),
  toggleSearch: () => {
    set((state) => {
      const nextActive = !state.isSearchActive;
      return {
        isSearchActive: nextActive,
        searchQuery: nextActive ? state.searchQuery : ''
      };
    });
  },
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
  rotateFilterButtons: (clickedType) => {
    set((state) => {
      const currentOrder = state.filterButtonOrder;
      if (currentOrder[0] === clickedType) {
        return state;
      }

      const nextOrder: ToolbarFilterType[] = [
        clickedType,
        ...currentOrder.filter((entry) => entry !== clickedType)
      ];

      return {
        filterButtonOrder: nextOrder
      };
    });
  },
  setFilterOrder: (order) => {
    const uniqueOrder = order.filter(
      (entry, index, array) => array.indexOf(entry) === index
    );
    const completeOrder = uniqueOrder.concat(
      defaultOrder.filter((entry) => !uniqueOrder.includes(entry))
    );
    set({
      filterButtonOrder: completeOrder.slice(0, defaultOrder.length)
    });
  },
  setPrimaryFilter: (filter) => {
    set((state) => {
      const filtered = state.filterButtonOrder.filter((entry) => entry !== filter);
      const nextOrder: ToolbarFilterType[] = [filter, ...filtered];
      return {
        filterButtonOrder: nextOrder
      };
    });
  },
  triggerFilterPulse: (type) => {
    set({
      filterPulseEvent: {
        type,
        id: Date.now()
      }
    });
  },
  reset: () => {
    set(() => ({
      ...createInitialState()
    }));
  }
}));

export const resetToolbarStore = () => {
  const { reset } = useToolbarStore.getState();
  reset();
};
