'use client';

import { useState, useEffect, useCallback } from 'react';

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
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

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

    const filtered = filter === 'all' ? reviews : reviews.filter(r => r.status === filter);
    const counts = { all: reviews.length, pending: reviews.filter(r => r.status === 'pending').length, approved: reviews.filter(r => r.status === 'approved').length, rejected: reviews.filter(r => r.status === 'rejected').length };
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedReviews = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const StarRating = ({ rating }: { rating: number }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`material-symbols-outlined text-[14px] ${i <= rating ? 'text-amber-400' : 'text-slate-200 dark:text-slate-600'}`} style={i <= rating ? { fontVariationSettings: "'FILL' 1" } : {}}>star</span>
            ))}
        </div>
    );

    return (
        <main className="flex-1 overflow-y-auto bg-[#f6f7f8] dark:bg-[#101922] p-6 md:p-8">
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl font-semibold text-white text-sm shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.text}
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Reviews</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Moderate customer reviews and control what appears on your storefront</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'All', key: 'all', icon: 'reviews', color: 'text-blue-600' },
                    { label: 'Pending', key: 'pending', icon: 'pending', color: 'text-amber-500' },
                    { label: 'Approved', key: 'approved', icon: 'check_circle', color: 'text-green-600' },
                    { label: 'Rejected', key: 'rejected', icon: 'cancel', color: 'text-red-500' },
                ].map(s => (
                    <button key={s.key} onClick={() => { setFilter(s.key as any); setCurrentPage(1); }} className={`bg-white dark:bg-slate-800 rounded-xl p-4 border transition-all text-left ${filter === s.key ? 'border-[#d41132] shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                            <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{counts[s.key as keyof typeof counts]}</p>
                    </button>
                ))}
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-5xl mb-3 block">reviews</span>
                        <p className="font-semibold">No {filter !== 'all' ? filter : ''} reviews found</p>
                    </div>
                ) : (
                    <>
                        {filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(review => (
                            <div key={review.id} className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm transition-all ${review.status === 'pending' ? 'border-amber-200 dark:border-amber-800/40' : review.status === 'approved' ? 'border-green-200 dark:border-green-800/40' : 'border-slate-200 dark:border-slate-700'}`}>
                                <div className="p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm flex-shrink-0">
                                                    {review.customer_name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{review.customer_name}</p>
                                                    {review.customer_email && <p className="text-xs text-slate-400">{review.customer_email}</p>}
                                                </div>
                                                <StarRating rating={review.rating} />
                                                {review.is_featured && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">Featured</span>
                                                )}
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${review.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : review.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                    {review.status}
                                                </span>
                                            </div>
                                            {review.comment && <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">"{review.comment}"</p>}
                                            <p className="text-[10px] text-slate-400 mt-2">{new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                        <div className="flex flex-row sm:flex-col gap-2 flex-wrap">
                                            {review.status !== 'approved' && (
                                                <button onClick={() => updateStatus(review.id, 'approved')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold hover:bg-green-100 transition-colors">
                                                    <span className="material-symbols-outlined text-[14px]">check</span> Approve
                                                </button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <button onClick={() => updateStatus(review.id, 'rejected')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 transition-colors">
                                                    <span className="material-symbols-outlined text-[14px]">close</span> Reject
                                                </button>
                                            )}
                                            <button onClick={() => toggleFeatured(review)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${review.is_featured ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}>
                                                <span className="material-symbols-outlined text-[14px]" style={review.is_featured ? { fontVariationSettings: "'FILL' 1" } : {}}>star</span>
                                                {review.is_featured ? 'Unfeature' : 'Feature'}
                                            </button>
                                            <button onClick={() => handleDelete(review.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-red-500 text-xs font-bold hover:bg-red-50 transition-colors">
                                                <span className="material-symbols-outlined text-[14px]">delete</span> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-3">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Previous</button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(page => (
                                        <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 text-sm rounded border transition-colors ${currentPage === page ? 'bg-[#d41132] text-white border-[#d41132]' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{page}</button>
                                    ))}
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Next</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
