'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Star, Plus, Check, ChevronDown, X } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlistStore';

interface AddToWatchlistBtnProps {
    ticker: string;
    name?: string;
    size?: 'sm' | 'md';
    variant?: 'icon' | 'button';
}

export default function AddToWatchlistBtn({ ticker, name, size = 'sm', variant = 'icon' }: AddToWatchlistBtnProps) {
    const { lists, fetchLists, addItemToList, removeItemFromList, isInAnyList, getListsForTicker, createList } = useWatchlistStore();
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [loading, setLoading] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const inAny = isInAnyList(ticker);
    const tickerLists = getListsForTicker(ticker);

    useEffect(() => {
        if (lists.length === 0) fetchLists();
    }, []);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
                setCreating(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleToggle = async (listId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(listId);
        if (tickerLists.includes(listId)) {
            await removeItemFromList(listId, ticker);
        } else {
            await addItemToList(listId, ticker, name);
        }
        setLoading(null);
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!newListName.trim()) return;
        setLoading(-1);

        const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];
        const color = COLORS[lists.length % COLORS.length];

        const newList = await createList(newListName.trim(), color);
        if (newList) {
            await addItemToList(newList.id, ticker, name);
        }
        setNewListName('');
        setCreating(false);
        setLoading(null);
    };

    const iconSize = size === 'sm' ? 12 : 14;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                title={inAny ? 'In watchlist' : 'Add to watchlist'}
                className={`
                    flex items-center gap-1 rounded-lg transition-all
                    ${variant === 'icon'
                        ? `p-1.5 ${inAny
                            ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                            : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'
                        }`
                        : `px-2.5 py-1.5 text-[11px] font-medium border ${inAny
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-slate-400 bg-[#1a1d29] border-white/5 hover:border-amber-500/20 hover:text-amber-400'
                        }`
                    }
                `}
            >
                <Star size={iconSize} fill={inAny ? 'currentColor' : 'none'} />
                {variant === 'button' && (
                    <>
                        {inAny ? 'Saved' : 'Save'}
                        <ChevronDown size={10} />
                    </>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute z-50 right-0 top-full mt-1 w-56 bg-[#0d0f15] border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-white">Save {ticker} to...</span>
                        <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-400 p-0.5">
                            <X size={12} />
                        </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto py-1">
                        {lists.map((list) => {
                            const isIn = tickerLists.includes(list.id);
                            const isLoading = loading === list.id;
                            return (
                                <button
                                    key={list.id}
                                    onClick={(e) => handleToggle(list.id, e)}
                                    disabled={isLoading}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all ${isIn
                                        ? 'bg-white/[0.03]'
                                        : 'hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <div
                                        className="w-3 h-3 rounded-sm shrink-0"
                                        style={{ backgroundColor: list.color }}
                                    />
                                    <span className="text-xs text-slate-300 flex-1 truncate">{list.name}</span>
                                    <span className="text-[9px] text-slate-600">{list.items.length}</span>
                                    {isLoading ? (
                                        <div className="w-3.5 h-3.5 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                                    ) : isIn ? (
                                        <Check size={13} className="text-emerald-400 shrink-0" />
                                    ) : (
                                        <Plus size={13} className="text-slate-600 shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="border-t border-white/5 px-3 py-2">
                        {creating ? (
                            <form onSubmit={handleCreateList} className="flex items-center gap-1.5">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="List name..."
                                    className="flex-1 px-2 py-1 text-[11px] bg-[#1a1d29] border border-white/10 rounded text-slate-300
                                        focus:border-blue-500/40 focus:outline-none placeholder:text-slate-600"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    type="submit"
                                    disabled={!newListName.trim() || loading === -1}
                                    className="px-2 py-1 text-[10px] font-semibold bg-blue-600 text-white rounded
                                        hover:bg-blue-500 disabled:opacity-40 transition-all"
                                >
                                    {loading === -1 ? '...' : 'Add'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setCreating(false); setNewListName(''); }}
                                    className="p-1 text-slate-500 hover:text-slate-300"
                                >
                                    <X size={10} />
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); setCreating(true); }}
                                className="w-full flex items-center gap-2 px-1 py-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <Plus size={12} />
                                Create New List
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
