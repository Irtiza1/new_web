'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface Order {
    id: string;
    customer_name: string;
    customer_email: string;
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string;
    items_count: number;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            // Mock data for now - will connect to Supabase later
            const mockOrders: Order[] = [
                {
                    id: '1',
                    customer_name: 'John Smith',
                    customer_email: 'john@example.com',
                    total: 495.00,
                    status: 'processing',
                    created_at: new Date().toISOString(),
                    items_count: 2
                },
                {
                    id: '2',
                    customer_name: 'Sarah Johnson',
                    customer_email: 'sarah@example.com',
                    total: 325.00,
                    status: 'shipped',
                    created_at: new Date().toISOString(),
                    items_count: 1
                },
                {
                    id: '3',
                    customer_name: 'Mike Davis',
                    customer_email: 'mike@example.com',
                    total: 185.00,
                    status: 'delivered',
                    created_at: new Date().toISOString(),
                    items_count: 1
                }
            ];
            setOrders(mockOrders);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: Order['status']) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id.includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] font-[family-name:var(--font-inter)]">
            <AdminSidebar />

            {/* Main Content */}
            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="w-full px-8 py-6 flex flex-col gap-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                    {/* Breadcrumbs & Title Row */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Link href="/admin" className="hover:text-[#d41132] transition-colors">Home</Link>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                            <span className="text-slate-900 dark:text-white font-medium">Orders</span>
                        </div>
                        <div className="flex justify-between items-end flex-wrap gap-4">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Order Management</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">View and manage all customer orders.</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <span className="material-symbols-outlined text-lg">download</span>
                                    Export
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#d41132] text-white rounded-lg font-medium text-sm hover:bg-[#b30f2a] transition-colors shadow-sm shadow-red-200 dark:shadow-none">
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    New Order
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Filters & Search Row */}
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                        {/* Search */}
                        <div className="relative w-full lg:w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400">search</span>
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d41132]/50 text-sm transition-all"
                                placeholder="Search by order ID, customer name, or email..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {/* Status Filters */}
                        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                            <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                All Orders
                            </button>
                            <button onClick={() => setStatusFilter('pending')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'pending' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                Pending
                            </button>
                            <button onClick={() => setStatusFilter('processing')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'processing' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                Processing
                            </button>
                            <button onClick={() => setStatusFilter('shipped')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'shipped' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                Shipped
                            </button>
                        </div>
                    </div>
                </header>

                {/* Table Section */}
                <div className="flex-1 overflow-auto px-8 py-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d41132]"></div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order ID</th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Items</th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">#{order.id}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <p className="font-medium text-slate-900 dark:text-white text-sm">{order.customer_name}</p>
                                                    <p className="text-xs text-slate-400">{order.customer_email}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm text-slate-600 dark:text-slate-300">{order.items_count} items</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">${order.total.toFixed(2)}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                {getStatusBadge(order.status)}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">{new Date(order.created_at).toLocaleDateString()}</span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                    <span className="material-symbols-outlined">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {/* Pagination Footer */}
                        <div className="bg-white dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Showing <span className="font-medium text-slate-900 dark:text-white">1</span> to <span className="font-medium text-slate-900 dark:text-white">{filteredOrders.length}</span> of <span className="font-medium text-slate-900 dark:text-white">{orders.length}</span> results
                            </p>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800" disabled>Previous</button>
                                <button className="px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
