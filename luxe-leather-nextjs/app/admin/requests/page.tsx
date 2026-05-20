'use client';

import { useEffect, useState } from 'react';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';

import { useToast } from '@/contexts/ToastContext';
import type { CustomRequest } from '@/lib/services/requestService';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';
import AdminRequestModal, { pRequest } from '@/components/admin/AdminRequestModal';
import ConfirmModal from '@/components/admin/ConfirmModal';

export default function AdminRequestsPage() {
    const { showToast } = useToast();
    const [requests, setRequests] = useState<CustomRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Stats for notifications (could be fetched separately or derived)
    const [newRequestCount, setNewRequestCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
    };

    // Filtered requests for display
    const filteredRequests = requests.filter(req => {
        const matchesStatus = statusFilter === 'all' || req.status?.toLowerCase() === statusFilter;
        const matchesSearch = searchQuery === '' ||
            req.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.itemType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]); // Reload when status filter changes

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRequests();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchRequests = async () => {
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
                } else if (selectedRequest && !data.data.some((r: CustomRequest) => r.id === selectedRequest.id)) {
                    // If selected request is no longer in the list, deselect it
                    setSelectedRequest(null);
                }

                // Update new count
                if (statusFilter === 'all' && !searchQuery) {
                    const count = data.data.filter((r: CustomRequest) =>
                        r.status?.toLowerCase() === 'new'
                    ).length;
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
                showToast(`Status updated to ${newStatus}`);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (isBulkDeleting) return;

        setConfirmModal({
            isOpen: true,
            title: 'Delete Request',
            message: 'Are you sure you want to delete this request? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        // Optimistic update
                        setRequests(requests.filter(r => r.id !== id));
                        setSelectedIds(prev => {
                            const next = new Set(prev);
                            next.delete(id);
                            return next;
                        });
                        if (selectedRequest?.id === id) {
                            setSelectedRequest(null);
                        }
                    } else {
                        showToast('Failed to delete request.', 'error');
                    }
                } catch (err) {
                    console.error('Delete error:', err);
                    showToast('An unexpected error occurred.', 'error');
                }
            }
        });
    };

    const handleBulkDelete = async () => {
        if (isBulkDeleting || selectedIds.size === 0) return;

        const count = selectedIds.size;
        setConfirmModal({
            isOpen: true,
            title: `Delete ${count} Requests`,
            message: `Are you sure you want to delete ${count} requests? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsBulkDeleting(true);
                const idsToDelete = Array.from(selectedIds);
                let successCount = 0;
                let failCount = 0;

                try {
                    await Promise.all(idsToDelete.map(async (id) => {
                        try {
                            const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
                            if (res.ok) successCount++;
                            else failCount++;
                        } catch (err) {
                            failCount++;
                        }
                    }));

                    if (successCount > 0) {
                        setRequests(prev => prev.filter(r => !selectedIds.has(r.id)));
                        setSelectedIds(new Set());
                        if (selectedRequest && selectedIds.has(selectedRequest.id)) {
                            setSelectedRequest(null);
                        }
                    }

                    if (failCount > 0) {
                        showToast(`Bulk delete completed. Success: ${successCount}, Failed: ${failCount}`, 'error');
                    }
                } catch (error) {
                    console.error('Bulk delete error:', error);
                } finally {
                    setIsBulkDeleting(false);
                    fetchRequests();
                }
            }
        });
    };

    const toggleSelectAll = () => {
        const visibleIds = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(r => r.id);
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

    const handleCreateRequest = async (requestData: pRequest) => {
        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });
            const result = await res.json();

            if (result.success) {
                await fetchRequests();
                setIsModalOpen(false);
            } else {
                showToast('Failed to create request: ' + (result.error || result.message), 'error');
            }
        } catch (error) {
            console.error('Error creating request:', error);
            showToast('An error occurred while creating the request', 'error');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            new: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
            quote_sent: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400',
            quoted: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400',
            in_progress: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400',
            completed: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400',
            cancelled: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400',
        };
        const key = status.toLowerCase();
        const style = styles[key] || styles.new;
        // Format the label
        const label = status === 'QUOTE_SENT' ? 'Quote Sent'
            : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        return (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
                {label}
            </span>
        );
    };

    return (
        <AdminPageLayout
            title="Custom Request Pipeline"
            subtitle="Manage and track incoming custom inquiries."
            stats={
                <>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total Requests</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{requests.length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">New</p>
                        <p className="text-base font-black text-blue-600 leading-none mt-0.5">{newRequestCount}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Completed</p>
                        <p className="text-base font-black text-emerald-500 leading-none mt-0.5">{requests.filter(r => r.status?.toLowerCase() === 'completed').length}</p>
                    </div>
                </>
            }
            actions={
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#d41132] hover:bg-[#b30f2a] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    New Request
                </button>
            }
            filters={
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 w-full">
                    <div className="relative w-full lg:max-w-md group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[#d41132] sm:text-sm bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:text-white transition-all outline-none"
                            placeholder="Search requests..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <AdminFilterTabs
                        tabs={[
                            { label: 'All', value: 'all' },
                            { label: 'New', value: 'new' },
                            { label: 'Quoted', value: 'quoted' },
                            { label: 'In Progress', value: 'in_progress' },
                            { label: 'Completed', value: 'completed' },
                        ]}
                        activeTab={statusFilter}
                        onTabChange={setStatusFilter}
                    />
                </div>
            }
            pagination={
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filteredRequests.length}
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
                headers={['Customer', 'Project', 'Budget', 'Status', 'Date', 'Actions']}
                onSelectAll={toggleSelectAll}
                isAllSelected={filteredRequests.length > 0 && filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(r => selectedIds.has(r.id))}
            >
                {loading ? (
                    <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                            <div className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-2xl text-[#d41132]">progress_activity</span>
                                Loading requests...
                            </div>
                        </td>
                    </tr>
                ) : filteredRequests.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                            No requests found.
                        </td>
                    </tr>
                ) : (
                    filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((req) => (
                        <tr
                            key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${selectedIds.has(req.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}
                        >
                            <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
                                    checked={selectedIds.has(req.id)}
                                    onChange={() => toggleSelect(req.id)}
                                />
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                                        {req.name?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{req.name}</span>
                                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">#{req.id.slice(-6).toUpperCase()}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 font-medium">{req.itemType}</td>
                            <td className="py-4 px-6 text-sm text-slate-900 dark:text-white font-black tabular-nums">${req.budget}</td>
                            <td className="py-4 px-6">
                                <StatusBadge status={req.status} />
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                                {isMounted ? new Date(req.createdAt).toLocaleDateString() : '...'}
                            </td>
                            <td className="py-4 px-6 text-right relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={(e) => toggleMenu(req.id, e)}
                                    className="action-menu-trigger text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                                {activeMenu === req.id && (
                                    <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 action-menu animate-in zoom-in-95 duration-150 origin-top-right">
                                        <button onClick={() => { setSelectedRequest(req); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">visibility</span> View Details
                                        </button>
                                        <button onClick={() => { handleStatusUpdate(req.id, 'quoted'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">request_quote</span> Approve & Quote
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                        <button onClick={() => { handleDelete(req.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">delete</span> Delete
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </AdminTable>

            <AdminRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateRequest}
            />

            {/* Detail Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#15202b] w-full sm:max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 p-8 flex flex-col">
                        <button
                            onClick={() => setSelectedRequest(null)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="flex items-center gap-4 mb-8 shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold">
                                <span className="material-symbols-outlined text-3xl">draw</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold dark:text-white text-slate-900">Request Detail</h3>
                                <p className="text-sm text-slate-500 font-mono">#{selectedRequest.id.slice(-8).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-6 min-h-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Customer</label>
                                    <p className="font-semibold dark:text-white text-slate-900">{selectedRequest.name}</p>
                                    <p className="text-sm text-slate-500">{selectedRequest.email}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                                    <StatusBadge status={selectedRequest.status} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Budget</label>
                                    <p className="font-bold text-slate-900 dark:text-emerald-400">${selectedRequest.budget}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Deadline</label>
                                    <p className="font-semibold dark:text-white text-slate-900">{selectedRequest.deadline}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Description</label>
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedRequest.description}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleStatusUpdate(selectedRequest.id, 'quoted')}
                                    className="px-6 py-2.5 bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold rounded-lg transition-all shadow-md text-sm"
                                >
                                    Approve & Quote
                                </button>
                                <button className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-white font-bold rounded-lg transition-all text-sm">
                                    Send Message
                                </button>
                            </div>
                            <button
                                onClick={() => { handleDelete(selectedRequest.id); setSelectedRequest(null); }}
                                className="px-6 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-lg transition-all text-sm"
                            >
                                Delete Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
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
