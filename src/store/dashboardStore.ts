import { create } from 'zustand';

interface DashboardData {
    gainers: any[];
    losers: any[];
    active: any[];
    marketStatus: any;
}

interface DashboardStore {
    data: DashboardData;
    isLoading: boolean;
    error: string | null;
    selectedStock: string | null;
    searchQuery: string;
    setData: (data: Partial<DashboardData>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSelectedStock: (ticker: string | null) => void;
    setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
    data: {
        gainers: [],
        losers: [],
        active: [],
        marketStatus: null,
    },
    isLoading: false,
    error: null,
    selectedStock: null,
    searchQuery: '',
    setData: (newData) =>
        set((state) => ({
            data: { ...state.data, ...newData },
        })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setSelectedStock: (selectedStock) => set({ selectedStock }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
