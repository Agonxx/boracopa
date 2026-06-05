import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

export interface User {
  id: string;
  name: string;
  email: string;
  pts: number;
  isSuperAdmin: boolean;
}

interface AuthStore {
  user: User | null;
  _hydrated: boolean;
  setUser: (user: User | null) => void;
  setHydrated: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  _hydrated: false,
  setHydrated: () => set({ _hydrated: true }),
  setUser: (user) => set({ user }),
  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
