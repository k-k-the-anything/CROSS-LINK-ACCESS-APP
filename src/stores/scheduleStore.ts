import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Post } from '../types';

interface ScheduledPost {
    id: string;
    postId: string;
    scheduledAt: Date;
    createdAt: Date;
    status: 'pending' | 'processing' | 'posted' | 'failed' | 'cancelled';
}

interface ScheduleStore {
    scheduledPosts: ScheduledPost[];

    // Actions
    addScheduledPost: (postId: string, scheduledAt: Date) => ScheduledPost;
    updateScheduledPost: (id: string, updates: Partial<ScheduledPost>) => void;
    removeScheduledPost: (id: string) => void;
    cancelScheduledPost: (id: string) => void;
    getScheduledPostsForDate: (date: Date) => ScheduledPost[];
    getScheduledPostsInRange: (start: Date, end: Date) => ScheduledPost[];
    getPendingScheduledPosts: () => ScheduledPost[];
}

export const useScheduleStore = create<ScheduleStore>()(
    persist(
        (set, get) => ({
            scheduledPosts: [],

            addScheduledPost: (postId: string, scheduledAt: Date) => {
                const newScheduled: ScheduledPost = {
                    id: crypto.randomUUID(),
                    postId,
                    scheduledAt,
                    createdAt: new Date(),
                    status: 'pending',
                };
                set((state) => ({
                    scheduledPosts: [...state.scheduledPosts, newScheduled],
                }));
                return newScheduled;
            },

            updateScheduledPost: (id: string, updates: Partial<ScheduledPost>) => {
                set((state) => ({
                    scheduledPosts: state.scheduledPosts.map((sp) =>
                        sp.id === id ? { ...sp, ...updates } : sp
                    ),
                }));
            },

            removeScheduledPost: (id: string) => {
                set((state) => ({
                    scheduledPosts: state.scheduledPosts.filter((sp) => sp.id !== id),
                }));
            },

            cancelScheduledPost: (id: string) => {
                set((state) => ({
                    scheduledPosts: state.scheduledPosts.map((sp) =>
                        sp.id === id ? { ...sp, status: 'cancelled' as const } : sp
                    ),
                }));
            },

            getScheduledPostsForDate: (date: Date) => {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);

                return get().scheduledPosts.filter((sp) => {
                    const spDate = new Date(sp.scheduledAt);
                    return spDate >= start && spDate <= end;
                });
            },

            getScheduledPostsInRange: (start: Date, end: Date) => {
                return get().scheduledPosts.filter((sp) => {
                    const spDate = new Date(sp.scheduledAt);
                    return spDate >= start && spDate <= end;
                });
            },

            getPendingScheduledPosts: () => {
                return get().scheduledPosts.filter((sp) => sp.status === 'pending');
            },
        }),
        {
            name: 'cross-link-schedule-storage',
        }
    )
);
