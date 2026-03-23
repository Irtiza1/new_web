'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Customer } from '@/lib/supabase';


// Extended type matching API response
interface CustomerWithStats extends Customer {
    ordersCount: number;
    totalSpent: number;
}

import AdminCustomerModal, { pCustomer } from '@/components/admin/AdminCustomerModal';
import ConfirmModal from '@/components/admin/ConfirmModal';

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSegment, setSelectedSegment] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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
        onConfirm: () => {},
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            // Fetching a large limit to support client-side filtering for now (Pilot Phase)
            const res = await fetch('/api/customers?limit=1000');
            const data = await res.json();

            if (data.success) {
                setCustomers(data.data);
            } else {
                console.error('Failed to load customers:', data.error);
            }
        } catch (error) {
            console.error('Failed to load customers data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        // Client-side filtering active
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (selectedSegment === 'all') return true;
        if (selectedSegment === 'vip') return c.totalSpent > 500;
        if (selectedSegment === 'repeat') return c.ordersCount > 1;
        if (selectedSegment === 'wholesale') return false; // Placeholder

        return true;
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
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Location', 'Created At'];
        const csvContent = [
            headers.join(','),
            ...customers.map(customer => [
                customer.id,
                `"${customer.name}"`,
                customer.email,
                customer.phone || '',
                `"${[customer.city, customer.country].filter(Boolean).join(', ') || ''}"`,
                new Date(customer.createdAt).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleDeleteCustomer = async (id: string) => {
        if (isBulkDeleting) return;
        
        setConfirmModal({
            isOpen: true,
            title: 'Delete Customer',
            message: 'Are you sure you want to delete this customer and all their associated orders? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetch(`/api/customers/${id}`, {
                        method: 'DELETE',
                    });

                    if (!res.ok) throw new Error('Failed to delete customer');

                    // Optimistic update
                    setCustomers(customers.filter(c => c.id !== id));
                    setSelectedIds(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                } catch (error) {
                    console.error('Error deleting customer:', error);
                    alert('Failed to delete customer. They might still have orders that could not be removed.');
                    loadCustomers(); // Refresh on error
                }
            }
        });
    };

    const handleBulkDelete = async () => {
        if (isBulkDeleting || selectedIds.size === 0) return;
        
        const count = selectedIds.size;
        setConfirmModal({
            isOpen: true,
            title: `Delete ${count} Customers`,
            message: `Are you sure you want to delete ${count} customers and their orders? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsBulkDeleting(true);
                const idsToDelete = Array.from(selectedIds);
                let successCount = 0;
                let failCount = 0;

                try {
                    await Promise.all(idsToDelete.map(async (id) => {
                        try {
                            const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
                            if (res.ok) successCount++;
                            else failCount++;
                        } catch (err) {
                            failCount++;
                        }
                    }));

                    if (successCount > 0) {
                        setCustomers(prev => prev.filter(c => !selectedIds.has(c.id)));
                        setSelectedIds(new Set());
                    }

                    if (failCount > 0) {
                        alert(`Bulk delete completed. Success: ${successCount}, Failed: ${failCount}`);
                    }
                } catch (error) {
                    console.error('Bulk delete error:', error);
                } finally {
                    setIsBulkDeleting(false);
                    loadCustomers();
                }
            }
        });
    };

    const toggleSelectAll = () => {
        const visibleIds = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(c => c.id);
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

    const handleCreateCustomer = async (data: pCustomer) => {
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await res.json();

            if (result.success) {
                await loadCustomers();
                setIsModalOpen(false);
            } else {
                alert('Failed to create customer: ' + (result.error || result.message));
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('An error occurred while creating the customer.');
        }
    };

    const handleUpdateCustomer = async (data: pCustomer) => {
        if (!editingCustomer) return;
        try {
            const res = await fetch(`/api/customers/${editingCustomer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await res.json();

            if (result.success) {
                await loadCustomers();
                setIsModalOpen(false);
                setEditingCustomer(null);
            } else {
                alert('Failed to update customer: ' + result.error);
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            alert('An error occurred while updating the customer.');
        }
    };

    const openCreateModal = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const toggleMenu = (customerId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === customerId ? null : customerId);
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
                            <span className="text-slate-900 dark:text-white font-medium">Customers</span>
                        </div>
                        <div className="flex justify-between items-end flex-wrap gap-4">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Customer Management</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and view your customer database, track spending, and segment users.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">download</span>
                                    Export CSV
                                </button>
                                <button
                                    onClick={openCreateModal}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#d41132] text-white rounded-lg font-medium text-sm hover:bg-[#b30f2a] transition-colors shadow-sm shadow-red-200 dark:shadow-none">
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Add Customer
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
                                placeholder="Search by name, email, or order ID..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                        {/* Segment Pills */}
                        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                            <button
                                onClick={() => setSelectedSegment('all')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedSegment === 'all' ? 'bg-[#d41132] text-white shadow-md shadow-red-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                <span className="material-symbols-outlined text-lg">group</span>
                                All Customers
                            </button>
                            <button
                                onClick={() => setSelectedSegment('vip')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedSegment === 'vip' ? 'bg-[#d41132] text-white shadow-md shadow-red-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                <span className="material-symbols-outlined text-lg text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                VIP
                            </button>
                            <button
                                onClick={() => setSelectedSegment('repeat')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedSegment === 'repeat' ? 'bg-[#d41132] text-white shadow-md shadow-red-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                <span className="material-symbols-outlined text-lg text-[#d41132]">autorenew</span>
                                Repeat Buyers
                            </button>
                            <button
                                onClick={() => setSelectedSegment('wholesale')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedSegment === 'wholesale' ? 'bg-[#d41132] text-white shadow-md shadow-red-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                <span className="material-symbols-outlined text-lg text-purple-500">domain</span>
                                Wholesale
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
                                                <th className="px-6 py-4 w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent"
                                                        checked={filteredCustomers.length > 0 && filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).every(c => selectedIds.has(c.id))}
                                                        onChange={toggleSelectAll}
                                                    />
                                                </th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 group">
                                                    <div className="flex items-center gap-1">Customer <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100">arrow_downward</span></div>
                                                </th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Orders</th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Total Spent</th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((customer) => (
                                                <tr key={customer.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group ${selectedIds.has(customer.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent"
                                                            checked={selectedIds.has(customer.id)}
                                                            onChange={() => toggleSelect(customer.id)}
                                                        />
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                                {customer.name.split(' ').map((n: string) => n[0]).join('')}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-900 dark:text-white text-sm">{customer.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col gap-1">
                                                            <a className="text-sm text-slate-600 dark:text-slate-300 hover:text-[#d41132] dark:hover:text-[#d41132] transition-colors flex items-center gap-1" href={`mailto:${customer.email}`}>
                                                                <span className="material-symbols-outlined text-[16px]">mail</span> {customer.email}
                                                            </a>
                                                            {customer.phone && (
                                                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">call</span> {customer.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                            {[customer.city, customer.country].filter(Boolean).join(', ') || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{customer.ordersCount}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">${customer.totalSpent.toFixed(2)}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                                                        {isMounted ? new Date(customer.createdAt).toLocaleDateString() : '...'}
                                                    </td>
                                                    <td className="py-4 px-6 text-right relative">
                                                        <button
                                                            onClick={(e) => toggleMenu(customer.id, e)}
                                                            className="action-menu-trigger text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined">more_vert</span>
                                                        </button>
                                                        {activeMenu === customer.id && (
                                                            <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 action-menu">
                                                                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-lg">visibility</span> View Profile
                                                                </button>
                                                                <button onClick={() => { openEditModal(customer); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-lg">edit</span> Edit Customer
                                                                </button>
                                                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                                                <button onClick={() => { handleDeleteCustomer(customer.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-lg">delete</span> Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Footer */}
                                <div className="bg-white dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Showing <span className="font-medium text-slate-900 dark:text-white">1</span> to <span className="font-medium text-slate-900 dark:text-white">{customers.length}</span> of <span className="font-medium text-slate-900 dark:text-white">{customers.length}</span> results
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Previous</button>
                                        {Array.from({ length: Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).slice(
                                            Math.max(0, currentPage - 3),
                                            Math.min(Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE), currentPage + 2)
                                        ).map(page => (
                                            <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 text-sm rounded border transition-colors ${currentPage === page ? 'bg-[#d41132] text-white border-[#d41132]' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{page}</button>
                                        ))}
                                        <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE), p + 1))} disabled={currentPage >= Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)} className="px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Next</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            <AdminCustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
                initialData={editingCustomer}
            />

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl border border-slate-800 flex flex-wrap md:flex-nowrap items-center justify-center gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 w-[90%] md:w-auto">
                    <div className="flex items-center gap-3">
                        <span className="bg-[#d41132] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {selectedIds.size}
                        </span>
                        <p className="text-sm font-medium whitespace-nowrap">customers selected</p>
                    </div>
                    <div className="hidden md:block w-px h-6 bg-slate-700" />
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-sm font-bold text-slate-400 hover:text-white transition-colors px-2"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="flex items-center gap-2 px-4 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white text-sm font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
                        >
                            {isBulkDeleting ? (
                                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                            )}
                            {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
                        </button>
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
        </div>
    );
}
