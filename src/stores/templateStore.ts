import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PostTemplate } from '../types';

interface TemplateStore {
    templates: PostTemplate[];

    // Actions
    addTemplate: (template: Omit<PostTemplate, 'id' | 'useCount'>) => PostTemplate;
    updateTemplate: (id: string, updates: Partial<PostTemplate>) => void;
    deleteTemplate: (id: string) => void;
    toggleFavorite: (id: string) => void;
    incrementUseCount: (id: string) => void;
    getTemplateById: (id: string) => PostTemplate | undefined;
    getFavoriteTemplates: () => PostTemplate[];
    getRecentTemplates: (count?: number) => PostTemplate[];
}

export const useTemplateStore = create<TemplateStore>()(
    persist(
        (set, get) => ({
            templates: [],

            addTemplate: (templateData) => {
                const newTemplate: PostTemplate = {
                    id: crypto.randomUUID(),
                    ...templateData,
                    useCount: 0,
                };
                set((state) => ({
                    templates: [...state.templates, newTemplate],
                }));
                return newTemplate;
            },

            updateTemplate: (id, updates) => {
                set((state) => ({
                    templates: state.templates.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                }));
            },

            deleteTemplate: (id) => {
                set((state) => ({
                    templates: state.templates.filter((t) => t.id !== id),
                }));
            },

            toggleFavorite: (id) => {
                set((state) => ({
                    templates: state.templates.map((t) =>
                        t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
                    ),
                }));
            },

            incrementUseCount: (id) => {
                set((state) => ({
                    templates: state.templates.map((t) =>
                        t.id === id ? { ...t, useCount: t.useCount + 1 } : t
                    ),
                }));
            },

            getTemplateById: (id) => {
                return get().templates.find((t) => t.id === id);
            },

            getFavoriteTemplates: () => {
                return get().templates.filter((t) => t.isFavorite);
            },

            getRecentTemplates: (count = 5) => {
                return [...get().templates]
                    .sort((a, b) => b.useCount - a.useCount)
                    .slice(0, count);
            },
        }),
        {
            name: 'cross-link-templates',
        }
    )
);
