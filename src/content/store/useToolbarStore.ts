import { create } from 'zustand';

export type ToolbarFilterType = 'unread' | 'read' | 'draft';

interface ToolbarState {
  isSearchActive: boolean;
  searchQuery: string;
  filterButtonOrder: ToolbarFilterType[];
  isFilterCollapsed: boolean;
}

interface ToolbarActions {
  toggleSearch: () => void;
  setSearchQuery: (query: string) => void;
  rotateFilterButtons: (clickedType: ToolbarFilterType) => void;
  toggleFilterCollapse: () => void;
  setFilterOrder: (order: ToolbarFilterType[]) => void;
  setFilterCollapsed: (collapsed: boolean) => void;
  setPrimaryFilter: (filter: ToolbarFilterType, options?: { collapse?: boolean }) => void;
  reset: () => void;
}

type ToolbarStore = ToolbarState & ToolbarActions;

const defaultOrder: ToolbarFilterType[] = ['unread', 'read', 'draft'];

const createInitialState = (): ToolbarState => ({
  isSearchActive: false,
  searchQuery: '',
  filterButtonOrder: [...defaultOrder],
  isFilterCollapsed: true
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
        filterButtonOrder: nextOrder,
        isFilterCollapsed: state.isFilterCollapsed
      };
    });
  },
  toggleFilterCollapse: () => {
    set((state) => ({
      isFilterCollapsed: !state.isFilterCollapsed
    }));
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
  setFilterCollapsed: (collapsed) => {
    set({ isFilterCollapsed: collapsed });
  },
  setPrimaryFilter: (filter, options) => {
    set((state) => {
      const filtered = state.filterButtonOrder.filter((entry) => entry !== filter);
      const nextOrder: ToolbarFilterType[] = [filter, ...filtered];
      return {
        filterButtonOrder: nextOrder,
        isFilterCollapsed: options?.collapse ?? state.isFilterCollapsed
      };
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
