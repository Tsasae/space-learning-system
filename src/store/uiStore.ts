import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeView: "dashboard",
      role: "admin",
      language: "mn",
      sidebarCollapsed: false,
      search: "",
      theme: "light",
      setActiveView: (activeView) => set({ activeView }),
      setRole: (role) => set({ role }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSearch: (search) => set({ search }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
    }),
    {
      name: "lms-ui",
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        role: state.role,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
