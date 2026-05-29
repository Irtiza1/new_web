'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SVGProps } from 'react';
import { useToast } from '@/contexts/ToastContext';
import type { AnalyticsSummary, TopProduct, CustomerCountry, TrafficStats } from '@/lib/services/analyticsService';

const statusMeta: Record<string, { label: string; color: string; text: string }> = {
    PENDING: { label: 'Pending', color: '#f59e0b', text: 'text-amber-600' },
    PROCESSING: { label: 'Processing', color: '#0ea5e9', text: 'text-sky-600' },
    SHIPPED: { label: 'Shipped', color: '#6366f1', text: 'text-indigo-600' },
    DELIVERED: { label: 'Delivered', color: '#10b981', text: 'text-emerald-600' },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', text: 'text-red-600' },
};

function formatCurrency(value?: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value || 0);
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function conicGradient(byStatus: Record<string, number>) {
    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 'conic-gradient(#e2e8f0 0deg 360deg)';

    let cursor = 0;
    const segments = Object.entries(byStatus).map(([status, count]) => {
        const start = cursor;
        const size = (count / total) * 360;
        cursor += size;
        return `${statusMeta[status]?.color || '#94a3b8'} ${start}deg ${cursor}deg`;
    });

    return `conic-gradient(${segments.join(', ')})`;
}

