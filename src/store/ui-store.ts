import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "grid" | "list";

interface UIState {
  // Detail panel
  selectedLinkId: string | null;
  isDetailPanelOpen: boolean;
  setSelectedLinkId: (id: string | null) => void;
  openDetailPanel: (linkId: string) => void;
  closeDetailPanel: () => void;

  // Bulk selection
  selectedLinkIds: Set<string>;
  toggleLinkSelection: (id: string) => void;
  clearSelection: () => void;
  isSelecting: boolean;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedLinkId: null,
      isDetailPanelOpen: false,
      setSelectedLinkId: (id) => set({ selectedLinkId: id }),
      openDetailPanel: (linkId) =>
        set({ selectedLinkId: linkId, isDetailPanelOpen: true }),
      closeDetailPanel: () =>
        set({ isDetailPanelOpen: false, selectedLinkId: null }),

      selectedLinkIds: new Set(),
      isSelecting: false,
      toggleLinkSelection: (id) =>
        set((state) => {
          const next = new Set(state.selectedLinkIds);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return { selectedLinkIds: next, isSelecting: next.size > 0 };
        }),
      clearSelection: () =>
        set({ selectedLinkIds: new Set(), isSelecting: false }),

      viewMode: "grid",
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: "digested-ui",
      partialize: (state) => ({ viewMode: state.viewMode }),
    }
  )
);
