'use client';

import { useState, useEffect, useCallback } from 'react';
import { contentService } from '@/lib/services/contentService';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';

const sections = [
    {
        id: 'hero', title: 'Hero Section', icon: 'photo_library',
        fields: [
            { key: 'home_hero_title', label: 'Hero Title', type: 'text', placeholder: 'Crafted for the World' },
            { key: 'home_hero_subtitle', label: 'Hero Subtitle', type: 'textarea', placeholder: 'Premium leather goods...' },
            { key: 'home_hero_cta', label: 'CTA Button Text', type: 'text', placeholder: 'Shop Collection' },
            { key: 'home_hero_image', label: 'Background Image URL', type: 'url', placeholder: 'https://...' },
        ]
    },
    {
        id: 'announcement', title: 'Announcement Bar', icon: 'campaign',
        fields: [
            { key: 'announcement_text', label: 'Primary Announcement', type: 'text', placeholder: 'Free Worldwide Shipping on orders over $150' },
            { key: 'announcement_2', label: 'Second Announcement', type: 'text', placeholder: 'Bespoke Orders Available | 12-15 Days' },
            { key: 'announcement_3', label: 'Third Announcement', type: 'text', placeholder: 'Quality that Lasts a Lifetime' },
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
            { key: 'home_meta_title', label: 'Page Title (SEO)', type: 'text', placeholder: 'Luxe Leather Co. | Handcrafted Premium Leather Goods' },
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
        await contentService.updateContent(key, value);
        setSaving(prev => ({ ...prev, [key]: false }));
        setSavedKeys(prev => { const s = new Set(prev); s.add(key); return s; });
        setTimeout(() => setSavedKeys(prev => { const s = new Set(prev); s.delete(key); return s; }), 2000);
    };

    const activeFields = sections.find(s => s.id === activeSection)?.fields || [];

    return (
        <main className="flex-1 overflow-y-auto bg-[#f6f7f8] dark:bg-[#101922] p-6 md:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Homepage Builder</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Edit every section of the homepage in real-time — changes reflect instantly on the live site</p>
            </div>

            <div className="mb-6">
                <AdminFilterTabs
                    tabs={sections.map(s => ({ label: s.title, value: s.id }))}
                    activeTab={activeSection}
                    onTabChange={setActiveSection}
                />
            </div>

            <div className="flex flex-col gap-6">
                {/* Fields */}
                <div className="flex-1">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#d41132]">{sections.find(s => s.id === activeSection)?.icon}</span>
                            {sections.find(s => s.id === activeSection)?.title}
                        </h2>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {activeFields.map(field => (
                                    <div key={field.key}>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">{field.label}</label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={content[field.key] || ''}
                                                onChange={e => handleChange(field.key, e.target.value)}
                                                rows={3}
                                                placeholder={field.placeholder}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm focus:border-[#d41132] outline-none resize-none dark:text-white transition-colors"
                                            />
                                        ) : (
                                            <input
                                                type={field.type || 'text'}
                                                value={content[field.key] || ''}
                                                onChange={e => handleChange(field.key, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm focus:border-[#d41132] outline-none dark:text-white transition-colors"
                                            />
                                        )}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                                            <p className="text-[10px] text-slate-400 font-mono">{field.key}</p>
                                            <button
                                                onClick={() => handleSave(field.key, content[field.key] || '')}
                                                disabled={saving[field.key]}
                                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${savedKeys.has(field.key) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-[#d41132]/10 text-[#d41132] hover:bg-[#d41132] hover:text-white'}`}
                                            >
                                                {saving[field.key] ? (
                                                    <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> Saving</>
                                                ) : savedKeys.has(field.key) ? (
                                                    <><span className="material-symbols-outlined text-[14px]">check</span> Saved</>
                                                ) : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
