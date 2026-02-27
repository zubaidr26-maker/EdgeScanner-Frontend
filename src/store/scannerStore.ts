import { create } from 'zustand';
import { scannerApi } from '@/lib/api';

// ── Filter types ───────────────────────────────────────────────────────
export interface RangeFilter {
    min: string;
    max: string;
}

export interface DayFilters {
    gap: RangeFilter;
    volume: RangeFilter;
    range: RangeFilter;
    highSpike: RangeFilter;
    lowSpike: RangeFilter;
    openPrice: RangeFilter;
    closePrice: RangeFilter;
    returnPct: RangeFilter;
    vwap: RangeFilter;
    change: RangeFilter;
    highGap: RangeFilter;
    highFade: RangeFilter;
    closeDirection: string; // '' | 'green' | 'red'
}

export interface ScannerFilters {
    gd: DayFilters;
    pd: DayFilters;
    d2: DayFilters;
    d3: DayFilters;
}

export interface ComputedDay {
    gap: number;
    volume: number;
    range: number;
    highSpike: number;
    lowSpike: number;
    openPrice: number;
    closePrice: number;
    highPrice: number;
    lowPrice: number;
    returnPct: number;
    vwap: number;
    change: number;
    closeDirection: string;
    highGap: number;
    highFade: number;
}

export interface ScanResult {
    ticker: string;
    // Fundamental Data
    name?: string;
    sector?: string;
    industry?: string;
    country?: string;
    marketCap?: number;
    peRatio?: number;
    forwardPe?: number;
    dividendYield?: number;
    employees?: number;
    float?: number;
    sharesOutstanding?: number;
    beta?: number;
    eps?: number;
    // Price Action
    gapDay: ComputedDay;
    prevDay: ComputedDay;
    day2: ComputedDay;
    day3: ComputedDay;
}

const emptyRange = (): RangeFilter => ({ min: '', max: '' });

const emptyDayFilters = (): DayFilters => ({
    gap: emptyRange(),
    volume: emptyRange(),
    range: emptyRange(),
    highSpike: emptyRange(),
    lowSpike: emptyRange(),
    openPrice: emptyRange(),
    closePrice: emptyRange(),
    returnPct: emptyRange(),
    vwap: emptyRange(),
    change: emptyRange(),
    highGap: emptyRange(),
    highFade: emptyRange(),
    closeDirection: '',
});

// ── Store ──────────────────────────────────────────────────────────────
interface ScannerState {
    filters: ScannerFilters;
    results: ScanResult[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    sort: string;
    sortDir: 'asc' | 'desc';

    setFilter: (prefix: keyof ScannerFilters, field: keyof DayFilters, value: any) => void;
    setRangeFilter: (prefix: keyof ScannerFilters, field: keyof Omit<DayFilters, 'closeDirection'>, bound: 'min' | 'max', value: string) => void;
    resetFilters: () => void;
    setPage: (page: number) => void;
    setSort: (sort: string) => void;
    scan: () => Promise<void>;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
    filters: {
        gd: emptyDayFilters(),
        pd: emptyDayFilters(),
        d2: emptyDayFilters(),
        d3: emptyDayFilters(),
    },
    results: [],
    loading: false,
    error: null,
    page: 1,
    totalPages: 0,
    total: 0,
    limit: 50,
    sort: 'gd_volume',
    sortDir: 'desc',

    setFilter: (prefix, field, value) =>
        set((state) => ({
            filters: {
                ...state.filters,
                [prefix]: { ...state.filters[prefix], [field]: value },
            },
        })),

    setRangeFilter: (prefix, field, bound, value) =>
        set((state) => ({
            filters: {
                ...state.filters,
                [prefix]: {
                    ...state.filters[prefix],
                    [field]: { ...(state.filters[prefix][field] as RangeFilter), [bound]: value },
                },
            },
        })),

    resetFilters: () =>
        set({
            filters: {
                gd: emptyDayFilters(),
                pd: emptyDayFilters(),
                d2: emptyDayFilters(),
                d3: emptyDayFilters(),
            },
            page: 1,
        }),

    setPage: (page) => set({ page }),

    setSort: (sort) =>
        set((state) => ({
            sort,
            sortDir: state.sort === sort ? (state.sortDir === 'desc' ? 'asc' : 'desc') : 'desc',
        })),

    scan: async () => {
        const { filters, page, limit, sort, sortDir } = get();
        set({ loading: true, error: null });

        try {
            // Build query params
            const params: Record<string, string> = {
                page: String(page),
                limit: String(limit),
                sort,
                sortDir,
            };

            const prefixes: (keyof ScannerFilters)[] = ['gd', 'pd', 'd2', 'd3'];
            const numericFields: (keyof Omit<DayFilters, 'closeDirection'>)[] = [
                'gap', 'volume', 'range', 'highSpike', 'lowSpike',
                'openPrice', 'closePrice', 'returnPct', 'vwap', 'change', 'highGap', 'highFade',
            ];

            for (const prefix of prefixes) {
                for (const field of numericFields) {
                    const rf = filters[prefix][field] as RangeFilter;
                    if (rf.min) params[`${prefix}_${field}Min`] = rf.min;
                    if (rf.max) params[`${prefix}_${field}Max`] = rf.max;
                }
                if (filters[prefix].closeDirection) {
                    params[`${prefix}_closeDirection`] = filters[prefix].closeDirection;
                }
            }

            const response = await scannerApi.scan(params);
            const data = response.data;

            set({
                results: data.data || [],
                total: data.meta?.total || 0,
                totalPages: data.meta?.totalPages || 0,
                loading: false,
            });
        } catch (error: any) {
            const status = error?.response?.status;
            let message = 'Scan failed';
            if (status === 429) {
                message = 'API rate limited. Please wait a minute and try again.';
            } else if (status === 500) {
                message = 'Server is loading data. Please wait a moment and try again.';
            } else if (error?.response?.data?.error) {
                message = error.response.data.error;
            } else if (error?.message) {
                message = error.message;
            }
            set({ error: message, loading: false, results: [] });
        }
    },
}));
