'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Clock, TrendingUp, TrendingDown, Activity, Search, Play,
    RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    ArrowUpDown, X, Calendar, Filter, BarChart3, Zap, Eye,
} from 'lucide-react';
import { useIntradayStore, type IntradayMover } from '@/store/intradayStore';
import { formatPrice, formatVolume, getChangeColor } from '@/lib/utils';
import AddToWatchlistBtn from '@/components/AddToWatchlistBtn';

// ── Sparkline Mini Chart ──────────────────────────────────────────────
function Sparkline({ data, direction, width = 120, height = 36 }: {
    data: { time: number; close: number }[];
    direction: 'up' | 'down';
    width?: number;
    height?: number;
}) {
    if (!data || data.length < 2) return <div className="w-[120px] h-[36px] bg-white/5 rounded" />;

    const prices = data.map(d => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = prices.map((p, i) => {
        const x = (i / (prices.length - 1)) * width;
        const y = height - ((p - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(' ');

    const color = direction === 'up' ? '#10b981' : '#ef4444';
    const gradientId = `grad-${direction}-${Math.random().toString(36).slice(2, 7)}`;

    // Create area fill path
    const areaPath = `M0,${height} L${points.split(' ').map(p => p).join(' L')} L${width},${height} Z`;

    return (
        <svg width={width} height={height} className="block">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ── Expanded Chart Row ────────────────────────────────────────────────
function ExpandedChart({ ticker, colSpan }: { ticker: string; colSpan: number }) {
    const { expandedChartData, expandedChartLoading, loadChart, filters } = useIntradayStore();
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<any>(null);

    const barLabel = filters.timespan === 'hour'
        ? `${filters.multiplier}-hour bars`
        : `${filters.multiplier}-min bars`;

    useEffect(() => {
        loadChart(ticker);
    }, [ticker]);

    useEffect(() => {
        if (!expandedChartData || expandedChartData.length === 0 || !chartRef.current) return;

        // Dynamically import lightweight-charts
        import('lightweight-charts').then(({ createChart, ColorType, CandlestickSeries, HistogramSeries }) => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.remove();
                chartInstanceRef.current = null;
            }

            if (!chartRef.current) return;
            const containerWidth = chartRef.current.clientWidth;

            const chart = createChart(chartRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: '#64748b',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 10,
                },
                grid: {
                    vertLines: { color: 'rgba(255,255,255,0.03)' },
                    horzLines: { color: 'rgba(255,255,255,0.03)' },
                },
                crosshair: {
                    vertLine: { color: 'rgba(99,102,241,0.4)', width: 1, style: 2, labelBackgroundColor: '#6366f1' },
                    horzLine: { color: 'rgba(99,102,241,0.4)', width: 1, style: 2, labelBackgroundColor: '#6366f1' },
                },
                rightPriceScale: {
                    borderColor: 'rgba(255,255,255,0.05)',
                    scaleMargins: { top: 0.1, bottom: 0.2 },
                },
                timeScale: {
                    borderColor: 'rgba(255,255,255,0.05)',
                    timeVisible: true,
                    secondsVisible: false,
                },
                width: containerWidth,
                height: 300,
            });

            chartInstanceRef.current = chart;

            const candleSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#10b981',
                downColor: '#ef4444',
                borderDownColor: '#ef4444',
                borderUpColor: '#10b981',
                wickDownColor: '#ef4444',
                wickUpColor: '#10b981',
            });

            const volumeSeries = chart.addSeries(HistogramSeries, {
                color: '#6366f1',
                priceFormat: { type: 'volume' },
                priceScaleId: '',
            });

            volumeSeries.priceScale().applyOptions({
                scaleMargins: { top: 0.8, bottom: 0 },
            });

            candleSeries.setData(
                expandedChartData.map((d: any) => ({
                    time: d.time,
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                }))
            );

            volumeSeries.setData(
                expandedChartData.map((d: any) => ({
                    time: d.time,
                    value: d.volume,
                    color: d.close >= d.open ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                }))
            );

            chart.timeScale().fitContent();
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.remove();
                chartInstanceRef.current = null;
            }
        };
    }, [expandedChartData]);

    return (
        <tr>
            <td colSpan={colSpan} className="p-0">
                <div className="bg-[#0a0c14] border-t border-b border-blue-500/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <BarChart3 size={14} className="text-blue-400" />
                        <span className="text-xs font-semibold text-white">{ticker} — Intraday Chart ({barLabel})</span>
                    </div>
                    {expandedChartLoading ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-slate-500">Loading chart...</span>
                            </div>
                        </div>
                    ) : expandedChartData && expandedChartData.length === 0 ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <span className="text-xs text-slate-500">No intraday chart data available for this time range</span>
                        </div>
                    ) : (
                        <div className="rounded-lg overflow-hidden border border-white/5">
                            <div ref={chartRef} />
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ── Time Selector ─────────────────────────────────────────────────────
function TimeSelector({
    label, hour, minute, onHourChange, onMinuteChange
}: {
    label: string;
    hour: number;
    minute: number;
    onHourChange: (h: number) => void;
    onMinuteChange: (m: number) => void;
}) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = [0, 15, 30, 45];

    const formatHour = (h: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12} ${ampm}`;
    };

    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</label>
            <div className="flex items-center gap-1">
                <select
                    value={hour}
                    onChange={(e) => onHourChange(parseInt(e.target.value))}
                    className="px-2 py-1.5 text-[11px] bg-[#1a1d29] border border-white/5 rounded-lg text-slate-300
                        focus:border-blue-500/40 focus:outline-none cursor-pointer appearance-none"
                >
                    {hours.map(h => (
                        <option key={h} value={h}>{formatHour(h)}</option>
                    ))}
                </select>
                <span className="text-slate-600 text-xs">:</span>
                <select
                    value={minute}
                    onChange={(e) => onMinuteChange(parseInt(e.target.value))}
                    className="px-2 py-1.5 text-[11px] bg-[#1a1d29] border border-white/5 rounded-lg text-slate-300
                        focus:border-blue-500/40 focus:outline-none cursor-pointer appearance-none"
                >
                    {minutes.map(m => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function IntradayPage() {
    const router = useRouter();
    const {
        filters, results, loading, error, meta, page, sort, sortDir,
        search, setFilter, setPage, setSort, resetFilters, expandedTicker,
        setExpandedTicker,
    } = useIntradayStore();

    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => {
        search();
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        search();
    };

    const handleSort = (field: string) => {
        setSort(field);
        search();
    };

    const handleToggleExpand = (ticker: string) => {
        if (expandedTicker === ticker) {
            setExpandedTicker(null);
        } else {
            setExpandedTicker(ticker);
        }
    };

    const columnCount = 10; // Number of table columns

    // Quick presets
    const presets = [
        { label: 'Pre-Market', fromH: 4, fromM: 0, toH: 9, toM: 30, icon: '🌅' },
        { label: 'Market Open', fromH: 9, fromM: 30, toH: 11, toM: 0, icon: '🔔' },
        { label: 'Midday', fromH: 11, fromM: 0, toH: 14, toM: 0, icon: '☀️' },
        { label: 'Market Close', fromH: 14, fromM: 0, toH: 16, toM: 0, icon: '🔕' },
        { label: 'After Hours', fromH: 16, fromM: 0, toH: 20, toM: 0, icon: '🌙' },
        { label: 'Full Day', fromH: 4, fromM: 0, toH: 20, toM: 0, icon: '📊' },
    ];

    const applyPreset = (preset: typeof presets[0]) => {
        setFilter('fromHour', preset.fromH);
        setFilter('fromMinute', preset.fromM);
        setFilter('toHour', preset.toH);
        setFilter('toMinute', preset.toM);
    };

    return (
        <div className="min-h-screen p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                            <Clock size={18} className="text-amber-400" />
                        </div>
                        Intraday Movers
                    </h1>
                    <p className="text-slate-500 text-xs mt-1">
                        Filter tickers by time range · See what moved and when
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border
                            ${showFilters
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-[#1a1d29] text-slate-400 border-white/5 hover:border-white/10'}`}
                    >
                        <Filter size={13} />
                        Filters
                        {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button
                        onClick={() => { resetFilters(); search(); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 border border-white/5
                            hover:bg-white/5 transition-all"
                    >
                        <RotateCcw size={12} />
                        <span className="hidden sm:inline">Reset</span>
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="mb-5 rounded-xl border border-white/5 bg-[#0d0f15]/80 p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Date + Time Range Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Date Picker */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium flex items-center gap-1">
                                <Calendar size={10} /> Date
                            </label>
                            <input
                                type="date"
                                value={filters.date}
                                onChange={(e) => setFilter('date', e.target.value)}
                                className="px-3 py-1.5 text-xs bg-[#1a1d29] border border-white/5 rounded-lg text-slate-300
                                    focus:border-amber-500/40 focus:outline-none cursor-pointer"
                            />
                        </div>

                        {/* From Time */}
                        <TimeSelector
                            label="From Time (ET)"
                            hour={filters.fromHour}
                            minute={filters.fromMinute}
                            onHourChange={(h) => setFilter('fromHour', h)}
                            onMinuteChange={(m) => setFilter('fromMinute', m)}
                        />

                        {/* To Time */}
                        <TimeSelector
                            label="To Time (ET)"
                            hour={filters.toHour}
                            minute={filters.toMinute}
                            onHourChange={(h) => setFilter('toHour', h)}
                            onMinuteChange={(m) => setFilter('toMinute', m)}
                        />

                        {/* Direction */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Direction</label>
                            <div className="flex items-center gap-1">
                                {(['both', 'up', 'down'] as const).map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setFilter('direction', d)}
                                        className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${filters.direction === d
                                            ? d === 'up'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : d === 'down'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            : 'bg-[#1a1d29] text-slate-500 border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        {d === 'up' && <TrendingUp size={10} className="inline mr-1" />}
                                        {d === 'down' && <TrendingDown size={10} className="inline mr-1" />}
                                        {d === 'both' && <Activity size={10} className="inline mr-1" />}
                                        {d === 'both' ? 'Both' : d === 'up' ? 'Up' : 'Down'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Advanced Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                        {/* Min Change */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Min Change %</label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={filters.minChange}
                                onChange={(e) => setFilter('minChange', parseFloat(e.target.value) || 0)}
                                className="px-3 py-1.5 text-xs bg-[#1a1d29] border border-white/5 rounded-lg text-slate-300
                                    focus:border-amber-500/40 focus:outline-none
                                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>

                        {/* Timespan */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Bar Size</label>
                            <select
                                value={filters.timespan}
                                onChange={(e) => setFilter('timespan', e.target.value as 'minute' | 'hour')}
                                className="px-3 py-1.5 text-xs bg-[#1a1d29] border border-white/5 rounded-lg text-slate-300
                                    focus:border-amber-500/40 focus:outline-none cursor-pointer"
                            >
                                <option value="hour">Hourly Bars</option>
                                <option value="minute">Minute Bars</option>
                            </select>
                        </div>

                        {/* Multiplier */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Multiplier</label>
                            <select
                                value={filters.multiplier}
                                onChange={(e) => setFilter('multiplier', parseInt(e.target.value))}
                                className="px-3 py-1.5 text-xs bg-[#1a1d29] border border-white/5 rounded-lg text-slate-300
                                    focus:border-amber-500/40 focus:outline-none cursor-pointer"
                            >
                                {filters.timespan === 'minute'
                                    ? [1, 5, 15, 30].map(m => <option key={m} value={m}>{m}-min</option>)
                                    : [1, 2, 4].map(m => <option key={m} value={m}>{m}-hour</option>)
                                }
                            </select>
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                        <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mr-1">Quick:</span>
                        {presets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => applyPreset(preset)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[#1a1d29] text-slate-400
                                    border border-white/5 hover:border-amber-500/20 hover:text-amber-400 
                                    hover:bg-amber-500/5 transition-all"
                            >
                                {preset.icon} {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Button */}
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] text-slate-600">
                            Times are in Eastern Time (ET) · Market hours: 9:30 AM – 4:00 PM
                        </p>
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold transition-all
                                bg-gradient-to-r from-amber-600 to-orange-500 text-white
                                hover:from-amber-500 hover:to-orange-400
                                disabled:opacity-50 shadow-lg shadow-amber-500/20"
                        >
                            {loading ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Zap size={13} />
                            )}
                            Search Movers
                        </button>
                    </div>
                </div>
            )}

            {/* Results Info / Error */}
            {error ? (
                <div className="mb-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <X size={14} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-red-400">{error}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">
                                The API may have rate limits — try again in a minute
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => search()}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20
                            hover:bg-red-500/20 transition-all shrink-0 disabled:opacity-50"
                    >
                        Retry
                    </button>
                </div>
            ) : meta ? (
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] text-slate-500">
                        {loading ? 'Scanning intraday data...' : (
                            <>
                                <span className="text-white font-semibold">{meta.total.toLocaleString()}</span> movers found
                                {meta.timeRange && (
                                    <span className="ml-2 text-slate-600">
                                        · {meta.date} · {meta.timeRange}
                                    </span>
                                )}
                            </>
                        )}
                    </span>
                </div>
            ) : null}

            {/* Results Table */}
            <div className="rounded-xl border border-white/5 overflow-hidden bg-[#0d0f15]/80">
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] sm:text-xs">
                        <thead>
                            <tr className="bg-[#12141e] border-b border-white/5">
                                <th className="px-2 sm:px-3 py-2.5 text-left font-semibold text-slate-500 w-8"></th>
                                <th className="px-2 sm:px-3 py-2.5 text-left font-semibold text-slate-500">Ticker</th>
                                <th
                                    className="px-2 sm:px-3 py-2.5 text-left font-semibold text-slate-500 cursor-pointer hover:text-amber-400 transition-colors"
                                    onClick={() => handleSort('changePct')}
                                >
                                    <div className="flex items-center gap-1">
                                        Change %
                                        {sort === 'changePct' && <ArrowUpDown size={9} />}
                                    </div>
                                </th>
                                <th className="px-2 sm:px-3 py-2.5 text-right font-semibold text-slate-500 hidden sm:table-cell">Start</th>
                                <th className="px-2 sm:px-3 py-2.5 text-right font-semibold text-slate-500 hidden sm:table-cell">End</th>
                                <th className="px-2 sm:px-3 py-2.5 text-right font-semibold text-slate-500 hidden md:table-cell">
                                    <div className="flex items-center gap-1 justify-end">
                                        <TrendingUp size={10} className="text-emerald-400" /> Peak Time
                                    </div>
                                </th>
                                <th className="px-2 sm:px-3 py-2.5 text-right font-semibold text-slate-500 hidden md:table-cell">
                                    <div className="flex items-center gap-1 justify-end">
                                        <TrendingDown size={10} className="text-red-400" /> Trough Time
                                    </div>
                                </th>
                                <th
                                    className="px-2 sm:px-3 py-2.5 text-right font-semibold text-slate-500 hidden lg:table-cell cursor-pointer hover:text-amber-400 transition-colors"
                                    onClick={() => handleSort('volume')}
                                >
                                    <div className="flex items-center gap-1 justify-end">
                                        Volume
                                        {sort === 'volume' && <ArrowUpDown size={9} />}
                                    </div>
                                </th>
                                <th className="px-2 sm:px-3 py-2.5 text-center font-semibold text-slate-500">Dir</th>
                                <th className="px-2 sm:px-3 py-2.5 text-center font-semibold text-slate-500 hidden sm:table-cell">Chart</th>
                                <th className="px-2 py-2.5 text-center text-slate-500 font-semibold text-[10px]">⭐</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 15 }).map((_, i) => (
                                    <tr key={i} className="border-b border-white/[0.02]">
                                        {Array.from({ length: columnCount }).map((_, j) => (
                                            <td key={j} className={`px-2 sm:px-3 py-3 ${j > 7 ? 'hidden lg:table-cell' : j > 4 ? 'hidden md:table-cell' : j > 2 ? 'hidden sm:table-cell' : ''}`}>
                                                <div className="h-4 bg-white/5 rounded animate-pulse w-12 sm:w-16" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : results.length === 0 ? (
                                <tr>
                                    <td colSpan={columnCount} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center">
                                                <Search size={24} className="text-slate-600" />
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-sm font-medium">No movers found</p>
                                                <p className="text-slate-600 text-xs mt-1">
                                                    Try adjusting the date, time range, or lowering the min change %
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                results.map((mover, idx) => (
                                    <React.Fragment key={mover.ticker}>
                                        <tr
                                            className={`border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer transition-colors group
                                                ${expandedTicker === mover.ticker ? 'bg-blue-500/5' : ''}`}
                                            onClick={() => handleToggleExpand(mover.ticker)}
                                        >
                                            {/* Expand indicator */}
                                            <td className="px-2 sm:px-3 py-3 text-center">
                                                <div className={`transition-transform duration-200 ${expandedTicker === mover.ticker ? 'rotate-90' : ''}`}>
                                                    <ChevronRight size={12} className="text-slate-600" />
                                                </div>
                                            </td>

                                            {/* Ticker */}
                                            <td className="px-2 sm:px-3 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0 border
                                                        ${mover.direction === 'up'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                                                    >
                                                        {mover.ticker.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <span className="text-white font-semibold group-hover:text-amber-400 transition-colors text-xs">
                                                            {mover.ticker}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Change % */}
                                            <td className="px-2 sm:px-3 py-3">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border
                                                    ${mover.direction === 'up'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                                                >
                                                    {mover.changePct > 0 ? '+' : ''}{mover.changePct.toFixed(2)}%
                                                </span>
                                            </td>

                                            {/* Start Price */}
                                            <td className="px-2 sm:px-3 py-3 text-right text-slate-400 font-mono hidden sm:table-cell">
                                                {formatPrice(mover.startPrice)}
                                            </td>

                                            {/* End Price */}
                                            <td className={`px-2 sm:px-3 py-3 text-right font-mono font-semibold hidden sm:table-cell ${getChangeColor(mover.changePct)}`}>
                                                {formatPrice(mover.endPrice)}
                                            </td>

                                            {/* Peak Time */}
                                            <td className="px-2 sm:px-3 py-3 text-right hidden md:table-cell">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <span className="text-emerald-400 text-[10px] font-medium">{mover.peakTime}</span>
                                                    <span className="text-slate-600 text-[10px]">@ {formatPrice(mover.highPrice)}</span>
                                                </div>
                                            </td>

                                            {/* Trough Time */}
                                            <td className="px-2 sm:px-3 py-3 text-right hidden md:table-cell">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <span className="text-red-400 text-[10px] font-medium">{mover.troughTime}</span>
                                                    <span className="text-slate-600 text-[10px]">@ {formatPrice(mover.lowPrice)}</span>
                                                </div>
                                            </td>

                                            {/* Volume */}
                                            <td className="px-2 sm:px-3 py-3 text-right text-slate-400 hidden lg:table-cell">
                                                {formatVolume(mover.totalVolume)}
                                            </td>

                                            {/* Direction */}
                                            <td className="px-2 sm:px-3 py-3 text-center">
                                                {mover.direction === 'up' ? (
                                                    <TrendingUp size={14} className="text-emerald-400 inline" />
                                                ) : (
                                                    <TrendingDown size={14} className="text-red-400 inline" />
                                                )}
                                            </td>

                                            {/* Sparkline Chart */}
                                            <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">
                                                <Sparkline
                                                    data={mover.chartData}
                                                    direction={mover.direction}
                                                />
                                            </td>

                                            {/* Save */}
                                            <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                                                <AddToWatchlistBtn ticker={mover.ticker} />
                                            </td>
                                        </tr>

                                        {/* Expanded Chart Row */}
                                        {expandedTicker === mover.ticker && (
                                            <ExpandedChart ticker={mover.ticker} colSpan={columnCount} />
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                    <span className="text-[11px] text-slate-600">Page {meta.page} of {meta.totalPages}</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg bg-[#1a1d29] border border-white/5 text-slate-400
                                hover:bg-white/5 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: Math.min(5, meta.totalPages) }).map((_, i) => {
                            let p: number;
                            if (meta.totalPages <= 5) p = i + 1;
                            else if (page <= 3) p = i + 1;
                            else if (page >= meta.totalPages - 2) p = meta.totalPages - 4 + i;
                            else p = page - 2 + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`min-w-[28px] py-1 rounded-lg text-[11px] font-medium transition-all ${page === p
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'text-slate-500 hover:bg-white/5'
                                        }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                            disabled={page === meta.totalPages}
                            className="p-1.5 rounded-lg bg-[#1a1d29] border border-white/5 text-slate-400
                                hover:bg-white/5 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
