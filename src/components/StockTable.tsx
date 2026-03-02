'use client';

import React from 'react';
import { cn, formatPrice, formatPercent, formatVolume, getChangeColor, getChangeBgColor } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AddToWatchlistBtn from './AddToWatchlistBtn';

interface Stock {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    open?: number;
    high?: number;
    low?: number;
}

interface StockTableProps {
    stocks: Stock[];
    isLoading?: boolean;
    showVolume?: boolean;
    compact?: boolean;
}

function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2 p-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-16 h-5 bg-white/5 rounded-md" />
                    <div className="flex-1 h-5 bg-white/5 rounded-md" />
                    <div className="w-20 h-5 bg-white/5 rounded-md" />
                    <div className="w-16 h-5 bg-white/5 rounded-md" />
                </div>
            ))}
        </div>
    );
}

export default function StockTable({ stocks, isLoading = false, showVolume = true, compact = false }: StockTableProps) {
    const router = useRouter();

    if (isLoading) {
        return <LoadingSkeleton rows={compact ? 5 : 10} />;
    }

    if (!stocks || stocks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <Minus size={20} className="text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">No stocks to display</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/5">
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Ticker</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Change</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">%</th>
                        {showVolume && (
                            <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Volume</th>
                        )}
                        <th className="py-3 px-2 text-center text-slate-500 font-semibold text-[10px]">⭐</th>
                    </tr>
                </thead>
                <tbody>
                    {stocks.map((stock, index) => (
                        <tr
                            key={stock.ticker}
                            onClick={() => router.push(`/stock/${stock.ticker}`)}
                            className="border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer transition-colors group"
                        >
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0 border border-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                                        {stock.ticker.slice(0, 2)}
                                    </div>
                                    <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                                        {stock.ticker}
                                    </span>
                                </div>
                            </td>
                            <td className="text-right py-3 px-4 text-sm font-mono text-white">
                                {formatPrice(stock.price)}
                            </td>
                            <td className={cn('text-right py-3 px-4 text-sm font-mono', getChangeColor(stock.change))}>
                                <div className="flex items-center justify-end gap-1">
                                    {stock.change > 0 ? <TrendingUp size={12} /> : stock.change < 0 ? <TrendingDown size={12} /> : null}
                                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                                </div>
                            </td>
                            <td className="text-right py-3 px-4">
                                <span className={cn('text-xs font-semibold px-2 py-1 rounded-md border', getChangeBgColor(stock.changePercent))}>
                                    {formatPercent(stock.changePercent)}
                                </span>
                            </td>
                            {showVolume && (
                                <td className="text-right py-3 px-4 text-sm font-mono text-slate-400">
                                    {formatVolume(stock.volume)}
                                </td>
                            )}
                            <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <AddToWatchlistBtn ticker={stock.ticker} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
