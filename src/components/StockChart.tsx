'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import { stockApi } from '@/lib/api';

interface StockChartProps {
    ticker: string;
    height?: number;
}

export default function StockChart({ ticker, height = 500 }: StockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const [timeframe, setTimeframe] = useState('1M');
    const [isLoading, setIsLoading] = useState(true);
    const [barCount, setBarCount] = useState(0);

    // All timeframes use day/week since free API only supports day+ aggregates
    const timeframes: Record<string, { timespan: string; multiplier: number; days: number; label: string }> = {
        '5D': { timespan: 'day', multiplier: 1, days: 7, label: '5D' },
        '1M': { timespan: 'day', multiplier: 1, days: 30, label: '1M' },
        '3M': { timespan: 'day', multiplier: 1, days: 90, label: '3M' },
        '6M': { timespan: 'day', multiplier: 1, days: 180, label: '6M' },
        '1Y': { timespan: 'day', multiplier: 1, days: 365, label: '1Y' },
        '5Y': { timespan: 'week', multiplier: 1, days: 1825, label: '5Y' },
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const containerWidth = chartContainerRef.current.clientWidth;
        const chartHeight = Math.min(height, window.innerHeight * 0.55);

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#64748b',
                fontFamily: "'Inter', sans-serif",
                fontSize: containerWidth < 500 ? 9 : 11,
            },
            grid: {
                vertLines: { color: 'rgba(255,255,255,0.03)' },
                horzLines: { color: 'rgba(255,255,255,0.03)' },
            },
            crosshair: {
                vertLine: {
                    color: 'rgba(99,102,241,0.4)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#6366f1',
                },
                horzLine: {
                    color: 'rgba(99,102,241,0.4)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#6366f1',
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(255,255,255,0.05)',
                scaleMargins: { top: 0.1, bottom: 0.2 },
            },
            timeScale: {
                borderColor: 'rgba(255,255,255,0.05)',
                timeVisible: true,
                secondsVisible: false,
            },
            width: containerWidth,
            height: chartHeight,
        });

        chartRef.current = chart;

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderDownColor: '#ef4444',
            borderUpColor: '#10b981',
            wickDownColor: '#ef4444',
            wickUpColor: '#10b981',
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#6366f1',
            priceFormat: { type: 'volume' },
            priceScaleId: '',
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });

        const tf = timeframes[timeframe];
        const toDate = new Date().toISOString().split('T')[0];
        const fromDate = new Date(Date.now() - tf.days * 86400000).toISOString().split('T')[0];

        setIsLoading(true);
        setBarCount(0);
        stockApi
            .getStockHistory(ticker, {
                timespan: tf.timespan,
                multiplier: tf.multiplier,
                from: fromDate,
                to: toDate,
            })
            .then((res) => {
                const data = res.data?.data || [];
                setBarCount(data.length);
                if (data.length > 0) {
                    candleSeries.setData(
                        data.map((d: any) => ({
                            time: d.time,
                            open: d.open,
                            high: d.high,
                            low: d.low,
                            close: d.close,
                        }))
                    );
                    volumeSeries.setData(
                        data.map((d: any) => ({
                            time: d.time,
                            value: d.volume,
                            color: d.close >= d.open ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                        }))
                    );
                    chart.timeScale().fitContent();
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: Math.min(height, window.innerHeight * 0.55),
                });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [ticker, timeframe, height]);

    return (
        <div className="w-full">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 mb-4 p-1 bg-[#1a1d29] rounded-xl w-fit overflow-x-auto">
                {Object.entries(timeframes).map(([key, tf]) => (
                    <button
                        key={key}
                        onClick={() => setTimeframe(key)}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap ${timeframe === key
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        {tf.label}
                    </button>
                ))}
            </div>

            {/* Chart Container */}
            <div className="relative rounded-xl overflow-hidden border border-white/5 bg-[#0d0f15]">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0d0f15]/80 z-10">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-slate-500">Loading chart...</span>
                        </div>
                    </div>
                )}
                {!isLoading && barCount === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0d0f15]/80 z-10">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-sm text-slate-500">No data available for this timeframe</span>
                            <span className="text-xs text-slate-600">Try a different period</span>
                        </div>
                    </div>
                )}
                <div ref={chartContainerRef} />
            </div>
        </div>
    );
}
