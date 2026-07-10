import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PrivacyStore {
  blurNames: boolean;
  toggle: () => void;
  setBlur: (v: boolean) => void;
}

export const usePrivacyStore = create<PrivacyStore>()(
  persist(
    (set) => ({
      blurNames: false,
      toggle: () => set((s) => ({ blurNames: !s.blurNames })),
      setBlur: (v) => set({ blurNames: v }),
    }),
    { name: "boracopa-privacy" }
  )
);
