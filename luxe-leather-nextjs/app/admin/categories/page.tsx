'use client';

import { useState, useEffect, useCallback } from 'react';

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

    return (
        <main className="flex-1 overflow-y-auto bg-[#f6f7f8] dark:bg-[#101922] p-6 md:p-8">
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl font-semibold text-white text-sm shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.text}
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Categories</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage product categories shown in the shop filters</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">add</span> Add Category
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categories.map(cat => (
                        <div key={cat.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                            {/* Image */}
                            <div className="aspect-video bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                                {cat.image_url ? (
                                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-5xl text-slate-300">category</span>
                                    </div>
                                )}
                                {!cat.is_visible && (
                                    <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Hidden</div>
                                )}
                            </div>
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white">{cat.name}</h3>
                                        <p className="text-xs text-slate-400 font-mono">/{cat.slug}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button onClick={() => setDeleteId(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                                {cat.description && <p className="text-sm text-slate-500 line-clamp-2">{cat.description}</p>}
                                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <span className="text-xs text-slate-400">Order: <strong>{cat.display_order}</strong></span>
                                    {cat.product_count !== undefined && <span className="text-xs text-slate-400">{cat.product_count} products</span>}
                                </div>
                            </div>
                        </div>
                    ))}

                    {categories.length === 0 && (
                        <div className="col-span-3 text-center py-20 text-slate-400">
                            <span className="material-symbols-outlined text-5xl mb-3 block">category</span>
                            <p className="font-semibold">No categories yet. Run the DB migration first.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><span className="material-symbols-outlined">close</span></button>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Display Order</label>
                                    <input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white" />
                                </div>
                                <div className="flex items-end pb-0.5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div onClick={() => setForm(f => ({ ...f, is_visible: !f.is_visible }))} className={`relative w-10 h-5 rounded-full transition-all ${form.is_visible ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_visible ? 'translate-x-5' : ''}`} />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
                        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-red-500 text-3xl">delete</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Delete Category?</h3>
                        <p className="text-slate-500 text-sm mb-6">Products in this category won't be deleted, but they'll lose their category.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
