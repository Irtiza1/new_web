'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getAllMedia, uploadMedia, deleteMedia, searchMedia, type MediaFile } from '@/lib/api/media';

export default function AdminMediaPage() {
    const [media, setMedia] = useState<MediaFile[]>([]);
    const [selected, setSelected] = useState<MediaFile | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadMedia();
    }, []);

    const loadMedia = async () => {
        try {
            const data = await getAllMedia();
            setMedia(data);
            if (data.length > 0) setSelected(data[0]);
        } catch (err) {
            console.error('Failed to load media:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await uploadMedia(file, 'products');
            await loadMedia();
        } catch (err) {
            console.error('Failed to upload:', err);
            alert('Upload failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this media file?')) return;
        try {
            await deleteMedia(id);
            setSelected(null);
            await loadMedia();
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim()) {
            const results = await searchMedia(query);
            setMedia(results);
        } else {
            await loadMedia();
        }
    };
    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#f5f5f5] dark:bg-[#101622] text-slate-900 dark:text-slate-100 antialiased font-[family-name:var(--font-inter)]">
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full min-w-0">
                {/* Top Utility Bar */}
                <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#135bec]/20 transition-all" placeholder="Search media by filename or tag..." type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
                        <nav className="flex gap-2">
                            <button className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                                <span className="material-symbols-outlined block">grid_view</span>
                            </button>
                            <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
                                <span className="material-symbols-outlined block">list</span>
                            </button>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-[#135bec] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#a20e26] transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">cloud_upload</span>
                            Upload New Media
                        </button>
                        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 relative">
                            <span className="material-symbols-outlined block">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Media Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Gallery Grid */}
                    <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
                            <span>Media Library</span>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                            <span className="text-slate-900 font-medium">Product Photos</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                            {loading ? (
                                <div className="col-span-full flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135bec]"></div>
                                </div>
                            ) : media.length > 0 ? media.map((item, i) => (
                                <div key={item.id} className="group relative flex flex-col gap-2 cursor-pointer" onClick={() => setSelected(item)}>
                                    <div className={`aspect-square w-full rounded-xl overflow-hidden bg-slate-200 ${selected?.id === item.id ? 'border-2 border-[#135bec] shadow-lg ring-4 ring-[#135bec]/10' : 'border border-slate-200 hover:border-[#135bec]'} relative`}>
                                        {selected?.id === item.id && (
                                            <div className="absolute top-2 right-2 z-10">
                                                <div className="bg-[#135bec] text-white rounded-full p-0.5">
                                                    <span className="material-symbols-outlined text-sm leading-none">check_circle</span>
                                                </div>
                                            </div>
                                        )}
                                        {item.content_type?.startsWith('image/') ? (
                                            <img src={item.url} alt={item.alt_text || item.filename} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                                <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-slate-900 truncate">{item.filename}</span>
                                        <span className="text-[10px] text-slate-500">{item.size ? `${(item.size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-12 text-center text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">cloud_upload</span>
                                    <p>No media files yet. Upload your first file.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details Panel */}
                    <aside className="w-80 bg-white border-l border-slate-200 overflow-y-auto p-6 shrink-0">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Details</h3>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            {/* Preview */}
                            <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-6xl text-slate-300">image</span>
                                </div>
                            </div>
                            {/* Meta Info */}
                            <div className="flex flex-col gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Filename</span>
                                    <span className="font-medium">{selected?.filename || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Size</span>
                                    <span className="font-medium">{selected?.size ? `${(selected.size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Dimensions</span>
                                    <span className="font-medium">{selected?.width && selected?.height ? `${selected.width}x${selected.height}` : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Uploaded</span>
                                    <span className="font-medium">{selected?.createdAt ? new Date(selected.createdAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                            <hr className="border-slate-200" />
                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        if (selected) {
                                            navigator.clipboard.writeText(selected.url);
                                            alert('URL copied to clipboard!');
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">link</span>
                                    Copy URL
                                </button>
                                <button
                                    onClick={() => {
                                        if (selected) window.open(selected.url, '_blank');
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">download</span>
                                    Download
                                </button>
                                <button
                                    onClick={() => { if (selected) handleDelete(selected.id); }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
