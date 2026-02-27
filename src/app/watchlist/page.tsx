'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { watchlistApi, stockApi } from '@/lib/api';
import { useWatchlistStore } from '@/store/watchlistStore';
import { Star, Trash2, TrendingUp, TrendingDown, ExternalLink, RefreshCcw } from 'lucide-react';
import { formatPrice, formatPercent, getChangeColor, cn } from '@/lib/utils';

interface WatchlistStock {
    ticker: string;
    name?: string;
    price?: number;
    change?: number;
    changePercent?: number;
}

export default function WatchlistPage() {
    const router = useRouter();
    const { items, localItems, setItems, removeItem, loadLocalItems, removeLocalItem, setLoading, isLoading } = useWatchlistStore();
    const [watchlistStocks, setWatchlistStocks] = useState<WatchlistStock[]>([]);
    const [loadingPrices, setLoadingPrices] = useState(false);

    useEffect(() => {
        loadLocalItems();
        fetchWatchlist();
    }, []);

    const fetchWatchlist = async () => {
        setLoading(true);
        try {
            const res = await watchlistApi.getWatchlist();
            setItems(res.data?.data || []);
        } catch {
            // If DB is down, use local storage
        } finally {
            setLoading(false);
        }
    };

    // Merge DB and local items
    useEffect(() => {
        const dbTickers = items.map(i => i.ticker);
        const allTickers = Array.from(new Set([...dbTickers, ...localItems]));
        const stocks: WatchlistStock[] = allTickers.map(ticker => {
            const dbItem = items.find(i => i.ticker === ticker);
            return {
                ticker,
                name: dbItem?.name,
            };
        });
        setWatchlistStocks(stocks);
    }, [items, localItems]);

    const fetchPrices = async () => {
        setLoadingPrices(true);
        const updated = await Promise.all(
            watchlistStocks.map(async (stock) => {
                try {
                    const res = await stockApi.getStockByTicker(stock.ticker);
                    const data = res.data?.data;
                    return {
                        ...stock,
                        name: data?.name || stock.name,
                        price: data?.price,
                        change: data?.change,
                        changePercent: data?.changePercent,
                    };
                } catch {
                    return stock;
                }
            })
        );
        setWatchlistStocks(updated);
        setLoadingPrices(false);
    };

    useEffect(() => {
        if (watchlistStocks.length > 0) {
            fetchPrices();
        }
    }, [watchlistStocks.length]);

    const handleRemove = async (ticker: string) => {
        removeLocalItem(ticker);
        removeItem(ticker);
        try {
            await watchlistApi.removeFromWatchlist(ticker);
        } catch { }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Star size={16} className="text-white" />
                        </div>
                        Watchlist
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Your saved stocks</p>
                </div>
                <button
                    onClick={fetchPrices}
                    disabled={loadingPrices || watchlistStocks.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-30"
                >
                    <RefreshCcw size={14} className={loadingPrices ? 'animate-spin' : ''} />
                    Refresh Prices
                </button>
            </div>

            {/* Watchlist Content */}
            {watchlistStocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/5 bg-[#12141e]">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                        <Star size={24} className="text-amber-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">Your watchlist is empty</h2>
                    <p className="text-sm text-slate-500 mb-6">Search for stocks and add them to your watchlist</p>
                    <button
                        onClick={() => router.push('/scanner')}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
                    >
                        Go to Scanner
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {watchlistStocks.map((stock, i) => (
                        <div
                            key={stock.ticker}
                            className="rounded-2xl border border-white/5 bg-[#12141e] p-5 hover:border-white/10 transition-all group animate-fade-in cursor-pointer"
                            style={{ animationDelay: `${i * 50}ms` }}
                            onClick={() => router.push(`/stock/${stock.ticker}`)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center text-sm font-bold text-blue-400 border border-blue-500/10">
                                        {stock.ticker.slice(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {stock.ticker}
                                        </h3>
                                        {stock.name && (
                                            <p className="text-xs text-slate-500 truncate max-w-[140px]">{stock.name}</p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(stock.ticker);
                                    }}
                                    className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {stock.price !== undefined ? (
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className="text-xl font-bold text-white font-mono">
                                            {formatPrice(stock.price)}
                                        </div>
                                        {stock.change !== undefined && stock.changePercent !== undefined && (
                                            <div className={cn('flex items-center gap-1 mt-1 text-sm font-medium', getChangeColor(stock.change))}>
                                                {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {formatPercent(stock.changePercent)}
                                            </div>
                                        )}
                                    </div>
                                    <ExternalLink size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                                </div>
                            ) : (
                                <div className="animate-pulse space-y-2">
                                    <div className="w-20 h-6 bg-white/5 rounded" />
                                    <div className="w-14 h-4 bg-white/5 rounded" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
