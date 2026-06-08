'use client';

import React, { useEffect, useState } from 'react';
import { stockApi } from '@/lib/api';
import { Calendar, DollarSign, RefreshCw, AlertCircle, Percent } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Dividend {
    cash_amount: number;
    declaration_date: string;
    ex_dividend_date: string;
    pay_date: string;
    frequency: number; // e.g. 4 for quarterly
}

interface Split {
    execution_date: string;
    split_from: number;
    split_to: number;
}

interface EventsData {
    dividends: Dividend[];
    splits: Split[];
}

interface StockEventsProps {
    ticker: string;
}

export default function StockEvents({ ticker }: StockEventsProps) {
    const [events, setEvents] = useState<EventsData>({ dividends: [], splits: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ticker) return;
        const fetchEvents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await stockApi.getEvents(ticker);
                if (res.data?.success) {
                    setEvents(res.data.data || { dividends: [], splits: [] });
                } else {
                    setError(res.data?.error || 'Failed to fetch events');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch events data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [ticker]);

    const getFrequencyText = (freq: number) => {
        switch (freq) {
            case 1: return 'Annual';
            case 2: return 'Semi-Annual';
            case 4: return 'Quarterly';
            case 12: return 'Monthly';
            default: return `Custom (${freq}/yr)`;
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
                <div className="space-y-4">
                    <div className="h-6 w-32 bg-white/5 rounded" />
                    <div className="h-40 bg-white/5 rounded-xl border border-white/5" />
                </div>
                <div className="space-y-4">
                    <div className="h-6 w-32 bg-white/5 rounded" />
                    <div className="h-40 bg-white/5 rounded-xl border border-white/5" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <AlertCircle size={28} className="text-amber-500/80 mb-2" />
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    const { dividends = [], splits = [] } = events;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dividends Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Dividend History</h3>
                </div>

                {dividends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-white/5 rounded-xl bg-[#12141e]/20 text-slate-500">
                        <Calendar size={24} className="mb-2 text-slate-600" />
                        <p className="text-xs">No dividend distribution history</p>
                    </div>
                ) : (
                    <div className="border border-white/5 rounded-xl overflow-hidden bg-[#12141e]/30 overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs text-slate-300">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Cash Amount</th>
                                    <th className="py-2.5 px-4 text-right">Frequency</th>
                                    <th className="py-2.5 px-4 text-right">Ex-Div Date</th>
                                    <th className="py-2.5 px-4 text-right">Pay Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {dividends.map((div, idx) => (
                                    <tr key={idx} className="hover:bg-white/2.5 transition-colors font-mono">
                                        <td className="py-3 px-4 text-emerald-400 font-bold">
                                            {formatPrice(div.cash_amount)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-400">
                                            {getFrequencyText(div.frequency)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-400">
                                            {div.ex_dividend_date || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-400">
                                            {div.pay_date || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Splits Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <RefreshCw size={16} className="text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Stock Splits</h3>
                </div>

                {splits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-white/5 rounded-xl bg-[#12141e]/20 text-slate-500">
                        <Percent size={22} className="mb-2 text-slate-600" />
                        <p className="text-xs">No stock split history found</p>
                    </div>
                ) : (
                    <div className="border border-white/5 rounded-xl overflow-hidden bg-[#12141e]/30 overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs text-slate-300">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Execution Date</th>
                                    <th className="py-2.5 px-4 text-right">Ratio</th>
                                    <th className="py-2.5 px-4 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {splits.map((split, idx) => (
                                    <tr key={idx} className="hover:bg-white/2.5 transition-colors font-mono">
                                        <td className="py-3 px-4 text-white">
                                            {split.execution_date}
                                        </td>
                                        <td className="py-3 px-4 text-right text-blue-400 font-semibold">
                                            {split.split_to}:{split.split_from}
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-400">
                                            {split.split_to} shares for every {split.split_from}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
