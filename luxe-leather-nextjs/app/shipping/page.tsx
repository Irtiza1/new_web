"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import { contentService } from '@/lib/services/contentService';
import { getShippingRates, type ShippingRate } from '@/lib/services/shippingService';
import { getSizeGuides, type SizeGuide } from '@/lib/services/sizeService';

export default function ShippingPage() {
    const [unit, setUnit] = useState<'inches' | 'cm'>('inches');
    const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
    const [sizeChart, setSizeChart] = useState<SizeGuide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cmsContent, setCmsContent] = useState<Record<string, string>>({});

    const convert = (val: string): string => {
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        return unit === 'cm' ? (num * 2.54).toFixed(1) : val;
    };

    useEffect(() => {
        async function loadCMS() {
            const keys = ['shipping_hero_title', 'shipping_hero_subtitle'];
            const content: Record<string, string> = {};
            await Promise.all(keys.map(async (key) => {
                content[key] = await contentService.getBySlug(key);
            }));
            setCmsContent(content);
        }
        loadCMS();
    }, []);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [rates, sizes] = await Promise.all([
                    getShippingRates(),
                    getSizeGuides()
                ]);
                setShippingRates(rates);
                setSizeChart(sizes);
            } catch (error) {
                console.error("Failed to fetch page data", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-[#FDFDFB] dark:bg-[#120d09] text-gray-900 antialiased font-[family-name:var(--font-inter)]">
            <Header />

            {/* Hero Section */}
            <div className="relative w-full py-24 md:py-32 bg-[#1a130e] overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2000&auto=format&fit=crop"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale scale-110"
                    alt="Leather texture"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a130e] via-[#1a130e]/80 to-transparent"></div>
                <div className="relative max-w-[1200px] mx-auto px-4 md:px-8">
                    <div className="max-w-2xl">
                        <span className="text-[#c27a2a] text-xs font-black uppercase tracking-[0.4em] mb-4 block">Concierge & Logistics</span>
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight mb-6">
                            {cmsContent.shipping_hero_title || "Fitting & Shipping"}
                        </h1>
                        <p className="text-lg text-gray-300 font-medium leading-relaxed">
                            {cmsContent.shipping_hero_subtitle || "Ensuring the perfect acquisition of your next legacy piece. From precise measurements to insured global delivery, every detail is managed with artisan care."}
                        </p>
                    </div>
                </div>
            </div>

            <main className="flex-1 -mt-10 z-10 px-4">
                <div className="max-w-[1200px] mx-auto space-y-24 mb-32">

                    {/* Shipping Rates */}
                    <section className="bg-white dark:bg-[#1a130e] rounded-[40px] shadow-2xl shadow-black/5 overflow-hidden border border-gray-100 dark:border-white/5">
                        <div className="p-8 md:p-12 border-b border-gray-50 dark:border-white/5">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="material-symbols-outlined text-[#c27a2a]">public</span>
                                <h2 className="text-2xl font-black text-[#1c140d] dark:text-white uppercase tracking-tight">Worldwide Logistics</h2>
                            </div>
                            <p className="text-gray-500 font-medium italic">Insured shipping to over 80 countries via premium carriers.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-white/5">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Regional Courier</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Transit Duration</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right text-gray-400">Investment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {isLoading ? (
                                        <tr><td colSpan={3} className="px-8 py-10 text-center text-gray-400 italic font-medium">Synchronizing rates...</td></tr>
                                    ) : (
                                        shippingRates.map((rate, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-[#1c140d] dark:text-white group-hover:text-[#c27a2a] transition-colors">{rate.method || 'Standard International'}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-black">Tracked & Insured</p>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-medium text-gray-500 dark:text-gray-400">{rate.estimatedDays}</td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="bg-[#c27a2a]/10 text-[#c27a2a] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap">
                                                        {rate.price === '0' || rate.price === 0 ? 'Complimentary' : `$${Number(rate.price).toFixed(2)}`}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-white/5 flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-[16px] text-[#c27a2a]">info</span>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Custom orders require an additional 12-15 days for artisanal preparation.</p>
                        </div>
                    </section>

                    {/* Sizing Guide */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <span className="material-symbols-outlined text-[#c27a2a]">straighten</span>
                                <h2 className="text-4xl font-black text-[#1c140d] dark:text-white uppercase tracking-tighter">The Perfect Fit</h2>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg mb-10 font-medium">
                                A jacket should feel like a second skin. Use our master guide below to determine your ideal size, or choose <strong className="text-[#c27a2a]">Bespoke</strong> on any product for a tailored commission.
                            </p>

                            <div className="space-y-8">
                                {[
                                    { title: 'Chest Measurement', desc: 'Measure around the fullest part of your chest, keeping the tape level under your arms.' },
                                    { title: 'Shoulder Width', desc: 'From the outer edge of one shoulder to the outer edge of the other, across the backbone.' },
                                    { title: 'Desired Length', desc: 'From the highest point of the shoulder down to your preferred waistline or hip.' },
                                ].map((tip, i) => (
                                    <div key={i} className="flex gap-6 items-start group">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-[#c27a2a] font-black text-xs shrink-0 group-hover:bg-[#c27a2a] group-hover:text-white transition-all shadow-sm">0{i + 1}</div>
                                        <div>
                                            <h4 className="font-bold text-[#1c140d] dark:text-white uppercase tracking-tight mb-1">{tip.title}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium italic">&quot;{tip.desc}&quot;</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1a130e] p-8 md:p-12 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-100 dark:border-white/5">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Jacket Size Chart</span>
                                <div className="flex bg-gray-50 dark:bg-black/20 p-1 rounded-full">
                                    <button
                                        onClick={() => setUnit('inches')}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${unit === 'inches' ? 'bg-[#c27a2a] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                    >Inches</button>
                                    <button
                                        onClick={() => setUnit('cm')}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${unit === 'cm' ? 'bg-[#c27a2a] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                    >CM</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {sizeChart.map((size, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-5 rounded-2xl border border-gray-50 dark:border-white/5 hover:border-[#c27a2a]/30 transition-all bg-gray-50/50 dark:bg-white/5 group">
                                        <div className="flex items-center gap-6">
                                            <span className="w-12 h-12 bg-white dark:bg-[#1a130e] rounded-xl flex items-center justify-center font-black text-sm text-[#c27a2a] shadow-sm">{size.label[0]}</span>
                                            <div>
                                                <p className="font-bold text-[#1c140d] dark:text-white uppercase tracking-tight">{size.label}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-black">Regular Cut</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-[#c27a2a]">
                                            <div className="text-center">
                                                <p className="text-gray-400 mb-1">Chest ({unit})</p>
                                                <p>{convert(size.chest)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-400 mb-1">Shoulder ({unit})</p>
                                                <p>{convert(size.shoulders)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 p-6 bg-[#f0efe8]/50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-[#c27a2a]/20 text-center">
                                <p className="text-xs font-bold text-gray-500 mb-4 italic">Require a custom measurement not listed above?</p>
                                <a href="/bespoke" className="inline-flex items-center gap-3 bg-[#1c140d] text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#c27a2a] transition-all shadow-xl shadow-black/10">
                                    Commission Bespoke
                                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
