"use client";

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import { contentService } from '@/lib/services/contentService';
import { STATIC_ASSET_DEFAULTS } from '@/lib/staticAssets';

export default function BespokePage() {
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [cmsContent, setCmsContent] = useState<Record<string, string>>({});
    const [heroImage, setHeroImage] = useState(STATIC_ASSET_DEFAULTS.bespoke_hero_image);

    useEffect(() => {
        async function loadCMS() {
            const keys = ['bespoke_hero_title', 'bespoke_hero_subtitle', 'bespoke_cta_text'];
            const content: Record<string, string> = {};
            const settingsPromise = fetch('/api/settings').then((res) => res.json()).catch(() => null);
            await Promise.all(keys.map(async (key) => {
                content[key] = await contentService.getBySlug(key);
            }));
            const settingsData = await settingsPromise;
            if (settingsData?.success && settingsData.data?.bespoke_hero_image) {
                setHeroImage(settingsData.data.bespoke_hero_image);
            }
            setCmsContent(content);
        }
        loadCMS();
    }, []);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormStatus('submitting');
        try {
            const form = e.currentTarget;
            const data = new FormData(form);

            // Upload file to Supabase Storage if present
            let imageUrl = '';
            const file = data.get('project_image') as File | null;
            if (file && file.size > 0) {
                const imageFormData = new FormData();
                imageFormData.append('file', file);
                const mediaRes = await fetch('/api/media', { method: 'POST', body: imageFormData });
                const mediaData = await mediaRes.json();
                if (!mediaRes.ok || !mediaData.success) {
                    throw new Error(mediaData.message || 'Failed to upload inspiration image');
                }
                imageUrl = mediaData.data.url;
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
                    inspiration: imageUrl,
                }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.message || 'Failed to submit request');
            }
            setFormStatus('success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Failed to submit request:', err);
            alert('Failed to submit request. Please try again.');
            setFormStatus('idle');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-[#FDFDFB] dark:bg-[#120d09] text-gray-900 antialiased font-[family-name:var(--font-inter)]">
            <Header />

            {/* Hero Section */}
            <div className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[#1a130e]">
                    <img
                        src={heroImage}
                        className="w-full h-full object-cover opacity-40 grayscale"
                        alt="Artisan at work"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a130e]/80 via-transparent to-[#FDFDFB] dark:to-[#120d09]"></div>
                </div>
                <div className="relative max-w-[1000px] mx-auto text-center px-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <span className="text-[#c27a2a] text-xs font-black uppercase tracking-[0.4em] mb-4 block">Tailored Excellence</span>
                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-6">
                        {cmsContent.bespoke_hero_title || "Bespoke Artistry"}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 font-medium max-w-2xl mx-auto leading-relaxed">
                        {cmsContent.bespoke_hero_subtitle || "Beyond the collection lies a world of pure imagination. Collaborate with our master artisans to create a legacy piece uniquely yours."}
                    </p>
                </div>
            </div>

            <main className="flex flex-col items-center w-full grow -mt-20 z-10">
                <div className="w-full max-w-[1200px] px-4 md:px-8 flex flex-col gap-24">

                    {/* Process Flow */}
                    <section className="bg-white dark:bg-[#1a130e] p-8 md:p-16 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-100 dark:border-white/5">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#1c140d] dark:text-white tracking-tight mb-4">The Artisan Journey</h2>
                            <p className="text-gray-500 max-w-lg mx-auto italic font-medium">Four chapters from your vision to an everlasting reality.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                            {[
                                { icon: 'edit_note', step: 'Conceptualize', desc: 'Detail your vision, materials, and desired functional elements.' },
                                { icon: 'auto_awesome', step: 'Design Consult', desc: 'Receive a personalized quote and technical sketches from our team.' },
                                { icon: 'handyman', step: 'Master Crafting', desc: 'Over 40 hours of focused hand-stitching and edge-paining by a single artisan.' },
                                { icon: 'local_shipping', step: 'White Glove', desc: 'Insured worldwide delivery in our signature bespoke packaging.' },
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center text-center group cursor-default">
                                    <div className="w-20 h-20 rounded-full border-2 border-gray-100 dark:border-white/10 flex items-center justify-center text-[#c27a2a] mb-6 transition-all duration-500 group-hover:bg-[#c27a2a] group-hover:text-white group-hover:border-[#c27a2a] group-hover:scale-110 shadow-sm">
                                        <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#1c140d] dark:text-white tracking-tight mb-2">{item.step}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Request Form */}
                    <section className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
                        <div className="lg:col-span-2 sticky top-32">
                            <h2 className="text-4xl font-bold text-[#1c140d] dark:text-white tracking-tight mb-6">Commence Your Project</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg mb-8 font-medium italic">
                                &quot;Perfection is not a standard, it is a conversation.&quot;
                            </p>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-[#c27a2a]">timeline</span>
                                    <span className="text-xs font-semibold uppercase tracking-widest">Average Timeline: 4-6 Weeks</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-[#c27a2a]">payments</span>
                                    <span className="text-xs font-semibold uppercase tracking-widest">Pricing: Starting at $450</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 bg-white dark:bg-[#1a130e] p-8 md:p-12 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-100 dark:border-white/5">
                            {formStatus === 'success' ? (
                                <div className="py-20 flex flex-col items-center text-center animate-in fade-in duration-700">
                                    <div className="w-24 h-24 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center text-green-600 mb-8 border border-green-100 dark:border-green-900">
                                        <span className="material-symbols-outlined text-5xl">verified</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-[#1c140d] dark:text-white tracking-tight mb-4">Vision Received</h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-10 leading-relaxed">
                                        An artisan has been notified of your project. Expect a detailed design consultation in your inbox within 24 hours.
                                    </p>
                                    <button
                                        onClick={() => setFormStatus('idle')}
                                        className="text-[#c27a2a] text-xs font-bold uppercase tracking-widest underline underline-offset-8 decoration-2 hover:text-[#d88b3a] transition-all"
                                    >
                                        Submit Another Request
                                    </button>
                                </div>
                            ) : (
                                <form className="flex flex-col gap-10" onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c27a2a]">Personal Identity <span className="text-red-500">*</span></p>
                                            <input name="name" required className="w-full h-14 bg-gray-50 dark:bg-white/5 border-b-2 border-transparent focus:border-[#c27a2a] outline-none px-0 text-lg font-bold transition-all dark:text-white" placeholder="Full Name" type="text" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c27a2a]">Digital Address <span className="text-red-500">*</span></p>
                                            <input name="email" required className="w-full h-14 bg-gray-50 dark:bg-white/5 border-b-2 border-transparent focus:border-[#c27a2a] outline-none px-0 text-lg font-bold transition-all dark:text-white" placeholder="Email@example.com" type="email" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c27a2a]">Object Type <span className="text-red-500">*</span></p>
                                            <select name="item_type" required defaultValue="" className="w-full h-14 bg-gray-50 dark:bg-white/5 border-b-2 border-transparent focus:border-[#c27a2a] outline-none px-0 text-lg font-bold transition-all dark:text-white appearance-none cursor-pointer">
                                                <option value="" disabled>Select Item Category</option>
                                                <option value="briefcase">Luxury Briefcase</option>
                                                <option value="duffle">Travel Duffle</option>
                                                <option value="jacket">Bespoke Jacket</option>
                                                <option value="footwear">Custom Footwear</option>
                                                <option value="other">Other Special Commission</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c27a2a]">Budget Range <span className="text-red-500">*</span></p>
                                            <input name="budget_range" required className="w-full h-14 bg-gray-50 dark:bg-white/5 border-b-2 border-transparent focus:border-[#c27a2a] outline-none px-0 text-lg font-bold transition-all dark:text-white" placeholder="e.g. $500 - $1,500" type="text" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c27a2a]">Primary Contact <span className="text-red-500">*</span></p>
                                            <input name="phone" required className="w-full h-14 bg-gray-50 dark:bg-white/5 border-b-2 border-transparent focus:border-[#c27a2a] outline-none px-0 text-lg font-bold transition-all dark:text-white" placeholder="Phone Number" type="tel" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c27a2a]">Desired Deadline <span className="text-red-500">*</span></p>
                                            <input name="deadline" required className="w-full h-14 bg-gray-50 dark:bg-white/5 border-b-2 border-transparent focus:border-[#c27a2a] outline-none px-0 text-lg font-bold transition-all dark:text-white" placeholder="MM/DD/YYYY" type="text" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c27a2a]">Project Description <span className="text-red-500">*</span></p>
                                        <textarea name="description" required className="w-full bg-gray-50 dark:bg-white/5 border-b-2 border-transparent focus:border-[#c27a2a] outline-none px-0 py-4 text-lg font-medium transition-all dark:text-white resize-none" placeholder="Describe the soul of your piece..." rows={4}></textarea>
                                    </div>

                                    <div className="relative group cursor-pointer" onClick={handleFileClick}>
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" required name="project_image" />
                                        <div className="h-24 border-2 border-dashed border-gray-100 dark:border-white/10 rounded-2xl flex items-center justify-center gap-4 text-gray-400 group-hover:border-[#c27a2a] transition-all">
                                            <span className="material-symbols-outlined">{fileName ? 'check_circle' : 'add_photo_alternate'}</span>
                                            <span className="text-xs font-bold uppercase tracking-widest">
                                                {fileName || 'Attach Sketches or Inspiration'} <span className="text-red-500">*</span>
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        className={`w-full bg-[#1c140d] dark:bg-[#c27a2a] hover:bg-[#c27a2a] dark:hover:bg-[#d88b3a] text-white h-20 rounded-2xl flex items-center justify-center gap-4 font-bold uppercase tracking-[0.1em] transition-all shadow-xl shadow-black/10 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50`}
                                        type="submit"
                                        disabled={formStatus === 'submitting'}
                                    >
                                        {formStatus === 'submitting' ? 'Transmitting...' : (cmsContent.bespoke_cta_text || 'Initiate Commission')}
                                        <span className="material-symbols-outlined">pentagon</span>
                                    </button>
                                </form>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <div className="mt-40">
                <Footer />
            </div>
        </div>
    );
}
