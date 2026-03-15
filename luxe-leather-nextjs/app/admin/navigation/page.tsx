'use client';

import { useState, useEffect, useCallback } from 'react';

interface NavItem {
    id: string;
    label: string;
    url: string;
    display_order: number;
    is_visible: boolean;
    opens_in_new_tab: boolean;
}

const emptyForm = { label: '', url: '', display_order: '0', is_visible: true, opens_in_new_tab: false };

export default function AdminNavigationPage() {
    const [items, setItems] = useState<NavItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<NavItem | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 3000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/nav-items');
        const data = await res.json();
        if (data.success) setItems(data.data.sort((a: NavItem, b: NavItem) => a.display_order - b.display_order));
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditingItem(null); setForm({ ...emptyForm, display_order: String(items.length + 1) }); setShowModal(true); };
    const openEdit = (item: NavItem) => {
        setEditingItem(item);
        setForm({ label: item.label, url: item.url, display_order: String(item.display_order), is_visible: item.is_visible, opens_in_new_tab: item.opens_in_new_tab });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const payload = { label: form.label, url: form.url, display_order: parseInt(form.display_order), is_visible: form.is_visible, opens_in_new_tab: form.opens_in_new_tab };
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem ? `/api/nav-items?id=${editingItem.id}` : '/api/nav-items';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) { showToast(editingItem ? 'Nav item updated!' : 'Nav item added!'); setShowModal(false); load(); }
        else showToast(data.message || 'Failed to save', 'error');
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this nav item?')) return;
        const res = await fetch(`/api/nav-items?id=${id}`, { method: 'DELETE' });
        if ((await res.json()).success) { showToast('Nav item removed'); load(); }
        else showToast('Failed to delete', 'error');
    };

    const toggleVisibility = async (item: NavItem) => {
        await fetch(`/api/nav-items?id=${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_visible: !item.is_visible }) });
        load();
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
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Navigation Editor</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Control what links appear in your storefront header</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">add</span> Add Link
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Nav Items List */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400">drag_indicator</span>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Menu Items (ordered by display order)</p>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-2 block">menu</span>
                                <p>No navigation items. Run DB migration first.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {items.map((item, idx) => (
                                    <div key={item.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!item.is_visible ? 'opacity-50' : ''}`}>
                                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-500 flex-shrink-0">
                                            {item.display_order}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{item.label}</p>
                                            <p className="text-xs text-slate-400 font-mono truncate">{item.url}{item.opens_in_new_tab && <span className="ml-2 text-blue-400">↗ new tab</span>}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => toggleVisibility(item)} className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full transition-all ${item.is_visible ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 hover:bg-slate-200'}`}>
                                                {item.is_visible ? 'Visible' : 'Hidden'}
                                            </button>
                                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Preview */}
                <div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm sticky top-6">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Live Header Preview</p>
                        <div className="bg-slate-900 rounded-xl p-3 flex items-center gap-4 overflow-x-auto">
                            <div className="text-white font-black text-xs flex-shrink-0">Luxe Leather</div>
                            <div className="flex gap-3 flex-wrap">
                                {items.filter(i => i.is_visible).map(i => (
                                    <span key={i.id} className="text-slate-300 text-[11px] font-medium whitespace-nowrap">{i.label}</span>
                                ))}
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-3 text-center">Only visible items appear in header</p>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">{editingItem ? 'Edit Link' : 'New Nav Link'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Label *</label>
                                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Shop" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">URL *</label>
                                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="/shop or https://example.com" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono focus:border-[#d41132] outline-none dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Display Order</label>
                                <input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white" />
                            </div>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div onClick={() => setForm(f => ({ ...f, is_visible: !f.is_visible }))} className={`relative w-10 h-5 rounded-full transition-all ${form.is_visible ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_visible ? 'translate-x-5' : ''}`} />
                                    </div>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Visible</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div onClick={() => setForm(f => ({ ...f, opens_in_new_tab: !f.opens_in_new_tab }))} className={`relative w-10 h-5 rounded-full transition-all ${form.opens_in_new_tab ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.opens_in_new_tab ? 'translate-x-5' : ''}`} />
                                    </div>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">New Tab</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.label || !form.url} className="flex-1 py-2.5 rounded-xl bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold text-sm transition-colors disabled:opacity-50">
                                {saving ? 'Saving...' : (editingItem ? 'Save Changes' : 'Add Link')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
