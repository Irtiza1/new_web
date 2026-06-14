'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { SizeGuide } from '@/lib/services/sizeService';

interface ShippingZone {
    id: string;
    name: string;
    regions: string;
    handling_days: number;
    rate: number;
    free_above: number | null;
    is_active: boolean;
}

const emptyZoneForm = { name: '', regions: '', handling_days: '7', rate: '0', free_above: '', is_active: true };
const emptySizeForm = { label: '', chest: '', waist: '', hips: '', shoulders: '', length: '' };

export default function AdminShippingAndSizingPage() {
    const [activeMainTab, setActiveMainTab] = useState<'rates' | 'sizes' | 'content'>('rates');
    
    // Shipping Zones State
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [zoneLoading, setZoneLoading] = useState(true);
    const [showZoneModal, setShowZoneModal] = useState(false);
    const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
    const [zoneForm, setZoneForm] = useState(emptyZoneForm);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [zoneSelectedIds, setZoneSelectedIds] = useState<Set<string>>(new Set());
    
    // Size Guides State
    const [sizes, setSizes] = useState<SizeGuide[]>([]);
    const [sizeLoading, setSizeLoading] = useState(true);
    const [showSizeModal, setShowSizeModal] = useState(false);
    const [editingSize, setEditingSize] = useState<SizeGuide | null>(null);
    const [sizeForm, setSizeForm] = useState(emptySizeForm);
    const [sizeSelectedIds, setSizeSelectedIds] = useState<Set<string>>(new Set());

    // Content State
    const [content, setContent] = useState({ shipping_hero_title: '', shipping_hero_subtitle: '' });
    const [contentLoading, setContentLoading] = useState(true);
    const [savingContent, setSavingContent] = useState(false);

    // Shared State
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: string; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

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

    // Loaders
    const loadZones = useCallback(async () => {
        setZoneLoading(true);
        try {
            const res = await fetch('/api/shipping-zones');
            const data = await res.json();
            if (data.success) setZones(data.data || []);
        } catch { }
        setZoneLoading(false);
    }, []);

    const loadSizes = useCallback(async () => {
        setSizeLoading(true);
        try {
            const res = await fetch('/api/size-guides');
            const data = await res.json();
            if (data.success) setSizes(data.data || []);
        } catch { }
        setSizeLoading(false);
    }, []);

    const loadContent = useCallback(async () => {
        setContentLoading(true);
        try {
            const keys = ['shipping_hero_title', 'shipping_hero_subtitle'];
            const res = await fetch('/api/cms');
            const data = await res.json();
            if (data.success) {
                const newContent = { shipping_hero_title: '', shipping_hero_subtitle: '' };
                data.data.forEach((item: { slug: string; content: string }) => {
                    if (keys.includes(item.slug)) {
                        newContent[item.slug as keyof typeof newContent] = item.content;
                    }
                });
                setContent(newContent);
            }
        } catch { }
        setContentLoading(false);
    }, []);

    useEffect(() => {
        if (activeMainTab === 'rates') loadZones();
        else if (activeMainTab === 'sizes') loadSizes();
        else if (activeMainTab === 'content') loadContent();
        
        setCurrentPage(1);
        setActiveMenu(null);
        setZoneSelectedIds(new Set());
        setSizeSelectedIds(new Set());
    }, [activeMainTab, loadZones, loadSizes, loadContent]);

    // Shipping Zone Handlers
    const openCreateZone = () => { setEditingZone(null); setZoneForm(emptyZoneForm); setShowZoneModal(true); };
    const openEditZone = (zone: ShippingZone) => {
        setEditingZone(zone);
        setZoneForm({ name: zone.name, regions: zone.regions, handling_days: String(zone.handling_days), rate: String(zone.rate), free_above: zone.free_above ? String(zone.free_above) : '', is_active: zone.is_active });
        setShowZoneModal(true);
    };

    const handleSaveZone = async () => {
        setSaving(true);
        const payload = { name: zoneForm.name, regions: zoneForm.regions, handling_days: parseInt(zoneForm.handling_days || '0'), rate: parseFloat(zoneForm.rate || '0'), free_above: zoneForm.free_above ? parseFloat(zoneForm.free_above) : null, is_active: zoneForm.is_active };
        const method = editingZone ? 'PUT' : 'POST';
        const url = editingZone ? `/api/shipping-zones?id=${editingZone.id}` : '/api/shipping-zones';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) { showToast(editingZone ? `Shipping Zone "${zoneForm.name}" updated successfully.` : `Shipping Zone "${zoneForm.name}" created successfully.`, 'success'); setShowZoneModal(false); loadZones(); }
        else showToast(data.message || data.error || 'Failed to save shipping zone.', 'error');
        setSaving(false);
    };

    const handleDeleteZone = async (id: string) => {
        const zone = zones.find(z => z.id === id);
        setConfirmModal({
            isOpen: true,
            title: `Delete Shipping Zone "${zone?.name}"`,
            message: 'Delete this shipping zone? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                const res = await fetch(`/api/shipping-zones?id=${id}`, { method: 'DELETE' });
                if ((await res.json()).success) { showToast(`Shipping Zone "${zone?.name}" was deleted successfully.`, 'success'); loadZones(); }
                else showToast(`Failed to delete shipping zone "${zone?.name}".`, 'error');
            }
        });
    };

    // Size Guide Handlers
    const openCreateSize = () => { setEditingSize(null); setSizeForm(emptySizeForm); setShowSizeModal(true); };
    const openEditSize = (size: SizeGuide) => {
        setEditingSize(size);
        setSizeForm({ label: size.label, chest: size.chest, waist: size.waist, hips: size.hips, shoulders: size.shoulders, length: size.length });
        setShowSizeModal(true);
    };

    const handleSaveSize = async () => {
        setSaving(true);
        const method = editingSize ? 'PUT' : 'POST';
        const url = editingSize ? `/api/size-guides?id=${editingSize.id}` : '/api/size-guides';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sizeForm) });
        const data = await res.json();
        if (data.success) { showToast(editingSize ? `Size Guide updated successfully.` : `Size Guide created successfully.`, 'success'); setShowSizeModal(false); loadSizes(); }
        else showToast(data.message || data.error || 'Failed to save size guide.', 'error');
        setSaving(false);
    };

    const handleDeleteSize = async (id: string) => {
        const size = sizes.find(s => s.id === id);
        setConfirmModal({
            isOpen: true,
            title: `Delete Size Guide "${size?.label}"`,
            message: 'Delete this size guide? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                const res = await fetch(`/api/size-guides?id=${id}`, { method: 'DELETE' });
                if ((await res.json()).success) { showToast(`Size Guide "${size?.label}" was deleted successfully.`, 'success'); loadSizes(); }
                else showToast(`Failed to delete size guide "${size?.label}".`, 'error');
            }
        });
    };

    // Content Handlers
    const handleSaveContent = async () => {
        setSavingContent(true);
        try {
            const res1 = await fetch('/api/cms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: 'shipping_hero_title', content: content.shipping_hero_title, type: 'text', title: 'Shipping Hero Title', section: 'Shipping' }) });
            const data1 = await res1.json();
            if (!data1.success) throw new Error(data1.message || data1.error || 'Failed to save title');

            const res2 = await fetch('/api/cms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: 'shipping_hero_subtitle', content: content.shipping_hero_subtitle, type: 'text', title: 'Shipping Hero Subtitle', section: 'Shipping' }) });
            const data2 = await res2.json();
            if (!data2.success) throw new Error(data2.message || data2.error || 'Failed to save subtitle');

            showToast('Shipping page content updated successfully.', 'success');
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            showToast(err.message || 'Failed to update content.', 'error');
        }
        setSavingContent(false);
    };

    // Bulk Actions (Shared)
    const handleBulkDelete = async () => {
        const selectedIds = activeMainTab === 'rates' ? zoneSelectedIds : sizeSelectedIds;
        if (isBulkDeleting || selectedIds.size === 0) return;
        
        setConfirmModal({
            isOpen: true,
            title: 'Delete Selected Items',
            message: `Are you sure you want to delete ${selectedIds.size} items? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsBulkDeleting(true);
                try {
                    const endpoint = activeMainTab === 'rates' ? '/api/shipping-zones' : '/api/size-guides';
                    const results = await Promise.all(
                        Array.from(selectedIds).map(id => fetch(`${endpoint}?id=${id}`, { method: 'DELETE' }).then(res => res.json()))
                    );
                    const successCount = results.filter(r => r.success).length;
                    const failCount = selectedIds.size - successCount;
                    if (failCount > 0) {
                        const errorMessages = results.filter(r => !r.success).map(r => r.message || 'Unknown error').join(', ');
                        showToast(`Bulk delete partial failure: ${successCount} deleted, ${failCount} failed. (${errorMessages})`, 'error');
                    }
                    else showToast(`${successCount} items were deleted successfully.`, 'success');
                    
                    if (activeMainTab === 'rates') { loadZones(); setZoneSelectedIds(new Set()); }
                    else { loadSizes(); setSizeSelectedIds(new Set()); }
                } catch {
                    showToast('An error occurred during bulk deletion.', 'error');
                } finally {
                    setIsBulkDeleting(false);
                }
            }
        });
    };

    // Toggle Select All (Zones)
    const filteredZones = zones.filter(z => {
        if (statusFilter === 'active') return z.is_active;
        if (statusFilter === 'inactive') return !z.is_active;
        return true;
    });
    
    const visibleZones = filteredZones.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const toggleSelectAllZones = () => {
        const allSelected = visibleZones.length > 0 && visibleZones.every(z => zoneSelectedIds.has(z.id));
        setZoneSelectedIds(prev => {
            const next = new Set(prev);
            if (allSelected) visibleZones.forEach(z => next.delete(z.id));
            else visibleZones.forEach(z => next.add(z.id));
            return next;
        });
    };

    // Toggle Select All (Sizes)
    const visibleSizes = sizes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const toggleSelectAllSizes = () => {
        const allSelected = visibleSizes.length > 0 && visibleSizes.every(s => sizeSelectedIds.has(s.id));
        setSizeSelectedIds(prev => {
            const next = new Set(prev);
            if (allSelected) visibleSizes.forEach(s => next.delete(s.id));
            else visibleSizes.forEach(s => next.add(s.id));
            return next;
        });
    };

    const formatRate = (zone: ShippingZone) => {
        if (zone.rate === 0) return 'Free';
        return `$${zone.rate.toFixed(2)}${zone.free_above ? ` (free above $${zone.free_above})` : ''}`;
    };

    return (
        <AdminPageLayout
            title="Shipping & Sizing"
            subtitle="Manage global shipping rates, size charts, and page content."
            actions={
                <div className="flex gap-2">
                    {activeMainTab === 'rates' && (
                        <button onClick={openCreateZone} className="flex items-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md">
                            <span className="material-symbols-outlined text-[18px]">add</span> Add Zone
                        </button>
                    )}
                    {activeMainTab === 'sizes' && (
                        <button onClick={openCreateSize} className="flex items-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md">
                            <span className="material-symbols-outlined text-[18px]">add</span> Add Size Guide
                        </button>
                    )}
                    {activeMainTab === 'content' && (
                        <button onClick={handleSaveContent} disabled={savingContent} className="flex items-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px]">save</span> {savingContent ? 'Saving...' : 'Save Content'}
                        </button>
                    )}
                </div>
            }
            filters={
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 w-full">
                    <AdminFilterTabs
                        tabs={[
                            { label: 'Rates & Zones', value: 'rates' },
                            { label: 'Sizing Guides', value: 'sizes' },
                            { label: 'Page Content', value: 'content' },
                        ]}
                        activeTab={activeMainTab}
                        onTabChange={(val) => setActiveMainTab(val as 'rates' | 'sizes' | 'content')}
                    />
                    {activeMainTab === 'rates' && (
                        <AdminFilterTabs
                            tabs={[
                                { label: 'All', value: 'all' },
                                { label: 'Active', value: 'active' },
                                { label: 'Inactive', value: 'inactive' },
                            ]}
                            activeTab={statusFilter}
                            onTabChange={(val) => setStatusFilter(val as 'all' | 'active' | 'inactive')}
                        />
                    )}
                </div>
            }
            pagination={
                activeMainTab !== 'content' && (
                    <AdminPagination
                        currentPage={currentPage}
                        totalItems={activeMainTab === 'rates' ? filteredZones.length : sizes.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                    />
                )
            }
            stats={
                activeMainTab === 'rates' && (
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
                )
            }
            bulkActions={
                activeMainTab !== 'content' && (
                    <AdminBulkActionsBar
                        selectedCount={activeMainTab === 'rates' ? zoneSelectedIds.size : sizeSelectedIds.size}
                        onCancel={() => activeMainTab === 'rates' ? setZoneSelectedIds(new Set()) : setSizeSelectedIds(new Set())}
                        onDelete={handleBulkDelete}
                        isDeleting={isBulkDeleting}
                    />
                )
            }
        >
            {activeMainTab === 'rates' && (
                <AdminTable
                    headers={['Zone Name', 'Regions', 'Rate', 'Delivery Time', 'Status', 'Actions']}
                    onSelectAll={toggleSelectAllZones}
                    isAllSelected={visibleZones.length > 0 && visibleZones.every(z => zoneSelectedIds.has(z.id))}
                >
                    {zoneLoading ? (
                        <tr><td colSpan={7} className="py-12 text-center text-slate-500 font-bold">Loading zones...</td></tr>
                    ) : visibleZones.length === 0 ? (
                        <tr><td colSpan={7} className="py-12 text-center text-slate-500">No shipping zones found.</td></tr>
                    ) : (
                        visibleZones.map((zone) => (
                            <tr key={zone.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${zoneSelectedIds.has(zone.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                                <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" className="rounded border-slate-300 text-[#d41132] cursor-pointer" checked={zoneSelectedIds.has(zone.id)} onChange={() => {
                                        setZoneSelectedIds(prev => { const next = new Set(prev); if (next.has(zone.id)) next.delete(zone.id); else next.add(zone.id); return next; });
                                    }} />
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{zone.name}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate font-medium">{zone.regions}</td>
                                <td className="px-6 py-4 font-black text-slate-700 dark:text-slate-300">{formatRate(zone)}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{zone.handling_days} days</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${zone.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                                        {zone.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right relative">
                                    <button onClick={(e) => toggleMenu(zone.id, e)} className="action-menu-trigger text-slate-400 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><span className="material-symbols-outlined">more_vert</span></button>
                                    {activeMenu === zone.id && (
                                        <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border py-1 action-menu">
                                            <button onClick={() => { openEditZone(zone); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-lg">edit</span> Edit</button>
                                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                            <button onClick={() => { handleDeleteZone(zone.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 flex items-center gap-2"><span className="material-symbols-outlined text-lg">delete</span> Delete</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </AdminTable>
            )}

            {activeMainTab === 'sizes' && (
                <AdminTable
                    headers={['Label', 'Chest', 'Waist', 'Hips', 'Shoulders', 'Length', 'Actions']}
                    onSelectAll={toggleSelectAllSizes}
                    isAllSelected={visibleSizes.length > 0 && visibleSizes.every(s => sizeSelectedIds.has(s.id))}
                >
                    {sizeLoading ? (
                        <tr><td colSpan={8} className="py-12 text-center text-slate-500 font-bold">Loading sizes...</td></tr>
                    ) : visibleSizes.length === 0 ? (
                        <tr><td colSpan={8} className="py-12 text-center text-slate-500">No size guides found.</td></tr>
                    ) : (
                        visibleSizes.map((size) => (
                            <tr key={size.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${sizeSelectedIds.has(size.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                                <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" className="rounded border-slate-300 text-[#d41132] cursor-pointer" checked={sizeSelectedIds.has(size.id)} onChange={() => {
                                        setSizeSelectedIds(prev => { const next = new Set(prev); if (next.has(size.id)) next.delete(size.id); else next.add(size.id); return next; });
                                    }} />
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{size.label}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{size.chest}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{size.waist}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{size.hips}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{size.shoulders}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{size.length}</td>
                                <td className="px-6 py-4 text-right relative">
                                    <button onClick={(e) => toggleMenu(size.id, e)} className="action-menu-trigger text-slate-400 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><span className="material-symbols-outlined">more_vert</span></button>
                                    {activeMenu === size.id && (
                                        <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border py-1 action-menu">
                                            <button onClick={() => { openEditSize(size); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-lg">edit</span> Edit</button>
                                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                            <button onClick={() => { handleDeleteSize(size.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 flex items-center gap-2"><span className="material-symbols-outlined text-lg">delete</span> Delete</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </AdminTable>
            )}

            {activeMainTab === 'content' && (
                <div className="bg-white dark:bg-[#1a2632] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8">
                    {contentLoading ? (
                        <div className="py-12 text-center text-slate-500 font-bold">Loading content...</div>
                    ) : (
                        <div className="space-y-6 max-w-3xl">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Shipping Hero Title</label>
                                <input
                                    type="text"
                                    value={content.shipping_hero_title}
                                    onChange={e => setContent(c => ({ ...c, shipping_hero_title: e.target.value }))}
                                    placeholder="e.g. Fitting & Shipping"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 focus:border-[#d41132] outline-none dark:text-white transition-all font-bold text-lg"
                                />
                                <p className="text-xs text-slate-500 mt-2">The large heading text at the top of the Shipping & Sizing page.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Shipping Hero Subtitle</label>
                                <textarea
                                    value={content.shipping_hero_subtitle}
                                    onChange={e => setContent(c => ({ ...c, shipping_hero_subtitle: e.target.value }))}
                                    placeholder="Enter subtitle description..."
                                    rows={4}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 focus:border-[#d41132] outline-none dark:text-white transition-all font-medium"
                                />
                                <p className="text-xs text-slate-500 mt-2">The descriptive paragraph text shown directly below the heading.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Zone Modal */}
            {showZoneModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-black">{editingZone ? 'Edit Zone' : 'New Zone'}</h2>
                            <button onClick={() => setShowZoneModal(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {[
                                { key: 'name', label: 'Zone Name', type: 'text' },
                                { key: 'regions', label: 'Regions', type: 'text' },
                                { key: 'rate', label: 'Rate ($)', type: 'number' },
                                { key: 'free_above', label: 'Free Above ($)', type: 'number' },
                                { key: 'handling_days', label: 'Days', type: 'number' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">{f.label}</label>
                                    <input
                                        type={f.type}
                                        value={zoneForm[f.key as keyof typeof zoneForm] as string}
                                        onChange={e => setZoneForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white"
                                    />
                                </div>
                            ))}
                            <label className="flex items-center gap-2 cursor-pointer pt-2 group">
                                <div onClick={() => setZoneForm(f => ({ ...f, is_active: !f.is_active }))} className={`relative w-10 h-5 rounded-full transition-all ${zoneForm.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${zoneForm.is_active ? 'translate-x-5' : ''}`} />
                                </div>
                                <span className="text-sm font-bold">Active</span>
                            </label>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={() => setShowZoneModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 font-bold text-sm">Cancel</button>
                            <button onClick={handleSaveZone} disabled={saving || !zoneForm.name || !zoneForm.regions} className="flex-1 py-2.5 rounded-xl bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold text-sm disabled:opacity-50">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Size Modal */}
            {showSizeModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-black">{editingSize ? 'Edit Size Guide' : 'New Size Guide'}</h2>
                            <button onClick={() => setShowSizeModal(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {[
                                { key: 'label', label: 'Size Label (e.g. Medium, 40R)', placeholder: 'Medium' },
                                { key: 'chest', label: 'Chest', placeholder: '40"' },
                                { key: 'waist', label: 'Waist', placeholder: '34"' },
                                { key: 'hips', label: 'Hips', placeholder: '41"' },
                                { key: 'shoulders', label: 'Shoulders', placeholder: '18"' },
                                { key: 'length', label: 'Length', placeholder: '28"' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">{f.label}</label>
                                    <input
                                        type="text"
                                        value={sizeForm[f.key as keyof typeof sizeForm]}
                                        onChange={e => setSizeForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-[#d41132] outline-none dark:text-white"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={() => setShowSizeModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 font-bold text-sm">Cancel</button>
                            <button onClick={handleSaveSize} disabled={saving || !sizeForm.label} className="flex-1 py-2.5 rounded-xl bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold text-sm disabled:opacity-50">Save</button>
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
