'use client';

import React from 'react';
import { cn, formatPrice, formatPercent, getChangeColor } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart3, Activity, LucideIcon } from 'lucide-react';

interface MarketCardProps {
    title: string;
    value: string | number;
    change?: number;
    changePercent?: number;
    icon?: LucideIcon;
    subtitle?: string;
    gradient?: string;
    isLoading?: boolean;
}

export default function MarketCard({
    title,
    value,
    change,
    changePercent,
    icon: Icon = BarChart3,
    subtitle,
    gradient = 'from-blue-500/10 to-purple-500/10',
    isLoading = false,
}: MarketCardProps) {
    if (isLoading) {
        return (
            <div className="p-5 rounded-2xl border border-white/5 bg-[#12141e] animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-20 h-4 bg-white/5 rounded" />
                    <div className="w-10 h-10 bg-white/5 rounded-xl" />
                </div>
                <div className="w-24 h-6 bg-white/5 rounded mb-2" />
                <div className="w-16 h-4 bg-white/5 rounded" />
            </div>
        );
    }

    return (
        <div className="group p-5 rounded-2xl border border-white/5 bg-[#12141e] hover:border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', gradient)}>
                    <Icon size={18} className="text-blue-400" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
                {typeof value === 'number' ? formatPrice(value) : value}
            </div>
            <div className="flex items-center gap-2">
                {change !== undefined && changePercent !== undefined && (
                    <>
                        <div className={cn('flex items-center gap-1 text-sm font-medium', getChangeColor(change))}>
                            {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {formatPercent(changePercent)}
                        </div>
                    </>
                )}
                {subtitle && <span className="text-xs text-slate-600">{subtitle}</span>}
            </div>
        </div>
    );
}
