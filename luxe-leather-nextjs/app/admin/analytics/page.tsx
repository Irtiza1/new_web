'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import type { AnalyticsSummary, TopProduct, CustomerCountry } from '@/lib/services/analyticsService';

export default function AdminAnalyticsPage() {
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [countries, setCountries] = useState<CustomerCountry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const dateRange = `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    useEffect(() => {
        async function fetchData() {
            try {
                const [summaryRes, productsRes, countriesRes] = await Promise.all([
                    fetch('/api/analytics?type=summary', { cache: 'no-store' }),
                    fetch('/api/analytics?type=top-products', { cache: 'no-store' }),
                    fetch('/api/analytics?type=customers-by-country', { cache: 'no-store' })
                ]);

                const summaryData = await summaryRes.json();
                const productsData = await productsRes.json();
                const countriesData = await countriesRes.json();

                if (summaryData.success) setSummary(summaryData.data);
                if (productsData.success) setTopProducts(productsData.data);
                if (countriesData.success) setCountries(countriesData.data);
            } catch (err) {
                console.error('Failed to load analytics:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleDownloadPDF = async () => {
        // Dynamic import to avoid SSR issues
        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).default;

        const element = document.getElementById('analytics-dashboard');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('analytics-report.pdf');
        } catch (err) {
            console.error('PDF Export failed:', err);
            alert('Failed to generate PDF');
        }
    };

    return (
        <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] font-[family-name:var(--font-inter)]">


            <div className="flex-1 flex flex-col h-full min-h-0 overflow-auto">


                {/* Main Content */}
                <main id="analytics-dashboard" className="flex-1 p-4 md:p-8 max-w-[1600px] mx-auto w-full space-y-6 bg-[#f6f7f8] dark:bg-[#101922]">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-[#0d141b] dark:text-[#f3f4f6]">Analytics & Reports</h1>
                            <p className="text-[#4c739a] dark:text-[#9ca3af] mt-1 text-sm md:text-base">Overview of sales performance, product trends, and customer distribution.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Date Range Picker */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDatePicker(p => !p)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1a2632] border border-[#e7edf3] dark:border-[#2b3a4a] rounded-lg text-sm font-medium text-[#0d141b] dark:text-[#f3f4f6] shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base">calendar_today</span>
                                    <span className="hidden sm:inline">{dateRange}</span>
                                    <span className="material-symbols-outlined text-base text-[#4c739a] dark:text-[#9ca3af]">arrow_drop_down</span>
                                </button>
                                {showDatePicker && (
                                    <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-[#1a2632] border border-[#e7edf3] dark:border-[#2b3a4a] rounded-xl shadow-xl p-4 flex flex-col gap-3" style={{ minWidth: '260px' }}>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Date Range</p>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">From</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                max={endDate}
                                                onChange={e => setStartDate(e.target.value)}
                                                className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#d41132] outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">To</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                min={startDate}
                                                max={new Date().toISOString().split('T')[0]}
                                                onChange={e => setEndDate(e.target.value)}
                                                className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#d41132] outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={() => { setShowDatePicker(false); }}
                                                className="flex-1 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            >Cancel</button>
                                            <button
                                                onClick={() => setShowDatePicker(false)}
                                                className="flex-1 py-1.5 text-xs font-bold bg-[#d41132] text-white rounded-lg hover:bg-[#b30f2a] transition-colors"
                                            >Apply</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Export Button */}
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center gap-2 px-3 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-base">download</span>
                                <span className="hidden sm:inline">Export PDF</span>
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Card 1 */}
                        <div className="bg-white dark:bg-[#1a2632] p-5 rounded-xl border border-[#e7edf3] dark:border-[#2b3a4a] shadow-sm flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                                <p className="text-[#4c739a] dark:text-[#9ca3af] text-sm font-medium">Total Revenue</p>
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-400">
                                    <span className="material-symbols-outlined text-sm">trending_up</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h3 className="text-2xl font-bold text-[#0d141b] dark:text-[#f3f4f6]">${summary?.totalRevenue?.toLocaleString() ?? '0'}</h3>
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">+12%</span>
                            </div>
                            <p className="text-xs text-[#4c739a] dark:text-[#9ca3af] mt-1">Compared to last month</p>
                        </div>
                        {/* Card 2 */}
                        <div className="bg-white dark:bg-[#1a2632] p-5 rounded-xl border border-[#e7edf3] dark:border-[#2b3a4a] shadow-sm flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                                <p className="text-[#4c739a] dark:text-[#9ca3af] text-sm font-medium">New Orders</p>
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-400">
                                    <span className="material-symbols-outlined text-sm">trending_up</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h3 className="text-2xl font-bold text-[#0d141b] dark:text-[#f3f4f6]">{summary?.totalOrders?.toLocaleString() ?? '0'}</h3>
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">+5%</span>
                            </div>
                            <p className="text-xs text-[#4c739a] dark:text-[#9ca3af] mt-1">Compared to last month</p>
                        </div>
                        {/* Card 3 */}
                        <div className="bg-white dark:bg-[#1a2632] p-5 rounded-xl border border-[#e7edf3] dark:border-[#2b3a4a] shadow-sm flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                                <p className="text-[#4c739a] dark:text-[#9ca3af] text-sm font-medium">Avg. Order Value</p>
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-#a20e26 dark:text-#e85273">
                                    <span className="material-symbols-outlined text-sm">remove</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h3 className="text-2xl font-bold text-[#0d141b] dark:text-[#f3f4f6]">${summary?.avgOrderValue ?? '0'}</h3>
                                <span className="text-sm font-semibold text-#b30f2a dark:text-#e85273">+2%</span>
                            </div>
                            <p className="text-xs text-[#4c739a] dark:text-[#9ca3af] mt-1">Stable performance</p>
                        </div>
                        {/* Card 4 */}
                        <div className="bg-white dark:bg-[#1a2632] p-5 rounded-xl border border-[#e7edf3] dark:border-[#2b3a4a] shadow-sm flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                                <p className="text-[#4c739a] dark:text-[#9ca3af] text-sm font-medium">Total Returns</p>
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-400">
                                    <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h3 className="text-2xl font-bold text-[#0d141b] dark:text-[#f3f4f6]">{summary?.totalReturns ?? '0'}</h3>
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">-1.5%</span>
                            </div>
                            <p className="text-xs text-[#4c739a] dark:text-[#9ca3af] mt-1">Improvement in quality</p>
                        </div>
                    </div>

                    {/* Main Revenue Chart */}
                    <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e7edf3] dark:border-[#2b3a4a] shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-[#0d141b] dark:text-[#f3f4f6]">Revenue (Last 12 Months)</h3>
                                <p className="text-sm text-[#4c739a] dark:text-[#9ca3af]">Year over year growth: <span className="text-green-600 font-medium">+8.5%</span></p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="size-3 rounded-full bg-[#d41132]"></span>
                                <span className="text-xs font-medium text-[#4c739a] dark:text-[#9ca3af] mr-3">Current Year</span>
                                <span className="size-3 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                <span className="text-xs font-medium text-[#4c739a] dark:text-[#9ca3af]">Previous Year</span>
                            </div>
                        </div>
                        <div className="relative w-full h-[300px] md:h-[350px]">
                            {/* CSS Bar Chart based on order status breakdown */}
                            {summary && Object.keys(summary.byStatus).length > 0 ? (
                                <div className="w-full h-full flex flex-col justify-end gap-2 pt-6 pb-2">
                                    <div className="flex items-end justify-around gap-3 h-full">
                                        {Object.entries(summary.byStatus).map(([status, count], i) => {
                                            const maxCount = Math.max(...Object.values(summary.byStatus));
                                            const heightPct = maxCount > 0 ? Math.max(10, (count / maxCount) * 100) : 10;
                                            const colors: Record<string, string> = {
                                                PENDING: 'bg-yellow-400',
                                                PROCESSING: 'bg-blue-400',
                                                SHIPPED: 'bg-purple-400',
                                                DELIVERED: 'bg-green-400',
                                                CANCELLED: 'bg-red-400',
                                            };
                                            return (
                                                <div key={status} className="flex flex-col items-center flex-1 gap-1 min-w-0">
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{count}</span>
                                                    <div
                                                        className={`w-full rounded-t-md transition-all duration-700 ${colors[status] ?? 'bg-slate-400'}`}
                                                        style={{ height: `${heightPct}%` }}
                                                    />
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center truncate w-full">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full bg-[#f6f7f8] dark:bg-[#101922] rounded-lg flex flex-col items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">bar_chart</span>
                                    <p className="text-[#4c739a] dark:text-[#9ca3af] text-sm">No order data available yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Charts Split Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Top Selling Products */}
                        <div className="lg:col-span-2 bg-white dark:bg-[#1a2632] rounded-xl border border-[#e7edf3] dark:border-[#2b3a4a] shadow-sm p-6">
                            <h3 className="text-lg font-bold text-[#0d141b] dark:text-[#f3f4f6] mb-6">Top Selling Products</h3>
                            <div className="space-y-6">
                                {topProducts.length > 0 ? topProducts.map((product, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-[#0d141b] dark:text-[#f3f4f6]">{product.name}</span>
                                            <span className="text-[#4c739a] dark:text-[#9ca3af]">{product.sales} Sales</span>
                                        </div>
                                        <div className="h-2 w-full bg-[#f6f7f8] dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#d41132] rounded-full" style={{ width: `${product.percentage}%`, opacity: 1 - i * 0.15 }}></div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-[#4c739a] dark:text-[#9ca3af]">No product data available</p>
                                )}
                            </div>
                        </div>

                        {/* Order Status */}
                        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e7edf3] dark:border-[#2b3a4a] shadow-sm p-6 flex flex-col">
                            <h3 className="text-lg font-bold text-[#0d141b] dark:text-[#f3f4f6] mb-6">Order Status</h3>
                            <div className="flex flex-1 items-center justify-center relative my-4">
                                {/* Donut Chart Placeholder */}
                                <div className="size-[200px] rounded-full border-[40px] border-[#d41132] border-t-[#60a5fa] border-r-[#ef4444] flex items-center justify-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-bold text-[#0d141b] dark:text-[#f3f4f6]">1.2K</span>
                                        <span className="text-xs text-[#4c739a] dark:text-[#9ca3af]">Orders</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="size-3 rounded-full bg-[#d41132]"></span>
                                    <span className="text-xs font-medium text-[#4c739a] dark:text-[#9ca3af]">Delivered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="size-3 rounded-full bg-[#60a5fa]"></span>
                                    <span className="text-xs font-medium text-[#4c739a] dark:text-[#9ca3af]">Processing</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="size-3 rounded-full bg-red-500"></span>
                                    <span className="text-xs font-medium text-[#4c739a] dark:text-[#9ca3af]">Returned</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* World Map Visualization */}
                    <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e7edf3] dark:border-[#2b3a4a] shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                            <h3 className="text-lg font-bold text-[#0d141b] dark:text-[#f3f4f6]">Customers by Country</h3>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 text-xs font-medium bg-[#d41132]/10 text-[#d41132] rounded-full">Global View</span>
                                <span className="px-3 py-1 text-xs font-medium bg-[#f6f7f8] dark:bg-gray-800 text-[#4c739a] dark:text-[#9ca3af] rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">North America</span>
                                <span className="px-3 py-1 text-xs font-medium bg-[#f6f7f8] dark:bg-gray-800 text-[#4c739a] dark:text-[#9ca3af] rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">Europe</span>
                            </div>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Map Graphic Placeholder */}
                            <div className="flex-1 relative bg-[#eef4ff] dark:bg-[#1f2d3d] rounded-lg min-h-[300px] overflow-hidden flex flex-col items-center justify-center gap-3">
                                <span className="material-symbols-outlined text-6xl text-blue-200 dark:text-blue-800">public</span>
                                <p className="text-[#4c739a] dark:text-[#9ca3af] text-sm font-medium">Customer Distribution</p>
                                {countries.length === 0 && (
                                    <p className="text-xs text-slate-400">No customer location data available</p>
                                )}
                                {countries.length > 0 && (
                                    <div className="w-full px-6 mt-2 space-y-2">
                                        {countries.map((c, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className="text-base">{c.flag}</span>
                                                <div className="flex-1 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-400 dark:bg-blue-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                                                </div>
                                                <span className="text-xs text-slate-500 w-8 text-right">{c.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Country List */}
                            <div className="w-full lg:w-80 flex flex-col justify-center gap-4">
                                {countries.length > 0 ? countries.map((c, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-[#f6f7f8] dark:bg-[#101922] rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{c.flag}</span>
                                            <span className="text-sm font-medium text-[#0d141b] dark:text-[#f3f4f6]">{c.country}</span>
                                        </div>
                                        <span className="text-sm font-bold text-[#0d141b] dark:text-[#f3f4f6]">{c.percentage}%</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-[#4c739a] dark:text-[#9ca3af] text-center">No customer data available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
