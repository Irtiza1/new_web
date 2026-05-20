'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';

import { useToast } from '@/contexts/ToastContext';
import ConfirmModal from '@/components/admin/ConfirmModal';

interface MediaFile {
    name: string;
    url: string;
    size: number;
    created_at: string;
}

export default function AdminMediaPage() {
    const { showToast } = useToast();
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const toggleMenu = (fileName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === fileName ? null : fileName);
    };

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/media');
        const data = await res.json();
        if (data.success) setFiles(data.data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/media', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) { showToast('Image uploaded!'); load(); }
        else showToast(data.message || 'Upload failed', 'error');
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const handleDelete = async (name: string) => {
        if (isBulkDeleting) return;

        setConfirmModal({
            isOpen: true,
            title: 'Delete Image',
            message: 'Delete this image? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                const res = await fetch(`/api/media?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
                if ((await res.json()).success) {
                    showToast('Image deleted');
                    setFiles(prev => prev.filter(f => f.name !== name));
                    setSelectedIds(prev => {
                        const next = new Set(prev);
                        next.delete(name);
                        return next;
                    });
                } else {
                    showToast('Failed to delete', 'error');
                }
            }
        });
    };

    const handleBulkDelete = async () => {
        if (isBulkDeleting || selectedIds.size === 0) return;

        const count = selectedIds.size;
        setConfirmModal({
            isOpen: true,
            title: `Delete ${count} Images`,
            message: `Are you sure you want to delete ${count} images? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsBulkDeleting(true);
                const namesToDelete = Array.from(selectedIds);
                let successCount = 0;
                let failCount = 0;

                try {
                    await Promise.all(namesToDelete.map(async (name) => {
                        try {
                            const res = await fetch(`/api/media?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
                            if ((await res.json()).success) successCount++;
                            else failCount++;
                        } catch (err) {
                            failCount++;
                        }
                    }));

                    if (successCount > 0) {
                        setFiles(prev => prev.filter(f => !selectedIds.has(f.name)));
                        setSelectedIds(new Set());
                    }

                    if (failCount > 0) {
                        showToast(`Bulk delete completed. Success: ${successCount}, Failed: ${failCount}`, 'error');
                    }
                } catch (error) {
                    console.error('Bulk delete error:', error);
                    showToast('An error occurred during bulk deletion.', 'error');
                } finally {
                    setIsBulkDeleting(false);
                    load(); // Refresh to ensure sync
                }
            }
        });
    };

    const toggleSelectAll = () => {
        const visibleNames = filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(f => f.name);
        const allVisibleSelected = visibleNames.every(name => selectedIds.has(name));

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleNames.forEach(name => next.delete(name));
            } else {
                visibleNames.forEach(name => next.add(name));
            }
            return next;
        });
    };

    const toggleSelect = (name: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate stats
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    return (
        <AdminPageLayout
            title="Media Library"
            subtitle={`${files.length} images \u00b7 Upload and manage image assets`}
            actions={
                <>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white text-sm font-bold rounded-lg shadow-md transition-colors disabled:opacity-60"
                    >
                        {uploading ? (
                            <><span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span> Uploading...</>
                        ) : (
                            <><span className="material-symbols-outlined text-[20px]">upload</span> Upload Image</>
                        )}
                    </button>
                </>
            }
            stats={
                <>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total Images</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{files.length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total Size</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{formatSize(totalSize)}</p>
                    </div>
                </>
            }
            filters={
                <div className="flex-1 min-w-[200px] relative">
                    <span className="absolute left-3 top-2.5 text-black/40 dark:text-white/40 material-symbols-outlined text-[20px]">search</span>
                    <input type="text" placeholder="Search media..." value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-[#1a2632] border border-[#e5e7eb] dark:border-[#2d3b4a] focus:ring-2 focus:ring-[#d41132] outline-none transition-all dark:text-white text-sm" />
                </div>
            }
            pagination={
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filteredFiles.length}
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
                headers={['Preview', 'Filename', 'Size', 'Actions']}
                onSelectAll={toggleSelectAll}
                isAllSelected={filteredFiles.length > 0 && filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(f => selectedIds.has(f.name))}
            >
                {loading ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                Loading media...
                            </div>
                        </td>
                    </tr>
                ) : filteredFiles.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No images found.
                        </td>
                    </tr>
                ) : (
                    filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((file) => (
                        <tr key={file.name} className={`hover:bg-[#f6f7f8] dark:hover:bg-[#17202b] transition-colors group ${selectedIds.has(file.name) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
                                    checked={selectedIds.has(file.name)}
                                    onChange={() => toggleSelect(file.name)}
                                />
                            </td>
                            <td className="px-6 py-4">
                                <img src={file.url} alt={file.name} className="w-10 h-10 rounded-lg object-cover" />
                            </td>
                            <td className="px-6 py-4">
                                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{file.name}</p>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                                {formatSize(file.size)}
                            </td>
                            <td className="px-6 py-4 text-right relative">
                                <button
                                    onClick={(e) => toggleMenu(file.name, e)}
                                    className="action-menu-trigger text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                                {activeMenu === file.name && (
                                    <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 action-menu animate-in zoom-in-95 duration-150 origin-top-right">
                                        <button onClick={() => { copyUrl(file.url); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">link</span> Copy URL
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                        <button onClick={() => { handleDelete(file.name); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">delete</span> Delete
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </AdminTable>

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
