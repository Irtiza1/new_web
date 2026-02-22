'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import type { CustomRequest } from '@/lib/services/requestService';
import AdminRequestModal, { pRequest } from '@/components/admin/AdminRequestModal';

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<CustomRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Stats for notifications (could be fetched separately or derived)
    const [newRequestCount, setNewRequestCount] = useState(0);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadRequests();
    }, [statusFilter]); // Reload when status filter changes

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            loadRequests();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (statusFilter !== 'all') query.append('status', statusFilter);
            if (searchQuery) query.append('search', searchQuery);

            const res = await fetch(`/api/requests?${query.toString()}`);
            const data = await res.json();

            if (data.success) {
                setRequests(data.data);
                // If we have data and no selection, select first? Or keep selection if exists?
                // Logic: if selectedRequest is not in new data, maybe deselect?
                // For now, simple:
                if (!selectedRequest && data.data.length > 0) {
                    setSelectedRequest(data.data[0]);
                }

                // Update new count - mostly for the notification badge
                // In a real app we'd probably have a separate /stats endpoint call here
                if (statusFilter === 'all' && !searchQuery) {
                    const count = data.data.filter((r: CustomRequest) => r.status === 'new').length;
                    setNewRequestCount(count);
                }
            }
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                // Update local state
                setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
                if (selectedRequest?.id === id) {
                    setSelectedRequest({ ...selectedRequest, status: newStatus as any });
                }
                alert(`Status updated to ${newStatus}`);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleCreateRequest = async (requestData: pRequest) => {
        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });
            const result = await res.json();

            if (result.success) {
                await loadRequests();
                setIsModalOpen(false);
            } else {
                alert('Failed to create request: ' + (result.error || result.message));
            }
        } catch (error) {
            console.error('Error creating request:', error);
            alert('An error occurred while creating the request');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            new: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
            quoted: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400',
            in_progress: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400',
            completed: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400'
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const style = (styles as any)[status.toLowerCase()] || styles.new;

        return (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
        );
    };

    return (
        <div className="bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-white h-screen flex overflow-hidden font-[family-name:var(--font-inter)]">
            {/* <AdminSidebar /> removed for layout */}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Top Header */}
                <header className="h-16 bg-white dark:bg-[#15202b] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                    {/* Search */}
                    <div className="flex-1 max-w-lg">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-[#d41132] transition-colors">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#d41132] sm:text-sm sm:leading-6 bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:text-white transition-all"
                                placeholder="Search requests, clients, or items..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Right Actions */}
                    <div className="flex items-center gap-4 ml-6">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#d41132] hover:bg-[#b30f2a] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            New Request
                        </button>
                        <button
                            onClick={() => setStatusFilter('new')}
                            className="relative p-2 text-slate-500 hover:text-[#d41132] transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Show new requests"
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            {newRequestCount > 0 && (
                                <span className="absolute top-1 right-1 size-4 bg-red-500 border border-white dark:border-[#15202b] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                    {newRequestCount}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-6xl mx-auto flex flex-col h-full">
                        {/* Page Header & Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Custom Request Pipeline</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track incoming custom leatherwork inquiries.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Status Filter Buttons */}
                                <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                                    {['all', 'new', 'quoted', 'in_progress', 'completed'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === status
                                                ? 'bg-[#d41132] text-white shadow-sm'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Data Table Card */}
                        <div className="bg-white dark:bg-[#15202b] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col">
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d41132]"></div>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">ID</th>
                                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Request Type</th>
                                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Budget</th>
                                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {requests.map((req, idx) => (
                                                <tr
                                                    key={req.id}
                                                    onClick={() => setSelectedRequest(req)}
                                                    className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${selectedRequest?.id === req.id ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}
                                                >
                                                    <td className="py-4 px-6 text-sm font-mono text-slate-500">#REQ-{req.id?.slice(0, 4)}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                                {req.name?.split(' ').map((n: string) => n[0]).join('')}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-slate-900 dark:text-white">{req.name}</span>
                                                                <span className="text-xs text-slate-500">Customer</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 font-medium">{req.itemType}</td>
                                                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400 tabular-nums">{req.budget || 'N/A'}</td>
                                                    <td className="py-4 px-6">
                                                        <StatusBadge status={req.status} />
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-slate-500 text-right tabular-nums">{new Date(req.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-sm text-slate-500">Showing {requests.length} results</span>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50" disabled>Previous</button>
                                    <button className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">Next</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side Panel (Details) */}
                {selectedRequest && (
                    <aside className="absolute top-0 right-0 h-full w-[400px] bg-white dark:bg-[#15202b] shadow-2xl z-30 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out translate-x-0">
                        {/* Drawer Header */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex flex-col">
                                <span className="text-xs font-mono text-slate-500 mb-1">#REQ-{selectedRequest.id?.slice(0, 4)}</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedRequest.itemType}</h3>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Client Info Card */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-700">
                                <div className="size-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">
                                    {selectedRequest.name?.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedRequest.name}</p>
                                    <p className="text-xs text-slate-500">{selectedRequest.email}</p>
                                </div>
                            </div>
                            {/* Request Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400 text-[18px]">description</span>
                                    Request Details
                                </h4>
                                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <p>{selectedRequest.description}</p>
                                </div>
                            </div>
                            {/* Meta Data */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-xs text-slate-500">Target Budget</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedRequest.budget || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Deadline</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedRequest.deadline ? new Date(selectedRequest.deadline).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        {/* Drawer Actions */}
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15202b]">
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleStatusUpdate(selectedRequest.id, 'quoted')}
                                    className="w-full flex items-center justify-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-md shadow-red-200 dark:shadow-none"
                                >
                                    <span className="material-symbols-outlined text-[20px]">send</span>
                                    Send Quote (Mark Quoted)
                                </button>
                                <button
                                    onClick={() => window.open(`https://wa.me/?text=Hi ${selectedRequest.name}, regarding your ${selectedRequest.itemType} request...`, '_blank')}
                                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium py-2.5 px-4 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chat</span>
                                    Reply via WhatsApp
                                </button>
                            </div>
                        </div>
                    </aside>
                )}
            </main>

            <AdminRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateRequest}
            />
        </div>
    );
}
