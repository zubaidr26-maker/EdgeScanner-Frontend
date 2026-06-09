'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { stockApi } from '@/lib/api';
import TradingViewChart from '@/components/TradingViewChart';
import AddToWatchlistBtn from '@/components/AddToWatchlistBtn';
import StockNews from '@/components/StockNews';
import StockFinancials from '@/components/StockFinancials';
import StockEvents from '@/components/StockEvents';
import StockPeers from '@/components/StockPeers';
import StockTechnicals from '@/components/StockTechnicals';

import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    Activity,
    Globe,
    Calendar,
    ExternalLink,
    Zap,
    Scale,
    Compass,
    Newspaper,
    Users,
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

interface RealtimeQuote {
    price: number | null;
    size: number | null;
    timestamp: number | null;
    bid: number | null;
    bidSize: number | null;
    ask: number | null;
    askSize: number | null;
}

type TabType = 'chart' | 'financials' | 'technicals' | 'events' | 'competitors' | 'news';

export default function StockDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticker = (params?.ticker as string)?.toUpperCase() || '';
    
    const [stockData, setStockData] = useState<StockData | null>(null);
    const [realtimeQuote, setRealtimeQuote] = useState<RealtimeQuote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('chart');

    useEffect(() => {
        if (!ticker) return;
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await stockApi.getStockByTicker(ticker);
                if (res.data?.success) {
                    setStockData(res.data?.data);
                } else {
                    setError(res.data?.error || 'Stock details not found');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch stock data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [ticker]);

    useEffect(() => {
        if (!ticker) return;
        const fetchRealtime = async () => {
            try {
                const res = await stockApi.getRealtime(ticker);
                if (res.data?.success && res.data.data) {
                    setRealtimeQuote(res.data.data);
                }
            } catch (err) {
                console.warn('Realtime fetch failed or unsupported:', err);
            }
        };
        fetchRealtime();
        const interval = setInterval(fetchRealtime, 10000);
        return () => clearInterval(interval);
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

    const tabsList = [
        { id: 'chart', label: 'Live Chart', icon: BarChart3 },
        { id: 'financials', label: 'Financials', icon: Scale },
        { id: 'technicals', label: 'Technicals', icon: Compass },
        { id: 'events', label: 'Dividends & Splits', icon: Calendar },
        { id: 'competitors', label: 'Competitors', icon: Users },
        { id: 'news', label: 'News & Sentiment', icon: Newspaper },
    ] as const;

    return (
        <div className="p-4 lg:p-8 animate-fade-in space-y-6">
            {/* Back Button */}
            <div className="flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                    <ArrowLeft size={16} /> Back
                </button>
            </div>

            {/* Stock Header */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
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

                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
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

            {/* Realtime Bid/Ask quote banner */}
            {realtimeQuote && (realtimeQuote.bid !== null || realtimeQuote.ask !== null) && (
                <div className="flex flex-wrap items-center gap-4 py-3 px-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-slate-300 font-mono animate-fade-in">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-400 uppercase">
                        <Zap size={14} className="animate-pulse" /> Live Quote
                    </div>
                    {realtimeQuote.price !== null && (
                        <div>
                            Last Trade: <span className="text-white font-bold">{formatPrice(realtimeQuote.price)}</span>
                            {realtimeQuote.size !== null && <span className="text-slate-500 text-[10px] ml-1">({realtimeQuote.size} shares)</span>}
                        </div>
                    )}
                    {realtimeQuote.bid !== null && (
                        <div>
                            Bid: <span className="text-emerald-400 font-bold">{formatPrice(realtimeQuote.bid)}</span>
                            {realtimeQuote.bidSize !== null && <span className="text-slate-500 text-[10px] ml-1">({realtimeQuote.bidSize} lot)</span>}
                        </div>
                    )}
                    {realtimeQuote.ask !== null && (
                        <div>
                            Ask: <span className="text-rose-400 font-bold">{formatPrice(realtimeQuote.ask)}</span>
                            {realtimeQuote.askSize !== null && <span className="text-slate-500 text-[10px] ml-1">({realtimeQuote.askSize} lot)</span>}
                        </div>
                    )}
                    {realtimeQuote.timestamp && (
                        <div className="text-[10px] text-slate-500 ml-auto flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Updated: {new Date(realtimeQuote.timestamp * 1000).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            )}

            {/* Info Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {infoCards.map((card, i) => (
                    <div
                        key={card.label}
                        className="p-4 rounded-xl border border-white/5 bg-[#12141e]/50 hover:border-white/10 transition-all animate-fade-in"
                        style={{ animationDelay: `${i * 30}ms` }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <card.icon size={12} className="text-slate-500" />
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{card.label}</span>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-white font-mono">{card.value}</div>
                    </div>
                ))}
            </div>

            {/* Main Content Area with Tabs */}
            <div className="space-y-4">
                {/* Tabs Group */}
                <div className="flex overflow-x-auto border-b border-white/5 gap-2 pb-1 scrollbar-hide">
                    {tabsList.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all shrink-0 cursor-pointer",
                                activeTab === tab.id
                                    ? "border-blue-500 text-blue-400 bg-blue-500/5 rounded-t-lg"
                                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/2.5"
                            )}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Active Tab Panel */}
                <div className="rounded-xl border border-white/5 bg-[#12141e]/20 p-4 sm:p-6 min-h-[400px]">
                    {activeTab === 'chart' && (
                        <div className="space-y-4">
                            <div className="h-[650px]">
                                <TradingViewChart ticker={ticker} height={650} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'financials' && (
                        <StockFinancials ticker={ticker} />
                    )}

                    {activeTab === 'technicals' && (
                        <StockTechnicals ticker={ticker} />
                    )}

                    {activeTab === 'events' && (
                        <StockEvents ticker={ticker} />
                    )}

                    {activeTab === 'competitors' && (
                        <StockPeers ticker={ticker} />
                    )}

                    {activeTab === 'news' && (
                        <StockNews ticker={ticker} />
                    )}
                </div>
            </div>

            {/* Description */}
            {stockData.description && (
                <div className="rounded-xl border border-white/5 bg-[#12141e]/30 p-6 space-y-3">
                    <h2 className="text-sm font-semibold text-white">About {stockData.name}</h2>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">{stockData.description}</p>
                </div>
            )}
        </div>
    );
}
