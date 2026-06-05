import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BolaoRef {
  id: string;
  name: string;
}

interface BolaoStore {
  activeBolaoId: string | null;
  activeBolaoName: string | null;
  userBoloes: BolaoRef[];
  setActiveBolao: (id: string, name: string) => void;
  setUserBoloes: (boloes: BolaoRef[]) => void;
  clearActiveBolao: () => void;
}

export const useBolaoStore = create<BolaoStore>()(
  persist(
    (set) => ({
      activeBolaoId: null,
      activeBolaoName: null,
      userBoloes: [],
      setActiveBolao: (id, name) => set({ activeBolaoId: id, activeBolaoName: name }),
      setUserBoloes: (boloes) => set({ userBoloes: boloes }),
      clearActiveBolao: () => set({ activeBolaoId: null, activeBolaoName: null }),
    }),
    { name: "boracopa-bolao" }
  )
);
