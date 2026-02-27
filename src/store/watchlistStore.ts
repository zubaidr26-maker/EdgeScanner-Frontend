import { create } from 'zustand';

interface WatchlistItem {
    id: number;
    ticker: string;
    name?: string;
    createdAt: string;
}

interface WatchlistStore {
    items: WatchlistItem[];
    localItems: string[];
    isLoading: boolean;
    error: string | null;
    setItems: (items: WatchlistItem[]) => void;
    addItem: (item: WatchlistItem) => void;
    removeItem: (ticker: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    // Local storage support
    addLocalItem: (ticker: string) => void;
    removeLocalItem: (ticker: string) => void;
    loadLocalItems: () => void;
    isInWatchlist: (ticker: string) => boolean;
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
    items: [],
    localItems: [],
    isLoading: false,
    error: null,
    setItems: (items) => set({ items }),
    addItem: (item) =>
        set((state) => ({ items: [item, ...state.items] })),
    removeItem: (ticker) =>
        set((state) => ({
            items: state.items.filter((i) => i.ticker !== ticker),
            localItems: state.localItems.filter((t) => t !== ticker),
        })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    addLocalItem: (ticker) => {
        const current = get().localItems;
        if (!current.includes(ticker)) {
            const updated = [ticker, ...current];
            localStorage.setItem('watchlist', JSON.stringify(updated));
            set({ localItems: updated });
        }
    },
    removeLocalItem: (ticker) => {
        const updated = get().localItems.filter((t) => t !== ticker);
        localStorage.setItem('watchlist', JSON.stringify(updated));
        set({ localItems: updated });
    },
    loadLocalItems: () => {
        try {
            const saved = localStorage.getItem('watchlist');
            if (saved) {
                set({ localItems: JSON.parse(saved) });
            }
        } catch {
            set({ localItems: [] });
        }
    },
    isInWatchlist: (ticker) => {
        const state = get();
        return (
            state.items.some((i) => i.ticker === ticker) ||
            state.localItems.includes(ticker)
        );
    },
}));
