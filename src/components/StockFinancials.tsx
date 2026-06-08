'use client';

import React, { useEffect, useState } from 'react';
import { stockApi } from '@/lib/api';
import { BarChart3, AlertCircle, DollarSign, Wallet } from 'lucide-react';
import { formatNumber, formatPrice } from '@/lib/utils';

interface FinancialReport {
    fiscal_period: string;
    fiscal_year: string;
    start_date: string;
    end_date: string;
    revenue: number;
    net_income: number;
    operating_income: number;
    assets: number;
    liabilities: number;
    equity: number;
    operating_cash_flow: number;
}

interface StockFinancialsProps {
    ticker: string;
}

export default function StockFinancials({ ticker }: StockFinancialsProps) {
    const [financials, setFinancials] = useState<FinancialReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ticker) return;
        const fetchFinancials = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await stockApi.getFinancials(ticker);
                if (res.data?.success) {
                    setFinancials(res.data.data || []);
                } else {
                    setError(res.data?.error || 'Financial statements not available');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch financial data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFinancials();
    }, [ticker]);

    const formatCurrency = (val: number) => {
        if (!val) return '$0.00';
        const absVal = Math.abs(val);
        if (absVal >= 1.0e9) {
            return `${val < 0 ? '-' : ''}$${(absVal / 1.0e9).toFixed(2)}B`;
        }
        if (absVal >= 1.0e6) {
            return `${val < 0 ? '-' : ''}$${(absVal / 1.0e6).toFixed(2)}M`;
        }
        return `${val < 0 ? '-' : ''}$${formatNumber(absVal)}`;
    };

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 w-48 bg-white/5 rounded-lg" />
                <div className="border border-white/5 rounded-xl overflow-hidden bg-[#12141e]/50">
                    <div className="h-12 bg-white/5 border-b border-white/5" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-14 border-b border-white/5 last:border-b-0 bg-white/0" />
                    ))}
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

    if (financials.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <BarChart3 size={32} className="mb-3 text-slate-600" />
                <p className="text-sm">No financial reports available for {ticker}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Financial Statement History</h3>
            </div>

            <div className="border border-white/5 rounded-xl overflow-hidden bg-[#12141e]/30 overflow-x-auto">
                <table className="w-full min-w-[650px] border-collapse text-left text-xs text-slate-300">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                            <th className="py-3 px-4">Period</th>
                            <th className="py-3 px-4 text-right">Revenue</th>
                            <th className="py-3 px-4 text-right">Operating Income</th>
                            <th className="py-3 px-4 text-right">Net Income</th>
                            <th className="py-3 px-4 text-right">Total Assets</th>
                            <th className="py-3 px-4 text-right">Total Liabilities</th>
                            <th className="py-3 px-4 text-right">Equity</th>
                            <th className="py-3 px-4 text-right">Operating Cash Flow</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {financials.map((report, idx) => (
                            <tr
                                key={idx}
                                className="hover:bg-white/2.5 transition-colors font-mono"
                            >
                                <td className="py-3.5 px-4 font-semibold text-white">
                                    {report.fiscal_period} {report.fiscal_year}
                                    <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                                        End: {report.end_date}
                                    </span>
                                </td>
                                <td className="py-3.5 px-4 text-right text-white font-medium">
                                    {formatCurrency(report.revenue)}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                    <span className={report.operating_income >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                        {formatCurrency(report.operating_income)}
                                    </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                    <span className={report.net_income >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                        {formatCurrency(report.net_income)}
                                    </span>
                                </td>
                                <td className="py-3.5 px-4 text-right text-slate-400">
                                    {formatCurrency(report.assets)}
                                </td>
                                <td className="py-3.5 px-4 text-right text-slate-400">
                                    {formatCurrency(report.liabilities)}
                                </td>
                                <td className="py-3.5 px-4 text-right text-slate-400">
                                    {formatCurrency(report.equity)}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                    <span className={report.operating_cash_flow >= 0 ? 'text-blue-400' : 'text-rose-400'}>
                                        {formatCurrency(report.operating_cash_flow)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
