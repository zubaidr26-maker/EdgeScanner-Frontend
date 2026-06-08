'use client';

import React, { useEffect, useState } from 'react';
import { stockApi } from '@/lib/api';
import { Activity, AlertCircle, Compass, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface TechnicalsData {
    sma20: number | null;
    rsi14: number | null;
    price?: number;
    message?: string;
}

interface StockTechnicalsProps {
    ticker: string;
}

export default function StockTechnicals({ ticker }: StockTechnicalsProps) {
    const [techData, setTechData] = useState<TechnicalsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ticker) return;
        const fetchTechnicals = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await stockApi.getTechnicals(ticker);
                if (res.data?.success) {
                    setTechData(res.data.data);
                } else {
                    setError(res.data?.error || 'Technicals not available');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch technical indicators');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTechnicals();
    }, [ticker]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                <div className="h-44 bg-white/5 border border-white/5 rounded-xl" />
                <div className="h-44 bg-white/5 border border-white/5 rounded-xl" />
            </div>
        );
    }

    if (error || !techData) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <AlertCircle size={28} className="text-amber-500/80 mb-2" />
                <p className="text-sm">{error || 'Technicals data not available'}</p>
            </div>
        );
    }

    const { rsi14, sma20, price } = techData;

    // Get RSI condition
    const getRsiCondition = (rsi: number) => {
        if (rsi >= 70) return { label: 'Overbought (Bearish Pivot)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', desc: 'The asset is trading at high levels and may be primed for a pullback or trend reversal.' };
        if (rsi <= 30) return { label: 'Oversold (Bullish Pivot)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', desc: 'The asset is trading at low levels and may be due for a technical bounce.' };
        return { label: 'Neutral', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'The asset has standard momentum and is not showing extreme overbought/oversold pressure.' };
    };

    // Get SMA condition
    const getSmaCondition = (currentPrice: number, sma: number) => {
        const diff = ((currentPrice - sma) / sma) * 100;
        if (diff > 0) return { label: 'Bullish', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, text: `Price is +${diff.toFixed(2)}% above SMA(20)` };
        return { label: 'Bearish', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: ShieldAlert, text: `Price is ${diff.toFixed(2)}% below SMA(20)` };
    };

    const rsiCondition = rsi14 !== null ? getRsiCondition(rsi14) : null;
    const smaCondition = (price !== undefined && sma20 !== null) ? getSmaCondition(price, sma20) : null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* RSI Meter Card */}
            <div className="p-6 rounded-xl border border-white/5 bg-[#12141e]/40 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Compass size={18} className="text-blue-400" />
                            <h3 className="text-sm font-semibold text-white">Relative Strength Index (RSI 14)</h3>
                        </div>
                        {rsi14 !== null && (
                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${rsiCondition?.color}`}>
                                {rsiCondition?.label}
                            </span>
                        )}
                    </div>

                    {rsi14 === null ? (
                        <p className="text-xs text-slate-500">Insufficient historical data to compute RSI</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-white font-mono">{rsi14.toFixed(1)}</span>
                                <span className="text-xs text-slate-500">/ 100</span>
                            </div>

                            {/* RSI Bar Gauge */}
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between text-xxs font-mono text-slate-500 uppercase">
                                    <span>Oversold (30)</span>
                                    <span>Neutral</span>
                                    <span>Overbought (70)</span>
                                </div>
                                <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-white/5 border border-white/5 relative">
                                    {/* Oversold marker area */}
                                    <div className="w-[30%] bg-emerald-500/10 border-r border-white/10" />
                                    {/* Neutral marker area */}
                                    <div className="w-[40%] bg-blue-500/5 border-r border-white/10" />
                                    {/* Overbought marker area */}
                                    <div className="w-[30%] bg-rose-500/10" />

                                    {/* Current RSI value indicator dot */}
                                    <div
                                        className={`absolute top-0 bottom-0 w-3.5 h-3.5 -mt-0.5 rounded-full border border-white shadow-md transition-all duration-500 ${
                                            rsi14 <= 30 ? 'bg-emerald-400' : rsi14 >= 70 ? 'bg-rose-400' : 'bg-blue-400'
                                        }`}
                                        style={{ left: `calc(${rsi14}% - 7px)` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {rsiCondition && (
                    <p className="text-xs text-slate-400 leading-relaxed mt-4 pt-3 border-t border-white/5">
                        {rsiCondition.desc}
                    </p>
                )}
            </div>

            {/* SMA Trend Card */}
            <div className="p-6 rounded-xl border border-white/5 bg-[#12141e]/40 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-blue-400" />
                            <h3 className="text-sm font-semibold text-white">Simple Moving Average (SMA 20)</h3>
                        </div>
                        {smaCondition && (
                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border flex items-center gap-1 ${smaCondition.color}`}>
                                <smaCondition.icon size={12} />
                                {smaCondition.label}
                            </span>
                        )}
                    </div>

                    {(sma20 === null || price === undefined) ? (
                        <p className="text-xs text-slate-500">Insufficient historical data to compute SMA</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 my-2 font-mono">
                            <div className="p-3 bg-white/2.5 rounded-lg border border-white/5">
                                <div className="text-xxs text-slate-500 uppercase tracking-wider mb-1">Current Price</div>
                                <div className="text-lg font-bold text-white">{formatPrice(price)}</div>
                            </div>
                            <div className="p-3 bg-white/2.5 rounded-lg border border-white/5">
                                <div className="text-xxs text-slate-500 uppercase tracking-wider mb-1">SMA (20)</div>
                                <div className="text-lg font-bold text-slate-300">{formatPrice(sma20)}</div>
                            </div>
                        </div>
                    )}
                </div>

                {smaCondition && (
                    <p className="text-xs text-slate-400 leading-relaxed mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 font-medium">
                        {smaCondition.text}
                    </p>
                )}
            </div>
        </div>
    );
}
