'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';

import { useToast } from '@/contexts/ToastContext';
import type { Order } from '@/lib/supabase';
import AdminOrderModal from '@/components/admin/AdminOrderModal';
import ConfirmModal from '@/components/admin/ConfirmModal';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';
import { displayOrderNumber } from '@/lib/utils/orderNumber';

interface OrderRow {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    total: number;
    status: Order['status'];
    created_at: string;
    items_count: number;
}

interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
    variant?: string;
    products?: {
        name: string;
        image?: string;
    };
}

interface FullOrder extends OrderRow {
    order_items: OrderItem[];
    notes?: string;
    subtotal?: number;
    shipping?: number;
    customers?: {
        name: string;
        email: string;
        phone?: string;
        address?: string;
        city?: string;
        country?: string;
    };
}

export default function AdminOrdersPage() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [fullOrder, setFullOrder] = useState<FullOrder | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const loadOrders = useCallback(async () => {
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
                    order_number: displayOrderNumber(o),
                    customer_name: o.customers?.name || 'Unknown',
                    customer_email: o.customers?.email || '',
                    total: Number(o.total),
                    status: o.status,
                    created_at: o.created_at || o.createdAt,
                    items_count: Array.isArray(o.order_items) ? o.order_items.length :
                        Array.isArray(o.items) ? o.items.length : 0
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
    }, [statusFilter]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Fetch full order details when an order is selected
    useEffect(() => {
        if (!selectedOrderId) {
            setFullOrder(null);
            return;
        }
        setLoadingDetail(true);
        fetch(`/api/orders/${selectedOrderId}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const o: any = data.data;
                    setFullOrder({
                        id: o.id,
                        order_number: displayOrderNumber(o),
                        customer_name: o.customers?.name || 'Unknown',
                        customer_email: o.customers?.email || '',
                        total: Number(o.total),
                        subtotal: o.subtotal != null ? Number(o.subtotal) : undefined,
                        shipping: o.shipping != null ? Number(o.shipping) : undefined,
                        status: o.status,
                        created_at: o.created_at || o.createdAt,
                        items_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
                        order_items: o.order_items || [],
                        notes: o.notes,
                        customers: o.customers,
                    });
                } else {
                    showToast('Failed to load order details', 'error');
                }
            })
            .catch(() => showToast('Failed to load order details', 'error'))
            .finally(() => setLoadingDetail(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOrderId]);

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
                const orderNumber = orders.find(o => o.id === orderId)?.order_number || orderId.slice(-8).toUpperCase();
                showToast(`Order ${orderNumber} moved to ${newStatus}.`, 'success');
                // Refresh detail panel if open
                if (selectedOrderId === orderId) {
                    setSelectedOrderId(null);
                    setTimeout(() => setSelectedOrderId(orderId), 50);
                }
            } else {
                showToast(`Failed to update order.`, 'error');
            }
        } catch (err) {
            console.error('Failed to update order status:', err);
            showToast('An error occurred while updating the order status.', 'error');
        }
    };

    const handleCreateOrder = async (orderData: Partial<Order>) => {
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
                showToast(`Order created successfully.`, 'success');
            } else {
                showToast('Failed to create order: ' + (result.error || result.message), 'error');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            showToast('An error occurred while creating/saving the order', 'error');
        }
    };



    const toggleSelectAll = () => {
        const visibleIds = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(o => o.id);
        const allVisibleSelected = visibleIds.every(id => selectedIds.has(id));

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleIds.forEach(id => next.delete(id));
            } else {
                visibleIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getStatusBadge = (status: Order['status']) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            SHIPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
            CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
            REPLACED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
        };

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
            </span>
        );
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            const target = event.target as Element;
            if (activeMenu && !target.closest('.action-menu-trigger') && !target.closest('.action-menu')) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeMenu]);

    const handleExport = () => {
        const headers = ['Order Number', 'UUID', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Date'];
        const csvContent = [
            headers.join(','),
            ...filteredOrders.map(order => [
                order.order_number,
                order.id,
                `"${order.customer_name}"`,
                order.customer_email,
                order.items_count,
                order.total,
                order.status,
                new Date(order.created_at + (order.created_at.includes('Z') || order.created_at.includes('+') ? '' : 'Z')).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
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
        <AdminPageLayout
            title="Order Management"
            subtitle="View and manage all customer orders."
            stats={
                <>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total Orders</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{orders.filter(o => o.status !== 'CANCELLED').length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Pending</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{orders.filter(o => o.status === 'PENDING').length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Cancelled</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{orders.filter(o => o.status === 'CANCELLED').length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Revenue</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">${orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'REPLACED').reduce((sum, o) => sum + o.total, 0).toFixed(2)}</p>
                    </div>
                </>
            }
            actions={
                <>
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
                </>
            }
            filters={
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 w-full">
                    {/* Search */}
                    <div className="relative w-full lg:w-96 shrink-0 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400">search</span>
                        </div>
                        <input
                            className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d41132]/50 text-sm transition-all"
                            placeholder="Search by order number, customer name, or email..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Status Filters */}
                    <div className="flex-1 w-full overflow-x-auto flex lg:justify-end hide-scrollbar">
                        <AdminFilterTabs
                            tabs={[
                                { label: 'All Orders', value: 'all' },
                                { label: 'Pending', value: 'PENDING' },
                                { label: 'Processing', value: 'PROCESSING' },
                                { label: 'Shipped', value: 'SHIPPED' },
                                { label: 'Delivered', value: 'DELIVERED' },
                                { label: 'Replaced', value: 'REPLACED' },
                                { label: 'Cancelled', value: 'CANCELLED' },
                            ]}
                            activeTab={statusFilter}
                            onTabChange={setStatusFilter}
                        />
                    </div>
                </div>
            }
            pagination={
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filteredOrders.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(val) => {
                        setItemsPerPage(val);
                        setCurrentPage(1);
                    }}
                />
            }
            bulkActions={
                <AdminBulkActionsBar
                    selectedCount={selectedIds.size}
                    onCancel={() => setSelectedIds(new Set())}
                    onSelectAll={toggleSelectAll}
                    isDeleting={isBulkDeleting}
                />
            }
        >
            <AdminTable
                headers={['Order', 'Customer', 'Items', 'Total', 'Status', 'Date', '']}
                onSelectAll={toggleSelectAll}
                isAllSelected={filteredOrders.length > 0 && filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(o => selectedIds.has(o.id))}
            >
                {loading ? (
                    <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                            <div className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                Loading orders...
                            </div>
                        </td>
                    </tr>
                ) : filteredOrders.length === 0 ? (
                    <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                            No orders found.
                        </td>
                    </tr>
                ) : (
                    filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order) => (
                        <tr key={order.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(order.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                            <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
                                    checked={selectedIds.has(order.id)}
                                    onChange={() => toggleSelect(order.id)}
                                />
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex flex-col">
                                    <span className="text-sm font-mono font-black text-[#d41132]" title={order.id}>{order.order_number}</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5">ID: {order.id.slice(0, 8)}…</span>
                                </div>
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex flex-col gap-1">
                                    <p className="font-medium text-slate-900 dark:text-white text-sm">{order.customer_name}</p>
                                    <p className="text-xs text-slate-400">{order.customer_email}</p>
                                </div>
                            </td>
                            <td className="py-4 px-6">
                                <span className="text-sm text-slate-600 dark:text-slate-300">{order.items_count} item{order.items_count !== 1 ? 's' : ''}</span>
                            </td>
                            <td className="py-4 px-6">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">${order.total.toFixed(2)}</span>
                            </td>
                            <td className="py-4 px-6">
                                {getStatusBadge(order.status)}
                            </td>
                            <td className="py-4 px-6">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {isMounted ? new Date(order.created_at + (order.created_at.includes('Z') || order.created_at.includes('+') ? '' : 'Z')).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '...'}
                                </span>
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
                                        <button onClick={() => { setSelectedOrderId(order.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">visibility</span> View Details
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                        <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Change Status</div>
                                        <button onClick={() => { handleStatusChange(order.id, 'PENDING'); setActiveMenu(null); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${order.status === 'PENDING' ? 'bg-slate-100 dark:bg-slate-700 text-amber-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                            <span className="material-symbols-outlined text-lg">schedule</span> Pending
                                        </button>
                                        <button onClick={() => { handleStatusChange(order.id, 'PROCESSING'); setActiveMenu(null); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${order.status === 'PROCESSING' ? 'bg-slate-100 dark:bg-slate-700 text-blue-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                            <span className="material-symbols-outlined text-lg">autorenew</span> Processing
                                        </button>
                                        <button onClick={() => { handleStatusChange(order.id, 'SHIPPED'); setActiveMenu(null); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${order.status === 'SHIPPED' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                            <span className="material-symbols-outlined text-lg">local_shipping</span> Shipped
                                        </button>
                                        <button onClick={() => { handleStatusChange(order.id, 'DELIVERED'); setActiveMenu(null); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${order.status === 'DELIVERED' ? 'bg-slate-100 dark:bg-slate-700 text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                            <span className="material-symbols-outlined text-lg">check_circle</span> Delivered
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                        <button onClick={() => { handleStatusChange(order.id, 'CANCELLED'); setActiveMenu(null); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${order.status === 'CANCELLED' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 font-bold' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
                                            <span className="material-symbols-outlined text-lg">cancel</span> Cancelled
                                        </button>
                                        <button onClick={() => { handleStatusChange(order.id, 'REPLACED'); setActiveMenu(null); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${order.status === 'REPLACED' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 font-bold' : 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}>
                                            <span className="material-symbols-outlined text-lg">published_with_changes</span> Replaced
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </AdminTable>

            {/* New Order Modal */}
            <AdminOrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateOrder}
            />

            {/* Order Detail — Centered Modal */}
            {selectedOrderId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedOrderId(null)}
                    />
                    {/* Modal */}
                    <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#1a2632] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#d41132]">receipt_long</span>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Order Details</h3>
                                </div>
                                {fullOrder && (
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className="text-sm font-mono font-bold text-[#d41132] bg-[#d41132]/10 px-2.5 py-0.5 rounded-full">{fullOrder.order_number}</span>
                                        {getStatusBadge(fullOrder.status)}
                                        <span className="text-xs text-slate-400">
                                            {isMounted && fullOrder.created_at ? new Date(fullOrder.created_at + (fullOrder.created_at.includes('Z') || fullOrder.created_at.includes('+') ? '' : 'Z')).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedOrderId(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 mt-0.5 shrink-0"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loadingDetail ? (
                                <div className="flex items-center justify-center gap-3 py-12">
                                    <span className="material-symbols-outlined animate-spin text-[#d41132] text-3xl">progress_activity</span>
                                    <span className="text-slate-500 font-medium">Loading order details...</span>
                                </div>
                            ) : fullOrder ? (
                                <>
                                    {/* Customer Info */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                        <h4 className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px]">person</span> Customer
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-[#d41132]/10 text-[#d41132] flex items-center justify-center text-sm font-bold shrink-0">
                                                {fullOrder.customer_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{fullOrder.customer_name}</p>
                                                <p className="text-xs text-slate-500 truncate">{fullOrder.customer_email}</p>
                                                {fullOrder.customers?.phone && (
                                                    <p className="text-xs text-slate-400 mt-0.5">{fullOrder.customers.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                        {(fullOrder.customers?.address || fullOrder.customers?.city || fullOrder.customers?.country) && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                                                <span className="material-symbols-outlined text-[14px] align-middle mr-1">location_on</span>
                                                {[fullOrder.customers?.address, fullOrder.customers?.city, fullOrder.customers?.country].filter(Boolean).join(', ')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Items */}
                                    <div>
                                        <h4 className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                                            Items Ordered ({fullOrder.order_items.length})
                                        </h4>
                                        {fullOrder.order_items.length === 0 ? (
                                            <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                                No item details available for this order.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {fullOrder.order_items.map((item, idx) => (
                                                    <div
                                                        key={item.id || idx}
                                                        className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-[#101922] rounded-xl border border-slate-100 dark:border-slate-700"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            {item.products?.image ? (
                                                                <img
                                                                    src={item.products.image}
                                                                    alt={item.products?.name || 'Product'}
                                                                    className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-100"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                                    <span className="material-symbols-outlined text-slate-400 text-[18px]">inventory_2</span>
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                                    {item.products?.name || `Product ${item.product_id.slice(0, 8)}`}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                                    <span className="text-xs text-slate-400">Qty: <strong className="text-slate-600 dark:text-slate-300">{item.quantity}</strong></span>
                                                                    {item.size && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-medium">Size: {item.size}</span>}
                                                                    {item.color && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-medium">Color: {item.color}</span>}
                                                                </div>
                                                                {item.variant && (
                                                                    <div className="mt-1 flex gap-1 items-start flex-wrap">
                                                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">Bespoke / Custom Size</span>
                                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.variant.replace('Custom Size:', '')}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-sm font-black text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                                            <p className="text-[10px] text-slate-400">${item.price.toFixed(2)} ea.</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Total Breakdown */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                                        <h4 className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider p-4 pb-3 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px]">receipt</span> Payment Summary
                                        </h4>
                                        <div className="px-4 pb-4 space-y-2">
                                            {fullOrder.subtotal != null && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Subtotal</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">${fullOrder.subtotal.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {fullOrder.shipping != null && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Shipping</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {fullOrder.shipping === 0 ? <span className="text-green-600 font-bold">Free</span> : `$${fullOrder.shipping.toFixed(2)}`}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                                <span className="font-bold text-slate-900 dark:text-white">Total</span>
                                                <span className="font-black text-[#d41132] text-base">${fullOrder.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Slip Verification */}
                                    {fullOrder.payment_slip_url && (
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                                            <h4 className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider p-4 pb-3 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[16px]">image</span> Payment Slip
                                            </h4>
                                            <div className="px-4 pb-4">
                                                <a href={fullOrder.payment_slip_url} target="_blank" rel="noreferrer" className="block w-full cursor-zoom-in">
                                                    <img src={fullOrder.payment_slip_url} alt="Payment Slip" className="w-full h-auto max-h-[300px] object-contain rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:opacity-90 transition-opacity" />
                                                </a>
                                                <p className="text-[10px] text-slate-400 mt-2 text-center uppercase tracking-wider font-bold">Click image to open in new tab</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Timeline */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px]">timeline</span> Status Flow
                                        </h4>
                                        <div className="flex items-center gap-1">
                                            {(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as Order['status'][]).map((s, i) => {
                                                const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
                                                const currentIdx = statuses.indexOf(fullOrder.status);
                                                const isActive = i <= currentIdx;
                                                return (
                                                    <div key={s} className="flex items-center flex-1">
                                                        <div className={`w-3 h-3 rounded-full shrink-0 border-2 ${isActive ? 'bg-[#d41132] border-[#d41132]' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`} />
                                                        {i < 3 && <div className={`h-[2px] flex-1 ${i < currentIdx ? 'bg-[#d41132]' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between">
                                            {['Pending', 'Processing', 'Shipped', 'Delivered'].map((s) => (
                                                <span key={s} className="text-[10px] font-bold text-slate-400">{s}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {fullOrder.notes && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4">
                                            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[16px]">note</span> Order Notes
                                            </h4>
                                            <p className="text-sm text-amber-800 dark:text-amber-300">{fullOrder.notes}</p>
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>

                        {/* Footer removed per request */}
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </AdminPageLayout>
    );
}
