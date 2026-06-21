'use client';

import { Customer } from '@/lib/supabase';

interface CustomerWithStats extends Customer {
    ordersCount: number;
    totalSpent: number;
}

interface CustomerViewDrawerProps {
    customer: CustomerWithStats;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export default function CustomerViewDrawer({ customer, onClose, onEdit, onDelete }: CustomerViewDrawerProps) {
    const location = [customer.city, customer.country].filter(Boolean).join(', ');

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <aside className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-[#1a2632] shadow-2xl rounded-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[#d41132]/10 text-[#d41132] flex items-center justify-center text-sm font-bold uppercase">
                            {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{customer.name}</h3>
                            <p className="text-xs text-slate-500">{customer.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Close drawer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Contact Info */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider mb-3">Contact</h4>
                        <div className="space-y-2">
                            {customer.phone && (
                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">call</span>
                                    {customer.phone}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                                {customer.email}
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider mb-3">Location</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                            {location || '—'}
                        </div>
                        {customer.address && (
                            <p className="text-xs text-slate-500 mt-1 ml-6">{customer.address}</p>
                        )}
                    </div>

                    {/* Order Stats */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Order History</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-[#1a2632] rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500">Total Orders</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{customer.ordersCount}</p>
                            </div>
                            <div className="bg-white dark:bg-[#1a2632] rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500">Total Spent</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">${customer.totalSpent.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Member Since */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        Member since {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2632] flex flex-col gap-3">
                    <button
                        onClick={onEdit}
                        className="w-full flex items-center justify-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-md"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                        Edit Customer
                    </button>
                    <button
                        onClick={onDelete}
                        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1a2632] border border-red-300 text-red-600 font-bold py-2.5 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                        Delete Customer
                    </button>
                </div>
            </aside>
        </div>
    );
}
