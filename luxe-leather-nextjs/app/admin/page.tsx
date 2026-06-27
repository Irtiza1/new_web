'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { SVGProps } from 'react';
import { Order, CustomRequest } from '@/lib/supabase';

type DashboardStats = {
    totalRevenue: number;
    totalLosses: number;
    totalOrders: number;
    totalCustomers: number;
    pendingRequests: number;
    byStatus: Record<string, number>;
};

const initialStats: DashboardStats = {
    totalRevenue: 0,
    totalLosses: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingRequests: 0,
    byStatus: {},
};

const statusStyles: Record<string, { dot: string; bar: string; label: string }> = {
    PENDING: { dot: 'bg-amber-500', bar: 'bg-amber-500', label: 'Pending' },
    PROCESSING: { dot: 'bg-sky-500', bar: 'bg-sky-500', label: 'Processing' },
    SHIPPED: { dot: 'bg-indigo-500', bar: 'bg-indigo-500', label: 'Shipped' },
    DELIVERED: { dot: 'bg-emerald-500', bar: 'bg-emerald-500', label: 'Delivered' },
    CANCELLED: { dot: 'bg-red-500', bar: 'bg-red-500', label: 'Cancelled' },
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value || 0);
}

function formatTime(value?: string) {
    if (!value) return 'Recently';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function statusLabel(status?: string | null) {
    if (!status) return 'Unknown';
    return statusStyles[status]?.label || status.replace(/_/g, ' ').toLowerCase();
}

type DashboardIconName =
    | 'arrowRight'
    | 'badge'
    | 'briefcase'
    | 'customerBadge'
    | 'downloadList'
    | 'globeStore'
    | 'image'
    | 'inbox'
    | 'inventory'
    | 'monitoring'
    | 'payments'
    | 'settings'
    | 'shoppingBag'
    | 'users';

function DashboardIcon({ name, className = 'size-5' }: { name: DashboardIconName; className?: string }) {
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
        case 'arrowRight':
            return (
                <svg {...iconProps}>
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                </svg>
            );
        case 'badge':
            return (
                <svg {...iconProps}>
                    <path d="M8 7V5a4 4 0 0 1 8 0v2" />
                    <rect width="18" height="14" x="3" y="7" rx="2" />
                    <path d="M9 13h6" />
                    <path d="M9 17h3" />
                </svg>
            );
        case 'briefcase':
            return (
                <svg {...iconProps}>
                    <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
                    <rect width="18" height="13" x="3" y="7" rx="2" />
                    <path d="M3 12h18" />
                    <path d="M10 12v2h4v-2" />
                </svg>
            );
        case 'customerBadge':
            return (
                <svg {...iconProps}>
                    <rect width="18" height="14" x="3" y="5" rx="2" />
                    <circle cx="9" cy="11" r="2" />
                    <path d="M6.5 16a3.5 3.5 0 0 1 5 0" />
                    <path d="M14 10h4" />
                    <path d="M14 14h3" />
                </svg>
            );
        case 'downloadList':
            return (
                <svg {...iconProps}>
                    <path d="M8 5h10" />
                    <path d="M8 12h10" />
                    <path d="M8 19h10" />
                    <path d="M3 5h.01" />
                    <path d="M3 12h.01" />
                    <path d="M3 19h.01" />
                </svg>
            );
        case 'globeStore':
            return (
                <svg {...iconProps}>
                    <path d="M4 10h16l-1.5-5h-13L4 10Z" />
                    <path d="M5 10v9h14v-9" />
                    <path d="M9 19v-5h6v5" />
                </svg>
            );
        case 'image':
            return (
                <svg {...iconProps}>
                    <rect width="18" height="16" x="3" y="4" rx="2" />
                    <circle cx="9" cy="10" r="2" />
                    <path d="m21 16-5-5L5 20" />
                </svg>
            );
        case 'inbox':
            return (
                <svg {...iconProps}>
                    <path d="M4 4h16l-2 12H6L4 4Z" />
                    <path d="M6 16a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3" />
                </svg>
            );
        case 'inventory':
            return (
                <svg {...iconProps}>
                    <path d="M4 7h16" />
                    <path d="M5 7l1 13h12l1-13" />
                    <path d="M8 4h8l1 3H7l1-3Z" />
                    <path d="M9 12h6" />
                </svg>
            );
        case 'monitoring':
            return (
                <svg {...iconProps}>
                    <path d="M4 19V5" />
                    <path d="M4 19h16" />
                    <path d="m7 15 4-4 3 3 5-7" />
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
        case 'settings':
            return (
                <svg {...iconProps}>
                    <path d="M4 7h10" />
                    <path d="M18 7h2" />
                    <path d="M4 17h2" />
                    <path d="M10 17h10" />
                    <circle cx="16" cy="7" r="2" />
                    <circle cx="8" cy="17" r="2" />
                </svg>
            );
        case 'shoppingBag':
            return (
                <svg {...iconProps}>
                    <path d="M6 8h12l-1 12H7L6 8Z" />
                    <path d="M9 8a3 3 0 0 1 6 0" />
                </svg>
            );
        case 'users':
            return (
                <svg {...iconProps}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                    <circle cx="9.5" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            );
    }
}

function MetricCard({
    icon,
    label,
    value,
    detail,
    tone = 'red',
}: {
    icon: DashboardIconName;
    label: string;
    value: string;
    detail: string;
    tone?: 'red' | 'gold' | 'green' | 'blue';
}) {
    const tones = {
        red: 'bg-[#d41132]/10 text-[#d41132]',
        gold: 'bg-[#c27a2a]/10 text-[#a35508]',
        green: 'bg-emerald-500/10 text-emerald-600',
        blue: 'bg-sky-500/10 text-sky-600',
    };

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
            <div className="flex items-start justify-between gap-4">
                <div className={`grid size-11 place-items-center rounded-lg ${tones[tone]}`}>
                    <DashboardIcon name={icon} />
                </div>
                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-white/10">
                    Live
                </span>
            </div>
            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-[#0d141b] dark:text-white">{value}</p>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>(initialStats);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [recentRequests, setRecentRequests] = useState<CustomRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                const [analyticsRes, customersRes, requestsRes, ordersListRes, requestsListRes] = await Promise.all([
                    fetch('/api/analytics?type=summary', { cache: 'no-store' }),
                    fetch('/api/customers?limit=1', { cache: 'no-store' }),
                    fetch('/api/requests?status=NEW&limit=1', { cache: 'no-store' }),
                    fetch('/api/orders?limit=5', { cache: 'no-store' }),
                    fetch('/api/requests?limit=5', { cache: 'no-store' }),
                ]);

                const analyticsData = await analyticsRes.json();
                const customersData = await customersRes.json();
                const requestsData = await requestsRes.json();
                const ordersListData = await ordersListRes.json();
                const requestsListData = await requestsListRes.json();

                setStats({
                    totalRevenue: analyticsData.success ? analyticsData.data.totalRevenue : 0,
                    totalLosses: analyticsData.success ? analyticsData.data.totalLosses : 0,
                    totalOrders: analyticsData.success ? analyticsData.data.totalOrders : 0,
                    totalCustomers: customersData.success ? customersData.pagination.total : 0,
                    pendingRequests: requestsData.success ? requestsData.pagination.total : 0,
                    byStatus: analyticsData.success ? analyticsData.data.byStatus : {},
                });

                if (ordersListData.success) setRecentOrders(ordersListData.data);
                if (requestsListData.success) setRecentRequests(requestsListData.data);
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const avgOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;
    const deliveredOrders = stats.byStatus.DELIVERED || 0;
    const fulfillmentRate = stats.totalOrders > 0 ? Math.round((deliveredOrders / stats.totalOrders) * 100) : 0;
    const maxStatusCount = Math.max(...Object.values(stats.byStatus), 1);

    const queueItems = useMemo(() => [
        {
            label: 'Orders awaiting action',
            value: (stats.byStatus.PENDING || 0) + (stats.byStatus.PROCESSING || 0),
            href: '/admin/orders',
            icon: 'downloadList' as DashboardIconName,
        },
        {
            label: 'Bespoke requests to review',
            value: stats.pendingRequests,
            href: '/admin/requests',
            icon: 'inbox' as DashboardIconName,
        },
        {
            label: 'Customers in CRM',
            value: stats.totalCustomers,
            href: '/admin/customers',
            icon: 'users' as DashboardIconName,
        },
    ], [stats]);

    return (
        <div className="min-h-full bg-[#f6f7f8] text-[#0d141b] dark:bg-[#101922] dark:text-white">
            <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 p-4 md:p-6 xl:p-8">
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632] md:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#c27a2a]">Operations command</p>
                            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Dashboard</h1>
                            <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                                A focused view of revenue, fulfillment pressure, customer activity, and bespoke work waiting for attention.
                            </p>
                        </div>
                        <div className="flex w-full flex-wrap gap-2 sm:w-auto lg:justify-end">
                            <Link href="/admin/orders" className="inline-flex h-9 min-w-[132px] items-center justify-center gap-2 rounded-lg bg-[#d41132] px-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-sm hover:bg-[#b30f2a]">
                                <DashboardIcon name="downloadList" className="size-4 shrink-0" />
                                Orders
                            </Link>
                            <Link href="/" className="inline-flex h-9 min-w-[132px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-[0.16em] text-[#0d141b] hover:border-[#c27a2a] dark:border-white/10 dark:bg-white/5 dark:text-white">
                                <DashboardIcon name="globeStore" className="size-4 shrink-0" />
                                Storefront
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
                    <MetricCard icon="payments" label="Revenue" value={formatCurrency(stats.totalRevenue)} detail={`${stats.totalOrders} total orders recorded`} />
                    <MetricCard icon="shoppingBag" label="Orders" value={String(stats.totalOrders)} detail={`${fulfillmentRate}% delivered fulfillment mix`} tone="blue" />
                    <MetricCard icon="monitoring" label="Average Order" value={formatCurrency(avgOrderValue)} detail="Revenue divided by order count" tone="gold" />
                    <MetricCard icon="inbox" label="Open Requests" value={String(stats.pendingRequests)} detail="Custom requests marked new" tone="green" />
                    <MetricCard icon="badge" label="Replacement Loss" value={formatCurrency(stats.totalLosses)} detail="Cost of replaced items" tone="red" />
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-black">Fulfillment Mix</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Order volume by current status.</p>
                            </div>
                            <Link href="/admin/analytics" className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-[#d41132] hover:underline">
                                Full analytics
                                <DashboardIcon name="arrowRight" className="size-4 shrink-0" />
                            </Link>
                        </div>
                        <div className="mt-6 space-y-4">
                            {Object.entries(stats.byStatus).length > 0 ? Object.entries(stats.byStatus).map(([status, count]) => {
                                const style = statusStyles[status] || { dot: 'bg-slate-400', bar: 'bg-slate-400', label: statusLabel(status) };
                                const width = `${Math.max(8, (count / maxStatusCount) * 100)}%`;
                                return (
                                    <div key={status} className="grid grid-cols-[120px_1fr_48px] items-center gap-3">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className={`size-2.5 rounded-full ${style.dot}`} />
                                            <span className="truncate text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{style.label}</span>
                                        </div>
                                        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                            <div className={`h-full rounded-full ${style.bar}`} style={{ width }} />
                                        </div>
                                        <span className="text-right text-sm font-black">{count}</span>
                                    </div>
                                );
                            }) : (
                                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm font-medium text-slate-400 dark:border-white/10">
                                    {loading ? 'Loading order mix...' : 'No order data available yet.'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-[#15100c] p-5 text-white shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#c27a2a]">Action Queue</p>
                        <div className="mt-5 space-y-3">
                            {queueItems.map((item) => (
                                <Link key={item.label} href={item.href} className="group flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:border-[#c27a2a]/70 hover:bg-white/10">
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-[#c27a2a]">
                                            <DashboardIcon name={item.icon} />
                                        </span>
                                        <span className="text-sm font-bold text-white/80">{item.label}</span>
                                    </div>
                                    <span className="text-2xl font-black">{item.value}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black">Recent Orders</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Latest commercial activity.</p>
                            </div>
                            <Link href="/admin/orders" className="text-xs font-black uppercase tracking-widest text-[#d41132] hover:underline">Manage</Link>
                        </div>
                        <div className="mt-5 divide-y divide-slate-100 dark:divide-white/10">
                            {recentOrders.length > 0 ? recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between gap-4 py-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black">{order.order_number || `Order ${String(order.id).slice(0, 8)}`}</p>
                                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{formatTime(order.createdAt)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black">{formatCurrency(Number(order.total || 0))}</p>
                                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{statusLabel(order.status)}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="py-8 text-center text-sm font-medium text-slate-400">{loading ? 'Loading orders...' : 'No recent orders.'}</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2632]">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black">Bespoke Requests</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Custom project leads needing follow-up.</p>
                            </div>
                            <Link href="/admin/requests" className="text-xs font-black uppercase tracking-widest text-[#d41132] hover:underline">Review</Link>
                        </div>
                        <div className="mt-5 divide-y divide-slate-100 dark:divide-white/10">
                            {recentRequests.length > 0 ? recentRequests.map((request) => (
                                <div key={request.id} className="flex items-center justify-between gap-4 py-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black">{request.name || 'Unnamed customer'}</p>
                                        <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{request.itemType || 'Custom leather project'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black uppercase tracking-widest text-[#c27a2a]">{request.status}</p>
                                        <p className="mt-1 text-xs text-slate-400">{formatTime(request.createdAt)}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="py-8 text-center text-sm font-medium text-slate-400">{loading ? 'Loading requests...' : 'No recent requests.'}</p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { title: 'Products', detail: 'Inventory', href: '/admin/products', icon: 'inventory' as DashboardIconName },
                        { title: 'Customers', detail: 'Profiles', href: '/admin/customers', icon: 'customerBadge' as DashboardIconName },
                        { title: 'Media', detail: 'Assets', href: '/admin/media', icon: 'image' as DashboardIconName },
                        { title: 'Settings', detail: 'Identity', href: '/admin/settings', icon: 'settings' as DashboardIconName },
                    ].map((item) => (
                        <Link key={item.href} href={item.href} className="group min-h-20 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#c27a2a] hover:shadow-md dark:border-white/10 dark:bg-[#1a2632]">
                            <div className="flex h-full items-center gap-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-[#c27a2a]/10 group-hover:text-[#a35508] dark:bg-white/10">
                                    <DashboardIcon name={item.icon} className="size-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-black leading-tight">{item.title}</p>
                                    <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{item.detail}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </section>
            </main>
        </div>
    );
}
