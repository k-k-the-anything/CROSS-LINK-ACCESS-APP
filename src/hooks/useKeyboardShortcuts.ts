import { useEffect, useCallback } from 'react';
import { useAppStore } from '../stores';

export type ShortcutHandler = () => void;

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    alt?: boolean;
    shift?: boolean;
    handler: ShortcutHandler;
    description: string;
    descriptionJa: string;
}

// Global shortcuts registry
const shortcuts: KeyboardShortcut[] = [];

/**
 * Register a keyboard shortcut
 */
export function registerShortcut(shortcut: KeyboardShortcut): () => void {
    shortcuts.push(shortcut);
    return () => {
        const index = shortcuts.indexOf(shortcut);
        if (index > -1) {
            shortcuts.splice(index, 1);
        }
    };
}

/**
 * Get all registered shortcuts
 */
export function getShortcuts(): KeyboardShortcut[] {
    return [...shortcuts];
}

/**
 * Format shortcut key for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.meta) parts.push('⌘');
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');

    const keyDisplay = shortcut.key.length === 1
        ? shortcut.key.toUpperCase()
        : shortcut.key;
    parts.push(keyDisplay);

    return parts.join(' + ');
}

/**
 * Custom hook for keyboard shortcuts
 */
export function useKeyboardShortcuts() {
    const { currentView, setCurrentView } = useAppStore();

    // Navigation shortcuts
    const navigateTo = useCallback((view: typeof currentView) => {
        setCurrentView(view);
    }, [setCurrentView]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            const isMod = event.metaKey || event.ctrlKey;

            // Navigation shortcuts (with modifier key)
            if (isMod) {
                switch (event.key.toLowerCase()) {
                    case 'd':
                        event.preventDefault();
                        navigateTo('dashboard');
                        break;
                    case 'n':
                        event.preventDefault();
                        navigateTo('compose');
                        break;
                    case 'a':
                        event.preventDefault();
                        navigateTo('accounts');
                        break;
                    case 's':
                        event.preventDefault();
                        navigateTo('schedule');
                        break;
                    case 'h':
                        event.preventDefault();
                        navigateTo('history');
                        break;
                    case 't':
                        event.preventDefault();
                        navigateTo('templates');
                        break;
                    case ',':
                        event.preventDefault();
                        navigateTo('settings');
                        break;
                }
            }

            // Check registered shortcuts
            for (const shortcut of shortcuts) {
                const modMatch =
                    (shortcut.meta === undefined || shortcut.meta === event.metaKey) &&
                    (shortcut.ctrl === undefined || shortcut.ctrl === event.ctrlKey) &&
                    (shortcut.alt === undefined || shortcut.alt === event.altKey) &&
                    (shortcut.shift === undefined || shortcut.shift === event.shiftKey);

                if (modMatch && event.key.toLowerCase() === shortcut.key.toLowerCase()) {
                    event.preventDefault();
                    shortcut.handler();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigateTo]);
}

/**
 * Hook to show keyboard shortcuts help
 */
export function useShortcutsHelp() {
    const { language } = useAppStore();

    const defaultShortcuts: KeyboardShortcut[] = [
        { key: 'd', meta: true, handler: () => { }, description: 'Go to Dashboard', descriptionJa: 'ダッシュボードへ移動' },
        { key: 'n', meta: true, handler: () => { }, description: 'New Post', descriptionJa: '新規投稿' },
        { key: 'a', meta: true, handler: () => { }, description: 'Accounts', descriptionJa: 'アカウント' },
        { key: 's', meta: true, handler: () => { }, description: 'Schedule', descriptionJa: '予約投稿' },
        { key: 'h', meta: true, handler: () => { }, description: 'History', descriptionJa: '投稿履歴' },
        { key: 't', meta: true, handler: () => { }, description: 'Templates', descriptionJa: 'テンプレート' },
        { key: ',', meta: true, handler: () => { }, description: 'Settings', descriptionJa: '設定' },
    ];

    return {
        shortcuts: [...defaultShortcuts, ...shortcuts],
        getDescription: (shortcut: KeyboardShortcut) =>
            language === 'ja' ? shortcut.descriptionJa : shortcut.description,
    };
}
