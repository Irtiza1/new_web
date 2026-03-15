'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV_GROUPS } from '@/lib/constants/navigation';
import { useAdminNotifications } from '@/contexts/AdminNotificationContext';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { counts } = useAdminNotifications();

    const isActive = (path: string) =>
        path === '/admin' ? pathname === path : pathname.startsWith(path);

    const getBadge = (name: string) => {
        if (name === 'Orders') return counts.pendingOrders;
        if (name === 'Requests') return counts.newRequests;
        return 0;
    };

    return (
        <aside className="w-[260px] flex-shrink-0 border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300 relative h-full hidden lg:block">
            <div className="absolute inset-0 flex flex-col overflow-hidden p-3">
                {/* Brand */}
                <Link href="/admin" className="flex items-center gap-3 px-3 py-4 group mb-2 shrink-0">
                    <div className="bg-gradient-to-br from-[#d41132] to-[#a60e25] rounded-xl flex-shrink-0 size-10 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        <span className="material-symbols-outlined text-white text-xl">checkroom</span>
                    </div>
                    <div>
                        <h1 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">Luxe Leather Co.</h1>
                        <p className="text-slate-400 dark:text-slate-500 text-[11px] font-medium uppercase tracking-widest">Admin Panel</p>
                    </div>
                </Link>

                {/* Grouped Nav */}
                <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-1 pb-4 custom-scrollbar pr-1">
                    {ADMIN_NAV_GROUPS.map((group) => (
                        <div key={group.label} className="mb-2 shrink-0">
                            <p className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
                                {group.label}
                            </p>
                            {group.items.map((item) => {
                                const active = isActive(item.path);
                                const badge = getBadge(item.name);
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm group ${active
                                            ? 'bg-[#d41132]/10 text-[#d41132] dark:bg-[#d41132]/20 dark:text-red-400 font-semibold'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className="material-symbols-outlined text-[20px] transition-all"
                                                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                                            >
                                                {item.icon}
                                            </span>
                                            <span className="leading-normal shrink-0">{item.name}</span>
                                        </div>
                                        {badge > 0 && (
                                            <span className="bg-[#d41132] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0 ml-1">
                                                {badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-auto shrink-0">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#c27a2a] to-[#8a5520] flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-white text-[16px]">person</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Admin User</p>
                            <Link href="/" className="text-xs text-slate-400 hover:text-[#d41132] transition-colors truncate block">
                                ↗ View Storefront
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
