'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
    RotateCcw, Play, TrendingUp, TrendingDown, Activity, BarChart3,
    ArrowUpDown, X, Calendar,
} from 'lucide-react';
import { useScannerStore, type DayFilters, type RangeFilter } from '@/store/scannerStore';
import { formatVolume, formatPrice } from '@/lib/utils';

// ── Filter config ──────────────────────────────────────────────────
interface FilterDef {
    key: keyof Omit<DayFilters, 'closeDirection'>;
    label: string;
    suffix?: string;
}

const NUMERIC_FILTERS: FilterDef[] = [
    { key: 'gap', label: 'Gap Value', suffix: '%' },
    { key: 'volume', label: 'Volume' },
    { key: 'range', label: 'Range', suffix: '%' },
    { key: 'highSpike', label: 'High Spike', suffix: '%' },
    { key: 'lowSpike', label: 'Low Spike', suffix: '%' },
    { key: 'openPrice', label: 'Open Price', suffix: '$' },
    { key: 'closePrice', label: 'Close Price', suffix: '$' },
    { key: 'returnPct', label: 'Return', suffix: '%' },
    { key: 'vwap', label: 'VWAP', suffix: '$' },
    { key: 'change', label: 'Change', suffix: '%' },
    { key: 'highGap', label: 'High Gap', suffix: '%' },
    { key: 'highFade', label: 'High Fade', suffix: '%' },
];

interface DayGroupConfig {
    prefix: 'gd' | 'pd' | 'd2' | 'd3';
    label: string;
    icon: React.ReactNode;
    color: string;
}

const DAY_GROUPS: DayGroupConfig[] = [
    { prefix: 'gd', label: 'Gap Day', icon: <TrendingUp size={14} />, color: 'text-emerald-400' },
    { prefix: 'pd', label: 'Previous Day', icon: <BarChart3 size={14} />, color: 'text-blue-400' },
    { prefix: 'd2', label: 'Day 2', icon: <Activity size={14} />, color: 'text-purple-400' },
    { prefix: 'd3', label: 'Day 3', icon: <TrendingDown size={14} />, color: 'text-amber-400' },
];

