import { create } from 'zustand';
import { watchlistApi } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────
export interface WatchlistItem {
    id: number;
    ticker: string;
    name?: string;
    groupId: number;
    createdAt: string;
}

export interface WatchlistGroup {
    id: number;
    name: string;
    color: string;
    icon: string;
    items: WatchlistItem[];
    createdAt: string;
}

// ── Store ──────────────────────────────────────────────────
interface WatchlistStore {
    lists: WatchlistGroup[];
    activeListId: number | null;
    isLoading: boolean;
    error: string | null;

    // List operations
    fetchLists: () => Promise<void>;
    createList: (name: string, color?: string) => Promise<WatchlistGroup | null>;
    updateList: (id: number, data: { name?: string; color?: string }) => Promise<void>;
    deleteList: (id: number) => Promise<void>;
    setActiveList: (id: number | null) => void;

    // Item operations
    addItemToList: (listId: number, ticker: string, name?: string) => Promise<boolean>;
    removeItemFromList: (listId: number, ticker: string) => Promise<void>;
    quickAdd: (ticker: string, name?: string, groupId?: number) => Promise<boolean>;

    // Helpers
    isInAnyList: (ticker: string) => boolean;
    getListsForTicker: (ticker: string) => number[];
    getActiveList: () => WatchlistGroup | null;
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
    lists: [],
    activeListId: null,
    isLoading: false,
    error: null,

    fetchLists: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await watchlistApi.getLists();
            const lists = res.data?.data || [];
            set({ lists, isLoading: false });
            // Auto-select first list if none selected
            if (!get().activeListId && lists.length > 0) {
                set({ activeListId: lists[0].id });
            }
        } catch (error: any) {
            set({ error: error?.message || 'Failed to load lists', isLoading: false });
        }
    },

    createList: async (name, color) => {
        try {
            const res = await watchlistApi.createList(name, color);
            const newList = res.data?.data;
            if (newList) {
                set((state) => ({ lists: [...state.lists, newList] }));
                return newList;
            }
            return null;
        } catch (error: any) {
            set({ error: error?.response?.data?.error || 'Failed to create list' });
            return null;
        }
    },

    updateList: async (id, data) => {
        try {
            const res = await watchlistApi.updateList(id, data);
            const updated = res.data?.data;
            if (updated) {
                set((state) => ({
                    lists: state.lists.map((l) => (l.id === id ? updated : l)),
                }));
            }
        } catch (error: any) {
            set({ error: error?.response?.data?.error || 'Failed to update list' });
        }
    },

    deleteList: async (id) => {
        try {
            await watchlistApi.deleteList(id);
            set((state) => {
                const newLists = state.lists.filter((l) => l.id !== id);
                return {
                    lists: newLists,
                    activeListId: state.activeListId === id
                        ? (newLists.length > 0 ? newLists[0].id : null)
                        : state.activeListId,
                };
            });
        } catch (error: any) {
            set({ error: error?.response?.data?.error || 'Failed to delete list' });
        }
    },

    setActiveList: (id) => set({ activeListId: id }),

    addItemToList: async (listId, ticker, name) => {
        try {
            const res = await watchlistApi.addItem(listId, ticker, name);
            const newItem = res.data?.data;
            if (newItem) {
                set((state) => ({
                    lists: state.lists.map((l) =>
                        l.id === listId ? { ...l, items: [newItem, ...l.items] } : l
                    ),
                }));
                return true;
            }
            return false;
        } catch {
            return false;
        }
    },

    removeItemFromList: async (listId, ticker) => {
        try {
            await watchlistApi.removeItem(listId, ticker);
            set((state) => ({
                lists: state.lists.map((l) =>
                    l.id === listId
                        ? { ...l, items: l.items.filter((i) => i.ticker !== ticker) }
                        : l
                ),
            }));
        } catch (error: any) {
            set({ error: error?.response?.data?.error || 'Failed to remove item' });
        }
    },

    quickAdd: async (ticker, name, groupId) => {
        try {
            const res = await watchlistApi.quickAdd(ticker, name, groupId);
            if (res.data?.success) {
                // Refresh lists to get updated data
                await get().fetchLists();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    },

    isInAnyList: (ticker) => {
        const { lists } = get();
        return lists.some((l) => l.items.some((i) => i.ticker === ticker));
    },

    getListsForTicker: (ticker) => {
        const { lists } = get();
        return lists
            .filter((l) => l.items.some((i) => i.ticker === ticker))
            .map((l) => l.id);
    },

    getActiveList: () => {
        const { lists, activeListId } = get();
        return lists.find((l) => l.id === activeListId) || null;
    },
}));
