import { create } from "zustand";

type InstitutionStoreState = {
  namesById: Record<string, string>;
  setName: (id: string, name: string) => void;
  setNames: (entries: Record<string, string>) => void;
};

export const useInstitutionStore = create<InstitutionStoreState>((set) => ({
  namesById: {},
  setName: (id, name) =>
    set((state) => ({
      namesById: {
        ...state.namesById,
        [id]: name,
      },
    })),
  setNames: (entries) =>
    set((state) => ({
      namesById: {
        ...state.namesById,
        ...entries,
      },
    })),
}));
