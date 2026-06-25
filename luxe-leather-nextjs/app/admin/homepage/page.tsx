'use client';

import { useState, useEffect, useCallback } from 'react';
import { contentService } from '@/lib/services/contentService';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';

const sections = [
    {
        id: 'hero', title: 'Hero Section', icon: 'photo_library',
        fields: [
            { key: 'home_hero_title', label: 'Hero Title', type: 'text', placeholder: 'Crafted for the World' },
            { key: 'home_hero_subtitle', label: 'Hero Subtitle', type: 'textarea', placeholder: 'Premium leather goods...' },
            { key: 'home_hero_cta', label: 'CTA Button Text', type: 'text', placeholder: 'Shop Collection' },
        ]
    },
    {
        id: 'announcement', title: 'Announcement Bar', icon: 'campaign',
        fields: [
            { key: 'announcement_bar_text', label: 'Primary Announcement', type: 'text', placeholder: 'Free Worldwide Shipping on orders over $150' },
            { key: 'announcement_bar_2', label: 'Second Announcement', type: 'text', placeholder: 'Bespoke Orders Available | 12-15 Days' },
            { key: 'announcement_bar_3', label: 'Third Announcement', type: 'text', placeholder: 'Quality that Lasts a Lifetime' },
        ]
    },
    {
        id: 'featured', title: 'Featured Section', icon: 'grade',
        fields: [
            { key: 'home_featured_title', label: 'Section Title', type: 'text', placeholder: 'Featured Collections' },
            { key: 'home_featured_subtitle', label: 'Section Subtitle', type: 'textarea', placeholder: 'Timeless pieces crafted with precision...' },
        ]
    },
    {
        id: 'testimonials', title: 'Testimonials', icon: 'format_quote',
        fields: [
            { key: 'home_testimonials_title', label: 'Section Title', type: 'text', placeholder: 'Stories from our Customers' },
        ]
    },
    {
        id: 'seo', title: 'SEO & Metadata', icon: 'manage_search',
        fields: [
            { key: 'home_meta_title', label: 'Page Title (SEO)', type: 'text', placeholder: 'Luxe Leather Gear | Handcrafted Premium Leather Goods' },
            { key: 'home_meta_description', label: 'Meta Description', type: 'textarea', placeholder: 'Discover handcrafted premium leather...' },
        ]
    }
];

export default function AdminHomepagePage() {
    const [content, setContent] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
    const [activeSection, setActiveSection] = useState('hero');
    const [loading, setLoading] = useState(true);

    const loadContent = useCallback(async () => {
        setLoading(true);
        const allKeys = sections.flatMap(s => s.fields.map(f => f.key));
        const result: Record<string, string> = {};
        await Promise.all(allKeys.map(async key => {
            result[key] = await contentService.getBySlug(key);
        }));
        setContent(result);
        setLoading(false);
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadContent(); }, [loadContent]);

    const handleChange = (key: string, value: string) => {
        setContent(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (key: string, value: string) => {
        setSaving(prev => ({ ...prev, [key]: true }));
        await contentService.upsertContentBySlug(key, value);
        setSaving(prev => ({ ...prev, [key]: false }));
        setSavedKeys(prev => { const s = new Set(prev); s.add(key); return s; });
        setTimeout(() => setSavedKeys(prev => { const s = new Set(prev); s.delete(key); return s; }), 2000);
    };

    const activeFields = sections.find(s => s.id === activeSection)?.fields || [];

    return (
        <AdminPageLayout
            title="Homepage Builder"
            subtitle="Edit every section of the homepage in real-time — changes reflect instantly on the live site"
            withTableCard={false}
            filters={
                <AdminFilterTabs
                    tabs={sections.map(s => ({ label: s.title, value: s.id }))}
                    activeTab={activeSection}
                    onTabChange={setActiveSection}
                />
            }
        >
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#d41132]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#d41132]">{sections.find(s => s.id === activeSection)?.icon}</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {sections.find(s => s.id === activeSection)?.title}
                    </h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 bg-white/50 dark:bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                        <span className="material-symbols-outlined animate-spin text-4xl text-[#d41132]">progress_activity</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {activeFields.map(field => (
                            <div key={field.key} className="bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{field.label}</label>
                                        <p className="text-xs text-slate-400 font-mono mt-1 opacity-70">key: {field.key}</p>
                                    </div>
                                    <button
                                        onClick={() => handleSave(field.key, content[field.key] || '')}
                                        disabled={saving[field.key]}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 ${savedKeys.has(field.key) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-[#d41132] text-white hover:bg-[#b30f2a] shadow-[#d41132]/20'}`}
                                    >
                                        {saving[field.key] ? (
                                            <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Saving...</>
                                        ) : savedKeys.has(field.key) ? (
                                            <><span className="material-symbols-outlined text-[16px]">check_circle</span> Saved</>
                                        ) : (
                                            <><span className="material-symbols-outlined text-[16px]">save</span> Save Changes</>
                                        )}
                                    </button>
                                </div>

                                <div className="relative">
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            value={content[field.key] || ''}
                                            onChange={e => handleChange(field.key, e.target.value)}
                                            rows={3}
                                            placeholder={field.placeholder}
                                            className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl px-5 py-4 text-sm focus:border-[#d41132] focus:ring-4 focus:ring-[#d41132]/10 outline-none resize-none dark:text-white transition-all group-hover:border-slate-300 dark:group-hover:border-slate-500"
                                        />
                                    ) : (
                                        <input
                                            type={field.type || 'text'}
                                            value={content[field.key] || ''}
                                            onChange={e => handleChange(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl px-5 py-4 text-sm focus:border-[#d41132] focus:ring-4 focus:ring-[#d41132]/10 outline-none dark:text-white transition-all group-hover:border-slate-300 dark:group-hover:border-slate-500"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminPageLayout>
    );
}
