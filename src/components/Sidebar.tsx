'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, ScanSearch, Star, Menu, X, TrendingUp, Clock,
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/scanner', label: 'Scanner', icon: ScanSearch },
    { href: '/intraday', label: 'Intraday', icon: Clock },
    { href: '/watchlist', label: 'Watchlist', icon: Star },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0c14]/95 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center justify-between px-4 py-3">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <TrendingUp size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-sm text-white">EdgeScanner</span>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Nav Dropdown */}
                {mobileOpen && (
                    <div className="border-t border-white/5 px-3 py-2 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? 'bg-blue-500/10 text-blue-400'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-[220px] h-screen bg-[#0a0c14]/80 backdrop-blur-xl
        border-r border-white/5 fixed left-0 top-0 z-40">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-white/5">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center
              shadow-lg shadow-blue-500/20">
                            <TrendingUp size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm text-white tracking-tight">EdgeScanner</h1>
                            <p className="text-[10px] text-slate-500">Stock Analytics</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 border border-blue-500/10'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-white/5">
                    <p className="text-[10px] text-slate-600">v1.0.0 · Phase 1</p>
                </div>
            </aside>
        </>
    );
}
