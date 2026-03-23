'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';

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
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 3000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/reviews');
        const data = await res.json();
        if (data.success) setReviews(data.data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const updateStatus = async (id: string, status: string) => {
        const res = await fetch(`/api/reviews?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        const data = await res.json();
        if (data.success) { showToast(`Review ${status}`); load(); }
        else showToast('Failed to update', 'error');
    };

    const toggleFeatured = async (review: Review) => {
        const res = await fetch(`/api/reviews?id=${review.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_featured: !review.is_featured }) });
        if ((await res.json()).success) { showToast(review.is_featured ? 'Unfeatured' : 'Marked as featured'); load(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this review permanently?')) return;
        const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
        if ((await res.json()).success) { showToast('Review deleted'); load(); }
        else showToast('Failed to delete', 'error');
    };

    const handleBulkDelete = async () => {
        if (isBulkUpdating || selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} reviews?`)) return;

        setIsBulkUpdating(true);
        try {
            const results = await Promise.all(
                Array.from(selectedIds).map(id =>
                    fetch(`/api/reviews?id=${id}`, { method: 'DELETE' }).then(res => res.json())
                )
            );
            const successCount = results.filter(r => r.success).length;
            showToast(`${successCount} reviews deleted successfully`);
            load();
            setSelectedIds(new Set());
        } catch (err) {
            showToast('Bulk delete failed', 'error');
        } finally {
            setIsBulkUpdating(false);
        }
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

    const filtered = filter === 'all' ? reviews : reviews.filter(r => r.status === filter);
    const counts = { all: reviews.length, pending: reviews.filter(r => r.status === 'pending').length, approved: reviews.filter(r => r.status === 'approved').length, rejected: reviews.filter(r => r.status === 'rejected').length };
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
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
            filters={
                <AdminFilterTabs
                    tabs={[
                        { label: 'All Reviews', value: 'all' },
                        { label: 'Pending', value: 'pending' },
                        { label: 'Approved', value: 'approved' },
                        { label: 'Rejected', value: 'rejected' },
                    ]}
                    activeTab={filter}
                    onTabChange={(val) => { setFilter(val as any); setCurrentPage(1); }}
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
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl font-semibold text-white text-sm shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.text}
                </div>
            )}

            <div className="flex flex-col h-full gap-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                    {[
                        { label: 'All', key: 'all', icon: 'reviews', color: 'text-blue-600' },
                        { label: 'Pending', key: 'pending', icon: 'pending', color: 'text-amber-500' },
                        { label: 'Approved', key: 'approved', icon: 'check_circle', color: 'text-green-600' },
                        { label: 'Rejected', key: 'rejected', icon: 'cancel', color: 'text-red-500' },
                    ].map(s => (
                        <div key={s.key} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                                <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{counts[s.key as keyof typeof counts]}</p>
                        </div>
                    ))}
                </div>

                {/* Reviews Table */}
                <AdminTable
                    headers={['Customer', 'Rating', 'Comment', 'Product', 'Status', 'Actions']}
                    onSelectAll={toggleSelectAll}
                    isAllSelected={filtered.length > 0 && paginatedReviews.every(r => selectedIds.has(r.id))}
                >
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined animate-spin text-2xl text-[#d41132]">progress_activity</span>
                                    Loading reviews...
                                </div>
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
                                        "{review.comment || 'No comment'}"
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
                                <td className="py-3 px-6 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {review.status !== 'approved' && (
                                            <button onClick={() => updateStatus(review.id, 'approved')} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-400 hover:text-green-600 transition-colors" title="Approve">
                                                <span className="material-symbols-outlined text-[18px]">check</span>
                                            </button>
                                        )}
                                        {review.status !== 'rejected' && (
                                            <button onClick={() => updateStatus(review.id, 'rejected')} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-colors" title="Reject">
                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                            </button>
                                        )}
                                        <button onClick={() => toggleFeatured(review)} className={`p-1.5 rounded-lg transition-colors ${review.is_featured ? 'text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`} title={review.is_featured ? 'Unfeature' : 'Feature'}>
                                            <span className="material-symbols-outlined text-[18px]" style={review.is_featured ? { fontVariationSettings: "'FILL' 1" } : {}}>star</span>
                                        </button>
                                        <button onClick={() => handleDelete(review.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </AdminTable>
            </div>
        </AdminPageLayout>
    );
}
