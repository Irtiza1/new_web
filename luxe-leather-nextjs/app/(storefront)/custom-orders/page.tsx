"use client";

import { useState, useRef, useEffect } from 'react';

import { contentService } from '@/lib/services/contentService';
import { STATIC_ASSET_DEFAULTS, staticAsset } from '@/lib/staticAssets';

export default function CustomOrdersPage() {
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [cmsContent, setCmsContent] = useState<Record<string, string>>({});
    const [heroImage, setHeroImage] = useState<string>(STATIC_ASSET_DEFAULTS.bespoke_hero_image);
    const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

    useEffect(() => {
        async function loadCMS() {
            const keys = ['bespoke_hero_title', 'bespoke_hero_subtitle', 'bespoke_cta_text'];
            const content: Record<string, string> = {};
            await Promise.all(keys.map(async (key) => {
                content[key] = await contentService.getBySlug(key);
            }));
            setCmsContent(content);

            try {
                const settingsRes = await fetch('/api/settings');
                const settingsData = await settingsRes.json();
                if (settingsData?.success && settingsData.data) {
                    setHeroImage(staticAsset(settingsData.data, 'bespoke_hero_image'));
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            }
        }
        async function loadCategories() {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                if (data.success && data.data) {
                    setCategories(data.data);
                }
            } catch (err) {
                console.error("Failed to load categories", err);
            }
        }
        loadCMS();
        loadCategories();
    }, []);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormStatus('submitting');
        try {
            const form = e.currentTarget;
            const data = new FormData(form);

            // Generate ID on client to name images correctly
            const requestId = crypto.randomUUID();
            const date = new Date();
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const shortId = requestId.replace(/-/g, '').slice(-6).toUpperCase();
            const formattedId = `REQ-${year}${month}-${shortId}`;

            // Upload files to Supabase Storage if present
            const imageUrls: string[] = [];
            
            if (selectedFiles.length > 0) {
                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i];
                    if (file.size > 0) {
                        const imageFormData = new FormData();
                        imageFormData.append('file', file);
                        imageFormData.append('bucket', 'custom-orders');
                        imageFormData.append('customName', `${formattedId}-${i + 1}`);
                        
                        const mediaRes = await fetch('/api/media', { method: 'POST', body: imageFormData });
                        const mediaData = await mediaRes.json();
                        if (!mediaRes.ok || !mediaData.success) {
                            throw new Error(mediaData.message || 'Failed to upload inspiration image');
                        }
                        imageUrls.push(mediaData.data.url);
                    }
                }
            }

            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.get('name') as string,
                    email: data.get('email') as string,
                    phone: data.get('phone') as string,
                    itemType: data.get('item_type') as string,
                    description: data.get('description') as string,
                    budget: data.get('budget_range') as string,
                    deadline: data.get('deadline') as string,
                    inspiration: JSON.stringify(imageUrls),
                    id: requestId,
                }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.message || 'Failed to submit request');
            }
            setFormStatus('success');
            setSelectedFiles([]);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Track bespoke request event
            if (typeof window !== 'undefined') {
                const extWindow = window as unknown as {
                    trackEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
                };
                if (extWindow.trackEvent) {
                    extWindow.trackEvent('bespoke_submit', {
                        itemType: data.get('item_type') as string,
                        budget: data.get('budget_range') as string
                    });
                }
            }
        } catch (err) {
            console.error('Failed to submit request:', err);
            alert('Failed to submit request. Please try again.');
            setFormStatus('idle');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-[#FDFDFB] dark:bg-[#120d09] text-[#1b0e10] antialiased font-[family-name:var(--font-manrope)]">


            {/* Hero Section */}
            <div className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url('${heroImage}')` }}
                >
                    <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
                </div>
                <div className="relative z-10 max-w-[1000px] mx-auto text-center px-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <span className="text-white/90 text-xs font-bold uppercase tracking-[0.4em] mb-4 block">Tailored Excellence</span>
                    <h1 className="text-5xl md:text-7xl font-medium tracking-tight leading-[1.1] text-white mb-6 drop-shadow-sm">
                        {cmsContent.bespoke_hero_title || "Custom Orders"}
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
                        {cmsContent.bespoke_hero_subtitle || "Beyond the collection lies a world of pure imagination. Collaborate with our master artisans to create a legacy piece uniquely yours."}
                    </p>
                </div>
            </div>

            <main className="flex flex-col items-center w-full grow py-20">
                <div className="w-full max-w-[1200px] px-4 md:px-8 flex flex-col gap-24">



                    {/* Request Form */}
                    <section className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
                        <div className="lg:col-span-2 sticky top-32">
                            <h2 className="text-3xl md:text-4xl font-medium text-[#1b0e10] dark:text-white tracking-tight mb-6">Submit Your Requirements</h2>
                            <p className="text-[#1b0e10]/80 dark:text-slate-400 leading-relaxed text-lg mb-8 font-medium italic">
                                &quot;Perfection is not a standard, it is a conversation.&quot;
                            </p>
                        </div>

                        <div className="lg:col-span-3 bg-white dark:bg-[#1b0e10] p-8 md:p-12 rounded-xl shadow-sm border border-slate-200 dark:border-white/10">
                            {formStatus === 'success' ? (
                                <div className="py-20 flex flex-col items-center text-center animate-in fade-in duration-700">
                                    <div className="w-24 h-24 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center text-green-600 mb-8 border border-green-100 dark:border-green-900">
                                        <span className="material-symbols-outlined text-5xl">verified</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">Vision Received</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-10 leading-relaxed">
                                        An artisan has been notified of your project. Expect a detailed design consultation in your inbox within 24 hours.
                                    </p>
                                    <button
                                        onClick={() => setFormStatus('idle')}
                                        className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest underline underline-offset-8 decoration-2 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                                    >
                                        Submit Another Request
                                    </button>
                                </div>
                            ) : (
                                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <label className="flex flex-col gap-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Personal Identity <span className="text-[#cf1736]">*</span></span>
                                            <input name="name" required className="w-full px-4 py-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all placeholder:text-slate-400 text-[#1b0e10] dark:text-white text-sm font-medium" placeholder="Full Name" type="text" />
                                        </label>
                                        <label className="flex flex-col gap-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Digital Address <span className="text-[#cf1736]">*</span></span>
                                            <input name="email" required className="w-full px-4 py-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all placeholder:text-slate-400 text-[#1b0e10] dark:text-white text-sm font-medium" placeholder="Email@example.com" type="email" />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <label className="flex flex-col gap-2 relative">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Object Type <span className="text-[#cf1736]">*</span></span>
                                            <select name="item_type" required defaultValue="" className="w-full px-4 py-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all text-[#1b0e10] dark:text-white text-sm font-medium appearance-none cursor-pointer">
                                                <option value="" disabled>Select Item Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                                ))}
                                                <option value="other">Other</option>
                                            </select>
                                            <div className="absolute bottom-4 right-4 pointer-events-none text-slate-500">
                                                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                    <path d="m6 9 6 6 6-6" />
                                                </svg>
                                            </div>
                                        </label>
                                        <label className="flex flex-col gap-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Budget Range <span className="text-[#cf1736]">*</span></span>
                                            <input name="budget_range" required className="w-full px-4 py-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all placeholder:text-slate-400 text-[#1b0e10] dark:text-white text-sm font-medium" placeholder="e.g. $500 - $1,500" type="text" />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <label className="flex flex-col gap-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Primary Contact <span className="text-[#cf1736]">*</span></span>
                                            <input name="phone" required className="w-full px-4 py-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all placeholder:text-slate-400 text-[#1b0e10] dark:text-white text-sm font-medium" placeholder="Phone Number" type="tel" />
                                        </label>
                                        <label className="flex flex-col gap-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Desired Deadline <span className="text-[#cf1736]">*</span></span>
                                            <input name="deadline" required className="w-full px-4 py-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all placeholder:text-slate-400 text-[#1b0e10] dark:text-white text-sm font-medium" placeholder="MM/DD/YYYY" type="text" />
                                        </label>
                                    </div>

                                    <label className="flex flex-col gap-2">
                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Project Description <span className="text-[#cf1736]">*</span></span>
                                        <textarea name="description" required className="w-full px-4 py-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all placeholder:text-slate-400 text-[#1b0e10] dark:text-white text-sm font-medium resize-none" placeholder="Describe the soul of your piece..." rows={4}></textarea>
                                    </label>

                                    <div className="relative group cursor-pointer mt-2" onClick={handleFileClick}>
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" multiple required name="project_image" />
                                        <div className="h-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400 group-hover:border-[#cf1736] transition-colors">
                                            <span className="material-symbols-outlined">{selectedFiles.length > 0 ? 'check_circle' : 'add_photo_alternate'}</span>
                                            <span className="text-xs font-bold uppercase tracking-widest">
                                                {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) attached` : 'Attach Sketches or Inspiration'} <span className="text-[#cf1736]">*</span>
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        className={`w-full bg-[#cf1736] hover:bg-[#a3122a] text-white py-4 rounded-lg font-bold text-sm tracking-widest uppercase transition-all mt-4 flex items-center justify-center gap-3 shadow-lg shadow-[#cf1736]/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed`}
                                        type="submit"
                                        disabled={formStatus === 'submitting'}
                                    >
                                        {formStatus === 'submitting' ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                Transmitting...
                                            </>
                                        ) : (
                                            <>
                                                {cmsContent.bespoke_cta_text || 'Initiate Commission'}
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <div className="mt-40">

            </div>
        </div>
    );
}
