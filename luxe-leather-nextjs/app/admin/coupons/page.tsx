'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';
import ConfirmModal from '@/components/admin/ConfirmModal';

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
    const { showToast } = useToast();
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
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

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
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
        if (data.success) { showToast(editingCoupon ? `Coupon "${form.code}" updated successfully.` : `Coupon "${form.code}" created successfully.`, 'success'); setShowModal(false); loadCoupons(); }
        else showToast(data.message || 'Failed to save coupon.', 'error');
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        const coupon = coupons.find(c => c.id === id);
        setConfirmModal({
            isOpen: true,
            title: `Delete Coupon "${coupon?.code}"`,
            message: 'Are you sure you want to delete this coupon? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                const res = await fetch(`/api/coupons/admin?id=${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) { showToast(`Coupon "${coupon?.code}" was deleted successfully.`, 'success'); loadCoupons(); }
                else showToast(`Failed to delete coupon "${coupon?.code}".`, 'error');
            }
        });
    };

    const toggleActive = async (c: Coupon) => {
        const res = await fetch(`/api/coupons/admin?id=${c.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...c, is_active: !c.is_active })
        });
        if (res.ok) {
            showToast(`Coupon "${c.code}" is now ${!c.is_active ? 'active' : 'inactive'}.`, 'success');
        } else {
            showToast(`Failed to update status for coupon "${c.code}".`, 'error');
        }
        loadCoupons();
    };

    const filteredCoupons = coupons.filter(c => {
        if (statusFilter === 'active') return c.is_active;
        if (statusFilter === 'inactive') return !c.is_active;
        return true;
    });

    const handleBulkDelete = async () => {
        if (isBulkDeleting || selectedIds.size === 0) return;
        setConfirmModal({
            isOpen: true,
            title: 'Delete Coupons',
            message: `Are you sure you want to delete ${selectedIds.size} coupons? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsBulkDeleting(true);
                try {
                    const results = await Promise.all(
                        Array.from(selectedIds).map(id =>
                            fetch(`/api/coupons/admin?id=${id}`, { method: 'DELETE' }).then(res => res.json())
                        )
                    );
                    const successCount = results.filter(r => r.success).length;
                    const failCount = selectedIds.size - successCount;
                    if (failCount > 0) {
                        showToast(`Bulk delete finished. ${successCount} deleted, ${failCount} failed.`, 'error');
                    } else {
                        showToast(`${successCount} coupons were deleted successfully.`, 'success');
                    }
                    loadCoupons();
                    setSelectedIds(new Set());
                } catch {
                    showToast('An error occurred during bulk deletion.', 'error');
                } finally {
                    setIsBulkDeleting(false);
                }
            }
        });
    };

    const toggleSelectAll = () => {
        const visibleCoupons = filteredCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        const allVisibleSelected = visibleCoupons.every(c => selectedIds.has(c.id));

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleCoupons.forEach(c => next.delete(c.id));
            } else {
                visibleCoupons.forEach(c => next.add(c.id));
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
            title="Coupons"
            subtitle="Create and manage discount codes for your storefront"
            actions={
                <button onClick={openCreate} className="flex items-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md">
                    <span className="material-symbols-outlined text-[18px]">add</span> New Coupon
                </button>
            }
            filters={
                <AdminFilterTabs
                    tabs={[
                        { label: 'All Coupons', value: 'all' },
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                    ]}
                    activeTab={statusFilter}
                    onTabChange={(val) => setStatusFilter(val as 'all' | 'active' | 'inactive')}
                />
            }
            pagination={
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filteredCoupons.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(val) => {
                        setItemsPerPage(val);
                        setCurrentPage(1);
                    }}
                />
            }
            stats={
                <>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total Coupons</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{coupons.length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Active</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{coupons.filter(c => c.is_active).length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Inactive</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{coupons.filter(c => !c.is_active).length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total Uses</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{coupons.reduce((sum, c) => sum + (c.uses_count || 0), 0)}</p>
                    </div>
                </>
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
                headers={['Code', 'Type', 'Value', 'Min. Order', 'Uses', 'Expiry', 'Status', 'Actions']}
                onSelectAll={toggleSelectAll}
                isAllSelected={filteredCoupons.length > 0 && filteredCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(c => selectedIds.has(c.id))}
            >
                {loading ? (
                    <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                            <div className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                Loading coupons...
                            </div>
                        </td>
                    </tr>
                ) : filteredCoupons.length === 0 ? (
                    <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                            No codes found.
                        </td>
                    </tr>
                ) : (
                    filteredCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((c) => (
                        <tr key={c.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(c.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                            <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
                                    checked={selectedIds.has(c.id)}
                                    onChange={() => toggleSelect(c.id)}
                                />
                            </td>
                            <td className="px-4 py-4"><span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{c.code}</span></td>
                            <td className="px-4 py-4 capitalize text-slate-600 dark:text-slate-300">{c.discount_type}</td>
                            <td className="px-4 py-4 font-bold text-slate-900 dark:text-white">{c.discount_type === 'percentage' ? `${c.value}%` : `$${c.value}`}</td>
                            <td className="px-4 py-4 text-slate-500 dark:text-slate-400 font-medium">{c.min_order_amount ? `$${c.min_order_amount}` : '—'}</td>
                            <td className="px-4 py-4 text-slate-500 dark:text-slate-400 font-medium">{c.uses_count || 0}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                            <td className="px-4 py-4 text-slate-500 dark:text-slate-400 font-medium">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : '—'}</td>
                            <td className="px-4 py-4">
                                <button onClick={() => toggleActive(c)} className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${c.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                    {c.is_active ? 'Active' : 'Inactive'}
                                </button>
                            </td>
                            <td className="px-4 py-4 text-right relative">
                                <button
                                    onClick={(e) => toggleMenu(c.id, e)}
                                    className="action-menu-trigger text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                                {activeMenu === c.id && (
                                    <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 action-menu animate-in zoom-in-95 duration-150 origin-top-right">
                                        <button onClick={() => { toggleActive(c); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">{c.is_active ? 'toggle_off' : 'toggle_on'}</span> {c.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button onClick={() => { openEdit(c); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">edit</span> Edit
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                        <button onClick={() => { handleDelete(c.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">delete</span> Delete
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </AdminTable>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Code *</label>
                                    <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:border-[#d41132] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Type *</label>
                                    <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'percentage' | 'flat' }))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none">
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat Amount ($)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Value *</label>
                                    <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.discount_type === 'percentage' ? '10' : '25'} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Min. Order ($)</label>
                                    <input type="number" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="50" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
