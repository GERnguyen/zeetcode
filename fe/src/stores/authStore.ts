import { create } from "zustand";
import type { User } from "../types/domain";

type AuthState = {
  accessToken: string;
  user: User | null;
  setSession: (accessToken: string, refreshToken: string, user: User) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("accessToken") ?? "",
  user: null,
  setSession: (accessToken, refreshToken, user) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    set({ accessToken, user });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ accessToken: "", user: null });
  },
}));
