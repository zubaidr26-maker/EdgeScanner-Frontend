'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { stockApi } from '@/lib/api';
import { Users, AlertCircle, ArrowRight } from 'lucide-react';

interface StockPeersProps {
    ticker: string;
}

export default function StockPeers({ ticker }: StockPeersProps) {
    const [peers, setPeers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!ticker) return;
        const fetchPeers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await stockApi.getPeers(ticker);
                if (res.data?.success) {
                    setPeers(res.data.data || []);
                } else {
                    setError(res.data?.error || 'Peers not available');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch peers');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPeers();
    }, [ticker]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-white/5 border border-white/5 rounded-xl" />
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

    if (peers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Users size={32} className="mb-3 text-slate-600" />
                <p className="text-sm">No related companies found for {ticker}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Related Peer Companies</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {peers.map((peer) => (
                    <button
                        key={peer}
                        onClick={() => router.push(`/stock/${peer.toUpperCase()}`)}
                        className="group flex flex-col items-center justify-center p-5 rounded-xl border border-white/5 bg-[#12141e]/50 hover:bg-[#12141e] hover:border-blue-500/25 transition-all duration-300 relative cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold mb-3 group-hover:bg-blue-500/20 transition-all">
                            {peer.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-white tracking-wider group-hover:text-blue-400 transition-colors">
                            {peer.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-0.5 group-hover:text-slate-400">
                            Analyze <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
