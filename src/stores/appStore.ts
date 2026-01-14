import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type Language = 'ja' | 'en';

interface AppState {
    theme: Theme;
    language: Language;
    sidebarCollapsed: boolean;
    currentView: 'dashboard' | 'compose' | 'accounts' | 'schedule' | 'history' | 'settings';

    // Actions
    setTheme: (theme: Theme) => void;
    setLanguage: (language: Language) => void;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setCurrentView: (view: AppState['currentView']) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            theme: 'system',
            language: 'ja',
            sidebarCollapsed: false,
            currentView: 'dashboard',

            setTheme: (theme) => {
                set({ theme });
                // Apply theme to document
                if (theme === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.toggle('dark', prefersDark);
                } else {
                    document.documentElement.classList.toggle('dark', theme === 'dark');
                }
            },

            setLanguage: (language) =>
                set({ language }),

            toggleSidebar: () =>
                set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

            setSidebarCollapsed: (collapsed) =>
                set({ sidebarCollapsed: collapsed }),

            setCurrentView: (view) =>
                set({ currentView: view }),
        }),
        {
            name: 'cross-link-app',
        }
    )
);
