'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';
import FormSkeleton from '@/components/shared/FormSkeleton';

export default function AdminSettingsPage() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettingsState] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // For universal image uploading
    const [isUploading, setIsUploading] = useState<string | null>(null);
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success) {
                    setSettingsState(data.data);
                }
            } catch (err) {
                console.error('Failed to load settings:', err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const triggerUpload = (key: string) => {
        setUploadingKey(key);
        setTimeout(() => fileInputRef.current?.click(), 0);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingKey) return;

        setIsUploading(uploadingKey);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bucket', uploadingKey === 'logo_url' ? 'logos' : 'platform-images');
            formData.append('customName', uploadingKey);

            const res = await fetch('/api/media', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message || data.error || 'Failed to upload image');

            setSettingsState(prev => ({ ...prev, [uploadingKey]: data.data.url }));
        } catch (error) {
            console.error('Image upload failed:', error);
            showToast(`Failed to upload image`, 'error');
        } finally {
            setIsUploading(null);
            setUploadingKey(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (key: string) => {
        setSettingsState(prev => ({ ...prev, [key]: '' }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            const data = await res.json();

            if (data.success) {
                showToast('Settings saved successfully!');
            } else {
                showToast(data.message || data.error || 'Failed to save settings', 'error');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const TABS = [
        { id: 'general', label: 'General Identity', icon: 'store' },
        { id: 'platform_images', label: 'Platform Images', icon: 'imagesmode' },
        { id: 'shipping', label: 'Shipping & Delivery', icon: 'local_shipping' },
        { id: 'seo', label: 'SEO & Metadata', icon: 'search' },
        { id: 'notifications', label: 'Notifications', icon: 'notifications' }
    ];

    const PLATFORM_IMAGE_GROUPS = [
        {
            title: "Storefront Hero Images",
            description: "Main banner images for your core landing pages.",
            items: [
                { key: 'home_hero_image', label: 'Home Page Hero' },
                { key: 'bespoke_hero_image', label: 'Custom Orders Hero' },
                { key: 'shipping_hero_image', label: 'Shipping Page Hero' },
                { key: 'login_hero_image', label: 'Login Hero' },
                { key: 'signup_hero_image', label: 'Signup Hero' },
            ]
        },
        {
            title: "Story Page Images",
            description: "Imagery used on the 'Our Story' page.",
            items: [
                { key: 'story_sourcing_image', label: 'Sourcing Block' },
                { key: 'story_stitching_image', label: 'Stitching Block' },
                { key: 'story_cta_image', label: 'Call-to-Action Background' },
            ]
        }
    ];

    return (
        <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] font-[family-name:var(--font-inter)]">
            
            {/* Hidden Universal File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />

            <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                {/* Header */}
                <header className="w-full px-6 pt-8 pb-6 border-b border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] sticky top-0 z-10 shadow-sm shrink-0">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-sm mb-2">
                                    <Link href="/admin" className="text-[#4c739a] dark:text-[#94a3b8] font-medium hover:text-[#d41132] transition-colors">Home</Link>
                                    <span className="text-[#4c739a] dark:text-[#94a3b8] font-medium">/</span>
                                    <span className="text-[#0d141b] dark:text-white font-medium">Settings</span>
                                </div>
                                <h1 className="text-3xl font-black tracking-tight text-[#0d141b] dark:text-white">Platform Settings</h1>
                                <p className="text-[#4c739a] dark:text-[#94a3b8]">Manage your store identity, platform imagery, shipping, and SEO.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 text-sm font-bold text-[#4c739a] dark:text-[#94a3b8] bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#d41132] hover:bg-[#b30f2a] text-white text-sm font-bold rounded-lg shadow-md transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[20px]">save</span>
                                    )}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area: Sidebar Layout */}
                <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        
                        {/* Settings Navigation Sidebar */}
                        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-1 sticky top-0">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-white dark:bg-[#1a2632] text-[#d41132] shadow-sm border border-gray-200 dark:border-gray-700' 
                                        : 'text-[#4c739a] dark:text-[#94a3b8] hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-[#0d141b] dark:hover:text-white border border-transparent'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </aside>

                        {/* Settings Content Area */}
                        <div className="flex-1 w-full">
                            
                            {isLoading ? (
                                <FormSkeleton fields={3} />
                            ) : (
                                <>
                                    {/* General */}
                                    {activeTab === 'general' && (
                                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <section className="bg-white dark:bg-[#1a2632] rounded-2xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                                        <div className="px-6 py-5 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                                            <h2 className="text-xl font-bold text-[#0d141b] dark:text-white">Store Identity</h2>
                                        </div>
                                        <div className="p-6 flex flex-col gap-8">
                                            {/* Logo */}
                                            <div className="flex flex-col sm:flex-row gap-8">
                                                <div className="w-full sm:w-1/3">
                                                    <h3 className="text-sm font-bold text-[#0d141b] dark:text-white mb-1">Company Logo</h3>
                                                    <p className="text-xs text-[#4c739a] dark:text-[#94a3b8] leading-relaxed">
                                                        Used on the header and checkout. Recommended 512x512px.
                                                    </p>
                                                </div>
                                                <div className="flex-1 flex items-center gap-6">
                                                    <div 
                                                        onClick={() => triggerUpload('logo_url')}
                                                        className="w-32 h-32 flex-shrink-0 bg-[#f6f7f8] dark:bg-[#101922] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-[#d41132] transition-colors"
                                                    >
                                                        {settings.logo_url ? (
                                                            <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 z-10 text-3xl group-hover:scale-110 transition-transform">add_photo_alternate</span>
                                                        )}
                                                        {isUploading === 'logo_url' && (
                                                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center z-20">
                                                                <span className="material-symbols-outlined animate-spin text-[#d41132]">progress_activity</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={() => triggerUpload('logo_url')}
                                                            disabled={isUploading === 'logo_url'}
                                                            className="px-4 py-2 bg-white dark:bg-[#1a2632] border border-gray-300 dark:border-gray-600 hover:border-[#d41132] text-[#0d141b] dark:text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                                                        >
                                                            {settings.logo_url ? 'Change Logo' : 'Upload Logo'}
                                                        </button>
                                                        {settings.logo_url && (
                                                            <button onClick={() => handleRemoveImage('logo_url')} className="text-sm font-bold text-red-500 hover:text-red-700 text-left px-2">Remove</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <hr className="border-[#e5e7eb] dark:border-[#2d3b4a]" />

                                            {/* Store Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="flex flex-col gap-2 md:col-span-2">
                                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Site Title</label>
                                                    <input className="w-full px-4 py-2.5 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all text-sm font-medium" placeholder="Luxe Leather Gear" type="text" value={settings.site_title || ''} onChange={(e) => setSettingsState({ ...settings, site_title: e.target.value })} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Support Email</label>
                                                    <input className="w-full px-4 py-2.5 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all text-sm font-medium" type="email" value={settings.support_email || ''} onChange={(e) => setSettingsState({ ...settings, support_email: e.target.value })} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">WhatsApp Number</label>
                                                    <input className="w-full px-4 py-2.5 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all text-sm font-medium" type="text" value={settings.whatsapp_number || ''} onChange={(e) => setSettingsState({ ...settings, whatsapp_number: e.target.value })} />
                                                </div>
                                                <div className="flex flex-col gap-2 md:col-span-2">
                                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Facebook Page ID</label>
                                                    <input className="w-full px-4 py-2.5 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all text-sm font-medium" type="text" value={settings.facebook_page_id || ''} onChange={(e) => setSettingsState({ ...settings, facebook_page_id: e.target.value })} />
                                                    <p className="text-xs text-[#4c739a] dark:text-[#94a3b8]">Embeds the Messenger chat plugin on the storefront.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* Platform Images */}
                            {activeTab === 'platform_images' && (
                                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex flex-col gap-2 mb-2">
                                        <h2 className="text-2xl font-black text-[#0d141b] dark:text-white">Platform Images</h2>
                                        <p className="text-sm text-[#4c739a] dark:text-[#94a3b8]">Manage the core imagery that runs your website. Images uploaded here are instantly converted to optimized WebP format.</p>
                                    </div>

                                    {PLATFORM_IMAGE_GROUPS.map((group, gIdx) => (
                                        <section key={gIdx} className="bg-white dark:bg-[#1a2632] rounded-2xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                                            <div className="px-6 py-5 border-b border-[#e5e7eb] dark:border-[#2d3b4a] bg-gray-50/50 dark:bg-[#101922]/50">
                                                <h3 className="text-lg font-bold text-[#0d141b] dark:text-white">{group.title}</h3>
                                                <p className="text-xs text-[#4c739a] dark:text-[#94a3b8] mt-1">{group.description}</p>
                                            </div>
                                            <div className="p-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {group.items.map((item) => (
                                                        <div key={item.key} className="flex flex-col gap-3 group/item">
                                                            <div 
                                                                onClick={() => triggerUpload(item.key)}
                                                                className="w-full aspect-[16/9] bg-[#f6f7f8] dark:bg-[#101922] rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center relative overflow-hidden cursor-pointer hover:border-[#d41132] transition-colors"
                                                            >
                                                                {settings[item.key] ? (
                                                                    <img src={settings[item.key]} alt={item.label} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500" />
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-600">
                                                                        <span className="material-symbols-outlined text-3xl">image</span>
                                                                        <span className="text-xs font-bold uppercase tracking-wider">Default</span>
                                                                    </div>
                                                                )}
                                                                {isUploading === item.key && (
                                                                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
                                                                        <span className="material-symbols-outlined animate-spin text-[#d41132] text-3xl">progress_activity</span>
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col items-center justify-center z-10">
                                                                    <span className="material-symbols-outlined text-white text-3xl">upload</span>
                                                                    <span className="text-white text-xs font-bold mt-1">Change Image</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between items-center px-1">
                                                                <label className="text-sm font-bold text-[#0d141b] dark:text-white truncate">{item.label}</label>
                                                                {settings[item.key] && (
                                                                    <button onClick={() => handleRemoveImage(item.key)} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors" title="Revert to default">Revert</button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            )}

                            {/* Shipping */}
                            {activeTab === 'shipping' && (
                                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <section className="bg-white dark:bg-[#1a2632] rounded-2xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                                        <div className="px-6 py-5 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                                            <h2 className="text-xl font-bold text-[#0d141b] dark:text-white">Shipping Configuration</h2>
                                        </div>
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-bold text-[#0d141b] dark:text-white">Free Shipping Threshold ($)</label>
                                                <input type="number" className="px-4 py-2.5 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all" value={settings.shipping_free_threshold || ''} onChange={(e) => setSettingsState({ ...settings, shipping_free_threshold: e.target.value })} />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-bold text-[#0d141b] dark:text-white">Standard Flat Rate ($)</label>
                                                <input type="number" className="px-4 py-2.5 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all" value={settings.shipping_flat_rate || ''} onChange={(e) => setSettingsState({ ...settings, shipping_flat_rate: e.target.value })} />
                                            </div>
                                            <div className="md:col-span-2 flex items-center justify-between p-5 bg-gray-50 dark:bg-[#101922] rounded-xl border border-gray-200 dark:border-gray-700">
                                                <div>
                                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white block">Enable International Shipping</label>
                                                    <p className="text-xs text-[#4c739a] dark:text-[#94a3b8]">Allow orders from outside details zones.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={settings.shipping_international === 'true'} onChange={(e) => setSettingsState({ ...settings, shipping_international: e.target.checked ? 'true' : 'false' })} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#d41132]"></div>
                                                </label>
                                            </div>
                                            <div className="md:col-span-2 flex flex-col gap-2 mt-4">
                                                <label className="text-sm font-bold text-[#0d141b] dark:text-white">Bank Transfer Details</label>
                                                <p className="text-xs text-[#4c739a] dark:text-[#94a3b8]">These details will be displayed to the customer during checkout.</p>
                                                <textarea rows={5} className="w-full px-4 py-3 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all resize-y text-sm" value={settings.bank_transfer_details || ''} onChange={(e) => setSettingsState({ ...settings, bank_transfer_details: e.target.value })} placeholder="e.g. Bank Name: NSave\nAccount Number: 1234567890\nSWIFT: NSAVUS33"></textarea>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* SEO */}
                            {activeTab === 'seo' && (
                                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <section className="bg-white dark:bg-[#1a2632] rounded-2xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                                        <div className="px-6 py-5 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                                            <h2 className="text-xl font-bold text-[#0d141b] dark:text-white">SEO & Metadata</h2>
                                        </div>
                                        <div className="p-6 flex flex-col gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-bold text-[#0d141b] dark:text-white">Default Meta Title</label>
                                                <input type="text" className="px-4 py-2.5 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all" value={settings.seo_title || ''} onChange={(e) => setSettingsState({ ...settings, seo_title: e.target.value })} />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-bold text-[#0d141b] dark:text-white">Default Meta Description</label>
                                                <textarea rows={3} className="px-4 py-3 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all resize-none" value={settings.seo_description || ''} onChange={(e) => setSettingsState({ ...settings, seo_description: e.target.value })} />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-bold text-[#0d141b] dark:text-white">Keywords (Comma separated)</label>
                                                <input type="text" className="px-4 py-2.5 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all" value={settings.seo_keywords || ''} onChange={(e) => setSettingsState({ ...settings, seo_keywords: e.target.value })} />
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* Notifications */}
                            {activeTab === 'notifications' && (
                                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <section className="bg-white dark:bg-[#1a2632] rounded-2xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                                        <div className="px-6 py-5 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                                            <h2 className="text-xl font-bold text-[#0d141b] dark:text-white">Notification Settings</h2>
                                        </div>
                                        <div className="p-6 flex flex-col gap-4">
                                            <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-[#101922] rounded-xl border border-gray-200 dark:border-gray-700">
                                                <div>
                                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white block">Email on New Order</label>
                                                    <p className="text-xs text-[#4c739a] dark:text-[#94a3b8]">Receive an email whenever a customer places a new order.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={settings.notify_new_order === 'true'} onChange={(e) => setSettingsState({ ...settings, notify_new_order: e.target.checked ? 'true' : 'false' })} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#d41132]"></div>
                                                </label>
                                            </div>

                                        </div>
                                    </section>
                                </div>
                            )}
                            </>
                        )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
