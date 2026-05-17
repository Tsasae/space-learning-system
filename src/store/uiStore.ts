import { create } from "zustand";
import { Language, UserRole, ViewKey } from "../types";

interface UIState {
  activeView: ViewKey;
  role: UserRole;
  language: Language;
  sidebarCollapsed: boolean;
  search: string;
  theme: "dark" | "light";
  setActiveView: (view: ViewKey) => void;
  setRole: (role: UserRole) => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  setSearch: (value: string) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: "dashboard",
  role: "admin",
  language: "en",
  sidebarCollapsed: false,
  search: "",
  theme: "dark",
  setActiveView: (activeView) => set({ activeView }),
  setRole: (role) => set({ role }),
  setLanguage: (language) => set({ language }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSearch: (search) => set({ search }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
}));
