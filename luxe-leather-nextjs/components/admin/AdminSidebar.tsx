'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV_ITEMS } from '@/lib/constants/navigation';
import { useAdminNotifications } from '@/contexts/AdminNotificationContext';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { counts } = useAdminNotifications();

    const isActive = (path: string) => pathname === path;

    const navItems = ADMIN_NAV_ITEMS;

    return (
        <aside className="flex w-64 flex-col border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300 h-screen sticky top-0 shrink-0 z-50">
            <div className="flex h-full flex-col justify-between p-4">
                <div className="flex flex-col gap-4">
                    {/* Brand */}
                    <Link href="/admin" className="flex items-center gap-3 px-2 group">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shadow-sm bg-slate-200 dark:bg-slate-700 flex items-center justify-center group-hover:bg-[#d41132] transition-colors">
                            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 group-hover:text-white transition-colors">checkroom</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-normal">Luxe Leather Co.</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal">Admin Panel</p>
                        </div>
                    </Link>

                    {/* Nav Items */}
                    <nav className="flex flex-col gap-2 mt-4">
                        {navItems.map((item) => {
                            let badgeCount = 0;
                            if (item.name === 'Orders') badgeCount = counts.pendingOrders;
                            if (item.name === 'Requests') badgeCount = counts.newRequests;
                            // if (item.name === 'Products' && counts.lowStock > 0) badgeCount = counts.lowStock; // Optional: Low stock badge

                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${isActive(item.path)
                                        ? 'bg-[#d41132]/10 text-[#d41132] dark:bg-[#d41132]/20 dark:text-red-400 font-medium'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-xl" style={isActive(item.path) ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                                        <p className="text-sm leading-normal">{item.name}</p>
                                    </div>
                                    {badgeCount > 0 && (
                                        <span className="bg-[#d41132] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {badgeCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3 px-3 py-2 border-t border-slate-200 dark:border-slate-800 mt-auto pt-4">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">person</span>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Admin User</p>
                        <Link href="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#d41132] transition-colors">View Storefront</Link>
                    </div>
                </div>
            </div>
        </aside>
    );
}
