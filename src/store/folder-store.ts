import { create } from "zustand";

interface FolderState {
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
}

export const useFolderStore = create<FolderState>((set) => ({
  activeFolderId: null,
  setActiveFolderId: (id) => set({ activeFolderId: id }),
}));
