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
    const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
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
            } else {
                console.error('Failed to update order status:', data.error);
                showToast(`Failed to update order ${orderId.slice(-8).toUpperCase()}.`, 'error');
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

    const handleDelete = async (orderId: string) => {
        if (isBulkDeleting) return;

        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        setConfirmModal({
            isOpen: true,
            title: `Archive Order ${order.order_number}`,
            message: `Are you sure you want to archive this order for ${order.customer_name}? For financial integrity, orders are never permanently deleted.`,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) {
                        // Optimistic update
                        setOrders(prev => prev.filter(o => o.id !== orderId));
                        setSelectedIds(prev => {
                            const next = new Set(prev);
                            next.delete(orderId);
                            return next;
                        });
                        showToast(`Order ${order.order_number} was archived.`, 'success');
                    } else {
                        showToast('Failed to archive order: ' + (data.error || 'Unknown error'), 'error');
                    }
                } catch (err) {
                    showToast('An unexpected error occurred during archiving.', 'error');
                    console.error('Failed to archive order:', err);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleBulkDelete = async () => {
        if (isBulkDeleting || selectedIds.size === 0) return;

        const count = selectedIds.size;
        setConfirmModal({
            isOpen: true,
            title: `Archive ${count} Orders`,
            message: `Are you sure you want to archive ${count} selected orders? For financial integrity, orders are never permanently deleted.`,
            onConfirm: async () => {
                setIsBulkDeleting(true);
                const idsToDelete = Array.from(selectedIds);
                let successCount = 0;
                let failCount = 0;

                try {
                    await Promise.all(idsToDelete.map(async (id) => {
                        try {
                            const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
                            if (res.ok) successCount++;
                            else failCount++;
                        } catch {
                            failCount++;
                        }
                    }));

                    if (successCount > 0) {
                        setOrders(prev => prev.filter(o => !selectedIds.has(o.id)));
                        setSelectedIds(new Set());
                    }

                    if (failCount > 0) {
                        showToast(`Bulk archive finished with errors. Archived: ${successCount}, Failed: ${failCount}`, 'error');
                    } else {
                        showToast(`Successfully archived ${successCount} orders.`, 'success');
                    }
                } catch (error) {
                    console.error('Bulk archive error:', error);
                    showToast('An error occurred during bulk archiving.', 'error');
                } finally {
                    setIsBulkDeleting(false);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    loadOrders(); // Refresh to ensure sync
                }
            }
        });
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
        <AdminPageLayout
            title="Order Management"
            subtitle="View and manage all customer orders."
            stats={
                <>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total Orders</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{orders.length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Pending</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{orders.filter(o => o.status === 'PENDING').length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Revenue</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</p>
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
                    <div className="relative w-full lg:w-full md:w-96 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400">search</span>
                        </div>
                        <input
                            className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d41132]/50 text-sm transition-all"
                            placeholder="Search by order number, UUID, customer name, or email..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Status Filters */}
                    <AdminFilterTabs
                        tabs={[
                            { label: 'All Orders', value: 'all' },
                            { label: 'Pending', value: 'PENDING' },
                            { label: 'Processing', value: 'PROCESSING' },
                            { label: 'Shipped', value: 'SHIPPED' },
                            { label: 'Delivered', value: 'DELIVERED' },
                        ]}
                        activeTab={statusFilter}
                        onTabChange={setStatusFilter}
                    />
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
                    onDelete={handleBulkDelete}
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
                                    <span className="text-sm font-mono font-black text-slate-900 dark:text-white" title={order.id}>{order.order_number}</span>
                                    <span className="text-[10px] font-mono text-slate-400">{order.id.slice(0, 8)}</span>
                                </div>
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
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {isMounted ? new Date(order.created_at).toLocaleDateString() : '...'}
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
            </AdminTable>

            {/* Modals and Side Panels */}
            <AdminOrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateOrder}
            />

            {/* Order Detail Drawer */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[110] flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
                    <aside className="relative h-full w-full sm:w-[500px] bg-white dark:bg-[#1a2632] shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Drawer Header */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex flex-col">
                                <span className="text-xs font-mono text-slate-500 mb-1">{selectedOrder.order_number}</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Details</h3>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Status Badge */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                {getStatusBadge(selectedOrder.status)}
                                <span className="text-xs text-slate-500">
                                    {isMounted ? new Date(selectedOrder.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '...'}
                                </span>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                                <h4 className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider mb-3">Customer</h4>
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-[#d41132]/10 text-[#d41132] flex items-center justify-center text-sm font-bold">
                                        {selectedOrder.customer_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedOrder.customer_name}</p>
                                        <p className="text-xs text-slate-500">{selectedOrder.customer_email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Order Summary</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-white dark:bg-[#1a2632] rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500">Items</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{selectedOrder.items_count}</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#1a2632] rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500">Total</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">${selectedOrder.total.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Timeline */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Status Flow</h4>
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
                                        <span key={s} className="text-[9px] font-bold text-slate-400">{s}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Actions */}
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2632] flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    const next: Record<string, Order['status']> = { PENDING: 'PROCESSING', PROCESSING: 'SHIPPED', SHIPPED: 'DELIVERED', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED' };
                                    handleStatusChange(selectedOrder.id, next[selectedOrder.status] || 'PROCESSING');
                                    setSelectedOrder(null);
                                }}
                                disabled={selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'CANCELLED'}
                                className="w-full flex items-center justify-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[20px]">forward</span>
                                Advance Status
                            </button>
                            <button
                                onClick={() => { handleDelete(selectedOrder.id); setSelectedOrder(null); }}
                                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1a2632] border border-red-300 text-red-600 font-bold py-2.5 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                Delete Order
                            </button>
                        </div>
                    </aside>
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
