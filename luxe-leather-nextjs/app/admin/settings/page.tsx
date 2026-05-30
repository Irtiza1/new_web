'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';


export default function AdminSettingsPage() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettingsState] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
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
            }
        }
        load();
    }, []);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bucket', 'logos');
            formData.append('customName', 'site-logo');

            const res = await fetch('/api/media', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message || data.error || 'Failed to upload logo');

            setSettingsState(prev => ({ ...prev, logo_url: data.data.url }));
        } catch (error) {
            console.error('Logo upload failed:', error);
            showToast('Failed to upload logo', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveLogo = () => {
        setSettingsState(prev => ({ ...prev, logo_url: '' }));
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
        } catch (err: any) {
            console.error('Failed to save settings:', err);
            showToast(err.message || 'Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] font-[family-name:var(--font-inter)]">
            {/* <AdminSidebar /> removed for layout */}

            <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                {/* Header */}
                <header className="w-full px-6 pt-8 pb-0 border-b border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] sticky top-0 z-10 shadow-sm shrink-0">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col gap-6">
                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-2 text-sm">
                                <Link href="/admin" className="text-[#4c739a] dark:text-[#94a3b8] font-medium hover:text-[#d41132] transition-colors">Home</Link>
                                <span className="text-[#4c739a] dark:text-[#94a3b8] font-medium">/</span>
                                <span className="text-[#0d141b] dark:text-white font-medium">Settings</span>
                            </div>
                            {/* Title & Actions */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                                <div className="flex flex-col gap-1">
                                    <h1 className="text-3xl font-black tracking-tight text-[#0d141b] dark:text-white">Platform Settings</h1>
                                    <p className="text-[#4c739a] dark:text-[#94a3b8]">Manage your store identity, shipping configurations, and SEO preferences.</p>
                                </div>
                                <div className="flex items-center gap-3 pb-2">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-4 py-2 text-sm font-bold text-[#4c739a] dark:text-[#94a3b8] bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white text-sm font-bold rounded-lg shadow-md transition-colors disabled:opacity-50"
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

                            {/* Tabs Navigation (Horizontal) */}
                            <div className="flex overflow-x-auto items-center gap-8 mt-2 pb-2 custom-scrollbar">
                                <button
                                    onClick={() => setActiveTab('general')}
                                    className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'text-[#d41132] border-[#d41132]' : 'text-[#4c739a] dark:text-[#94a3b8] border-transparent hover:text-[#0d141b] dark:hover:text-white'}`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">store</span>
                                    General
                                </button>
                                <button
                                    onClick={() => setActiveTab('shipping')}
                                    className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'shipping' ? 'text-[#d41132] border-[#d41132]' : 'text-[#4c739a] dark:text-[#94a3b8] border-transparent hover:text-[#0d141b] dark:hover:text-white'}`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                                    Shipping
                                </button>
                                <button
                                    onClick={() => setActiveTab('seo')}
                                    className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'seo' ? 'text-[#d41132] border-[#d41132]' : 'text-[#4c739a] dark:text-[#94a3b8] border-transparent hover:text-[#0d141b] dark:hover:text-white'}`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                    SEO
                                </button>
                                <button
                                    onClick={() => setActiveTab('notifications')}
                                    className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'notifications' ? 'text-[#d41132] border-[#d41132]' : 'text-[#4c739a] dark:text-[#94a3b8] border-transparent hover:text-[#0d141b] dark:hover:text-white'}`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                                    Notifications
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 overflow-y-auto">
                    {/* Section: General */}
                    {activeTab === 'general' && (
                        <section className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                            <div className="px-6 py-5 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                                <h2 className="text-xl font-bold text-[#0d141b] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#d41132]">storefront</span>
                                    Store Identity
                                </h2>
                            </div>
                            <div className="p-6 flex flex-col gap-8">
                                {/* Logo Upload */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    <div className="md:col-span-4 lg:col-span-3">
                                        <h3 className="text-base font-bold text-[#0d141b] dark:text-white mb-2">Company Logo</h3>
                                        <p className="text-sm text-[#4c739a] dark:text-[#94a3b8] leading-relaxed">
                                            This logo will appear on your store header and checkout pages.
                                            <br className="hidden md:block" />
                                            <span className="mt-2 block text-xs font-medium text-[#0d141b]/60 dark:text-white/60">
                                                Recommended: 512x512px
                                                <br />
                                                Formats: JPG, PNG, SVG, WebP. Stored as optimized WebP.
                                            </span>
                                        </p>
                                    </div>

                                    <div className="md:col-span-8 lg:col-span-9 flex flex-col sm:flex-row gap-6 items-start">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                        />
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-32 h-32 flex-shrink-0 bg-[#f6f7f8] dark:bg-[#101922] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-[#d41132] transition-colors"
                                        >
                                            {settings.logo_url ? (
                                                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 z-10 text-3xl group-hover:scale-110 transition-transform">cloud_upload</span>
                                            )}
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center z-20">
                                                    <span className="material-symbols-outlined animate-spin text-[#d41132]">progress_activity</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-3 pt-2">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="px-4 py-2 bg-white dark:bg-[#1a2632] border border-[#e5e7eb] dark:border-[#2d3b4a] hover:border-[#d41132] text-[#0d141b] dark:text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                {settings.logo_url ? 'Change Logo' : 'Upload Logo'}
                                            </button>
                                            {settings.logo_url && (
                                                <button
                                                    onClick={handleRemoveLogo}
                                                    className="text-sm font-semibold text-red-500 hover:text-red-600 px-4 text-left"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <hr className="border-[#e5e7eb] dark:border-[#2d3b4a]" />
                                {/* Store Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-sm font-bold text-[#0d141b] dark:text-white">Site Title</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-[20px]">badge</span>
                                            <input className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-[#0d141b] dark:text-white focus:ring-2 focus:ring-[#d41132] focus:border-transparent outline-none transition-all" placeholder="e.g. Luxe Leather Gear" type="text" value={settings.site_title || ''} onChange={(e) => setSettingsState({ ...settings, site_title: e.target.value })} />
                                        </div>
                                        <p className="text-xs text-[#4c739a] dark:text-[#94a3b8]">
                                            The official name of the store. Used across the header, footer, metadata, order notifications, and invoices.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-[#0d141b] dark:text-white">Support Email</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-[20px]">mail</span>
                                            <input className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-[#0d141b] dark:text-white focus:ring-2 focus:ring-[#d41132] focus:border-transparent outline-none transition-all" type="email" value={settings.support_email || ''} onChange={(e) => setSettingsState({ ...settings, support_email: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-[#0d141b] dark:text-white">Facebook Page ID</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-[20px]">chat</span>
                                            <input className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-[#0d141b] dark:text-white focus:ring-2 focus:ring-[#d41132] focus:border-transparent outline-none transition-all" placeholder="e.g. 61590459932071" type="text" value={settings.facebook_page_id || ''} onChange={(e) => setSettingsState({ ...settings, facebook_page_id: e.target.value })} />
                                        </div>
                                        <p className="text-xs text-[#4c739a] dark:text-[#94a3b8]">
                                            Enter your numeric Facebook Page ID (e.g. `61590459932071`). This embeds the official direct-chat plugin.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-[#0d141b] dark:text-white">WhatsApp Number</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-[20px]">call</span>
                                            <input className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-[#0d141b] dark:text-white focus:ring-2 focus:ring-[#d41132] focus:border-transparent outline-none transition-all" placeholder="e.g. +1234567890" type="text" value={settings.whatsapp_number || ''} onChange={(e) => setSettingsState({ ...settings, whatsapp_number: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Section: Shipping */}
                    {activeTab === 'shipping' && (
                        <section className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                            <div className="px-6 py-5 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                                <h2 className="text-xl font-bold text-[#0d141b] dark:text-white flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-[#d41132]">local_shipping</span>
                                    Global Shipping Configuration
                                </h2>
                                <p className="text-sm text-[#4c739a] dark:text-[#94a3b8]">Set your global threshold for free shipping. For regional rates and zones, use the <a href="/admin/shipping-and-sizing" className="text-[#d41132] font-bold hover:underline">Shipping & Sizing</a> page.</p>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Free Shipping Threshold ($)</label>
                                    <p className="text-xs text-[#4c739a] dark:text-[#94a3b8] mb-1">Cart value to qualify for free shipping.</p>
                                    <input
                                        type="number"
                                        className="px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-[#0d141b] dark:text-white focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                                        value={settings.shipping_free_threshold || ''}
                                        onChange={(e) => setSettingsState({ ...settings, shipping_free_threshold: e.target.value })}
                                        placeholder="150"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Standard Flat Rate ($)</label>
                                    <p className="text-xs text-[#4c739a] dark:text-[#94a3b8] mb-1">Default shipping cost for orders below threshold.</p>
                                    <input
                                        type="number"
                                        className="px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-[#0d141b] dark:text-white focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                                        value={settings.shipping_flat_rate || ''}
                                        onChange={(e) => setSettingsState({ ...settings, shipping_flat_rate: e.target.value })}
                                        placeholder="15"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#f6f7f8] dark:bg-[#101922] rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div>
                                            <label className="text-sm font-bold text-[#0d141b] dark:text-white block">Enable International Shipping</label>
                                            <p className="text-xs text-[#4c739a] dark:text-[#94a3b8]">Allow orders from outside details zones.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.shipping_international === 'true'}
                                                onChange={(e) => setSettingsState({ ...settings, shipping_international: e.target.checked ? 'true' : 'false' })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#d41132]"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Section: SEO */}
                    {activeTab === 'seo' && (
                        <section className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                            <div className="px-6 py-5 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                                <h2 className="text-xl font-bold text-[#0d141b] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#d41132]">search</span>
                                    SEO & Metadata
                                </h2>
                            </div>
                            <div className="p-6 flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Default Meta Title</label>
                                    <input
                                        type="text"
                                        className="px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-[#0d141b] dark:text-white focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                                        value={settings.seo_title || ''}
                                        onChange={(e) => setSettingsState({ ...settings, seo_title: e.target.value })}
                                        placeholder="Luxe Leather Co. | Premium Handcrafted Leather Goods"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Default Meta Description</label>
                                    <textarea
                                        rows={3}
                                        className="px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-[#0d141b] dark:text-white focus:ring-2 focus:ring-[#d41132] outline-none transition-all resize-none"
                                        value={settings.seo_description || ''}
                                        onChange={(e) => setSettingsState({ ...settings, seo_description: e.target.value })}
                                        placeholder="Discover our collection of premium handcrafted leather wallets, bags, and accessories."
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Keywords (Comma separated)</label>
                                    <input
                                        type="text"
                                        className="px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-[#0d141b] dark:text-white focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                                        value={settings.seo_keywords || ''}
                                        onChange={(e) => setSettingsState({ ...settings, seo_keywords: e.target.value })}
                                        placeholder="leather, wallets, handcrafted, premium, accessories"
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Section: Notifications */}
                    {activeTab === 'notifications' && (
                        <section className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                            <div className="px-6 py-5 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                                <h2 className="text-xl font-bold text-[#0d141b] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#d41132]">notifications</span>
                                    Notification Settings
                                </h2>
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#f6f7f8] dark:bg-[#101922] rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div>
                                        <label className="text-sm font-bold text-[#0d141b] dark:text-white block">Email on New Order</label>
                                        <p className="text-xs text-[#4c739a] dark:text-[#94a3b8]">Receive an email whenever a customer places a new order.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.notify_new_order === 'true'}
                                            onChange={(e) => setSettingsState({ ...settings, notify_new_order: e.target.checked ? 'true' : 'false' })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#d41132]"></div>
                                    </label>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#f6f7f8] dark:bg-[#101922] rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div>
                                        <label className="text-sm font-bold text-[#0d141b] dark:text-white block">Email on Low Stock</label>
                                        <p className="text-xs text-[#4c739a] dark:text-[#94a3b8]">Get notified when product stock drops below 5 units.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.notify_low_stock === 'true'}
                                            onChange={(e) => setSettingsState({ ...settings, notify_low_stock: e.target.checked ? 'true' : 'false' })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#d41132]"></div>
                                    </label>
                                </div>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}
