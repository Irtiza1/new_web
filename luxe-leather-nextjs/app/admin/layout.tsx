'use client';

import { useState } from 'react';
import { AdminNotificationProvider } from '@/contexts/AdminNotificationContext';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <AdminNotificationProvider>
            <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922]">
                <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    {/* Mobile Header */}
                    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-[#d41132] to-[#a60e25] rounded-xl flex-shrink-0 size-8 flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-white text-sm">checkroom</span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">Luxe Leather Co.</span>
                        </div>
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">menu</span>
                        </button>
                    </div>
                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                        {children}
                    </div>
                </div>
            </div>
        </AdminNotificationProvider>
    );
}
