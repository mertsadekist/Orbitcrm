import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarState = {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
};

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
    }),
    { name: "orbitflow-sidebar-state" }
  )
);
