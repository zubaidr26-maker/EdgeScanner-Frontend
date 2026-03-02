'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { stockApi } from '@/lib/api';
import { useWatchlistStore, type WatchlistGroup } from '@/store/watchlistStore';
import {
    Star, Trash2, TrendingUp, TrendingDown, ExternalLink, RefreshCcw,
    Plus, Pencil, X, Check, FolderPlus, Layers, ChevronDown,
} from 'lucide-react';
import { formatPrice, formatPercent, getChangeColor, cn } from '@/lib/utils';

// ── Color palette for lists ────────────────────────────────
const LIST_COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#a855f7',
];

interface WatchlistStock {
    ticker: string;
    name?: string;
    price?: number;
    change?: number;
    changePercent?: number;
}

// ── Create List Modal ──────────────────────────────────────
function CreateListModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { createList, lists } = useWatchlistStore();
    const [name, setName] = useState('');
    const [color, setColor] = useState(LIST_COLORS[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setName('');
            setColor(LIST_COLORS[lists.length % LIST_COLORS.length]);
        }
    }, [open]);

    if (!open) return null;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        const result = await createList(name.trim(), color);
        setLoading(false);
        if (result) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm mx-4 bg-[#0d0f15] border border-white/10 rounded-2xl shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <FolderPlus size={16} className="text-blue-400" />
                        </div>
                        <h2 className="text-sm font-bold text-white">Create New List</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">List Name</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Gap Runners, Momentum Plays..."
                            className="w-full px-3 py-2 text-sm bg-[#1a1d29] border border-white/5 rounded-lg text-slate-300
                                focus:border-blue-500/40 focus:outline-none placeholder:text-slate-600"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 block">Color</label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {LIST_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-lg transition-all border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim() || loading}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white
                            hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 transition-all shadow-lg shadow-blue-500/20"
                    >
                        {loading ? 'Creating...' : 'Create List'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────
export default function WatchlistPage() {
    const router = useRouter();
    const {
        lists, activeListId, isLoading,
        fetchLists, setActiveList, deleteList, updateList, removeItemFromList,
    } = useWatchlistStore();

    const [watchlistStocks, setWatchlistStocks] = useState<WatchlistStock[]>([]);
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingListId, setEditingListId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    useEffect(() => {
        fetchLists();
    }, []);

    const activeList = lists.find((l) => l.id === activeListId) || null;

    // When active list changes, update stocks
    useEffect(() => {
        if (activeList) {
            const stocks: WatchlistStock[] = activeList.items.map((item) => ({
                ticker: item.ticker,
                name: item.name || undefined,
            }));
            setWatchlistStocks(stocks);
        } else {
            setWatchlistStocks([]);
        }
    }, [activeList, activeListId, lists]);

    const fetchPrices = async () => {
        if (watchlistStocks.length === 0) return;
        setLoadingPrices(true);
        const updated = await Promise.all(
            watchlistStocks.map(async (stock) => {
                try {
                    const res = await stockApi.getStockByTicker(stock.ticker);
                    const data = res.data?.data;
                    return {
                        ...stock,
                        name: data?.name || stock.name,
                        price: data?.price,
                        change: data?.change,
                        changePercent: data?.changePercent,
                    };
                } catch {
                    return stock;
                }
            })
        );
        setWatchlistStocks(updated);
        setLoadingPrices(false);
    };

    useEffect(() => {
        if (watchlistStocks.length > 0 && !watchlistStocks[0].price) {
            fetchPrices();
        }
    }, [watchlistStocks.length]);

    const handleRemove = async (ticker: string) => {
        if (!activeListId) return;
        await removeItemFromList(activeListId, ticker);
    };

    const handleStartEdit = (list: WatchlistGroup) => {
        setEditingListId(list.id);
        setEditName(list.name);
    };

    const handleSaveEdit = async () => {
        if (editingListId && editName.trim()) {
            await updateList(editingListId, { name: editName.trim() });
        }
        setEditingListId(null);
    };

    const handleDeleteList = async (id: number) => {
        await deleteList(id);
        setDeleteConfirmId(null);
    };

    const totalItems = lists.reduce((sum, l) => sum + l.items.length, 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Star size={16} className="text-white" />
                        </div>
                        Watchlists
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {lists.length} list{lists.length !== 1 ? 's' : ''} · {totalItems} total stocks
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-sm text-blue-400
                            hover:bg-blue-500/20 transition-all font-medium"
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">New List</span>
                    </button>
                    <button
                        onClick={fetchPrices}
                        disabled={loadingPrices || watchlistStocks.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-400
                            hover:text-white hover:border-white/20 transition-all disabled:opacity-30"
                    >
                        <RefreshCcw size={14} className={loadingPrices ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Create List Modal */}
            <CreateListModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />

            {/* List Tabs */}
            {lists.length > 0 && (
                <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-thin">
                    {/* All Lists button */}
                    <button
                        onClick={() => setActiveList(null)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border whitespace-nowrap shrink-0 ${activeListId === null
                                ? 'bg-white/10 text-white border-white/20'
                                : 'bg-[#1a1d29] text-slate-400 border-white/5 hover:border-white/10'
                            }`}
                    >
                        <Layers size={12} />
                        All ({totalItems})
                    </button>

                    {lists.map((list) => (
                        <div key={list.id} className="relative group shrink-0">
                            <button
                                onClick={() => setActiveList(list.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border whitespace-nowrap ${activeListId === list.id
                                        ? 'bg-white/10 text-white border-white/20'
                                        : 'bg-[#1a1d29] text-slate-400 border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: list.color }} />
                                {editingListId === list.id ? (
                                    <input
                                        autoFocus
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit();
                                            if (e.key === 'Escape') setEditingListId(null);
                                        }}
                                        onBlur={handleSaveEdit}
                                        className="bg-transparent text-xs text-white w-24 focus:outline-none border-b border-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <>
                                        {list.name}
                                        <span className="text-slate-600 text-[10px]">({list.items.length})</span>
                                    </>
                                )}
                            </button>
                            {/* Edit/Delete actions on hover */}
                            {activeListId === list.id && editingListId !== list.id && (
                                <div className="absolute -top-1 -right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEdit(list);
                                        }}
                                        className="p-1 rounded bg-[#0d0f15] border border-white/10 text-slate-400 hover:text-blue-400 transition-colors"
                                    >
                                        <Pencil size={9} />
                                    </button>
                                    {deleteConfirmId === list.id ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteList(list.id);
                                            }}
                                            className="p-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[8px] font-bold"
                                        >
                                            <Check size={9} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmId(list.id);
                                                setTimeout(() => setDeleteConfirmId(null), 3000);
                                            }}
                                            className="p-1 rounded bg-[#0d0f15] border border-white/10 text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={9} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Content */}
            {lists.length === 0 && !isLoading ? (
                // No lists at all
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/5 bg-[#12141e]">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                        <Star size={24} className="text-amber-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">No Watchlists Yet</h2>
                    <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
                        Create your first watchlist to start tracking stocks. You can add tickers from the Scanner or Intraday pages.
                    </p>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-sm font-semibold text-white
                            hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={14} className="inline mr-2" />
                        Create First List
                    </button>
                </div>
            ) : activeListId === null ? (
                // "All" view — show summary cards for each list
                <div className="space-y-4">
                    {lists.map((list) => (
                        <div
                            key={list.id}
                            className="rounded-2xl border border-white/5 bg-[#12141e] overflow-hidden hover:border-white/10 transition-all"
                        >
                            <button
                                onClick={() => setActiveList(list.id)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: list.color }} />
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-white">{list.name}</h3>
                                        <p className="text-[11px] text-slate-500">
                                            {list.items.length} stock{list.items.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        {list.items.slice(0, 5).map((item) => (
                                            <span
                                                key={item.ticker}
                                                className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 font-medium"
                                            >
                                                {item.ticker}
                                            </span>
                                        ))}
                                        {list.items.length > 5 && (
                                            <span className="text-[10px] text-slate-600">+{list.items.length - 5}</span>
                                        )}
                                    </div>
                                    <ChevronDown size={14} className="text-slate-600 -rotate-90" />
                                </div>
                            </button>
                        </div>
                    ))}
                </div>
            ) : watchlistStocks.length === 0 ? (
                // Active list is empty
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/5 bg-[#12141e]">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                        <Star size={24} className="text-amber-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">
                        {activeList?.name || 'Watchlist'} is empty
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Add stocks from the Scanner or click the ⭐ button on any ticker
                    </p>
                    <button
                        onClick={() => router.push('/scanner')}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-sm font-semibold text-white
                            hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
                    >
                        Go to Scanner
                    </button>
                </div>
            ) : (
                // Active list stocks grid
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {watchlistStocks.map((stock, i) => (
                        <div
                            key={stock.ticker}
                            className="rounded-2xl border border-white/5 bg-[#12141e] p-5 hover:border-white/10 transition-all group animate-fade-in cursor-pointer"
                            style={{ animationDelay: `${i * 50}ms` }}
                            onClick={() => router.push(`/stock/${stock.ticker}`)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center text-sm font-bold text-blue-400 border border-blue-500/10">
                                        {stock.ticker.slice(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {stock.ticker}
                                        </h3>
                                        {stock.name && (
                                            <p className="text-xs text-slate-500 truncate max-w-[140px]">{stock.name}</p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(stock.ticker);
                                    }}
                                    className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {stock.price !== undefined ? (
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className="text-xl font-bold text-white font-mono">
                                            {formatPrice(stock.price)}
                                        </div>
                                        {stock.change !== undefined && stock.changePercent !== undefined && (
                                            <div className={cn('flex items-center gap-1 mt-1 text-sm font-medium', getChangeColor(stock.change))}>
                                                {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {formatPercent(stock.changePercent)}
                                            </div>
                                        )}
                                    </div>
                                    <ExternalLink size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                                </div>
                            ) : (
                                <div className="animate-pulse space-y-2">
                                    <div className="w-20 h-6 bg-white/5 rounded" />
                                    <div className="w-14 h-4 bg-white/5 rounded" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
