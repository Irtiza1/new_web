'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';
import ConfirmModal from '@/components/admin/ConfirmModal';

interface ShippingZone {
    id: string;
    name: string;
    regions: string;
    handling_days: number;
    rate: number;
    free_above: number | null;
    is_active: boolean;
}

const emptyForm = { name: '', regions: '', handling_days: '7', rate: '0', free_above: '', is_active: true };

export default function AdminShippingPage() {
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
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

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/shipping-zones');
            const data = await res.json();
            if (data.success) setZones(data.data || []);
        } catch (_) { }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditingZone(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (zone: ShippingZone) => {
        setEditingZone(zone);
        setForm({ name: zone.name, regions: zone.regions, handling_days: String(zone.handling_days), rate: String(zone.rate), free_above: zone.free_above ? String(zone.free_above) : '', is_active: zone.is_active });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const payload = { name: form.name, regions: form.regions, handling_days: parseInt(form.handling_days), rate: parseFloat(form.rate), free_above: form.free_above ? parseFloat(form.free_above) : null, is_active: form.is_active };
        const method = editingZone ? 'PUT' : 'POST';
        const url = editingZone ? `/api/shipping-zones?id=${editingZone.id}` : '/api/shipping-zones';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) { showToast(editingZone ? `Shipping Zone "${form.name}" updated successfully.` : `Shipping Zone "${form.name}" created successfully.`, 'success'); setShowModal(false); load(); }
        else showToast(data.message || 'Failed to save shipping zone.', 'error');
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        const zone = zones.find(z => z.id === id);
        setConfirmModal({
            isOpen: true,
            title: `Delete Shipping Zone "${zone?.name}"`,
            message: 'Delete this shipping zone? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                const res = await fetch(`/api/shipping-zones?id=${id}`, { method: 'DELETE' });
                if ((await res.json()).success) { showToast(`Shipping Zone "${zone?.name}" was deleted successfully.`, 'success'); load(); }
                else showToast(`Failed to delete shipping zone "${zone?.name}".`, 'error');
            }
        });
    };

    const handleBulkDelete = async () => {
        if (isBulkDeleting || selectedIds.size === 0) return;
        setConfirmModal({
            isOpen: true,
            title: 'Delete Shipping Zones',
            message: `Are you sure you want to delete ${selectedIds.size} shipping zones? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsBulkDeleting(true);
                try {
                    const results = await Promise.all(
                        Array.from(selectedIds).map(id =>
                            fetch(`/api/shipping-zones?id=${id}`, { method: 'DELETE' }).then(res => res.json())
                        )
                    );
                    const successCount = results.filter(r => r.success).length;
                    const failCount = selectedIds.size - successCount;
                    if (failCount > 0) {
                        showToast(`Bulk delete finished. ${successCount} deleted, ${failCount} failed.`, 'error');
                    } else {
                        showToast(`${successCount} shipping zones were deleted successfully.`, 'success');
                    }
                    load();
                    setSelectedIds(new Set());
                } catch (err) {
                    showToast('An error occurred during bulk deletion.', 'error');
                } finally {
                    setIsBulkDeleting(false);
                }
            }
        });
    };

    const toggleSelectAll = () => {
        const visibleItems = filteredZones.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        const allVisibleSelected = visibleItems.every(z => selectedIds.has(z.id));

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleItems.forEach(z => next.delete(z.id));
            } else {
                visibleItems.forEach(z => next.add(z.id));
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

    const formatRate = (zone: ShippingZone) => {
        if (zone.rate === 0) return 'Free';
        return `$${zone.rate.toFixed(2)}${zone.free_above ? ` (free above $${zone.free_above})` : ''}`;
    };

    const filteredZones = zones.filter(z => {
        if (statusFilter === 'active') return z.is_active;
        if (statusFilter === 'inactive') return !z.is_active;
        return true;
    });

    return (
        <AdminPageLayout
            title="Shipping Zones"
            subtitle="Manage shipping rates and delivery regions for your store"
            actions={
                <button onClick={openCreate} className="flex items-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md">
                    <span className="material-symbols-outlined text-[18px]">add</span> Add Zone
                </button>
            }
            filters={
                <AdminFilterTabs
                    tabs={[
                        { label: 'All Zones', value: 'all' },
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                    ]}
                    activeTab={statusFilter}
                    onTabChange={(val) => setStatusFilter(val as any)}
                />
            }
            pagination={
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filteredZones.length}
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
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total Zones</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{zones.length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Active</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{zones.filter(z => z.is_active).length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Free Shipping Zones</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{zones.filter(z => z.rate === 0).length}</p>
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
                    headers={['Zone Name', 'Regions', 'Rate', 'Delivery Time', 'Status', 'Actions']}
                    onSelectAll={toggleSelectAll}
                    isAllSelected={filteredZones.length > 0 && filteredZones.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(z => selectedIds.has(z.id))}
                >
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined animate-spin text-2xl text-[#d41132]">progress_activity</span>
                                    Loading zones...
                                </div>
                            </td>
                        </tr>
                    ) : filteredZones.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                No shipping zones found.
                            </td>
                        </tr>
                    ) : (
                        filteredZones.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((zone) => (
                            <tr key={zone.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(zone.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                                <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
                                        checked={selectedIds.has(zone.id)}
                                        onChange={() => toggleSelect(zone.id)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-900 dark:text-white">{zone.name}</p>
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate font-medium">{zone.regions}</td>
                                <td className="px-6 py-4 font-black text-slate-700 dark:text-slate-300">{formatRate(zone)}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{zone.handling_days} days</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${zone.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                                        {zone.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right relative">
                                    <button
                                        onClick={(e) => toggleMenu(zone.id, e)}
                                        className="action-menu-trigger text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>
                                    {activeMenu === zone.id && (
                                        <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 action-menu animate-in zoom-in-95 duration-150 origin-top-right">
                                            <button onClick={() => { openEdit(zone); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">edit</span> Edit
                                            </button>
                                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                            <button onClick={() => { handleDelete(zone.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">delete</span> Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </AdminTable>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">{editingZone ? 'Edit Shipping Zone' : 'New Shipping Zone'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {[
                                { key: 'name', label: 'Zone Name', placeholder: 'e.g. North America', type: 'text' },
                                { key: 'regions', label: 'Regions / Countries', placeholder: 'e.g. USA, Canada, Mexico', type: 'text' },
                                { key: 'rate', label: 'Shipping Rate ($)', placeholder: '0 for free shipping', type: 'number' },
                                { key: 'free_above', label: 'Free Shipping Above ($)', placeholder: 'Leave blank to disable', type: 'number' },
                                { key: 'handling_days', label: 'Delivery Time (days)', placeholder: '7', type: 'number' },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">{field.label}</label>
                                    <input
                                        type={field.type}
                                        value={(form as any)[field.key]}
                                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                        placeholder={field.placeholder}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white transition-all ring-0"
                                    />
                                </div>
                            ))}
                            <label className="flex items-center gap-2 cursor-pointer pt-2 group">
                                <div onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className={`relative w-10 h-5 rounded-full transition-all ${form.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
                                </div>
                                <span className="text-sm text-slate-700 dark:text-slate-300 font-bold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Active</span>
                            </label>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name || !form.regions} className="flex-1 py-2.5 rounded-xl bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold text-sm transition-colors disabled:opacity-50 shadow-sm shadow-red-200 dark:shadow-none">
                                {saving ? 'Saving...' : (editingZone ? 'Save Changes' : 'Create Zone')}
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
