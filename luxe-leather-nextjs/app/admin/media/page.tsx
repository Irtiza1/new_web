'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface MediaFile {
    name: string;
    url: string;
    size: number;
    created_at: string;
}

export default function AdminMediaPage() {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 3000);
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
        if (!confirm('Delete this image? It cannot be undone.')) return;
        const res = await fetch(`/api/media?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
        if ((await res.json()).success) { showToast('Image deleted'); load(); }
        else showToast('Failed to delete', 'error');
    };

    const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

    return (
        <main className="flex-1 overflow-y-auto bg-[#f6f7f8] dark:bg-[#101922] p-6 md:p-8">
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl font-semibold text-white text-sm shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.text}
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Media Library</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{files.length} images · Upload, browse, and copy image URLs for use across your store</p>
                </div>
                <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-60">
                        {uploading ? (
                            <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Uploading...</>
                        ) : (
                            <><span className="material-symbols-outlined text-[18px]">upload</span> Upload Image</>
                        )}
                    </button>
                </div>
            </div>

            {/* Drop zone hint */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 mb-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#d41132] hover:bg-[#d41132]/5 transition-all group"
            >
                <span className="material-symbols-outlined text-4xl text-slate-300 group-hover:text-[#d41132] transition-colors">cloud_upload</span>
                <p className="text-sm text-slate-400 group-hover:text-[#d41132] transition-colors font-semibold">Click to upload or drag & drop</p>
                <p className="text-xs text-slate-400">PNG, JPG, WebP (max 10MB)</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
                </div>
            ) : files.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <span className="material-symbols-outlined text-5xl mb-3 block">photo_library</span>
                    <p className="font-semibold">No images yet</p>
                    <p className="text-sm mt-1">Upload your first image to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {files.map(file => (
                        <div key={file.name} className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div className="aspect-square bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                                <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                {/* Overlay actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => copyUrl(file.url)} className={`p-2 rounded-lg transition-all ${copiedUrl === file.url ? 'bg-green-500 text-white' : 'bg-white/90 text-slate-900 hover:bg-white'}`}>
                                        <span className="material-symbols-outlined text-[18px]">{copiedUrl === file.url ? 'check' : 'link'}</span>
                                    </button>
                                    <button onClick={() => handleDelete(file.name)} className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>
                            <div className="p-2">
                                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
                                <p className="text-[10px] text-slate-400">{formatSize(file.size)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
