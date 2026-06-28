'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';
import ConfirmModal from '@/components/admin/ConfirmModal';
import ErrorState from '@/components/shared/ErrorState';
import TableSkeleton from '@/components/shared/TableSkeleton';

interface Review {
    id: string;
    product_id: string | null;
    product_name?: string;
    customer_name: string;
    customer_email: string | null;
    rating: number;
    comment: string | null;
    status: 'pending' | 'approved' | 'rejected';
    is_featured: boolean;
    helpful_count: number;
    created_at: string;
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const { showToast } = useToast();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
    const [createForm, setCreateForm] = useState({
        product_id: '',
        customer_name: '',
        customer_email: '',
        rating: '5',
        comment: '',
        status: 'pending' as const,
    });
    const [createSaving, setCreateSaving] = useState(false);
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

    useEffect(() => {
        fetch('/api/products').then(r => r.json()).then(d => {
            if (d.success) setProducts(d.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        }).catch(() => {});
    }, []);

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
    };

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch('/api/reviews');
            const data = await res.json();
            if (data.success) {
                setReviews(data.data);
            } else {
                setError(true);
            }
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const updateStatus = async (id: string, status: string) => {
        const review = reviews.find(r => r.id === id);
        const res = await fetch(`/api/reviews?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        const data = await res.json();
        if (data.success) { showToast(`Review from "${review?.customer_name}" marked as ${status}.`, 'success'); load(); }
        else showToast('Failed to update review status.', 'error');
    };

    const toggleFeatured = async (review: Review) => {
        const res = await fetch(`/api/reviews?id=${review.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_featured: !review.is_featured }) });
        if ((await res.json()).success) { showToast(`Review from "${review.customer_name}" was ${review.is_featured ? 'unfeatured' : 'featured'}.`, 'success'); load(); }
    };

    const handleDelete = async (id: string) => {
        const review = reviews.find(r => r.id === id);
        setConfirmModal({
            isOpen: true,
            title: `Delete Review from "${review?.customer_name}"`,
            message: 'Delete this review permanently? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
                if ((await res.json()).success) { showToast(`Review from "${review?.customer_name}" was deleted successfully.`, 'success'); load(); }
                else showToast(`Failed to delete review from "${review?.customer_name}".`, 'error');
            }
        });
    };

    const handleBulkDelete = async () => {
        if (isBulkUpdating || selectedIds.size === 0) return;
        setConfirmModal({
            isOpen: true,
            title: 'Delete Reviews',
            message: `Are you sure you want to delete ${selectedIds.size} reviews? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsBulkUpdating(true);
                try {
                    const idsToDelete = Array.from(selectedIds);
                    const res = await fetch('/api/reviews', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: idsToDelete })
                    });
                    const data = await res.json();

                    if (data.success) {
                        showToast(`${idsToDelete.length} reviews were deleted successfully.`, 'success');
                        setSelectedIds(new Set());
                        load();
                    } else {
                        showToast(data.message || 'Failed to bulk delete reviews.', 'error');
                    }
                } catch {
                    showToast('An error occurred during bulk deletion.', 'error');
                } finally {
                    setIsBulkUpdating(false);
                }
            }
        });
    };

    const toggleSelectAll = () => {
        const visibleItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        const allVisibleSelected = visibleItems.every(r => selectedIds.has(r.id));

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleItems.forEach(r => next.delete(r.id));
            } else {
                visibleItems.forEach(r => next.add(r.id));
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

    const handleCreateReview = async () => {
        setCreateSaving(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...createForm,
                    rating: parseInt(createForm.rating),
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Review for "${createForm.customer_name}" created successfully.`, 'success');
                setShowCreateModal(false);
                setCreateForm({ product_id: '', customer_name: '', customer_email: '', rating: '5', comment: '', status: 'pending' });
                load();
            } else {
                showToast(data.message || 'Failed to create review.', 'error');
            }
        } catch {
            showToast('An error occurred while creating the review.', 'error');
        } finally {
            setCreateSaving(false);
        }
    };

    const filtered = filter === 'all' ? reviews : reviews.filter(r => r.status === filter);
    const counts = { all: reviews.length, pending: reviews.filter(r => r.status === 'pending').length, approved: reviews.filter(r => r.status === 'approved').length, rejected: reviews.filter(r => r.status === 'rejected').length };

    const paginatedReviews = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const StarRating = ({ rating }: { rating: number }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`material-symbols-outlined text-[14px] ${i <= rating ? 'text-amber-400' : 'text-slate-200 dark:text-slate-600'}`} style={i <= rating ? { fontVariationSettings: "'FILL' 1" } : {}}>star</span>
            ))}
        </div>
    );

    return (
        <AdminPageLayout
            title="Reviews"
            subtitle="Moderate customer reviews and control what appears on your storefront"
            actions={
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white text-sm font-bold rounded-lg shadow-md transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Add Review
                </button>
            }
            stats={
                <>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">All</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{counts.all}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Pending</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{counts.pending}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Approved</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{counts.approved}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Rejected</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{counts.rejected}</p>
                    </div>
                </>
            }
            filters={
                <AdminFilterTabs
                    tabs={[
                        { label: 'All Reviews', value: 'all' },
                        { label: 'Pending', value: 'pending' },
                        { label: 'Approved', value: 'approved' },
                        { label: 'Rejected', value: 'rejected' },
                    ]}
                    activeTab={filter}
                    onTabChange={(val) => { setFilter(val as 'all' | 'pending' | 'approved' | 'rejected'); setCurrentPage(1); }}
                />
            }
            pagination={
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filtered.length}
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
                    isDeleting={isBulkUpdating}
                />
            }
        >
            <AdminTable
                    headers={['Customer', 'Rating', 'Comment', 'Product', 'Status', 'Actions']}
                    onSelectAll={toggleSelectAll}
                    isAllSelected={filtered.length > 0 && paginatedReviews.every(r => selectedIds.has(r.id))}
                >
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="p-0">
                                <TableSkeleton rows={5} columns={6} />
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan={7} className="p-0">
                                <ErrorState onRetry={load} title="Database Error" message="Failed to load reviews from the server." />
                            </td>
                        </tr>
                    ) : filtered.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                No reviews found.
                            </td>
                        </tr>
                    ) : (
                        paginatedReviews.map((review) => (
                            <tr key={review.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(review.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                                <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
                                        checked={selectedIds.has(review.id)}
                                        onChange={() => toggleSelect(review.id)}
                                    />
                                </td>
                                <td className="py-3 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs flex-shrink-0">
                                            {review.customer_name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{review.customer_name}</p>
                                            {review.customer_email && <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{review.customer_email}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-6">
                                    <div className="flex flex-col gap-1">
                                        <StarRating rating={review.rating} />
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(review.created_at).toLocaleDateString()}</p>
                                    </div>
                                </td>
                                <td className="py-3 px-6">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-2 max-w-[250px]">
                                        &quot;{review.comment || 'No comment'}&quot;
                                    </p>
                                </td>
                                <td className="py-3 px-6">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{review.product_name || 'General'}</p>
                                </td>
                                <td className="py-3 px-6 text-right">
                                    <div className="flex flex-col gap-1 items-end">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${review.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : review.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                            {review.status}
                                        </span>
                                        {review.is_featured && (
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full mt-1">Featured</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right relative">
                                    <button onClick={(e) => toggleMenu(review.id, e)}
                                        className="action-menu-trigger text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>
                                    {activeMenu === review.id && (
                                        <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 action-menu animate-in zoom-in-95 duration-150 origin-top-right">
                                            {review.status !== 'approved' && (
                                                <button onClick={() => { updateStatus(review.id, 'approved'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">check</span> Approve
                                                </button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <button onClick={() => { updateStatus(review.id, 'rejected'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">close</span> Reject
                                                </button>
                                            )}
                                            <button onClick={() => { toggleFeatured(review); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">star</span> {review.is_featured ? 'Unfeature' : 'Mark Featured'}
                                            </button>
                                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                            <button onClick={() => { handleDelete(review.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">delete</span> Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </AdminTable>
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">Add Review</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Product</label>
                                <select value={createForm.product_id} onChange={e => setCreateForm(f => ({ ...f, product_id: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white">
                                    <option value="">Select product...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Customer Name *</label>
                                <input value={createForm.customer_name} onChange={e => setCreateForm(f => ({ ...f, customer_name: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Rating *</label>
                                <select value={createForm.rating} onChange={e => setCreateForm(f => ({ ...f, rating: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white">
                                    {[5,4,3,2,1].map(n => <option key={n} value={String(n)}>{n} Star{n > 1 ? 's' : ''}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Comment</label>
                                <textarea value={createForm.comment} onChange={e => setCreateForm(f => ({ ...f, comment: e.target.value }))} rows={3}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={handleCreateReview} disabled={createSaving || !createForm.customer_name}
                                className="flex-1 py-2.5 rounded-xl bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold text-sm transition-colors disabled:opacity-50">
                                {createSaving ? 'Creating...' : 'Create Review'}
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