function csvCell(value: string | number | null | undefined) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, rows: Array<Array<string | number | null | undefined>>) {
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

type AnalyticsIconName = 'calendar' | 'download' | 'payments' | 'shoppingBag' | 'receipt' | 'return' | 'globe' | 'devices' | 'trendingUp';

function AnalyticsIcon({ name, className = 'size-5' }: { name: AnalyticsIconName; className?: string }) {
    const iconProps: SVGProps<SVGSVGElement> = {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
    };

    switch (name) {
        case 'calendar':
            return (
                <svg {...iconProps}>
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <rect width="18" height="18" x="3" y="4" rx="3" />
                    <path d="M3 10h18" />
                    <path d="M8 14h.01" />
                    <path d="M12 14h.01" />
                    <path d="M16 14h.01" />
                </svg>
            );
        case 'download':
            return (
                <svg {...iconProps}>
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                </svg>
            );
        case 'payments':
            return (
                <svg {...iconProps}>
                    <rect width="18" height="12" x="3" y="6" rx="3" />
                    <path d="M3 10h18" />
                    <path d="M7 15h3" />
                    <path d="M15 15h2" />
                </svg>
            );
        case 'shoppingBag':
            return (
                <svg {...iconProps}>
                    <path d="M6 8h12l-1 12H7L6 8Z" />
                    <path d="M9 8a3 3 0 0 1 6 0" />
                </svg>
            );
        case 'receipt':
            return (
                <svg {...iconProps}>
                    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
                    <path d="M9 8h6" />
                    <path d="M9 12h6" />
                    <path d="M9 16h4" />
                </svg>
            );
        case 'return':
            return (
                <svg {...iconProps}>
                    <path d="m9 10-4 4 4 4" />
                    <path d="M5 14h10a4 4 0 0 0 0-8h-3" />
                    <path d="M17 18h2" />
                </svg>
            );
        case 'globe':
            return (
                <svg {...iconProps}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18" />
                    <path d="M12 3a14 14 0 0 1 0 18" />
                    <path d="M12 3a14 14 0 0 0 0 18" />
                </svg>
            );
        case 'devices':
            return (
                <svg {...iconProps}>
                    <rect width="14" height="10" x="2" y="3" rx="2" />
                    <path d="M12 17v4" />
                    <path d="M8 21h8" />
                    <rect width="6" height="8" x="16" y="13" rx="1.5" />
                </svg>
            );
        case 'trendingUp':
            return (
                <svg {...iconProps}>
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                </svg>
            );
    }
}

function KpiCard({
    label,
    value,
    note,
    icon,
}: {
    label: string;
    value: string;
    note: string;
    icon: AnalyticsIconName;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-[#0d141b] dark:text-white truncate" title={value}>{value}</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#d41132]/10 text-[#d41132]">
                    <AnalyticsIcon name={icon} />
                </span>
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed truncate" title={note}>{note}</p>
        </div>
    );
}

export default function AdminAnalyticsPage() {
    const { showToast } = useToast();
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [countries, setCountries] = useState<CustomerCountry[]>([]);
    const [trafficData, setTrafficData] = useState<TrafficStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState<'sales' | 'traffic'>('sales');

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;

    // Re-fetch analytics whenever dates change
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [summaryRes, productsRes, countriesRes, trafficRes] = await Promise.all([
                    fetch(`/api/analytics?type=summary&startDate=${startDate}&endDate=${endDate}`, { cache: 'no-store' }),
                    fetch(`/api/analytics?type=top-products&startDate=${startDate}&endDate=${endDate}`, { cache: 'no-store' }),
                    fetch(`/api/analytics?type=customers-by-country&startDate=${startDate}&endDate=${endDate}`, { cache: 'no-store' }),
                    fetch(`/api/analytics?type=traffic&startDate=${startDate}&endDate=${endDate}`, { cache: 'no-store' }),
                ]);

                const summaryData = await summaryRes.json();
                const productsData = await productsRes.json();
                const countriesData = await countriesRes.json();
                const trafficResponse = await trafficRes.json();

                if (summaryData.success) setSummary(summaryData.data);
                if (productsData.success) setTopProducts(productsData.data);
                if (countriesData.success) setCountries(countriesData.data);
                if (trafficResponse.success) setTrafficData(trafficResponse.data);
            } catch (err) {
                console.error('Failed to load analytics:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [startDate, endDate]);

    const handleExportReport = () => {
        if (loading) {
            showToast('Analytics are still loading', 'warning');
            return;
        }
        if (!summary) {
            showToast('No analytics data available to export', 'warning');
            return;
        }

        setExporting(true);
        try {
            const statusRows = Object.entries(summary.byStatus || {}).map(([status, count]) => [
                statusMeta[status]?.label || status,
                count,
            ]);
            const rows: Array<Array<string | number | null | undefined>> = [
                ['Luxe Leather Co. Analytics Export'],
                ['Date range', formatDate(startDate), formatDate(endDate)],
                ['Generated at', new Date().toLocaleString()],
                [],
                ['Summary', 'Value'],
                ['Total revenue', summary.totalRevenue],
                ['Total orders', summary.totalOrders],
                ['Average order value', summary.avgOrderValue],
                ['Returns / cancelled', summary.totalReturns],
                [],
                ['Order status', 'Orders'],
                ...(statusRows.length > 0 ? statusRows : [['No status data', 0]]),
                [],
                ['Top products', 'Units sold', 'Sales share'],
                ...(topProducts.length > 0
                    ? topProducts.map((product) => [product.name, product.sales, `${product.percentage}%`])
                    : [['No product data', 0, '0%']]),
                [],
                ['Customer geography', 'Customers', 'Customer share'],
                ...(countries.length > 0
                    ? countries.map((country) => [country.country, country.count, `${country.percentage}%`])
                    : [['No geography data', 0, '0%']]),
                [],
                ['Traffic Pageviews', trafficData?.pageViews ?? 0],
                ['Traffic Sessions', trafficData?.uniqueSessions ?? 0],
            ];

            downloadCsv(`luxe-analytics-${startDate}-to-${endDate}.csv`, rows);
            showToast('Analytics export downloaded', 'success');
        } catch (err) {
            console.error('Analytics export failed:', err);
            showToast('Failed to export analytics', 'error');
        } finally {
            setExporting(false);
        }
    };

    // Sales Calculations
    const byStatus = summary?.byStatus || {};
    const totalOrders = summary?.totalOrders || 0;
    const delivered = byStatus.DELIVERED || 0;
    const cancelled = byStatus.CANCELLED || 0;
    const fulfillmentRate = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0;
    const cancellationRate = totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0;
    const maxStatus = Math.max(...Object.values(byStatus), 1);
    const totalProductSales = topProducts.reduce((sum, product) => sum + product.sales, 0);

    const insightItems = useMemo(() => [
        {
            label: 'Fulfillment health',
            value: `${fulfillmentRate}%`,
            note: `${delivered} delivered out of ${totalOrders} orders`,
        },
        {
            label: 'Cancellation pressure',
            value: `${cancellationRate}%`,
            note: `${cancelled} cancelled orders in the dataset`,
        },
        {
            label: 'Product concentration',
            value: `${topProducts[0]?.percentage || 0}%`,
            note: topProducts[0] ? `${topProducts[0].name} leads sales volume` : 'No product sales yet',
        },
    ], [cancelled, cancellationRate, delivered, fulfillmentRate, topProducts, totalOrders]);

    // Traffic Calculations
    const deviceTypeCounts = trafficData?.deviceType || {};
    const maxDeviceCount = Math.max(...Object.values(deviceTypeCounts), 1);
    let topDeviceName = 'Desktop';
    let maxDeviceVal = 0;
    Object.entries(deviceTypeCounts).forEach(([device, count]) => {
        if (count > maxDeviceVal) {
            maxDeviceVal = count;
            topDeviceName = device;
        }
    });

    const hourlyViews = trafficData?.hourlyViews || {};
    const maxHourCount = Math.max(...Object.values(hourlyViews), 1);

    const dailyViews = trafficData?.dailyViews || {};
    const maxDayCount = Math.max(...Object.values(dailyViews), 1);
    const daysLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const eventCounts = trafficData?.events || {};
    const conversionCart = eventCounts['add_to_cart'] || 0;
    const conversionBespoke = eventCounts['bespoke_submit'] || 0;
    const conversionContact = eventCounts['contact_submit'] || 0;

    return (
        <div className="min-h-full bg-[#f6f7f8] text-[#0d141b] dark:bg-[#101922] dark:text-white font-[family-name:var(--font-inter)]">
            <main id="analytics-dashboard" className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 p-4 md:p-6 xl:p-8">
                
                {/* Header Block */}
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632] md:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#c27a2a]">Commercial intelligence</p>
                            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Analytics</h1>
                            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                                Monitor storefront revenue pipelines, evaluate product velocity, and analyze detailed visitor web traffic patterns.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <button
                                    onClick={() => setShowDatePicker((value) => !value)}
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-[#0d141b] shadow-sm hover:border-[#c27a2a] dark:border-white/10 dark:bg-white/5 dark:text-white"
                                >
                                    <AnalyticsIcon name="calendar" className="size-4 shrink-0 text-[#c27a2a]" />
                                    <span>{dateRange}</span>
                                </button>
                                {showDatePicker && (
                                    <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#1a2632]">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Report Range</p>
                                        <div className="mt-4 grid gap-3">
                                            <label className="grid gap-1 text-xs font-bold text-slate-500">
                                                From
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    max={endDate}
                                                    onChange={(event) => setStartDate(event.target.value)}
                                                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#d41132] dark:border-white/10 dark:bg-[#101922] dark:text-white"
                                                />
                                            </label>
                                            <label className="grid gap-1 text-xs font-bold text-slate-500">
                                                To
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    min={startDate}
                                                    max={new Date().toISOString().split('T')[0]}
                                                    onChange={(event) => setEndDate(event.target.value)}
                                                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#d41132] dark:border-white/10 dark:bg-[#101922] dark:text-white"
                                                />
                                            </label>
                                        </div>
                                        <button
                                            onClick={() => setShowDatePicker(false)}
                                            className="mt-4 h-10 w-full rounded-lg bg-[#d41132] text-xs font-black uppercase tracking-widest text-white hover:bg-[#b30f2a]"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleExportReport}
                                disabled={loading || exporting}
                                aria-busy={exporting}
                                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#d41132] px-4 text-sm font-black uppercase tracking-widest text-white shadow-sm hover:bg-[#b30f2a] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-white/10 dark:disabled:text-slate-400"
                            >
                                <AnalyticsIcon name="download" className="size-4 shrink-0" />
                                {exporting ? 'Exporting' : 'Export'}
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-white/10 mt-8 gap-6">
                        <button
                            onClick={() => setActiveTab('sales')}
                            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'sales' ? 'text-[#d41132] border-[#d41132]' : 'text-[#4c739a] dark:text-[#94a3b8] border-transparent hover:text-[#0d141b] dark:hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">insights</span>
                            Sales Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('traffic')}
                            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'traffic' ? 'text-[#d41132] border-[#d41132]' : 'text-[#4c739a] dark:text-[#94a3b8] border-transparent hover:text-[#0d141b] dark:hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">monitoring</span>
                            Web Traffic & Behavior
                        </button>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────────────────────
                    TAB: SALES OVERVIEW
                ───────────────────────────────────────────────────────────────────────────── */}
                {activeTab === 'sales' && (
                    <>
                        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <KpiCard label="Total revenue" value={formatCurrency(summary?.totalRevenue)} note="All paid order totals in analytics dataset" icon="payments" />
                            <KpiCard label="Orders" value={String(summary?.totalOrders ?? 0)} note="Total captured commercial orders" icon="shoppingBag" />
                            <KpiCard label="Average order" value={formatCurrency(summary?.avgOrderValue)} note="Revenue divided by order count" icon="receipt" />
                            <KpiCard label="Returns / cancelled" value={String(summary?.totalReturns ?? 0)} note="Cancelled orders counted as return pressure" icon="return" />
                        </section>

                        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-lg font-black">Order Status Mix</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Real distribution across your fulfillment pipeline.</p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:bg-white/10 dark:text-slate-300">
                                        {loading ? 'Loading' : `${totalOrders} orders`}
                                    </span>
                                </div>
                                <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr] lg:items-center">
                                    <div className="mx-auto grid size-60 place-items-center rounded-full" style={{ background: conicGradient(byStatus) }}>
                                        <div className="grid size-36 place-items-center rounded-full bg-white text-center shadow-inner dark:bg-[#1a2632]">
                                            <div>
                                                <p className="text-3xl font-black">{fulfillmentRate}%</p>
                                                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Delivered</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {Object.entries(byStatus).length > 0 ? Object.entries(byStatus).map(([status, count]) => {
                                            const meta = statusMeta[status] || { label: status, color: '#94a3b8', text: 'text-slate-500' };
                                            const width = `${Math.max(8, (count / maxStatus) * 100)}%`;
                                            return (
                                                <div key={status} className="grid grid-cols-[120px_1fr_48px] items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="size-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                                                        <span className="truncate text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{meta.label}</span>
                                                    </div>
                                                    <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                                        <div className="h-full rounded-full" style={{ width, backgroundColor: meta.color }} />
                                                    </div>
                                                    <span className="text-right text-sm font-black">{count}</span>
                                                </div>
                                            );
                                        }) : (
                                            <p className="text-sm font-medium text-slate-400">No order status data available yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
                                <h2 className="text-lg font-black">Operating Signals</h2>
                                <div className="mt-5 space-y-3">
                                    {insightItems.map((item) => (
                                        <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                                                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{item.note}</p>
                                                </div>
                                                <p className="text-2xl font-black text-[#d41132]">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-black">Top Products</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Sales concentration by quantity.</p>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{totalProductSales} units</span>
                                </div>
                                <div className="mt-6 space-y-5">
                                    {topProducts.length > 0 ? topProducts.map((product, index) => (
                                        <div key={product.id} className="space-y-2">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="grid size-8 place-items-center rounded-lg bg-[#15100c] text-xs font-black text-white">{index + 1}</span>
                                                    <p className="truncate text-sm font-black">{product.name}</p>
                                                </div>
                                                <p className="shrink-0 text-sm font-black">{product.sales} sold</p>
                                            </div>
                                            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                                <div className="h-full rounded-full bg-[#d41132]" style={{ width: `${Math.max(8, product.percentage)}%`, opacity: Math.max(0.45, 1 - index * 0.12) }} />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm font-medium text-slate-400 dark:border-white/10">
                                            {loading ? 'Loading product velocity...' : 'No product sales data available.'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-black">Customer Geography</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Top countries in your customer base.</p>
                                    </div>
                                    <AnalyticsIcon name="globe" className="size-5 shrink-0 text-[#c27a2a]" />
                                </div>
                                <div className="mt-6 grid gap-4">
                                    {countries.length > 0 ? countries.map((country) => (
                                        <div key={country.country} className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{country.flag}</span>
                                                    <div>
                                                        <p className="text-sm font-black">{country.country}</p>
                                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{country.count} customers</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-black">{country.percentage}%</span>
                                            </div>
                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-[#101922]">
                                                <div className="h-full rounded-full bg-[#c27a2a]" style={{ width: `${Math.max(8, country.percentage)}%` }} />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm font-medium text-slate-400 dark:border-white/10">
                                            {loading ? 'Loading customer regions...' : 'No customer geography data available.'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {/* ─────────────────────────────────────────────────────────────────────────────
                    TAB: WEB TRAFFIC & BEHAVIOR
                ───────────────────────────────────────────────────────────────────────────── */}
                {activeTab === 'traffic' && (
                    <>
                        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <KpiCard label="Page Views" value={String(trafficData?.pageViews ?? 0)} note="Total web pages viewed by visitors" icon="globe" />
                            <KpiCard label="Unique Visitors" value={String(trafficData?.uniqueSessions ?? 0)} note="Estimated unique visitor sessions (visits)" icon="receipt" />
                            <KpiCard label="Top viewed page" value={trafficData?.topPages[0]?.path || '/'} note="Most visited page route" icon="shoppingBag" />
                            <KpiCard label="Primary device" value={topDeviceName} note="Most popular device class in range" icon="devices" />
                        </section>

                        {/* Temporal Analytics (Hour of Day & Day of Week) */}
                        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            {/* Hourly Peaks */}
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
                                <h2 className="text-lg font-black">Visitor Time of Day (UTC Peak Hours)</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Track traffic volumes by hour to schedule promotions or server updates.</p>
                                <div className="h-48 flex items-end justify-between gap-1 mt-6 border-b border-slate-100 dark:border-white/5 pb-2 px-1">
                                    {Array.from({ length: 24 }).map((_, hour) => {
                                        const count = hourlyViews[hour] || 0;
                                        const height = `${(count / maxHourCount) * 100}%`;
                                        return (
                                            <div key={hour} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-bold whitespace-nowrap z-10">
                                                    {count} views
                                                </div>
                                                <div className="w-full bg-[#d41132] rounded-t hover:bg-[#b30f2a] transition-all min-h-[2px]" style={{ height }} />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-400 font-black tracking-widest mt-2 px-1">
                                    <span>12 AM</span>
                                    <span>6 AM</span>
                                    <span>12 PM</span>
                                    <span>6 PM</span>
                                    <span>11 PM</span>
                                </div>
                            </div>

                            {/* Day of Week */}
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
                                <h2 className="text-lg font-black">Traffic by Day of Week</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Weekly trends showing which days are best for publishing content.</p>
                                <div className="h-48 flex items-end justify-around gap-2 mt-6 border-b border-slate-100 dark:border-white/5 pb-2 px-2">
                                    {daysLabel.map((label, dayIdx) => {
                                        const count = dailyViews[dayIdx] || 0;
                                        const height = `${(count / maxDayCount) * 100}%`;
                                        return (
                                            <div key={label} className="w-12 flex flex-col items-center group relative h-full justify-end">
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-bold z-10">
                                                    {count} views
                                                </div>
                                                <div className="w-full bg-[#c27a2a] rounded-t hover:bg-[#a8651f] transition-all min-h-[2px]" style={{ height }} />
                                                <span className="text-[10px] text-slate-400 font-bold mt-2">{label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        {/* Geographic & Device Breakdown */}
                        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                            {/* Detailed Location Profiles */}
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632] flex flex-col gap-6">
                                <h2 className="text-lg font-black">Visitor Geography (Geographic Profile)</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Countries */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-[#c27a2a]">Top Countries</h3>
                                        <div className="space-y-3">
                                            {(trafficData?.countries || []).map((c, i) => (
                                                <div key={c.name} className="text-xs">
                                                    <div className="flex justify-between font-bold mb-1">
                                                        <span className="truncate">{i+1}. {c.name}</span>
                                                        <span>{c.count} ({c.percentage}%)</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#c27a2a] rounded-full" style={{ width: `${c.percentage}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                            {(!trafficData?.countries || trafficData.countries.length === 0) && (
                                                <p className="text-xs text-slate-400 font-medium">No visitor country records yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Regions/States */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-[#c27a2a]">Top Regions/States</h3>
                                        <div className="space-y-3">
                                            {(trafficData?.regions || []).map((r, i) => (
                                                <div key={r.name} className="text-xs">
                                                    <div className="flex justify-between font-bold mb-1">
                                                        <span className="truncate">{i+1}. {r.name}</span>
                                                        <span>{r.count} ({r.percentage}%)</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-slate-500 rounded-full" style={{ width: `${r.percentage}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                            {(!trafficData?.regions || trafficData.regions.length === 0) && (
                                                <p className="text-xs text-slate-400 font-medium">No visitor region records yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cities */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-[#c27a2a]">Top Cities</h3>
                                        <div className="space-y-3">
                                            {(trafficData?.cities || []).map((c, i) => (
                                                <div key={c.name} className="text-xs">
                                                    <div className="flex justify-between font-bold mb-1">
                                                        <span className="truncate">{i+1}. {c.name}</span>
                                                        <span>{c.count} ({c.percentage}%)</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#d41132] rounded-full" style={{ width: `${c.percentage}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                            {(!trafficData?.cities || trafficData.cities.length === 0) && (
                                                <p className="text-xs text-slate-400 font-medium">No visitor city records yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Device Breakdown */}
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632] flex flex-col gap-6">
                                <h2 className="text-lg font-black">Device Profile</h2>
                                <div className="space-y-4">
                                    {Object.entries(deviceTypeCounts).map(([device, count]) => {
                                        const pct = trafficData?.pageViews ? Math.round((count / trafficData.pageViews) * 100) : 0;
                                        const width = `${Math.max(8, (count / maxDeviceCount) * 100)}%`;
                                        return (
                                            <div key={device} className="grid grid-cols-[100px_1fr_40px] items-center gap-3">
                                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 truncate">{device}</span>
                                                <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#d41132] rounded-full" style={{ width }} />
                                                </div>
                                                <span className="text-right text-xs font-bold">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                    {Object.keys(deviceTypeCounts).length === 0 && (
                                        <p className="text-xs text-slate-400 font-medium">No device records available.</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Top Pages, Searches, and Conversion Funnels */}
                        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                            {/* Top Viewed Pages */}
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
                                <h2 className="text-lg font-black">Top Pages</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Popular page routes visited by users.</p>
                                <div className="space-y-4">
                                    {(trafficData?.topPages || []).map((page, index) => (
                                        <div key={page.path} className="flex justify-between items-center text-xs font-bold py-2 border-b border-slate-100 dark:border-white/5">
                                            <span className="truncate text-slate-500 font-semibold">{index+1}. {page.path}</span>
                                            <span className="shrink-0">{page.count} views</span>
                                        </div>
                                    ))}
                                    {(!trafficData?.topPages || trafficData.topPages.length === 0) && (
                                        <p className="text-xs text-slate-400 font-medium">No landing page records yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Top Search Queries */}
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
                                <h2 className="text-lg font-black">Top Searches</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Product search queries typed by customers.</p>
                                <div className="space-y-4">
                                    {(trafficData?.topSearches || []).map((search) => (
                                        <div key={search.query} className="flex justify-between items-center text-xs font-bold py-2 border-b border-slate-100 dark:border-white/5">
                                            <span className="truncate text-[#c27a2a]">&quot;{search.query}&quot;</span>
                                            <span className="shrink-0">{search.count} searches</span>
                                        </div>
                                    ))}
                                    {(!trafficData?.topSearches || trafficData.topSearches.length === 0) && (
                                        <p className="text-xs text-slate-400 font-medium">No customer searches recorded yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Conversion Actions Funnel */}
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632] flex flex-col justify-between">
                                <div>
                                    <h2 className="text-lg font-black">User Action Events</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Conversion signals showing user commitment.</p>
                                    <div className="space-y-4 mt-4">
                                        <div className="flex justify-between items-center text-xs font-bold py-2 border-b border-slate-100 dark:border-white/5">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                                                Cart Additions
                                            </span>
                                            <span>{conversionCart} events</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold py-2 border-b border-slate-100 dark:border-white/5">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                                                Bespoke Commissions
                                            </span>
                                            <span>{conversionBespoke} submits</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold py-2 border-b border-slate-100 dark:border-white/5">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
                                                Contact Enquiries
                                            </span>
                                            <span>{conversionContact} submits</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Storefront Action Triggers
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
