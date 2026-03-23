"use client";

import { useState, useEffect } from "react";
import { contentService, CMSContent } from "@/lib/services/contentService";
import AdminFilterTabs from "@/components/admin/shared/AdminFilterTabs";

export default function CMSAdminPage() {
    const [content, setContent] = useState<CMSContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [activeCategory, setActiveCategory] = useState('announcement');

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        try {
            const data = await contentService.getAll();
            setContent(data);
        } catch (error) {
            setMessage({ text: "Failed to load content", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: string, newContent: string) => {
        setSaving(id);
        setMessage(null);
        try {
            await contentService.updateContent(id, newContent);
            setContent(prev => prev.map(item => item.id === id ? { ...item, content: newContent } : item));
            setMessage({ text: "Content updated successfully!", type: 'success' });
        } catch (error) {
            setMessage({ text: "Failed to update content", type: 'error' });
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c27a2a]"></div>
            </div>
        );
    }

    const categories = [
        { name: 'Global / Header', prefix: 'announcement' },
        { name: 'Home Page', prefix: 'home' },
        { name: 'Bespoke Experience', prefix: 'bespoke' },
        { name: 'Shipping & Fit Guide', prefix: 'shipping' }
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto font-[family-name:var(--font-inter)]">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Content Management</h1>
                    <p className="text-slate-500 mt-1">Directly control headings, text, and buttons across the storefront.</p>
                </div>
                {message && (
                    <div className={`px-4 py-2 rounded-lg text-sm font-bold animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className="mb-8">
                <AdminFilterTabs
                    tabs={categories.map(cat => ({ label: cat.name, value: cat.prefix }))}
                    activeTab={activeCategory}
                    onTabChange={setActiveCategory}
                />
            </div>

            <div className="space-y-12">
                {categories.filter(cat => cat.prefix === activeCategory).map((cat) => (
                    <section key={cat.name} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-black uppercase tracking-widest text-[#c27a2a]">{cat.name}</h2>
                            <div className="flex-1 h-px bg-slate-100"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {content
                                .filter(item => item.slug.startsWith(cat.prefix))
                                .map((item) => (
                                    <div key={item.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.slug}</p>
                                                <h3 className="font-bold text-slate-700 mt-1">{item.description}</h3>
                                            </div>
                                            <span className="bg-slate-50 text-[10px] px-2 py-1 rounded font-bold text-slate-400 uppercase">{item.contentType}</span>
                                        </div>

                                        <div className="relative">
                                            {item.contentType === 'text' || item.contentType === 'html' ? (
                                                <textarea
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-[#c27a2a] outline-none rounded-xl p-4 text-sm font-medium transition-all min-h-[100px] resize-none"
                                                    defaultValue={item.content}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== item.content) {
                                                            handleUpdate(item.id, e.target.value);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-[#c27a2a] outline-none rounded-xl p-4 text-sm font-medium transition-all"
                                                    defaultValue={item.content}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== item.content) {
                                                            handleUpdate(item.id, e.target.value);
                                                        }
                                                    }}
                                                />
                                            )}
                                            {saving === item.id && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#c27a2a]"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </section>
                ))}
            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-medium">CMS version 1.0 • Changes are applied immediately to the live production site.</p>
            </div>
        </div>
    );
}
