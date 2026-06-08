'use client';

import React, { useEffect, useState } from 'react';
import { stockApi } from '@/lib/api';
import { Newspaper, ArrowUpRight, MessageSquare, AlertCircle } from 'lucide-react';

interface NewsItem {
    id: string;
    title: string;
    author: string;
    published_utc: string;
    article_url: string;
    image_url: string;
    description: string;
    sentiment: string;
}

interface StockNewsProps {
    ticker: string;
}

export default function StockNews({ ticker }: StockNewsProps) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ticker) return;
        const fetchNews = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await stockApi.getNews(ticker);
                if (res.data?.success) {
                    setNews(res.data.data || []);
                } else {
                    setError(res.data?.error || 'Failed to fetch news');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch news data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchNews();
    }, [ticker]);

    const getSentimentBadge = (sentiment: string) => {
        const s = sentiment?.toLowerCase();
        if (s === 'bullish' || s === 'positive') {
            return (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                    Bullish
                </span>
            );
        } else if (s === 'bearish' || s === 'negative') {
            return (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-400 rounded-md border border-rose-500/20">
                    Bearish
                </span>
            );
        } else {
            return (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-500/10 text-slate-400 rounded-md border border-slate-500/20">
                    Neutral
                </span>
            );
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 rounded-xl bg-white/5 border border-white/5 p-4 space-y-3">
                        <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-lg bg-white/5 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-white/5 rounded" />
                                <div className="h-3 w-1/2 bg-white/5 rounded" />
                            </div>
                        </div>
                        <div className="h-10 w-full bg-white/5 rounded" />
                    </div>
                ))}
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

    if (news.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Newspaper size={32} className="mb-3 text-slate-600" />
                <p className="text-sm">No recent news found for {ticker}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map((item) => (
                <a
                    key={item.id}
                    href={item.article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between p-4 rounded-xl border border-white/5 bg-[#12141e]/50 hover:bg-[#12141e] hover:border-white/10 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                >
                    <div className="flex gap-4">
                        {item.image_url && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-slate-900">
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                                    {item.author || 'Massive News'}
                                </span>
                                {getSentimentBadge(item.sentiment)}
                            </div>
                            <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                                {item.title}
                            </h3>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                        {item.description}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 font-mono">
                            {formatDate(item.published_utc)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-400 group-hover:text-blue-300">
                            Read article <ArrowUpRight size={10} />
                        </span>
                    </div>
                </a>
            ))}
        </div>
    );
}
