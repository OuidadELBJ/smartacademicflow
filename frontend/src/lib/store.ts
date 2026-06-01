import { create } from "zustand";

export type Role = "ENS" | "RM" | "CF" | "SCO";

interface User {
  userId: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  token: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user: User) => {
    localStorage.setItem("saf_token", user.token);
    localStorage.setItem("saf_user", JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("saf_token");
    localStorage.removeItem("saf_user");
    set({ user: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("saf_user");
      if (stored) {
        const user = JSON.parse(stored) as User;
        set({ user, isAuthenticated: true });
      }
    }
  },
}));
