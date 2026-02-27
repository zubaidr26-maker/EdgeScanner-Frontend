import { create } from 'zustand';
import { intradayApi } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────
export interface IntradayMover {
    ticker: string;
    name?: string;
    sector?: string;
    industry?: string;
    startPrice: number;
    endPrice: number;
    highPrice: number;
    lowPrice: number;
    changePct: number;
    changeAbs: number;
    totalVolume: number;
    peakTime: string;
    troughTime: string;
    direction: 'up' | 'down';
    chartData: { time: number; close: number; volume: number }[];
}

export interface IntradayFilters {
    date: string;           // YYYY-MM-DD
    fromHour: number;       // 0-23
    fromMinute: number;     // 0-59
    toHour: number;         // 0-23
    toMinute: number;       // 0-59
    direction: 'up' | 'down' | 'both';
    minChange: number;      // minimum change %
    timespan: 'minute' | 'hour';
    multiplier: number;
}

interface IntradayMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    sort: string;
    sortDir: string;
    date: string;
    timeRange: string;
}

// ── Store ──────────────────────────────────────────────────────────────
interface IntradayState {
    filters: IntradayFilters;
    results: IntradayMover[];
    loading: boolean;
    error: string | null;
    meta: IntradayMeta | null;
    page: number;
    sort: string;
    sortDir: 'asc' | 'desc';

    // Expanded row for detail chart
    expandedTicker: string | null;
    expandedChartData: any[] | null;
    expandedChartLoading: boolean;

    setFilter: <K extends keyof IntradayFilters>(key: K, value: IntradayFilters[K]) => void;
    setPage: (page: number) => void;
    setSort: (sort: string) => void;
    setExpandedTicker: (ticker: string | null) => void;
    resetFilters: () => void;
    search: () => Promise<void>;
    loadChart: (ticker: string) => Promise<void>;
}

function getYesterday(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    // Skip weekends
    while (d.getDay() === 0 || d.getDay() === 6) {
        d.setDate(d.getDate() - 1);
    }
    return d.toISOString().split('T')[0];
}

const defaultFilters: IntradayFilters = {
    date: getYesterday(),
    fromHour: 9,
    fromMinute: 30,
    toHour: 16,
    toMinute: 0,
    direction: 'both',
    minChange: 2,
    timespan: 'hour',
    multiplier: 1,
};

export const useIntradayStore = create<IntradayState>((set, get) => ({
    filters: { ...defaultFilters },
    results: [],
    loading: false,
    error: null,
    meta: null,
    page: 1,
    sort: 'changePct',
    sortDir: 'desc',
    expandedTicker: null,
    expandedChartData: null,
    expandedChartLoading: false,

    setFilter: (key, value) =>
        set((state) => ({
            filters: { ...state.filters, [key]: value },
        })),

    setPage: (page) => set({ page }),

    setSort: (sort) =>
        set((state) => ({
            sort,
            sortDir: state.sort === sort
                ? (state.sortDir === 'desc' ? 'asc' : 'desc')
                : 'desc',
        })),

    setExpandedTicker: (ticker) =>
        set({ expandedTicker: ticker, expandedChartData: null }),

    resetFilters: () =>
        set({
            filters: { ...defaultFilters },
            page: 1,
        }),

    search: async () => {
        const { filters, page, sort, sortDir } = get();
        set({ loading: true, error: null });

        try {
            const params: Record<string, string> = {
                date: filters.date,
                fromHour: String(filters.fromHour),
                fromMinute: String(filters.fromMinute),
                toHour: String(filters.toHour),
                toMinute: String(filters.toMinute),
                direction: filters.direction,
                minChange: String(filters.minChange),
                timespan: filters.timespan,
                multiplier: String(filters.multiplier),
                page: String(page),
                limit: '50',
                sort,
                sortDir,
            };

            const response = await intradayApi.getMovers(params);
            const data = response.data;

            set({
                results: data.data || [],
                meta: data.meta || null,
                loading: false,
            });
        } catch (error: any) {
            const status = error?.response?.status;
            let message = 'Failed to fetch intraday data';
            if (status === 429) {
                message = 'API rate limited. Please wait a minute and try again.';
            } else if (status === 500) {
                message = 'Server error loading intraday data. Please try again.';
            } else if (error?.response?.data?.error) {
                message = error.response.data.error;
            } else if (error?.message) {
                message = error.message;
            }
            set({ error: message, loading: false, results: [] });
        }
    },

    loadChart: async (ticker: string) => {
        const { filters } = get();
        set({ expandedTicker: ticker, expandedChartLoading: true, expandedChartData: null });

        try {
            const params: Record<string, string> = {
                date: filters.date,
                fromHour: String(filters.fromHour),
                fromMinute: String(filters.fromMinute),
                toHour: String(filters.toHour),
                toMinute: String(filters.toMinute),
                timespan: filters.timespan,
                multiplier: String(filters.multiplier),
            };

            const response = await intradayApi.getChart(ticker, params);
            const data = response.data?.data;

            set({
                expandedChartData: data?.bars || [],
                expandedChartLoading: false,
            });
        } catch (error: any) {
            console.error('Failed to load intraday chart:', error.message);
            set({ expandedChartLoading: false, expandedChartData: [] });
        }
    },
}));
