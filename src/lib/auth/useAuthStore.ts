// useAuthStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string | undefined;
}

interface AuthState {
  user: User | null;
  role: "admin" | "editor" | "developer" | null;
  setUser: (user: User) => void;
  setRole: (role: "admin" | "editor" | "developer") => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,

      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),

      clearSession: () =>
        set({
          user: null,
          role: null,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);
