'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Customer, getAllCustomers, searchCustomers, deleteCustomer } from '@/lib/api/customers';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSegment, setSelectedSegment] = useState('all');

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await getAllCustomers();
            setCustomers(data);
        } catch (error) {
            console.error('Failed to load customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim()) {
            const results = await searchCustomers(query);
            setCustomers(results);
        } else {
            loadCustomers();
        }
    };

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

    const handleDelete = async (customerId: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            await deleteCustomer(customerId);
            await loadCustomers();
        } catch (err) {
            console.error('Failed to delete customer:', err);
        }
    };

    const toggleMenu = (customerId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === customerId ? null : customerId);
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] font-[family-name:var(--font-inter)]">
            <AdminSidebar />

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
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#d41132] text-white rounded-lg font-medium text-sm hover:bg-[#b30f2a] transition-colors shadow-sm shadow-red-200 dark:shadow-none">
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
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap transition-colors">
                                <span className="material-symbols-outlined text-lg text-[#d41132]">autorenew</span>
                                Repeat Buyers
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap transition-colors">
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
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12">
                                                    <input className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent" type="checkbox" />
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
                                            {customers.map((customer) => (
                                                <tr key={customer.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <input className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent" type="checkbox" />
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
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">0</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">$0.00</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-sm text-slate-500 dark:text-slate-400">{new Date(customer.createdAt).toLocaleDateString()}</span>
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
                                                                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-lg">edit</span> Edit Customer
                                                                </button>
                                                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                                                <button onClick={() => { handleDelete(customer.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
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
        </div>
    );
}
