'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';


export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        pendingRequests: 0,
        byStatus: {} as Record<string, number>
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [analyticsRes, customersRes, requestsRes] = await Promise.all([
                    fetch('/api/analytics?type=summary'),
                    fetch('/api/customers?limit=1'),
                    fetch('/api/requests?status=NEW&limit=1')
                ]);

                const analyticsData = await analyticsRes.json();
                const customersData = await customersRes.json();
                const requestsData = await requestsRes.json();

                setStats({
                    totalRevenue: analyticsData.success ? analyticsData.data.totalRevenue : 0,
                    totalOrders: analyticsData.success ? analyticsData.data.totalOrders : 0,
                    totalCustomers: customersData.success ? customersData.pagination.total : 0,
                    pendingRequests: requestsData.success ? requestsData.pagination.total : 0,
                    byStatus: analyticsData.success ? analyticsData.data.byStatus : {}
                });

                // Fetch recent activity
                const [ordersListRes, requestsListRes] = await Promise.all([
                    fetch('/api/orders?limit=3'),
                    fetch('/api/requests?limit=3')
                ]);
                const ordersListData = await ordersListRes.json();
                const requestsListData = await requestsListRes.json();

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

    return (
        <div className="flex min-h-screen w-full bg-[#f6f7f8] dark:bg-[#0d141b] font-[family-name:var(--font-inter)]">


            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="bg-white dark:bg-[#1a2632] border-b border-[#e5e7eb] dark:border-[#2d3b4a] px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-[#0d141b] dark:text-[#f3f4f6]">Admin Dashboard</h1>
                            <p className="text-[#4c739a] dark:text-[#94a3b8] mt-1">Welcome back! Here's your overview.</p>
                        </div>
                        <Link href="/" className="px-4 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white rounded-lg font-medium transition-colors">
                            View Storefront
                        </Link>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="material-symbols-outlined text-[#d41132] text-3xl">payments</span>
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">+12%</span>
                                </div>
                                <h3 className="text-2xl font-bold text-[#0d141b] dark:text-white">${stats.totalRevenue.toLocaleString()}</h3>
                                <p className="text-sm text-[#4c739a] dark:text-[#94a3b8] mt-1">Total Revenue</p>
                            </div>

                            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="material-symbols-outlined text-[#d41132] text-3xl">shopping_bag</span>
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">+5%</span>
                                </div>
                                <h3 className="text-2xl font-bold text-[#0d141b] dark:text-white">{stats.totalOrders}</h3>
                                <p className="text-sm text-[#4c739a] dark:text-[#94a3b8] mt-1">Total Orders</p>
                            </div>

                            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="material-symbols-outlined text-[#d41132] text-3xl">group</span>
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">+8%</span>
                                </div>
                                <h3 className="text-2xl font-bold text-[#0d141b] dark:text-white">{stats.totalCustomers}</h3>
                                <p className="text-sm text-[#4c739a] dark:text-[#94a3b8] mt-1">Total Customers</p>
                            </div>

                            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="material-symbols-outlined text-[#d41132] text-3xl">inbox</span>
                                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">Pending</span>
                                </div>
                                <h3 className="text-2xl font-bold text-[#0d141b] dark:text-white">{stats.pendingRequests}</h3>
                                <p className="text-sm text-[#4c739a] dark:text-[#94a3b8] mt-1">Custom Requests</p>
                            </div>
                        </div>

                        {/* Middle Section: Chart and Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Revenue Chart */}
                            <div className="lg:col-span-2 bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-[#0d141b] dark:text-white">Order Distribution</h3>
                                    <Link href="/admin/analytics" className="text-xs font-bold text-[#d41132] hover:underline">View Full Analytics</Link>
                                </div>
                                <div className="h-[240px] flex items-end justify-around gap-4 pb-2">
                                    {Object.entries(stats.byStatus).length > 0 ? Object.entries(stats.byStatus).map(([status, count]) => {
                                        const vals = Object.values(stats.byStatus);
                                        const max = vals.length > 0 ? Math.max(...vals) : 0;
                                        const height = max > 0 ? (count / max) * 100 : 0;
                                        const colors: Record<string, string> = {
                                            PENDING: 'bg-amber-400',
                                            PROCESSING: 'bg-blue-400',
                                            SHIPPED: 'bg-purple-400',
                                            DELIVERED: 'bg-emerald-400',
                                            CANCELLED: 'bg-red-400',
                                        };
                                        return (
                                            <div key={status} className="flex-1 flex flex-col items-center gap-2 group relative">
                                                <div className="absolute -top-8 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {count} orders
                                                </div>
                                                <div 
                                                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-1000 ${colors[status] || 'bg-gray-400'}`}
                                                    style={{ height: `${height}%`, minHeight: '10%' }}
                                                />
                                                <span className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] truncate w-full text-center">{status}</span>
                                            </div>
                                        );
                                    }) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 italic">No order data available</div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-[#0d141b] dark:text-white mb-6">Recent Activity</h3>
                                <div className="space-y-6">
                                    {[...recentOrders.map(o => ({ ...o, type: 'ORDER' })), ...recentRequests.map(r => ({ ...r, type: 'REQUEST', customer_name: r.name }))]
                                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                        .slice(0, 5)
                                        .map((item, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className={`mt-1 size-2 rounded-full flex-shrink-0 ${item.type === 'ORDER' ? 'bg-emerald-500' : 'bg-[#d41132]'}`} />
                                                <div>
                                                    <p className="text-sm font-bold text-[#0d141b] dark:text-white">
                                                        {item.type === 'ORDER' ? `New Order #${item.id.slice(0, 8)}` : `Bespoke: ${item.itemType || item.subject}`}
                                                    </p>
                                                    <p className="text-xs text-[#4c739a] dark:text-[#94a3b8]">
                                                        {item.type === 'ORDER' ? `$${item.total} • ${item.status}` : `${item.customer_name} • ${item.status}`}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Link href="/admin/orders" className="group bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm hover:shadow-md hover:border-[#d41132] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#d41132]/10 p-3 rounded-lg">
                                        <span className="material-symbols-outlined text-[#d41132] text-2xl">list_alt</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#0d141b] dark:text-white group-hover:text-[#d41132] transition-colors">Manage Orders</h3>
                                        <p className="text-sm text-[#4c739a] dark:text-[#94a3b8]">View and process orders</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/admin/customers" className="group bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm hover:shadow-md hover:border-[#d41132] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#d41132]/10 p-3 rounded-lg">
                                        <span className="material-symbols-outlined text-[#d41132] text-2xl">group</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#0d141b] dark:text-white group-hover:text-[#d41132] transition-colors">Customer CRM</h3>
                                        <p className="text-sm text-[#4c739a] dark:text-[#94a3b8]">Manage customer data</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/admin/requests" className="group bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm hover:shadow-md hover:border-[#d41132] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#d41132]/10 p-3 rounded-lg">
                                        <span className="material-symbols-outlined text-[#d41132] text-2xl">inbox</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#0d141b] dark:text-white group-hover:text-[#d41132] transition-colors">Custom Requests</h3>
                                        <p className="text-sm text-[#4c739a] dark:text-[#94a3b8]">Review bespoke orders</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/admin/analytics" className="group bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm hover:shadow-md hover:border-[#d41132] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#d41132]/10 p-3 rounded-lg">
                                        <span className="material-symbols-outlined text-[#d41132] text-2xl">bar_chart</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#0d141b] dark:text-white group-hover:text-[#d41132] transition-colors">Analytics</h3>
                                        <p className="text-sm text-[#4c739a] dark:text-[#94a3b8]">View sales reports</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/admin/cms" className="group bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm hover:shadow-md hover:border-[#c27a2a] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#c27a2a]/10 p-3 rounded-lg">
                                        <span className="material-symbols-outlined text-[#c27a2a] text-2xl">auto_stories</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#0d141b] dark:text-white group-hover:text-[#c27a2a] transition-colors">Storefront CMS</h3>
                                        <p className="text-sm text-[#4c739a] dark:text-[#94a3b8]">Manage page headings & text</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/admin/settings" className="group bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-[#2d3b4a] p-6 shadow-sm hover:shadow-md hover:border-[#d41132] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#d41132]/10 p-3 rounded-lg">
                                        <span className="material-symbols-outlined text-[#d41132] text-2xl">settings</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#0d141b] dark:text-white group-hover:text-[#d41132] transition-colors">Settings</h3>
                                        <p className="text-sm text-[#4c739a] dark:text-[#94a3b8]">Platform configuration</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
