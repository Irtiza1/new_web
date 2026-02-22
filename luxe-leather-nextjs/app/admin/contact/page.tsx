'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import type { ContactMessage } from '@/lib/services/contactService';

export default function AdminContactPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Stats for notifications
    const [newMessageCount, setNewMessageCount] = useState(0);

    useEffect(() => {
        loadMessages();
    }, [statusFilter]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            loadMessages();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (statusFilter !== 'all') query.append('status', statusFilter);
            if (searchQuery) query.append('search', searchQuery);

            const res = await fetch(`/api/contact?${query.toString()}`);
            const data = await res.json();

            if (data.success) {
                setMessages(data.data);
                if (!selectedMessage && data.data.length > 0) {
                    setSelectedMessage(data.data[0]);
                }

                if (statusFilter === 'all' && !searchQuery) {
                    const count = data.data.filter((m: ContactMessage) => m.status === 'new').length;
                    setNewMessageCount(count);
                }
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/contact/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus as any } : m));
                if (selectedMessage?.id === id) {
                    setSelectedMessage({ ...selectedMessage, status: newStatus as any });
                }
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            const res = await fetch(`/api/contact/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setMessages(messages.filter(m => m.id !== id));
                if (selectedMessage?.id === id) {
                    setSelectedMessage(null);
                }
            }
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            new: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
            read: 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-900/30 dark:text-slate-400',
            replied: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400',
            archived: 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400'
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const style = (styles as any)[status.toLowerCase()] || styles.new;

        return (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-white h-screen flex overflow-hidden font-[family-name:var(--font-inter)]">


            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Top Header */}
                <header className="h-16 bg-white dark:bg-[#15202b] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                    {/* Search */}
                    <div className="flex-1 max-w-lg">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-[#d41132] transition-colors">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#d41132] sm:text-sm sm:leading-6 bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:text-white transition-all"
                                placeholder="Search sender, email, or subject..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Right Actions */}
                    <div className="flex items-center gap-4 ml-6">
                        <button
                            onClick={() => setStatusFilter('new')}
                            className="relative p-2 text-slate-500 hover:text-[#d41132] transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Show new messages"
                        >
                            <span className="material-symbols-outlined">mail</span>
                            {newMessageCount > 0 && (
                                <span className="absolute top-1 right-1 size-4 bg-red-500 border border-white dark:border-[#15202b] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                    {newMessageCount}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-6xl mx-auto flex flex-col h-full">
                        {/* Page Header & Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Contact Messages</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage inquiries from the contact form.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Status Filter Buttons */}
                                <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                                    {['all', 'new', 'read', 'replied'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === status
                                                ? 'bg-[#d41132] text-white shadow-sm'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Data Table Card */}
                        <div className="bg-white dark:bg-[#15202b] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col">
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d41132]"></div>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sender</th>
                                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Inquiry Type</th>
                                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {messages.map((msg) => (
                                                <tr
                                                    key={msg.id}
                                                    onClick={() => {
                                                        setSelectedMessage(msg);
                                                        if (msg.status === 'new') handleStatusUpdate(msg.id, 'read');
                                                    }}
                                                    className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${selectedMessage?.id === msg.id ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}
                                                >
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                                                                {msg.name?.split(' ').map((n: string) => n[0]).join('')}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-slate-900 dark:text-white">{msg.name}</span>
                                                                <span className="text-xs text-slate-500">{msg.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]">{msg.inquiry_type}</td>
                                                    <td className="py-4 px-6">
                                                        <StatusBadge status={msg.status} />
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-slate-500 text-right tabular-nums">{new Date(msg.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                            {messages.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-12 text-center text-slate-500">
                                                        No messages found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-sm text-slate-500">Showing {messages.length} results</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side Panel (Details) */}
                {selectedMessage && (
                    <aside className="absolute top-0 right-0 h-full w-[400px] bg-white dark:bg-[#15202b] shadow-2xl z-30 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out translate-x-0">
                        {/* Drawer Header */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex flex-col">
                                <span className="text-xs font-mono text-slate-500 mb-1">Message Details</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4">{selectedMessage.inquiry_type}</h3>
                            </div>
                            <button onClick={() => setSelectedMessage(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Client Info Card */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-700">
                                <div className="size-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold">
                                    {selectedMessage.name?.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedMessage.name}</p>
                                    <p className="text-xs text-slate-500">{selectedMessage.email}</p>
                                </div>
                            </div>
                            {/* Message Content */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400 text-[18px]">mail</span>
                                    Message
                                </h4>
                                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm whitespace-pre-wrap">
                                    {selectedMessage.message}
                                </div>
                            </div>
                            {/* Meta Data */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-slate-500">Received on {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                        {/* Drawer Actions */}
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15202b]">
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.inquiry_type}`, '_blank')}
                                    className="w-full flex items-center justify-center gap-2 bg-[#d41132] hover:bg-[#b30f2a] text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-md shadow-red-200 dark:shadow-none"
                                >
                                    <span className="material-symbols-outlined text-[20px]">reply</span>
                                    Reply via Email
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(selectedMessage.id, 'replied')}
                                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium py-2.5 px-4 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[20px]">check</span>
                                    Mark as Replied
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedMessage.id)}
                                    className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium py-2.5 px-4 rounded-lg transition-all"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </aside>
                )}
            </main>
        </div>
    );
}