// ── Table columns ──────────────────────────────────────────────────
// ── Table columns ──────────────────────────────────────────────────
interface ColumnDef {
    key: string;
    label: string;
    shortLabel: string;
    sortKey: string;
    format: (val: any) => string;
    colorCode?: boolean;
    hideOnMobile?: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
    { key: 'ticker', label: 'Ticker', shortLabel: 'Tkr', sortKey: '', format: (v) => v, hideOnMobile: false },
    { key: 'gapDate', label: 'Date', shortLabel: 'Date', sortKey: 'gapDate', format: (v) => v ? new Date(v + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—', hideOnMobile: false },
    { key: 'name', label: 'Company', shortLabel: 'Name', sortKey: 'name', format: (v) => v || '—', hideOnMobile: true },
    { key: 'sector', label: 'Sector', shortLabel: 'Sec', sortKey: 'sector', format: (v) => v || '—', hideOnMobile: true },
    { key: 'industry', label: 'Industry', shortLabel: 'Ind', sortKey: 'industry', format: (v) => v || '—', hideOnMobile: true },
    { key: 'country', label: 'Country', shortLabel: 'Ctry', sortKey: 'country', format: (v) => v || 'USA', hideOnMobile: true },

    { key: 'marketCap', label: 'Market Cap', shortLabel: 'MCap', sortKey: 'marketCap', format: (v) => formatVolume(v), hideOnMobile: true },
    { key: 'employees', label: 'Employees', shortLabel: 'Emp', sortKey: 'employees', format: (v) => v?.toLocaleString() || '—', hideOnMobile: true },
    { key: 'sharesOutstanding', label: 'Shares Out', shortLabel: 'SOut', sortKey: 'sharesOutstanding', format: (v) => formatVolume(v), hideOnMobile: true },

    { key: 'gapDay.gap', label: 'Gap %', shortLabel: 'Gap', sortKey: 'gd_gap', format: (v) => v != null ? v.toFixed(2) + '%' : '—', colorCode: true },
    { key: 'gapDay.volume', label: 'Volume', shortLabel: 'Vol', sortKey: 'gd_volume', format: (v) => formatVolume(v) },
    { key: 'gapDay.openPrice', label: 'Open', shortLabel: 'Open', sortKey: 'gd_openPrice', format: (v) => formatPrice(v), hideOnMobile: true },
    { key: 'gapDay.closePrice', label: 'Close', shortLabel: 'Close', sortKey: 'gd_closePrice', format: (v) => formatPrice(v), hideOnMobile: true },
    { key: 'gapDay.range', label: 'Range %', shortLabel: 'Rng', sortKey: 'gd_range', format: (v) => v != null ? v.toFixed(2) + '%' : '—', hideOnMobile: true },
    { key: 'gapDay.highSpike', label: 'High Spike %', shortLabel: 'HSpk', sortKey: 'gd_highSpike', format: (v) => v != null ? v.toFixed(2) + '%' : '—', colorCode: true, hideOnMobile: true },
    { key: 'gapDay.returnPct', label: 'Return %', shortLabel: 'Ret', sortKey: 'gd_returnPct', format: (v) => v != null ? v.toFixed(2) + '%' : '—', colorCode: true },
    { key: 'gapDay.change', label: 'Change %', shortLabel: 'Chg', sortKey: 'gd_change', format: (v) => v != null ? v.toFixed(2) + '%' : '—', colorCode: true },
    { key: 'gapDay.vwap', label: 'VWAP', shortLabel: 'VWAP', sortKey: 'gd_vwap', format: (v) => formatPrice(v), hideOnMobile: true },
    { key: 'gapDay.highGap', label: 'High Gap %', shortLabel: 'HGap', sortKey: 'gd_highGap', format: (v) => v != null ? v.toFixed(2) + '%' : '—', colorCode: true, hideOnMobile: true },
    { key: 'gapDay.highFade', label: 'High Fade %', shortLabel: 'HFade', sortKey: 'gd_highFade', format: (v) => v != null ? v.toFixed(2) + '%' : '—', hideOnMobile: true },
    { key: 'gapDay.closeDirection', label: 'Dir', shortLabel: 'Dir', sortKey: '', format: (v) => v === 'green' ? '🟢' : '🔴' },

    { key: 'prevDay.gap', label: 'PD Gap %', shortLabel: 'PD Gap', sortKey: 'pd_gap', format: (v) => v != null ? v.toFixed(2) + '%' : '—', colorCode: true, hideOnMobile: true },
    { key: 'prevDay.volume', label: 'PD Vol', shortLabel: 'PD Vol', sortKey: 'pd_volume', format: (v) => formatVolume(v), hideOnMobile: true },
    { key: 'prevDay.returnPct', label: 'PD Return %', shortLabel: 'PD Ret', sortKey: 'pd_returnPct', format: (v) => v != null ? v.toFixed(2) + '%' : '—', colorCode: true, hideOnMobile: true },
];

const DEFAULT_COLUMNS = [
    'ticker', 'gapDate', 'gapDay.gap', 'gapDay.volume', 'gapDay.openPrice',
    'gapDay.closePrice', 'gapDay.returnPct', 'marketCap', 'sector'
];

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function countActiveFilters(filters: DayFilters): number {
    let count = 0;
    for (const [key, val] of Object.entries(filters)) {
        if (key === 'closeDirection') {
            if (val) count++;
        } else {
            const rf = val as RangeFilter;
            if (rf.min || rf.max) count++;
        }
    }
    return count;
}

// ── Range Input ────────────────────────────────────────────────────
function RangeInput({
    label, suffix, value, onMinChange, onMaxChange,
}: {
    label: string; suffix?: string; value: RangeFilter;
    onMinChange: (v: string) => void; onMaxChange: (v: string) => void;
}) {
    return (
        <div className="flex items-center gap-2 py-1">
            <span className="text-[11px] text-slate-400 w-20 sm:w-24 shrink-0 truncate" title={label}>
                {label} {suffix && <span className="text-slate-600">{suffix}</span>}
            </span>
            <input
                type="number"
                placeholder="Min"
                value={value.min}
                onChange={(e) => onMinChange(e.target.value)}
                className="w-16 sm:w-20 px-2 py-1 text-[11px] bg-[#1a1d29] border border-white/5 rounded-md text-slate-300
          focus:border-blue-500/40 focus:outline-none transition-all placeholder:text-slate-600
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-slate-600 text-[10px]">–</span>
            <input
                type="number"
                placeholder="Max"
                value={value.max}
                onChange={(e) => onMaxChange(e.target.value)}
                className="w-16 sm:w-20 px-2 py-1 text-[11px] bg-[#1a1d29] border border-white/5 rounded-md text-slate-300
          focus:border-blue-500/40 focus:outline-none transition-all placeholder:text-slate-600
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
        </div>
    );
}

// ── Filter Modal ───────────────────────────────────────────────────
function FilterModal({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: () => void }) {
    const { filters, setRangeFilter, setFilter, resetFilters } = useScannerStore();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ gd: true });

    if (!open) return null;

