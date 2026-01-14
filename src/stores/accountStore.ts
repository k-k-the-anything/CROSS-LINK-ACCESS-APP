import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, PlatformType } from '../types';

interface AccountState {
    accounts: Account[];
    selectedAccountIds: string[];
    isLoading: boolean;
    error: string | null;

    // Actions
    addAccount: (account: Account) => void;
    removeAccount: (id: string) => void;
    updateAccount: (id: string, updates: Partial<Account>) => void;
    setSelectedAccounts: (ids: string[]) => void;
    toggleAccountSelection: (id: string) => void;
    selectAllAccounts: () => void;
    deselectAllAccounts: () => void;
    getAccountsByPlatform: (platform: PlatformType) => Account[];
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useAccountStore = create<AccountState>()(
    persist(
        (set, get) => ({
            accounts: [],
            selectedAccountIds: [],
            isLoading: false,
            error: null,

            addAccount: (account) =>
                set((state) => ({
                    accounts: [...state.accounts, account],
                })),

            removeAccount: (id) =>
                set((state) => ({
                    accounts: state.accounts.filter((a) => a.id !== id),
                    selectedAccountIds: state.selectedAccountIds.filter((aid) => aid !== id),
                })),

            updateAccount: (id, updates) =>
                set((state) => ({
                    accounts: state.accounts.map((a) =>
                        a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
                    ),
                })),

            setSelectedAccounts: (ids) =>
                set({ selectedAccountIds: ids }),

            toggleAccountSelection: (id) =>
                set((state) => ({
                    selectedAccountIds: state.selectedAccountIds.includes(id)
                        ? state.selectedAccountIds.filter((aid) => aid !== id)
                        : [...state.selectedAccountIds, id],
                })),

            selectAllAccounts: () =>
                set((state) => ({
                    selectedAccountIds: state.accounts.filter((a) => a.isActive).map((a) => a.id),
                })),

            deselectAllAccounts: () =>
                set({ selectedAccountIds: [] }),

            getAccountsByPlatform: (platform) =>
                get().accounts.filter((a) => a.platform === platform),

            setLoading: (loading) =>
                set({ isLoading: loading }),

            setError: (error) =>
                set({ error }),
        }),
        {
            name: 'cross-link-accounts',
        }
    )
);
