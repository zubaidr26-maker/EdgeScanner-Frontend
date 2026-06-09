import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
    sidebarOpen: boolean;
    theme: 'dark' | 'light';
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleTheme: () => void;
    setTheme: (theme: 'dark' | 'light') => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            sidebarOpen: true,
            theme: 'dark',
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'edgescanner-ui-store',
        }
    )
);
