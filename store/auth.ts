import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  name: string;
  sector: string;
  pts: number;
  isAdmin: boolean;
}

interface AuthStore {
  user: User | null;
  _hydrated: boolean;
  setHydrated: () => void;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      _hydrated: false,
      setHydrated: () => set({ _hydrated: true }),
      login: (username, password) => {
        if (!username || !password) return false;
        if (username === "adm" && password === "adm123") {
          set({ user: { name: "Admin", sector: "TI", pts: 0, isAdmin: true } });
          return true;
        }
        set({
          user: {
            name: username,
            sector: "Comercial",
            pts: 47,
            isAdmin: false,
          },
        });
        return true;
      },
      logout: () => set({ user: null }),
    }),
    {
      name: "boracopa-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
