'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useUiStore } from '@/store/uiStore';
import { Menu } from 'lucide-react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const { sidebarOpen, theme, toggleSidebar } = useUiStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const root = window.document.documentElement;
        if (theme === 'light') {
            root.classList.add('light');
            root.classList.remove('dark');
        } else {
            root.classList.add('dark');
            root.classList.remove('light');
        }
    }, [theme, mounted]);

    // During SSR / Initial load, render matching layout to avoid layout shifts
    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#080a12] text-white">
                <Sidebar />
                <main className="lg:ml-[220px] pt-14 lg:pt-0 min-h-screen">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
            {/* Sidebar Component */}
            <Sidebar />

            {/* Main Content */}
            <main
                className={`min-h-screen transition-all duration-300 ease-in-out ${
                    sidebarOpen ? 'lg:ml-[220px]' : 'lg:ml-0'
                } pt-14 lg:pt-0`}
            >
                {/* Floating Toggle Button (visible when sidebar is closed on desktop) */}
                {!sidebarOpen && (
                    <button
                        onClick={toggleSidebar}
                        className="hidden lg:flex fixed top-4 left-4 z-40 p-2 rounded-xl bg-card border border-card-border hover:bg-hover-bg text-foreground shadow-lg cursor-pointer flex items-center justify-center animate-fade-in"
                        title="Open Sidebar"
                    >
                        <Menu size={18} />
                    </button>
                )}

                {children}
            </main>
        </div>
    );
}
