'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    display_order: number;
    is_visible: boolean;
    product_count?: number;
}

const emptyForm = { name: '', slug: '', description: '', image_url: '', display_order: '0', is_visible: true };

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadCategories = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) setCategories(data.data);
        setLoading(false);
    }, []);

    useEffect(() => { loadCategories(); }, [loadCategories]);

    const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

    const openCreate = () => { setEditingCategory(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (c: Category) => {
        setEditingCategory(c);
        setForm({ name: c.name, slug: c.slug, description: c.description || '', image_url: c.image_url || '', display_order: String(c.display_order), is_visible: c.is_visible });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const payload = { name: form.name, slug: form.slug || generateSlug(form.name), description: form.description || null, image_url: form.image_url || null, display_order: parseInt(form.display_order), is_visible: form.is_visible };
        const method = editingCategory ? 'PUT' : 'POST';
        const url = editingCategory ? `/api/categories?id=${editingCategory.id}` : '/api/categories';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) { showToast(editingCategory ? 'Category updated!' : 'Category created!'); setShowModal(false); loadCategories(); }
        else showToast(data.message || 'Failed to save', 'error');
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { showToast('Category deleted'); loadCategories(); }
        else showToast('Failed to delete', 'error');
        setDeleteId(null);
    };

    const handleBulkDelete = async () => {
        if (isBulkDeleting || selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} categories?`)) return;

        setIsBulkDeleting(true);
        try {
            const results = await Promise.all(
                Array.from(selectedIds).map(id =>
                    fetch(`/api/categories?id=${id}`, { method: 'DELETE' }).then(res => res.json())
                )
            );
            const successCount = results.filter(r => r.success).length;
            showToast(`${successCount} categories deleted successfully`);
            loadCategories();
            setSelectedIds(new Set());
        } catch (err) {
            showToast('Bulk delete failed', 'error');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        const visibleItems = categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        const allVisibleSelected = visibleItems.every(c => selectedIds.has(c.id));

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleItems.forEach(c => next.delete(c.id));
            } else {
                visibleItems.forEach(c => next.add(c.id));
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

    return (
        <AdminPageLayout
            title="Categories"
            subtitle="Manage product categories shown in the shop filters"
            actions={
                <button onClick={openCreate} className="flex items-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md">
                    <span className="material-symbols-outlined text-[18px]">add</span> Add Category
                </button>
            }
            pagination={
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={categories.length}
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
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl font-semibold text-white text-sm shadow-xl transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.text}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
                </div>
            ) : (
                <AdminTable
                    headers={['Image', 'Category Name', 'Slug', 'Order', 'Products', 'Status', 'Actions']}
                    onSelectAll={toggleSelectAll}
                    isAllSelected={categories.length > 0 && categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(c => selectedIds.has(c.id))}
                >
                    {categories.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                                No categories found.
                            </td>
                        </tr>
                    ) : (
                        categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((cat) => (
                            <tr key={cat.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(cat.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                                <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
                                        checked={selectedIds.has(cat.id)}
                                        onChange={() => toggleSelect(cat.id)}
                                    />
                                </td>
                                <td className="py-3 px-6">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                        {cat.image_url ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" /> : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <span className="material-symbols-outlined text-xl">category</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-6">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{cat.name}</p>
                                        {cat.description && <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] mt-1">{cat.description}</p>}
                                    </div>
                                </td>
                                <td className="py-3 px-6">
                                    <span className="font-mono text-xs text-slate-500 uppercase font-bold tracking-wider">/{cat.slug}</span>
                                </td>
                                <td className="py-3 px-6">
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-black">{cat.display_order}</span>
                                </td>
                                <td className="py-3 px-6">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{cat.product_count || 0}</span>
                                </td>
                                <td className="py-3 px-6">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cat.is_visible ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                        {cat.is_visible ? 'Visible' : 'Hidden'}
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button onClick={() => setDeleteId(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </AdminTable>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Name *</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))} placeholder="Leather Jackets" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Slug</label>
                                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="leather-jackets" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono focus:border-[#d41132] outline-none dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Description</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Brief description..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none resize-none dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Image URL</label>
                                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Display Order</label>
                                    <input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white" />
                                </div>
                                <div className="flex items-end pb-0.5">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div onClick={() => setForm(f => ({ ...f, is_visible: !f.is_visible }))} className={`relative w-11 h-6 rounded-full transition-all ${form.is_visible ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_visible ? 'translate-x-5' : ''}`} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Visible</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-2.5 rounded-xl bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold text-sm transition-colors disabled:opacity-50">
                                {saving ? 'Saving...' : (editingCategory ? 'Save Changes' : 'Create Category')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-red-500 text-3xl">delete</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Delete Category?</h3>
                        <p className="text-slate-500 text-sm mb-6">Products in this category won't be deleted, but they'll lose their category.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageLayout>
    );
}
