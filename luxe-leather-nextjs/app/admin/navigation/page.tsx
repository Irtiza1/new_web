'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';

import { useToast } from '@/contexts/ToastContext';
import ConfirmModal from '@/components/admin/ConfirmModal';
import ErrorState from '@/components/shared/ErrorState';
import TableSkeleton from '@/components/shared/TableSkeleton';

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
    const { showToast } = useToast();
    const [items, setItems] = useState<NavItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<NavItem | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

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

    const toggleMenu = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === itemId ? null : itemId);
    };

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch('/api/nav-items');
            const data = await res.json();
            if (data.success) {
                setItems(data.data.sort((a: NavItem, b: NavItem) => a.display_order - b.display_order));
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
        if (data.success) { showToast(editingItem ? `Navigation link "${form.label}" updated successfully.` : `Navigation link "${form.label}" created successfully.`, 'success'); setShowModal(false); load(); }
        else showToast(data.message || 'Failed to save navigation link.', 'error');
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (isBulkDeleting) return;

        const navItem = items.find(i => i.id === id);
        setConfirmModal({
            isOpen: true,
            title: `Remove Nav Link "${navItem?.label}"`,
            message: 'Remove this nav link? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetch(`/api/nav-items?id=${id}`, { method: 'DELETE' });
                    if ((await res.json()).success) {
                        showToast(`Navigation link "${navItem?.label}" was removed successfully.`, 'success');
                        setItems(prev => prev.filter(i => i.id !== id));
                        setSelectedIds(prev => {
                            const next = new Set(prev);
                            next.delete(id);
                            return next;
                        });
                    } else {
                        showToast('Failed to delete', 'error');
                        load();
                    }
                } catch (error) {
                    console.error('Error deleting nav item:', error);
                    showToast('Failed to delete nav item. Please try again.', 'error');
                    load();
                }
            }
        });
    };

    const handleBulkDelete = async () => {
        if (isBulkDeleting || selectedIds.size === 0) return;
        setConfirmModal({
            isOpen: true,
            title: 'Delete Items',
            message: `Are you sure you want to delete ${selectedIds.size} navigation items?`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsBulkDeleting(true);
                const idsToDelete = Array.from(selectedIds);

                try {
                    const res = await fetch('/api/nav-items', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: idsToDelete })
                    });
                    const data = await res.json();

                    if (data.success) {
                        setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
                        setSelectedIds(new Set());
                        showToast(`${idsToDelete.length} items were deleted successfully.`, 'success');
                    } else {
                        showToast(data.message || 'Failed to bulk delete items.', 'error');
                    }
                } catch (error) {
                    console.error('Bulk delete error:', error);
                    showToast('An error occurred during bulk deletion.', 'error');
                } finally {
                    setIsBulkDeleting(false);
                    load();
                }
            }
        });
    };

    const toggleVisibility = async (item: NavItem) => {
        await fetch(`/api/nav-items?id=${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_visible: !item.is_visible }) });
        showToast(`Navigation link "${item.label}" is now ${!item.is_visible ? 'visible' : 'hidden'}.`, 'success');
        load();
    };

    const toggleSelectAll = () => {
        const visibleIds = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(i => i.id);
        const allVisibleSelected = visibleIds.every(id => selectedIds.has(id));

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleIds.forEach(id => next.delete(id));
            } else {
                visibleIds.forEach(id => next.add(id));
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

    const filteredItems = items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate stats
    const visibleCount = items.filter(i => i.is_visible).length;
    const hiddenCount = items.filter(i => !i.is_visible).length;

    return (
        <AdminPageLayout
            title="Navigation Editor"
            subtitle="Control what links appear in your storefront header"
            actions={
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white text-sm font-bold rounded-lg shadow-md transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Add Link
                </button>
            }
            stats={
                <>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total Items</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{items.length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Visible</p>
                        <p className="text-base font-black text-emerald-500 leading-none mt-0.5">{visibleCount}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Hidden</p>
                        <p className={`text-base font-black leading-none mt-0.5 ${hiddenCount > 0 ? 'text-[#d41132]' : 'text-[#0d141b] dark:text-white'}`}>{hiddenCount}</p>
                    </div>
                </>
            }
            filters={
                <div className="flex-1 min-w-[200px] relative">
                    <span className="absolute left-3 top-2.5 text-black/40 dark:text-white/40 material-symbols-outlined text-[20px]">search</span>
                    <input type="text" placeholder="Search navigation..." value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-[#1a2632] border border-[#e5e7eb] dark:border-[#2d3b4a] focus:ring-2 focus:ring-[#d41132] outline-none transition-all dark:text-white text-sm" />
                </div>
            }
            pagination={
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filteredItems.length}
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
            <AdminTable
                headers={['Label', 'URL', 'Order', 'Status', 'Actions']}
                onSelectAll={toggleSelectAll}
                isAllSelected={filteredItems.length > 0 && filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(i => selectedIds.has(i.id))}
            >
                {loading ? (
                    <tr>
                        <td colSpan={6} className="p-0">
                            <TableSkeleton rows={5} columns={6} />
                        </td>
                    </tr>
                ) : error ? (
                    <tr>
                        <td colSpan={6} className="p-0">
                            <ErrorState onRetry={load} title="Database Error" message="Failed to load navigation items from the server." />
                        </td>
                    </tr>
                ) : filteredItems.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No navigation items found. Add your first link to get started.
                        </td>
                    </tr>
                ) : (
                    filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                        <tr key={item.id} className={`hover:bg-[#f6f7f8] dark:hover:bg-[#17202b] transition-colors group ${selectedIds.has(item.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
                                    checked={selectedIds.has(item.id)}
                                    onChange={() => toggleSelect(item.id)}
                                />
                            </td>
                            <td className="px-6 py-4">
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{item.label}</p>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-sm text-slate-500 font-mono truncate">
                                    {item.url}
                                    {item.opens_in_new_tab && <span className="ml-2 text-blue-400">&#8599; new tab</span>}
                                </p>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-[#0d141b] dark:text-white">
                                {item.display_order}
                            </td>
                            <td className="px-6 py-4 text-sm">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${item.is_visible ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                                    {item.is_visible ? 'Visible' : 'Hidden'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right relative">
                                <button
                                    onClick={(e) => toggleMenu(item.id, e)}
                                    className="action-menu-trigger text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                                {activeMenu === item.id && (
                                    <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 action-menu animate-in zoom-in-95 duration-150 origin-top-right">
                                        <button onClick={() => { toggleVisibility(item); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">{item.is_visible ? 'visibility_off' : 'visibility'}</span> {item.is_visible ? 'Hide' : 'Show'}
                                        </button>
                                        <button onClick={() => { openEdit(item); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">edit</span> Edit
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                        <button onClick={() => { handleDelete(item.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full sm:max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
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
