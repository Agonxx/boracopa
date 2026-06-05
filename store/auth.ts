import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  name: string;
  email: string;
  pts: number;
  isSuperAdmin: boolean;
}

interface AuthStore {
  user: User | null;
  _hydrated: boolean;
  setHydrated: () => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      _hydrated: false,
      setHydrated: () => set({ _hydrated: true }),
      login: (email, password) => {
        if (!email || !password) return false;
        if (email === "adm@boracopa.app" && password === "adm123") {
          set({ user: { name: "Admin", email, pts: 0, isSuperAdmin: true } });
          return true;
        }
        set({
          user: {
            name: email.split("@")[0],
            email,
            pts: 47,
            isSuperAdmin: false,
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
