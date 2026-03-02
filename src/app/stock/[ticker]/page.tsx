'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { stockApi, watchlistApi } from '@/lib/api';
import { useWatchlistStore } from '@/store/watchlistStore';
import StockChart from '@/components/StockChart';
import AddToWatchlistBtn from '@/components/AddToWatchlistBtn';
import {
    ArrowLeft,
    Star,
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    Activity,
    Globe,
    Calendar,
    ExternalLink,
} from 'lucide-react';
import { formatPrice, formatPercent, formatNumber, getChangeColor, cn } from '@/lib/utils';

interface StockData {
    ticker: string;
    name: string;
    description: string;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    previousClose: number;
    change: number;
    changePercent: number;
    marketCap: number;
    shareClassSharesOutstanding: number;
    weightedSharesOutstanding: number;
    vwap: number;
    homepageUrl: string;
    listDate: string;
    sic_description: string;
}

export default function StockDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticker = (params?.ticker as string)?.toUpperCase() || '';
    const [stockData, setStockData] = useState<StockData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { fetchLists } = useWatchlistStore();

    useEffect(() => {
        fetchLists();
    }, []);

    useEffect(() => {
        if (!ticker) return;
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await stockApi.getStockByTicker(ticker);
                setStockData(res.data?.data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch stock data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [ticker]);



    if (isLoading) {
        return (
            <div className="p-4 lg:p-8 animate-fade-in">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="animate-pulse space-y-6">
                    <div className="h-10 w-64 bg-white/5 rounded-xl" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}
                    </div>
                    <div className="h-[500px] bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !stockData) {
        return (
            <div className="p-4 lg:p-8 animate-fade-in">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <TrendingDown size={24} className="text-red-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">Unable to load stock data</h2>
                    <p className="text-sm text-slate-500">{error || 'Stock not found'}</p>
                </div>
            </div>
        );
    }

    const infoCards = [
        { label: 'Open', value: formatPrice(stockData.open), icon: DollarSign },
        { label: 'High', value: formatPrice(stockData.high), icon: TrendingUp },
        { label: 'Low', value: formatPrice(stockData.low), icon: TrendingDown },
        { label: 'Close', value: formatPrice(stockData.close), icon: BarChart3 },
        { label: 'Volume', value: formatNumber(stockData.volume), icon: Activity },
        { label: 'VWAP', value: formatPrice(stockData.vwap), icon: Globe },
        { label: 'Prev Close', value: formatPrice(stockData.previousClose), icon: Calendar },
        { label: 'Market Cap', value: formatNumber(stockData.marketCap), icon: DollarSign },
    ];

    return (
        <div className="p-4 lg:p-8 animate-fade-in">
            {/* Back Button */}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm">
                <ArrowLeft size={16} /> Back
            </button>

            {/* Stock Header */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-sm sm:text-lg font-bold text-blue-400 border border-blue-500/10 shrink-0">
                        {ticker.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{ticker}</h1>
                            {stockData.sic_description && (
                                <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20 hidden sm:inline">
                                    {stockData.sic_description}
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate">{stockData.name}</p>
                        {stockData.homepageUrl && (
                            <a href={stockData.homepageUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 mt-0.5 truncate max-w-[200px] sm:max-w-none">
                                <ExternalLink size={10} className="shrink-0" /> {stockData.homepageUrl}
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-left sm:text-right">
                        <div className="text-2xl sm:text-3xl font-bold text-white font-mono">{formatPrice(stockData.price)}</div>
                        <div className={cn('flex items-center sm:justify-end gap-1.5 mt-0.5', getChangeColor(stockData.change))}>
                            {stockData.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span className="text-xs sm:text-sm font-semibold">
                                {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({formatPercent(stockData.changePercent)})
                            </span>
                        </div>
                    </div>
                    <AddToWatchlistBtn
                        ticker={ticker}
                        name={stockData?.name}
                        variant="button"
                        size="md"
                    />
                </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {infoCards.map((card, i) => (
                    <div
                        key={card.label}
                        className="p-4 rounded-xl border border-white/5 bg-[#12141e] hover:border-white/10 transition-all animate-fade-in"
                        style={{ animationDelay: `${i * 50}ms` }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <card.icon size={14} className="text-slate-600" />
                            <span className="text-xs text-slate-500 uppercase tracking-wider">{card.label}</span>
                        </div>
                        <div className="text-lg font-bold text-white font-mono">{card.value}</div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl sm:rounded-2xl border border-white/5 bg-[#12141e] p-3 sm:p-6">
                <h2 className="text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-400" />
                    Price Chart
                </h2>
                <StockChart ticker={ticker} height={400} />
            </div>

            {/* Description */}
            {stockData.description && (
                <div className="mt-6 rounded-2xl border border-white/5 bg-[#12141e] p-6">
                    <h2 className="text-sm font-semibold text-white mb-3">About {stockData.name}</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">{stockData.description}</p>
                </div>
            )}
        </div>
    );
}
