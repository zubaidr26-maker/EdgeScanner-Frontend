import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatNumber(num: number | undefined | null): string {
    if (num === undefined || num === null || isNaN(num)) return '—';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

export function formatPrice(price: number | undefined | null): string {
    if (price === undefined || price === null || isNaN(price)) return '—';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
}

export function formatPercent(percent: number | undefined | null): string {
    if (percent === undefined || percent === null || isNaN(percent)) return '—';
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
}

export function formatVolume(volume: number | undefined | null): string {
    return formatNumber(volume);
}

export function getChangeColor(change: number): string {
    if (change > 0) return 'text-emerald-400';
    if (change < 0) return 'text-red-400';
    return 'text-slate-400';
}

export function getChangeBgColor(change: number): string {
    if (change > 0) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (change < 0) return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
}
