'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    TrendingUp, TrendingDown, Activity, BarChart3, Clock,
} from 'lucide-react';
import { stockApi } from '@/lib/api';
import SearchBar from '@/components/SearchBar';
import { formatPrice, formatVolume, getChangeColor } from '@/lib/utils';
import AddToWatchlistBtn from '@/components/AddToWatchlistBtn';

interface StockItem {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    open: number;
    high: number;
    low: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [gainers, setGainers] = useState<StockItem[]>([]);
    const [losers, setLosers] = useState<StockItem[]>([]);
    const [active, setActive] = useState<StockItem[]>([]);
    const [marketStatus, setMarketStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'active'>('gainers');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [g, l, a, m] = await Promise.allSettled([
                    stockApi.getGainers(),
                    stockApi.getLosers(),
                    stockApi.getMostActive(),
                    stockApi.getMarketStatus(),
                ]);
                if (g.status === 'fulfilled') setGainers(g.value.data?.data || []);
                if (l.status === 'fulfilled') setLosers(l.value.data?.data || []);
                if (a.status === 'fulfilled') setActive(a.value.data?.data || []);
                if (m.status === 'fulfilled') setMarketStatus(m.value.data?.data || null);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const tabData = activeTab === 'gainers' ? gainers : activeTab === 'losers' ? losers : active;
    const tabs = [
        { key: 'gainers' as const, label: 'Top Gainers', icon: <TrendingUp size={14} />, color: 'text-emerald-400' },
        { key: 'losers' as const, label: 'Top Losers', icon: <TrendingDown size={14} />, color: 'text-red-400' },
        { key: 'active' as const, label: 'Most Active', icon: <Activity size={14} />, color: 'text-blue-400' },
    ];

    // Mini cards: top 3 of each
    const miniCards = [
        { title: 'Top Gainer', data: gainers[0], color: 'from-emerald-500/10 to-emerald-500/5', icon: <TrendingUp size={16} className="text-emerald-400" /> },
        { title: 'Top Loser', data: losers[0], color: 'from-red-500/10 to-red-500/5', icon: <TrendingDown size={16} className="text-red-400" /> },
        { title: 'Most Active', data: active[0], color: 'from-blue-500/10 to-blue-500/5', icon: <Activity size={16} className="text-blue-400" /> },
    ];

    return (
        <div className="min-h-screen p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        <BarChart3 size={22} className="text-blue-400" />
                        Dashboard
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Market overview and top movers</p>
                </div>
                <div className="w-full sm:w-80">
                    <SearchBar />
                </div>
            </div>

            {/* Market Status + Mini Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {/* Market Status */}
                <div className="rounded-xl border border-white/5 bg-[#0d0f15]/80 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-slate-500" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Market</span>
                    </div>
                    {loading ? (
                        <div className="h-6 bg-white/5 rounded animate-pulse" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${marketStatus?.market === 'open' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-red-400'}`} />
                            <span className="text-sm font-semibold text-white capitalize">
                                {marketStatus?.market || 'Closed'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Mini cards */}
                {miniCards.map((card) => (
                    <div
                        key={card.title}
                        onClick={() => card.data && router.push(`/stock/${card.data.ticker}`)}
                        className={`rounded-xl border border-white/5 bg-gradient-to-br ${card.color} p-4 cursor-pointer
              hover:border-white/10 transition-all`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            {card.icon}
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{card.title}</span>
                        </div>
                        {loading || !card.data ? (
                            <div className="h-6 bg-white/5 rounded animate-pulse" />
                        ) : (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white">{card.data.ticker}</span>
                                <span className={`text-xs font-semibold ${getChangeColor(card.data.changePercent)}`}>
                                    {card.data.changePercent > 0 ? '+' : ''}{card.data.changePercent.toFixed(2)}%
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4 p-1 bg-[#0d0f15] rounded-xl w-fit overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                            ? `bg-white/5 ${tab.color} border border-white/5`
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.key === 'gainers' ? 'Gain' : tab.key === 'losers' ? 'Loss' : 'Active'}</span>
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <div className="rounded-xl border border-white/5 overflow-hidden bg-[#0d0f15]/80">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                        <thead>
                            <tr className="bg-[#12141e] border-b border-white/5">
                                <th className="px-3 sm:px-4 py-3 text-left text-slate-500 font-semibold">Ticker</th>
                                <th className="px-3 sm:px-4 py-3 text-right text-slate-500 font-semibold">Price</th>
                                <th className="px-3 sm:px-4 py-3 text-right text-slate-500 font-semibold">Change %</th>
                                <th className="px-3 sm:px-4 py-3 text-right text-slate-500 font-semibold hidden sm:table-cell">Volume</th>
                                <th className="px-3 sm:px-4 py-3 text-right text-slate-500 font-semibold hidden md:table-cell">High</th>
                                <th className="px-3 sm:px-4 py-3 text-right text-slate-500 font-semibold hidden md:table-cell">Low</th>
                                <th className="px-2 py-3 text-center text-slate-500 font-semibold text-[10px]">⭐</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="border-b border-white/[0.02]">
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className={`px-4 py-3 ${j > 3 ? 'hidden md:table-cell' : j > 2 ? 'hidden sm:table-cell' : ''}`}>
                                                <div className="h-4 bg-white/5 rounded animate-pulse" />
                                            </td>
                                        ))}
                                        <td className="px-2 py-3"><div className="h-4 w-5 bg-white/5 rounded animate-pulse" /></td>
                                    </tr>
                                ))
                                : tabData.map((stock) => (
                                    <tr
                                        key={stock.ticker}
                                        onClick={() => router.push(`/stock/${stock.ticker}`)}
                                        className="border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer transition-colors"
                                    >
                                        <td className="px-3 sm:px-4 py-3 font-semibold text-white">{stock.ticker}</td>
                                        <td className="px-3 sm:px-4 py-3 text-right text-slate-300">{formatPrice(stock.price)}</td>
                                        <td className={`px-3 sm:px-4 py-3 text-right font-semibold ${getChangeColor(stock.changePercent)}`}>
                                            {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 text-right text-slate-400 hidden sm:table-cell">{formatVolume(stock.volume)}</td>
                                        <td className="px-3 sm:px-4 py-3 text-right text-slate-400 hidden md:table-cell">{formatPrice(stock.high)}</td>
                                        <td className="px-3 sm:px-4 py-3 text-right text-slate-400 hidden md:table-cell">{formatPrice(stock.low)}</td>
                                        <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <AddToWatchlistBtn ticker={stock.ticker} />
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
