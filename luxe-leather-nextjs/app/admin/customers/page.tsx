'use client';

import { useEffect, useState } from 'react';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';
import { Customer } from '@/lib/supabase';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';


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
    const [itemsPerPage, setItemsPerPage] = useState(10);

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
        onConfirm: () => { },
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
        const visibleIds = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(c => c.id);
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
        <AdminPageLayout
            title="Customer Management"
            subtitle="Manage and view your customer database, track spending, and segment users."
            actions={
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
                            placeholder="Search by name, email, or order ID..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    {/* Segment Pills */}
                    <AdminFilterTabs
                        tabs={[
                            { label: 'All Customers', value: 'all' },
                            { label: 'VIP', value: 'vip' },
                            { label: 'Repeat Buyers', value: 'repeat' },
                            { label: 'Wholesale', value: 'wholesale' },
                        ]}
                        activeTab={selectedSegment}
                        onTabChange={setSelectedSegment}
                    />
                </div>
            }
            pagination={
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filteredCustomers.length}
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
                headers={['Customer', 'Contact', 'Location', 'Orders', 'Total Spent', 'Created', 'Actions']}
                onSelectAll={toggleSelectAll}
                isAllSelected={filteredCustomers.length > 0 && filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(c => selectedIds.has(c.id))}
            >
                {loading ? (
                    <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                            <div className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-2xl text-[#d41132]">progress_activity</span>
                                Loading customers...
                            </div>
                        </td>
                    </tr>
                ) : filteredCustomers.length === 0 ? (
                    <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                            No customers found.
                        </td>
                    </tr>
                ) : (
                    filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((customer) => (
                        <tr key={customer.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(customer.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                            <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
                                    checked={selectedIds.has(customer.id)}
                                    onChange={() => toggleSelect(customer.id)}
                                />
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0 uppercase">
                                        {customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{customer.name}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex flex-col gap-1">
                                    <a className="text-sm text-slate-600 dark:text-slate-300 hover:text-[#d41132] dark:hover:text-[#d41132] transition-colors flex items-center gap-1 font-medium" href={`mailto:${customer.email}`}>
                                        <span className="material-symbols-outlined text-[16px]">mail</span> {customer.email}
                                    </a>
                                    {customer.phone && (
                                        <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                            <span className="material-symbols-outlined text-[14px]">call</span> {customer.phone}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                    {[customer.city, customer.country].filter(Boolean).join(', ') || '—'}
                                </div>
                            </td>
                            <td className="py-4 px-6">
                                <span className="text-sm font-black text-slate-800 dark:text-slate-200">{customer.ordersCount}</span>
                            </td>
                            <td className="py-4 px-6">
                                <span className="text-sm font-black text-slate-900 dark:text-white">${customer.totalSpent.toFixed(2)}</span>
                            </td>
                            <td className="py-4 px-6">
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    {isMounted ? new Date(customer.createdAt).toLocaleDateString() : '...'}
                                </span>
                            </td>
                            <td className="py-4 px-6 text-right relative">
                                <button
                                    onClick={(e) => toggleMenu(customer.id, e)}
                                    className="action-menu-trigger text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                                {activeMenu === customer.id && (
                                    <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 action-menu animate-in zoom-in-95 duration-150 origin-top-right">
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
                    ))
                )}
            </AdminTable>

            <AdminCustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
                initialData={editingCustomer}
            />
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
