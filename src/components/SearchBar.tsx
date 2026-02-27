'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { stockApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SearchResult {
    ticker: string;
    name: string;
    market: string;
    type: string;
}

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await stockApi.searchStocks(query);
                setResults(res.data?.data || []);
                setIsOpen(true);
            } catch {
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const handleSelect = (ticker: string) => {
        setQuery('');
        setIsOpen(false);
        router.push(`/stock/${ticker}`);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search ticker or company..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query && setIsOpen(true)}
                    className="w-full pl-10 pr-8 py-2.5 bg-[#1a1d29] border border-white/5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            setIsOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-[#1a1d29] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                            Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="max-h-64 overflow-y-auto">
                            {results.map((r) => (
                                <li key={r.ticker}>
                                    <button
                                        onClick={() => handleSelect(r.ticker)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                                            {r.ticker.slice(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{r.ticker}</p>
                                            <p className="text-xs text-slate-500 truncate">{r.name}</p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-sm text-slate-500">
                            No results found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
