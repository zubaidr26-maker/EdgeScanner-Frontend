import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Stock API calls
export const stockApi = {
    getAllStocks: (limit = 100) => api.get(`/stocks?limit=${limit}`),
    getStockByTicker: (ticker: string) => api.get(`/stocks/${ticker}`),
    getGainers: () => api.get('/stocks/gainers'),
    getLosers: () => api.get('/stocks/losers'),
    getMostActive: () => api.get('/stocks/active'),
    getStockHistory: (ticker: string, params?: {
        timespan?: string;
        multiplier?: number;
        from?: string;
        to?: string;
    }) => api.get(`/stocks/history/${ticker}`, { params }),
    searchStocks: (query: string) => api.get(`/stocks/search?q=${query}`),
    getMarketStatus: () => api.get('/stocks/market-status'),
};

// Scanner API calls
export const scannerApi = {
    scan: (params: Record<string, string>) => api.get('/scanner', { params }),
};

// Intraday API calls
export const intradayApi = {
    getMovers: (params: Record<string, string>) => api.get('/intraday', { params }),
    getChart: (ticker: string, params: Record<string, string>) =>
        api.get(`/intraday/chart/${ticker}`, { params }),
};

// Watchlist API calls (multi-list)
export const watchlistApi = {
    // Lists
    getLists: () => api.get('/watchlist/lists'),
    createList: (name: string, color?: string, icon?: string) =>
        api.post('/watchlist/lists', { name, color, icon }),
    updateList: (id: number, data: { name?: string; color?: string; icon?: string }) =>
        api.put(`/watchlist/lists/${id}`, data),
    deleteList: (id: number) => api.delete(`/watchlist/lists/${id}`),

    // Items in a list
    addItem: (listId: number, ticker: string, name?: string) =>
        api.post(`/watchlist/lists/${listId}/items`, { ticker, name }),
    removeItem: (listId: number, ticker: string) =>
        api.delete(`/watchlist/lists/${listId}/items/${ticker}`),

    // Quick add
    quickAdd: (ticker: string, name?: string, groupId?: number) =>
        api.post('/watchlist/quick-add', { ticker, name, groupId }),

    // Check which lists contain this ticker
    getTickerLists: (ticker: string) => api.get(`/watchlist/ticker/${ticker}`),

    // Legacy
    getWatchlist: () => api.get('/watchlist'),
    addToWatchlist: (ticker: string, name?: string) =>
        api.post('/watchlist', { ticker, name }),
    removeFromWatchlist: (ticker: string) =>
        api.delete(`/watchlist/${ticker}`),
};

export default api;
