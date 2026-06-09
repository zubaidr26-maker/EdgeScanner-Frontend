'use client';

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
    ticker: string;
    height?: number;
}

function TradingViewChartInner({ ticker, height = 900 }: TradingViewChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptRef = useRef<HTMLScriptElement | null>(null);

    useEffect(() => {
        if (!containerRef.current || !ticker) return;

        // Clear previous widget
        const container = containerRef.current;
        container.innerHTML = '';

        // Create the widget container div that TradingView expects
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        widgetDiv.style.height = `calc(${height}px - 32px)`;
        widgetDiv.style.width = '100%';
        container.appendChild(widgetDiv);

        // Create the copyright div (required by TradingView ToS)
        const copyrightDiv = document.createElement('div');
        copyrightDiv.className = 'tradingview-widget-copyright';
        copyrightDiv.innerHTML = `<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>`;
        container.appendChild(copyrightDiv);

        // Create and inject the widget script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            autosize: false,
            width: '100%',
            height: height - 40,
            symbol: ticker,
            interval: 'D',
            timezone: 'exchange',
            theme: 'dark',
            style: '1',
            locale: 'en',
            backgroundColor: '#12141e',
            gridColor: 'rgba(255, 255, 255, 0.03)',
            hide_top_toolbar: false,
            hide_legend: false,
            allow_symbol_change: true,
            save_image: true,
            calendar: false,
            hide_volume: false,
            support_host: 'https://www.tradingview.com',
            studies: [
                'Volume@tv-basicstudies',
            ],
            withdateranges: true,
            details: true,
            hotlist: false,
            show_popup_button: true,
            popup_width: '1000',
            popup_height: '650',
        });

        scriptRef.current = script;
        container.appendChild(script);

        // Cleanup on unmount or ticker change
        return () => {
            if (container) {
                container.innerHTML = '';
            }
            scriptRef.current = null;
        };
    }, [ticker, height]);

    return (
        <div className="w-full">
            {/* TradingView Widget Container */}
            <div
                className="tradingview-widget-container rounded-xl overflow-hidden"
                ref={containerRef}
                style={{ height: `${height}px`, width: '100%' }}
            />
        </div>
    );
}

// Memoize to avoid unnecessary re-renders
const TradingViewChart = memo(TradingViewChartInner);
export default TradingViewChart;
