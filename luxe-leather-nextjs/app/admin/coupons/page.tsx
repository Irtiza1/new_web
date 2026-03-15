'use client';

import { useState, useEffect, useCallback } from 'react';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'flat';
    value: number;
    min_order_amount: number | null;
    max_uses: number | null;
    uses_count: number;
    is_active: boolean;
    expiry_date: string | null;
    created_at: string;
}

const emptyForm: { code: string; discount_type: 'percentage' | 'flat'; value: string; min_order_amount: string; max_uses: string; expiry_date: string; is_active: boolean } = {
    code: '', discount_type: 'percentage', value: '', min_order_amount: '', max_uses: '', expiry_date: '', is_active: true
};

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadCoupons = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/coupons/admin');
        const data = await res.json();
        if (data.success) setCoupons(data.data);
        setLoading(false);
    }, []);

    useEffect(() => { loadCoupons(); }, [loadCoupons]);

    const openCreate = () => { setEditingCoupon(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (c: Coupon) => {
        setEditingCoupon(c);
        setForm({
            code: c.code, discount_type: c.discount_type,
            value: String(c.value), min_order_amount: String(c.min_order_amount || ''),
            max_uses: String(c.max_uses || ''),
            expiry_date: c.expiry_date ? c.expiry_date.split('T')[0] : '',
            is_active: c.is_active
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const payload = {
            code: form.code.toUpperCase(),
            discount_type: form.discount_type,
            value: parseFloat(form.value),
            min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
            max_uses: form.max_uses ? parseInt(form.max_uses) : null,
            expiry_date: form.expiry_date || null,
            is_active: form.is_active,
        };
        const method = editingCoupon ? 'PUT' : 'POST';
        const url = editingCoupon ? `/api/coupons/admin?id=${editingCoupon.id}` : '/api/coupons/admin';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) { showToast(editingCoupon ? 'Coupon updated!' : 'Coupon created!'); setShowModal(false); loadCoupons(); }
        else showToast(data.message || 'Failed to save', 'error');
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/coupons/admin?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { showToast('Coupon deleted'); loadCoupons(); }
        else showToast('Failed to delete', 'error');
        setDeleteId(null);
    };

    const toggleActive = async (c: Coupon) => {
        await fetch(`/api/coupons/admin?id=${c.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...c, is_active: !c.is_active })
        });
        loadCoupons();
    };

    return (
        <main className="flex-1 overflow-y-auto bg-[#f6f7f8] dark:bg-[#101922] p-6 md:p-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl font-semibold text-white text-sm shadow-xl transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.text}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Coupons</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create and manage discount codes for your storefront</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md">
                    <span className="material-symbols-outlined text-[18px]">add</span> New Coupon
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Coupons', value: coupons.length, icon: 'local_offer', color: 'text-blue-600' },
                    { label: 'Active', value: coupons.filter(c => c.is_active).length, icon: 'check_circle', color: 'text-green-600' },
                    { label: 'Inactive', value: coupons.filter(c => !c.is_active).length, icon: 'unpublished', color: 'text-red-600' },
                    { label: 'Total Uses', value: coupons.reduce((sum, c) => sum + (c.uses_count || 0), 0), icon: 'confirmation_number', color: 'text-amber-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{s.label}</p>
                            <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-3 block">local_offer</span>
                        <p className="font-semibold">No coupons yet</p>
                        <button onClick={openCreate} className="mt-4 text-[#d41132] font-bold text-sm hover:underline">Create your first coupon →</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {['Code', 'Type', 'Value', 'Min. Order', 'Uses', 'Expiry', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {coupons.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3"><span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{c.code}</span></td>
                                        <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">{c.discount_type}</td>
                                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{c.discount_type === 'percentage' ? `${c.value}%` : `$${c.value}`}</td>
                                        <td className="px-4 py-3 text-slate-500">{c.min_order_amount ? `$${c.min_order_amount}` : '—'}</td>
                                        <td className="px-4 py-3 text-slate-500">{c.uses_count || 0}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                                        <td className="px-4 py-3 text-slate-500">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => toggleActive(c)} className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${c.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                                {c.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Code *</label>
                                    <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:border-[#d41132] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Type *</label>
                                    <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as any }))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none">
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat Amount ($)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Value *</label>
                                    <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.discount_type === 'percentage' ? '10' : '25'} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Min. Order ($)</label>
                                    <input type="number" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="50" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Max Uses</label>
                                    <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Expiry Date</label>
                                    <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className={`relative w-12 h-6 rounded-full transition-all ${form.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-6' : ''}`} />
                                </button>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{form.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.code || !form.value} className="flex-1 py-2.5 rounded-xl bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold text-sm transition-colors disabled:opacity-50">
                                {saving ? 'Saving...' : (editingCoupon ? 'Save Changes' : 'Create Coupon')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
                        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-red-500 text-3xl">delete</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Delete Coupon?</h3>
                        <p className="text-slate-500 text-sm mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
