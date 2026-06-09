'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, ScanSearch, Star, Menu, X, TrendingUp, Clock,
    Sun, Moon, ChevronLeft,
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/scanner', label: 'Scanner', icon: ScanSearch },
    { href: '/intraday', label: 'Intraday', icon: Clock },
    { href: '/watchlist', label: 'Watchlist', icon: Star },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { sidebarOpen, theme, toggleSidebar, toggleTheme } = useUiStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // SSR / Initial hydration render: render a placeholder matching default theme
        return (
            <>
                <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0c14] border-b border-white/5 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <TrendingUp size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-sm text-white">EdgeScanner</span>
                    </div>
                </div>
                <aside className="hidden lg:flex flex-col w-[220px] h-screen bg-[#0a0c14] border-r border-white/5 fixed left-0 top-0 z-40" />
            </>
        );
    }

    return (
        <>
            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-b border-sidebar-border">
                <div className="flex items-center justify-between px-4 py-3">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <TrendingUp size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-sm text-foreground">EdgeScanner</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-hover-bg text-muted-text hover:text-foreground cursor-pointer"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 rounded-lg hover:bg-hover-bg text-muted-text hover:text-foreground cursor-pointer"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav Dropdown */}
                {mobileOpen && (
                    <div className="border-t border-sidebar-border px-3 py-2 space-y-1 bg-sidebar">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
                                        : 'text-muted-text hover:text-foreground hover:bg-hover-bg'
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
            <aside
                className={`hidden lg:flex flex-col w-[220px] h-screen bg-sidebar/80 backdrop-blur-xl
                border-r border-sidebar-border fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo Section */}
                <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <TrendingUp size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm text-foreground tracking-tight">EdgeScanner</h1>
                            <p className="text-[10px] text-muted-text">Stock Analytics</p>
                        </div>
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-lg hover:bg-hover-bg text-muted-text hover:text-foreground cursor-pointer flex items-center justify-center"
                        title="Close Sidebar"
                    >
                        <ChevronLeft size={16} />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10 dark:border-blue-500/20'
                                    : 'text-muted-text hover:text-foreground hover:bg-hover-bg'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shadow-lg shadow-blue-500/50" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Section with Theme Toggle */}
                <div className="px-5 py-4 border-t border-sidebar-border flex items-center justify-between">
                    <p className="text-[10px] text-muted-text">v1.0.0 · Phase 1</p>
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-lg hover:bg-hover-bg text-muted-text hover:text-foreground cursor-pointer flex items-center justify-center"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                    </button>
                </div>
            </aside>
        </>
    );
}
