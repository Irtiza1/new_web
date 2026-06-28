'use client';

import { useEffect, useState } from 'react';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { useToast } from '@/contexts/ToastContext';
import { useAdminNotifications } from '@/contexts/AdminNotificationContext';

export type ContactMessage = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    inquiry_type: string;
    message: string;
    status: 'new' | 'replied' | 'archived';
    created_at: string;
};

export default function AdminMessagesPage() {
    const { showToast } = useToast();
    const { counts } = useAdminNotifications();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalMessages, setTotalMessages] = useState(0);

    const [isMounted, setIsMounted] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

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

    const fetchMessages = async () => {
        try {
            setLoading(true);
            setError(false);
            const query = new URLSearchParams();
            if (statusFilter !== 'all') query.append('status', statusFilter);
            if (searchQuery) query.append('search', searchQuery);

            const res = await fetch(`/api/contact/admin?${query.toString()}`);
            const data = await res.json();

            if (data.success) {
                setMessages(data.data);
                setTotalMessages(data.pagination?.total || data.data.length);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error('Failed to load messages:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMessages();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/contact/admin?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus as any } : m));
                if (selectedMessage?.id === id) {
                    setSelectedMessage({ ...selectedMessage, status: newStatus as any });
                }
                showToast(`Message marked as ${newStatus}.`, 'success');
            } else {
                showToast('Failed to update status.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error updating status.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (isBulkDeleting) return;
        const msg = messages.find(m => m.id === id);
        if (!msg) return;

        setConfirmModal({
            isOpen: true,
            title: `Delete Message`,
            message: `Are you sure you want to delete the message from ${msg.name}?`,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/contact/admin`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: [id] })
                    });
                    if (res.ok) {
                        setMessages(messages.filter(m => m.id !== id));
                        setSelectedIds(prev => {
                            const next = new Set(prev);
                            next.delete(id);
                            return next;
                        });
                        setSelectedMessage(null);
                        showToast(`Message deleted.`, 'success');
                    } else {
                        showToast(`Failed to delete message.`, 'error');
                    }
                } catch (err) {
                    console.error(err);
                    showToast('Error deleting message.', 'error');
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleBulkDelete = async () => {
        if (isBulkDeleting || selectedIds.size === 0) return;
        setConfirmModal({
            isOpen: true,
            title: 'Delete Messages',
            message: `Are you sure you want to delete ${selectedIds.size} messages?`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsBulkDeleting(true);
                const idsToDelete = Array.from(selectedIds);

                try {
                    const res = await fetch('/api/contact/admin', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: idsToDelete })
                    });
                    const data = await res.json();

                    if (data.success) {
                        setMessages(prev => prev.filter(m => !selectedIds.has(m.id)));
                        setSelectedIds(new Set());
                        showToast(`${idsToDelete.length} messages deleted.`, 'success');
                    } else {
                        showToast('Failed to bulk delete.', 'error');
                    }
                } catch (error) {
                    console.error(error);
                    showToast('Error during bulk deletion.', 'error');
                } finally {
                    setIsBulkDeleting(false);
                    fetchMessages();
                }
            }
        });
    };

    const toggleSelectAll = () => {
        const visibleIds = messages.map(m => m.id);
        const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            visibleIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
            return next;
        });
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleReply = (msg: ContactMessage) => {
        const a = document.createElement('a');
        a.href = `mailto:${msg.email}?subject=${encodeURIComponent('Re: Luxe Leather Gear - Support Inquiry')}`;
        a.click();
        if (msg.status === 'new') {
            handleStatusUpdate(msg.id, 'replied');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            new: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
            replied: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400',
            archived: 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-800/50 dark:text-slate-400',
        };
        const label = status.replace(/\b\w/g, l => l.toUpperCase());
        return (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.new}`}>
                {label}
            </span>
        );
    };

    return (
        <AdminPageLayout
            title="Support Messages"
            subtitle="Manage incoming contact form inquiries."
            stats={
                <>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{totalMessages}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">New</p>
                        <p className="text-base font-black text-blue-600 leading-none mt-0.5">{counts.newMessages || 0}</p>
                    </div>
                </>
            }
            filters={
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 w-full">
                    <div className="relative w-full lg:max-w-md group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[#d41132] sm:text-sm bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:text-white transition-all outline-none"
                            placeholder="Search messages..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <AdminFilterTabs
                        tabs={[
                            { label: 'All', value: 'all' },
                            { label: 'New', value: 'new' },
                            { label: 'Replied', value: 'replied' },
                            { label: 'Archived', value: 'archived' },
                        ]}
                        activeTab={statusFilter}
                        onTabChange={setStatusFilter}
                    />
                </div>
            }
            pagination={
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={totalMessages}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
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
                headers={['Sender', 'Inquiry Type', 'Message', 'Status', 'Date', 'Actions']}
                onSelectAll={toggleSelectAll}
                isAllSelected={messages.length > 0 && messages.every(m => selectedIds.has(m.id))}
            >
                {loading ? (
                    <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                            <div className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-2xl text-[#d41132]">progress_activity</span>
                                Loading messages...
                            </div>
                        </td>
                    </tr>
                ) : error ? (
                    <tr>
                        <td colSpan={7} className="py-12 text-center text-red-500 font-bold">
                            Failed to load messages. Database connection error.
                        </td>
                    </tr>
                ) : messages.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                            No messages found.
                        </td>
                    </tr>
                ) : (
                    messages.map((msg) => (
                        <tr
                            key={msg.id}
                            onClick={() => {
                                setSelectedMessage(msg);
                                if (msg.status === 'new') handleStatusUpdate(msg.id, 'read');
                            }}
                            className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${selectedIds.has(msg.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}
                        >
                            <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
                                    checked={selectedIds.has(msg.id)}
                                    onChange={() => toggleSelect(msg.id)}
                                />
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                                        {msg.name?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{msg.name}</span>
                                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">{msg.email}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 font-medium">{msg.inquiry_type}</td>
                            <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{msg.message}</td>
                            <td className="py-4 px-6"><StatusBadge status={msg.status} /></td>
                            <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                                {isMounted ? new Date(msg.created_at).toLocaleDateString() : '...'}
                            </td>
                            <td className="py-4 px-6 text-right relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={(e) => toggleMenu(msg.id, e)}
                                    className="action-menu-trigger text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                                {activeMenu === msg.id && (
                                    <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 action-menu animate-in zoom-in-95 duration-150 origin-top-right">
                                        <button onClick={() => { setSelectedMessage(msg); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">visibility</span> View
                                        </button>
                                        <button onClick={() => { handleReply(msg); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">reply</span> Reply via Email
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                        <button onClick={() => { handleDelete(msg.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">delete</span> Delete
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </AdminTable>

            {selectedMessage && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#15202b] w-full sm:max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 p-8 flex flex-col">
                        <button
                            onClick={() => setSelectedMessage(null)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="flex items-center gap-4 mb-8 shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                                <span className="material-symbols-outlined text-3xl">mail</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold dark:text-white text-slate-900">Message Detail</h3>
                                <p className="text-sm text-slate-500 font-mono">{selectedMessage.email}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-6 min-h-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sender</label>
                                    <p className="font-semibold dark:text-white text-slate-900">{selectedMessage.name}</p>
                                    {selectedMessage.phone && <p className="text-sm text-slate-500">{selectedMessage.phone}</p>}
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                                    <StatusBadge status={selectedMessage.status} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Inquiry Type</label>
                                    <p className="font-semibold text-slate-900 dark:text-white">{selectedMessage.inquiry_type}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Date</label>
                                    <p className="font-semibold dark:text-white text-slate-900">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Message</label>
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedMessage.message}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleReply(selectedMessage)}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all text-sm"
                                >
                                    Reply via Email
                                </button>
                            </div>
                            <button
                                onClick={() => { handleDelete(selectedMessage.id); }}
                                className="px-6 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-lg transition-all text-sm"
                            >
                                Delete
                            </button>
                        </div>
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