    const totalActive = DAY_GROUPS.reduce((s, g) => s + countActiveFilters(filters[g.prefix]), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 max-h-[85vh] bg-[#0d0f15] border border-white/10 rounded-2xl
        shadow-2xl shadow-black/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Filter size={16} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">Gap Filters</h2>
                            <p className="text-[10px] text-slate-500">
                                {totalActive > 0 ? `${totalActive} active filters` : 'No filters applied'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/5">
                    {DAY_GROUPS.map((group) => {
                        const dayFilters = filters[group.prefix];
                        const activeCount = countActiveFilters(dayFilters);
                        const expanded = expandedGroups[group.prefix] || false;

                        return (
                            <div key={group.prefix} className="border border-white/5 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.prefix]: !prev[group.prefix] }))}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={group.color}>{group.icon}</span>
                                        <span className="text-xs font-semibold text-slate-200">{group.label}</span>
                                        <span className="text-[10px] text-slate-600">[{NUMERIC_FILTERS.length + 1}]</span>
                                        {activeCount > 0 && (
                                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold">
                                                {activeCount}
                                            </span>
                                        )}
                                    </div>
                                    {expanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
                                </button>
                                {expanded && (
                                    <div className="px-4 pb-3 border-t border-white/5">
                                        {NUMERIC_FILTERS.map((f) => (
                                            <RangeInput
                                                key={f.key}
                                                label={f.label}
                                                suffix={f.suffix}
                                                value={dayFilters[f.key] as RangeFilter}
                                                onMinChange={(v) => setRangeFilter(group.prefix, f.key, 'min', v)}
                                                onMaxChange={(v) => setRangeFilter(group.prefix, f.key, 'max', v)}
                                            />
                                        ))}
                                        <div className="flex items-center gap-2 py-1">
                                            <span className="text-[11px] text-slate-400 w-20 sm:w-24 shrink-0">Direction</span>
                                            <select
                                                value={dayFilters.closeDirection}
                                                onChange={(e) => setFilter(group.prefix, 'closeDirection', e.target.value)}
                                                className="w-full px-2 py-1 text-[11px] bg-[#1a1d29] border border-white/5 rounded-md text-slate-300
                          focus:border-blue-500/40 focus:outline-none cursor-pointer"
                                            >
                                                <option value="">Any</option>
                                                <option value="green">🟢 Green</option>
                                                <option value="red">🔴 Red</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-white/5 shrink-0 bg-[#0a0c14]">
                    <button
                        onClick={() => { resetFilters(); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 border border-white/5
              hover:bg-white/5 transition-all"
                    >
                        <RotateCcw size={12} />
                        Reset All
                    </button>
                    <button
                        onClick={onApply}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold
              bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400
              shadow-lg shadow-blue-500/20 transition-all"
                    >
                        <Play size={12} />
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Column Selector Modal ──────────────────────────────────────────
function ColumnSelectorModal({
    open, onClose, visible, onChange
}: {
    open: boolean;
    onClose: () => void;
    visible: string[];
    onChange: (cols: string[]) => void;
}) {
    if (!open) return null;

    const toggle = (key: string) => {
        if (visible.includes(key)) {
            onChange(visible.filter(k => k !== key));
        } else {
            onChange([...visible, key]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] bg-[#0d0f15] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                    <div>
                        <h2 className="text-sm font-bold text-white">Customize Columns</h2>
                        <p className="text-[10px] text-slate-500">Select columns to display in the screener</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onChange(DEFAULT_COLUMNS)}
                            className="px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 rounded text-slate-400"
                        >
                            Default
                        </button>
                        <button
                            onClick={() => onChange(ALL_COLUMNS.map(c => c.key))}
                            className="px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 rounded text-slate-400"
                        >
                            Select All
                        </button>
                        <button
                            onClick={() => onChange(['ticker'])}
                            className="px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 rounded text-slate-400"
                        >
                            Deselect All
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 ml-2">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 sm:grid-cols-3 gap-3 scrollbar-thin">
                    {ALL_COLUMNS.map((col) => (
                        <label key={col.key} className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5 transition-colors">
                            <input
                                type="checkbox"
                                checked={visible.includes(col.key)}
                                onChange={() => toggle(col.key)}
                                className="mt-0.5 rounded border-white/10 bg-black/20 text-blue-500 focus:ring-offset-0 focus:ring-0"
                            />
                            <div>
                                <div className="text-xs font-medium text-slate-200">{col.label}</div>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5 bg-[#0a0c14] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function ScannerPage() {
    const router = useRouter();
    const {
        filters, results, loading, error, page, totalPages, total, sort, sortDir,
        scan, setPage, setSort, resetFilters, setDateFilter, scannedDates,
    } = useScannerStore();

    const [filterOpen, setFilterOpen] = useState(false);
    const [colSelectorOpen, setColSelectorOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);

    // Derived columns
    const columns = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key));

    useEffect(() => { scan(); }, []);
    useEffect(() => { scan(); }, [page]);

    const handleSort = (sortKey: string) => {
        if (!sortKey) return;
        setSort(sortKey);
        scan();
    };

    const handleApplyFilters = () => {
        setFilterOpen(false);
        setPage(1);
        scan();
    };

    const totalActiveFilters = DAY_GROUPS.reduce(
        (s, g) => s + countActiveFilters(filters[g.prefix]), 0
    );

    return (
        <div className="min-h-screen p-4 sm:p-6">
            {/* Filter Modal */}
            <FilterModal
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                onApply={handleApplyFilters}
            />

            <ColumnSelectorModal
                open={colSelectorOpen}
                onClose={() => setColSelectorOpen(false)}
                visible={visibleColumns}
                onChange={setVisibleColumns}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
                            <Filter size={18} className="text-blue-400" />
                        </div>
                        Gap Scanner
                    </h1>
                    <p className="text-slate-500 text-xs mt-1">
                        Advanced multi-day gap analysis · {NUMERIC_FILTERS.length * 4 + 4} filters
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setColSelectorOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border bg-[#1a1d29] text-slate-400 border-white/5 hover:border-white/10"
                    >
                        <BarChart3 size={13} />
                        Columns
                    </button>

                    <button
                        onClick={() => setFilterOpen(true)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${totalActiveFilters > 0
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-[#1a1d29] text-slate-400 border-white/5 hover:border-white/10'
                            }`}
                    >
                        <Filter size={13} />
                        Filters
                        {totalActiveFilters > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/30 text-[9px] font-bold">{totalActiveFilters}</span>
                        )}
                    </button>
                    <button
                        onClick={() => { resetFilters(); scan(); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 border border-white/5
              hover:bg-white/5 transition-all"
                    >
                        <RotateCcw size={12} />
                        <span className="hidden sm:inline">Reset</span>
                    </button>
                    <button
                        onClick={() => { setPage(1); scan(); }}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all
              bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400
              disabled:opacity-50 shadow-lg shadow-blue-500/20 ml-auto sm:ml-0"
                    >
                        {loading ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Play size={12} />
                        )}
                        Scan
                    </button>
                </div>
            </div>

            {/* ── Date Filter Section ─────────────────────────────────── */}
            <div className="mb-5 rounded-xl border border-white/5 bg-[#0d0f15]/80 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-blue-400" />
                    <span className="text-xs font-semibold text-white">Date Range</span>
                    <span className="text-[10px] text-slate-600">— Select which days to scan</span>
                </div>

                {/* Date Mode Tabs */}
                <div className="flex items-center gap-1 mb-3">
                    {(['preset', 'single', 'range'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setDateFilter('dateMode', mode)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${filters.dateMode === mode
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-[#1a1d29] text-slate-500 border-white/5 hover:border-white/10'
                                }`}
                        >
                            {mode === 'preset' ? '📅 Quick Presets' : mode === 'single' ? '📌 Specific Date' : '📊 Date Range'}
                        </button>
                    ))}
                </div>

                {/* Preset Buttons */}
                {filters.dateMode === 'preset' && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {[
                            { value: 'yesterday', label: 'Yesterday', icon: '📆' },
                            { value: 'lastWeek', label: 'Last Week', icon: '📅' },
                            { value: 'last2Weeks', label: 'Last 2 Weeks', icon: '📅' },
                            { value: 'lastMonth', label: 'Last Month', icon: '🗓️' },
                            { value: 'last3Months', label: 'Last 3 Months', icon: '📊' },
                        ].map((preset) => (
                            <button
                                key={preset.value}
                                onClick={() => setDateFilter('dateRange', preset.value)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${filters.dateRange === preset.value
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-[#1a1d29] text-slate-400 border-white/5 hover:border-blue-500/20 hover:text-blue-400'
                                    }`}
                            >
                                {preset.icon} {preset.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Single Date Picker */}
                {filters.dateMode === 'single' && (
                    <div className="flex items-center gap-3">
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Gap Day Date</label>
                        <input
                            type="date"
                            value={filters.gapDate}
                            onChange={(e) => setDateFilter('gapDate', e.target.value)}
                            className="px-3 py-1.5 text-xs bg-[#1a1d29] border border-white/5 rounded-lg text-slate-300
                                focus:border-blue-500/40 focus:outline-none cursor-pointer"
                        />
                    </div>
                )}

                {/* Date Range Picker */}
                {filters.dateMode === 'range' && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider">From</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setDateFilter('dateFrom', e.target.value)}
                                className="px-3 py-1.5 text-xs bg-[#1a1d29] border border-white/5 rounded-lg text-slate-300
                                    focus:border-blue-500/40 focus:outline-none cursor-pointer"
                            />
                        </div>
                        <span className="text-slate-600 text-xs">→</span>
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider">To</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setDateFilter('dateTo', e.target.value)}
                                className="px-3 py-1.5 text-xs bg-[#1a1d29] border border-white/5 rounded-lg text-slate-300
                                    focus:border-blue-500/40 focus:outline-none cursor-pointer"
                            />
                        </div>
                    </div>
                )}

                {scannedDates.length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-600">
                        Scanning {scannedDates.length} business day{scannedDates.length !== 1 ? 's' : ''}
                        {scannedDates.length <= 5 && (
                            <span className="ml-1 text-slate-500">
                                ({scannedDates.map(d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ')})
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Results Info / Error Banner */}
            {error ? (
                <div className="mb-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <X size={14} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-red-400">{error}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">The free API has rate limits — data caches after the first load</p>
                        </div>
                    </div>
                    <button
                        onClick={() => scan()}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20
                          hover:bg-red-500/20 transition-all shrink-0 disabled:opacity-50"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] text-slate-500">
                        {loading ? 'Scanning market data...' : `${total.toLocaleString()} results`}
                    </span>
                </div>
            )}

            {/* Results Table */}
            <div className="rounded-xl border border-white/5 overflow-hidden bg-[#0d0f15]/80">
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] sm:text-xs">
                        <thead>
                            <tr className="bg-[#12141e] border-b border-white/5">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.sortKey)}
                                        className={`px-2 sm:px-3 py-2.5 text-left font-semibold whitespace-nowrap transition-colors
                      ${col.sortKey ? 'cursor-pointer hover:text-blue-400' : ''}
                      ${sort === col.sortKey ? 'text-blue-400' : 'text-slate-500'}
                      ${col.hideOnMobile ? 'hidden lg:table-cell' : ''}`}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span className="hidden sm:inline">{col.label}</span>
                                            <span className="sm:hidden">{col.shortLabel}</span>
                                            {sort === col.sortKey && <ArrowUpDown size={9} />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 15 }).map((_, i) => (
                                    <tr key={i} className="border-b border-white/[0.02]">
                                        {columns.map((col) => (
                                            <td key={col.key} className={`px-2 sm:px-3 py-2.5 ${col.hideOnMobile ? 'hidden lg:table-cell' : ''}`}>
                                                <div className="h-3 bg-white/5 rounded animate-pulse w-12 sm:w-16" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : results.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={24} className="text-slate-600" />
                                            <p className="text-slate-500 text-sm">No results found</p>
                                            <p className="text-slate-600 text-xs">Adjust your filters and try again</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                results.map((row) => (
                                    <tr
                                        key={row.ticker}
                                        onClick={() => router.push(`/stock/${row.ticker}`)}
                                        className="border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer transition-colors group"
                                    >
                                        {columns.map((col) => {
                                            const val = col.key === 'ticker' ? row.ticker : col.key === 'gapDate' ? row.gapDate : getNestedValue(row, col.key);
                                            const formatted = col.format(val);
                                            let colorClass = 'text-slate-300';
                                            if (col.key === 'ticker') colorClass = 'text-white font-semibold group-hover:text-blue-400 transition-colors';
                                            else if (col.colorCode && typeof val === 'number') {
                                                colorClass = val > 0 ? 'text-emerald-400' : val < 0 ? 'text-red-400' : 'text-slate-400';
                                            }
                                            return (
                                                <td key={col.key} className={`px-2 sm:px-3 py-2.5 whitespace-nowrap ${colorClass} ${col.hideOnMobile ? 'hidden lg:table-cell' : ''}`}>
                                                    {formatted || '—'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                    <span className="text-[11px] text-slate-600">Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg bg-[#1a1d29] border border-white/5 text-slate-400
                hover:bg-white/5 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            let p: number;
                            if (totalPages <= 5) p = i + 1;
                            else if (page <= 3) p = i + 1;
                            else if (page >= totalPages - 2) p = totalPages - 4 + i;
                            else p = page - 2 + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`min-w-[28px] py-1 rounded-lg text-[11px] font-medium transition-all ${page === p
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'text-slate-500 hover:bg-white/5'
                                        }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
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
