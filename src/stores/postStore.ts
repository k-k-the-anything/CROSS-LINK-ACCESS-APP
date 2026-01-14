import { create } from 'zustand';
import { Post, CrossPostTarget, PostStatus, ContentType } from '../types';

interface PostState {
    posts: Post[];
    currentDraft: {
        content: string;
        title?: string;
        contentType: ContentType;
        mediaPaths: string[];
        hashtags: string[];
        scheduledAt?: Date;
    };
    crossPostTargets: CrossPostTarget[];
    isPosting: boolean;
    error: string | null;

    // Draft actions
    setDraftContent: (content: string) => void;
    setDraftTitle: (title: string) => void;
    setDraftContentType: (type: ContentType) => void;
    addDraftMedia: (path: string) => void;
    removeDraftMedia: (path: string) => void;
    setDraftHashtags: (hashtags: string[]) => void;
    setDraftScheduledAt: (date: Date | undefined) => void;
    clearDraft: () => void;

    // Post actions
    addPost: (post: Post) => void;
    updatePost: (id: string, updates: Partial<Post>) => void;
    deletePost: (id: string) => void;
    getPostsByStatus: (status: PostStatus) => Post[];
    getScheduledPosts: () => Post[];

    // Cross-post actions
    addCrossPostTarget: (target: CrossPostTarget) => void;
    updateCrossPostTarget: (id: string, updates: Partial<CrossPostTarget>) => void;

    // State actions
    setPosting: (posting: boolean) => void;
    setError: (error: string | null) => void;
}

const initialDraft = {
    content: '',
    title: undefined,
    contentType: 'text' as ContentType,
    mediaPaths: [],
    hashtags: [],
    scheduledAt: undefined,
};

export const usePostStore = create<PostState>((set, get) => ({
    posts: [],
    currentDraft: { ...initialDraft },
    crossPostTargets: [],
    isPosting: false,
    error: null,

    // Draft actions
    setDraftContent: (content) =>
        set((state) => ({
            currentDraft: { ...state.currentDraft, content },
        })),

    setDraftTitle: (title) =>
        set((state) => ({
            currentDraft: { ...state.currentDraft, title },
        })),

    setDraftContentType: (type) =>
        set((state) => ({
            currentDraft: { ...state.currentDraft, contentType: type },
        })),

    addDraftMedia: (path) =>
        set((state) => ({
            currentDraft: {
                ...state.currentDraft,
                mediaPaths: [...state.currentDraft.mediaPaths, path],
                contentType: path.includes('video') ? 'video' : 'image',
            },
        })),

    removeDraftMedia: (path) =>
        set((state) => ({
            currentDraft: {
                ...state.currentDraft,
                mediaPaths: state.currentDraft.mediaPaths.filter((p) => p !== path),
                contentType:
                    state.currentDraft.mediaPaths.length <= 1 ? 'text' : state.currentDraft.contentType,
            },
        })),

    setDraftHashtags: (hashtags) =>
        set((state) => ({
            currentDraft: { ...state.currentDraft, hashtags },
        })),

    setDraftScheduledAt: (date) =>
        set((state) => ({
            currentDraft: { ...state.currentDraft, scheduledAt: date },
        })),

    clearDraft: () =>
        set({ currentDraft: { ...initialDraft } }),

    // Post actions
    addPost: (post) =>
        set((state) => ({ posts: [...state.posts, post] })),

    updatePost: (id, updates) =>
        set((state) => ({
            posts: state.posts.map((p) =>
                p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
            ),
        })),

    deletePost: (id) =>
        set((state) => ({
            posts: state.posts.filter((p) => p.id !== id),
            crossPostTargets: state.crossPostTargets.filter((t) => t.postId !== id),
        })),

    getPostsByStatus: (status) =>
        get().posts.filter((p) => p.status === status),

    getScheduledPosts: () =>
        get().posts.filter((p) => p.status === 'scheduled' && p.scheduledAt),

    // Cross-post actions
    addCrossPostTarget: (target) =>
        set((state) => ({ crossPostTargets: [...state.crossPostTargets, target] })),

    updateCrossPostTarget: (id, updates) =>
        set((state) => ({
            crossPostTargets: state.crossPostTargets.map((t) =>
                t.id === id ? { ...t, ...updates } : t
            ),
        })),

    // State actions
    setPosting: (posting) =>
        set({ isPosting: posting }),

    setError: (error) =>
        set({ error }),
}));
