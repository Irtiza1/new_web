'use client';

import Link from 'next/link';
import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] font-[family-name:var(--font-inter)]">
            <AdminSidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="w-full px-6 py-5 border-b border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] sticky top-0 z-10 shadow-sm shrink-0">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col gap-4">
                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-2 text-sm">
                                <Link href="/admin" className="text-[#4c739a] dark:text-[#94a3b8] font-medium hover:text-[#d41132] transition-colors">Home</Link>
                                <span className="text-[#4c739a] dark:text-[#94a3b8] font-medium">/</span>
                                <span className="text-[#0d141b] dark:text-white font-medium">Settings</span>
                            </div>
                            {/* Title & Actions */}
                            <div className="flex flex-wrap justify-between items-end gap-4">
                                <div className="flex flex-col gap-1">
                                    <h1 className="text-3xl font-black tracking-tight text-[#0d141b] dark:text-white">Platform Settings</h1>
                                    <p className="text-[#4c739a] dark:text-[#94a3b8]">Manage your store identity, shipping configurations, and SEO preferences.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="px-4 py-2 text-sm font-bold text-[#4c739a] dark:text-[#94a3b8] bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                        Cancel
                                    </button>
                                    <button className="flex items-center gap-2 px-5 py-2 bg-[#d41132] hover:bg-#b30f2a text-white text-sm font-bold rounded-lg shadow-md transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">save</span>
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Grid */}
                <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 overflow-y-auto">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Sidebar Navigation (Tabs) */}
                        <aside className="w-full lg:w-64 flex-shrink-0">
                            <nav className="sticky top-40 flex flex-row lg:flex-col gap-1 lg:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                                <button
                                    onClick={() => setActiveTab('general')}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold border-l-4 lg:border-l-4 transition-colors ${activeTab === 'general' ? 'bg-[#d41132]/10 text-[#d41132] border-[#d41132]' : 'text-[#4c739a] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0d141b] dark:hover:text-white border-transparent'}`}
                                >
                                    <span className="material-symbols-outlined">store</span>
                                    General
                                </button>
                                <button
                                    onClick={() => setActiveTab('shipping')}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium border-l-4 transition-colors ${activeTab === 'shipping' ? 'bg-[#d41132]/10 text-[#d41132] border-[#d41132]' : 'text-[#4c739a] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0d141b] dark:hover:text-white border-transparent'}`}
                                >
                                    <span className="material-symbols-outlined">local_shipping</span>
                                    Shipping
                                </button>
                                <button
                                    onClick={() => setActiveTab('seo')}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium border-l-4 transition-colors ${activeTab === 'seo' ? 'bg-[#d41132]/10 text-[#d41132] border-[#d41132]' : 'text-[#4c739a] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0d141b] dark:hover:text-white border-transparent'}`}
                                >
                                    <span className="material-symbols-outlined">search</span>
                                    SEO
                                </button>
                                <button
                                    onClick={() => setActiveTab('notifications')}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium border-l-4 transition-colors ${activeTab === 'notifications' ? 'bg-[#d41132]/10 text-[#d41132] border-[#d41132]' : 'text-[#4c739a] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0d141b] dark:hover:text-white border-transparent'}`}
                                >
                                    <span className="material-symbols-outlined">notifications</span>
                                    Notifications
                                </button>
                            </nav>
                        </aside>

                        {/* Right Content Area */}
                        <div className="flex-1 flex flex-col gap-8">
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
                                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                                            <div className="w-32 h-32 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-[#d41132] transition-colors">
                                                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 z-10 text-3xl group-hover:scale-110 transition-transform">cloud_upload</span>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <h3 className="text-base font-bold text-[#0d141b] dark:text-white">Company Logo</h3>
                                                <p className="text-sm text-[#4c739a] dark:text-[#94a3b8] max-w-md">
                                                    This logo will appear on your store header and checkout pages. Recommended size: 512x512px. Formats: JPG, PNG, SVG.
                                                </p>
                                                <div className="flex gap-3 mt-1">
                                                    <button className="text-sm font-semibold text-[#d41132] hover:text-#b30f2a">Upload New</button>
                                                    <button className="text-sm font-semibold text-red-500 hover:text-red-600">Remove</button>
                                                </div>
                                            </div>
                                        </div>
                                        <hr className="border-[#e5e7eb] dark:border-[#2d3b4a]" />
                                        {/* Contact Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-bold text-[#0d141b] dark:text-white">Support Email</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-[20px]">mail</span>
                                                    <input className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-[#0d141b] dark:text-white focus:ring-2 focus:ring-[#d41132] focus:border-transparent outline-none transition-all" type="email" defaultValue="support@luxeleather.co" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-bold text-[#0d141b] dark:text-white">WhatsApp Number</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-[20px]">chat</span>
                                                    <input className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-[#0d141b] dark:text-white focus:ring-2 focus:ring-[#d41132] focus:border-transparent outline-none transition-all" placeholder="+1 (555) 000-0000" type="tel" />
                                                </div>
                                                <p className="text-xs text-[#4c739a] dark:text-[#94a3b8]">Format: +(Country Code) Number</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Section: Shipping */}
                            {activeTab === 'shipping' && (
                                <section className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                                    <div className="px-6 py-5 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                                        <h2 className="text-xl font-bold text-[#0d141b] dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#d41132]">local_shipping</span>
                                            Shipping Configuration
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-[#4c739a] dark:text-[#94a3b8]">Configure your shipping zones, rates, and carrier integrations here.</p>
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
                                    <div className="p-6">
                                        <p className="text-[#4c739a] dark:text-[#94a3b8]">Manage your site's meta titles, descriptions, and social media previews.</p>
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
                                    <div className="p-6">
                                        <p className="text-[#4c739a] dark:text-[#94a3b8]">Configure email notifications for orders, customer inquiries, and system alerts.</p>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
