'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import type { Order } from '@/lib/supabase';
import AdminOrderModal from '@/components/admin/AdminOrderModal';

interface OrderRow {
    id: string;
    customer_name: string;
    customer_email: string;
    total: number;
    status: Order['status'];
    created_at: string;
    items_count: number;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);

    useEffect(() => {
        loadOrders();
    }, [statusFilter]); // Reload when filter changes if server-side filtering is preferred, but we will filter client side for search

    const loadOrders = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (statusFilter !== 'all') query.append('status', statusFilter);

            const res = await fetch(`/api/orders?${query.toString()}`);
            const data = await res.json();

            if (data.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mapped: OrderRow[] = (data.data || []).map((o: any) => ({
                    id: o.id,
                    customer_name: o.Customer?.name || 'Unknown',
                    customer_email: o.Customer?.email || '',
                    total: Number(o.total),
                    status: o.status,
                    created_at: o.createdAt,
                    items_count: Array.isArray(o.OrderItem) ? o.OrderItem.length :
                        Array.isArray(o.items) ? o.items.length :
                            Array.isArray(o.OrderItems) ? o.OrderItems.length : 0
                }));
                setOrders(mapped);
            } else {
                console.error('Failed to load orders:', data.error);
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();

            if (data.success) {
                await loadOrders();
            } else {
                console.error('Failed to update order status:', data.error);
            }
        } catch (err) {
            console.error('Failed to update order status:', err);
        }
    };

    const handleCreateOrder = async (orderData: any) => {
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            const result = await res.json();

            if (result.success) {
                await loadOrders();
                setIsModalOpen(false);
            } else {
                alert('Failed to create order: ' + (result.error || result.message));
            }
        } catch (error) {
            console.error('Error creating order:', error);
            alert('An error occurred while creating/saving the order');
        }
    };

    const handleDelete = async (orderId: string) => {
        if (!confirm('Are you sure you want to delete this order?')) return;
        try {
            const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                await loadOrders();
            } else {
                console.error('Failed to delete order:', data.error);
            }
        } catch (err) {
            console.error('Failed to delete order:', err);
        }
    };

    const getStatusBadge = (status: Order['status']) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            SHIPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
            </span>
        );
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id.includes(searchQuery);
        // Status filtering is now handled by the API mostly, but if 'all' is fetched we can filter client side too
        // However, since we reload on status change, this check is redundant but safe
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeMenu && !(event.target as Element).closest('.action-menu-trigger')) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeMenu]);

    const handleExport = () => {
        const headers = ['Order ID', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Date'];
        const csvContent = [
            headers.join(','),
            ...filteredOrders.map(order => [
                order.id,
                `"${order.customer_name}"`,
                order.customer_email,
                order.items_count,
                order.total,
                order.status,
                new Date(order.created_at).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const toggleMenu = (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === orderId ? null : orderId);
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] font-[family-name:var(--font-inter)]">
            {/* <AdminSidebar /> removed for layout */}

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
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">download</span>
                                    Export
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#d41132] text-white rounded-lg font-medium text-sm hover:bg-[#b30f2a] transition-colors shadow-sm shadow-red-200 dark:shadow-none">
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
                            <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'all' ? 'bg-[#d41132] text-white shadow-md shadow-red-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                All Orders
                            </button>
                            <button onClick={() => setStatusFilter('PENDING')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'PENDING' ? 'bg-[#d41132] text-white shadow-md shadow-red-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                Pending
                            </button>
                            <button onClick={() => setStatusFilter('PROCESSING')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'PROCESSING' ? 'bg-[#d41132] text-white shadow-md shadow-red-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                Processing
                            </button>
                            <button onClick={() => setStatusFilter('SHIPPED')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'SHIPPED' ? 'bg-[#d41132] text-white shadow-md shadow-red-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                Shipped
                            </button>
                        </div>
                    </div>
                </header>

                {/* Table Section */}
                <div className="flex-1 overflow-auto px-8 py-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[400px] flex flex-col">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d41132]"></div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1">
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
                                            {filteredOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                                        No orders found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredOrders.map((order) => (
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
                                                        <td className="py-4 px-6 text-right relative">
                                                            <button
                                                                onClick={(e) => toggleMenu(order.id, e)}
                                                                className="action-menu-trigger text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined">more_vert</span>
                                                            </button>
                                                            {activeMenu === order.id && (
                                                                <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 action-menu">
                                                                    <button onClick={() => { setSelectedOrder(order); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-lg">visibility</span> View Details
                                                                    </button>
                                                                    <button onClick={() => { const next: Record<string, Order['status']> = { PENDING: 'PROCESSING', PROCESSING: 'SHIPPED', SHIPPED: 'DELIVERED', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED' }; handleStatusChange(order.id, next[order.status] || 'PROCESSING'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-lg">edit</span> Advance Status
                                                                    </button>
                                                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                                                    <button onClick={() => { handleDelete(order.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-lg">delete</span> Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Footer */}
                                <div className="bg-white dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Showing <span className="font-medium text-slate-900 dark:text-white">1</span> to <span className="font-medium text-slate-900 dark:text-white">{filteredOrders.length}</span> of <span className="font-medium text-slate-900 dark:text-white">{orders.length}</span> results
                                    </p>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800" disabled>Previous</button>
                                        <button className="px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800" disabled>Next</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            <AdminOrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateOrder}
            />

            {/* Order Detail Drawer */}
            {selectedOrder && (
                <aside className="fixed top-0 right-0 h-full w-[400px] bg-white dark:bg-[#15202b] shadow-2xl z-50 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out">
                    {/* Drawer Header */}
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex flex-col">
                            <span className="text-xs font-mono text-slate-500 mb-1">#{selectedOrder.id.slice(-8).toUpperCase()}</span>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Details</h3>
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                            {getStatusBadge(selectedOrder.status)}
                            <span className="text-xs text-slate-500">{new Date(selectedOrder.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Customer</h4>
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                                    {selectedOrder.customer_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedOrder.customer_name}</p>
                                    <p className="text-xs text-slate-500">{selectedOrder.customer_email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Summary</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                                    <p className="text-xs text-slate-500">Items</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedOrder.items_count}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                                    <p className="text-xs text-slate-500">Total</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">${selectedOrder.total.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Status Timeline */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Flow</h4>
                            <div className="flex items-center gap-1">
                                {(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as Order['status'][]).map((s, i) => {
                                    const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
                                    const currentIdx = statuses.indexOf(selectedOrder.status);
                                    const isActive = i <= currentIdx;
                                    return (
                                        <div key={s} className="flex items-center flex-1">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-[#d41132]' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                            {i < 3 && <div className={`h-[2px] flex-1 ${i < currentIdx ? 'bg-[#d41132]' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between">
                                {['Pending', 'Processing', 'Shipped', 'Delivered'].map((s) => (
                                    <span key={s} className="text-[9px] text-slate-400">{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Drawer Actions */}
                    <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15202b] flex flex-col gap-3">
                        <button
                            onClick={() => {
                                const next: Record<string, Order['status']> = { PENDING: 'PROCESSING', PROCESSING: 'SHIPPED', SHIPPED: 'DELIVERED', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED' };
                                handleStatusChange(selectedOrder.id, next[selectedOrder.status] || 'PROCESSING');
                                setSelectedOrder(null);
                            }}
                            disabled={selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'CANCELLED'}
                            className="w-full flex items-center justify-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[20px]">forward</span>
                            Advance Status
                        </button>
                        <button
                            onClick={() => { if (confirm('Delete this order?')) { handleDelete(selectedOrder.id); setSelectedOrder(null); } }}
                            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-red-300 text-red-600 font-medium py-2.5 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                            Delete Order
                        </button>
                    </div>
                </aside>
            )}
        </div>
    );
}
