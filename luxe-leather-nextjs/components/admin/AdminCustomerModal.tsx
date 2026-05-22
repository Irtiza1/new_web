'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Customer } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

// Partial customer type for creation/editing
export type pCustomer = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'orders'>;

interface AdminCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (customer: pCustomer) => Promise<void>;
    initialData?: Customer | null;
}

export default function AdminCustomerModal({ isOpen, onClose, onSubmit, initialData }: AdminCustomerModalProps) {
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<pCustomer>({
        name: '',
        email: '',
        phone: '',
        city: '',
        country: '',
        isActive: true,
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    email: initialData.email,
                    phone: initialData.phone || '',
                    city: initialData.city || '',
                    country: initialData.country || '',
                    isActive: initialData.isActive !== undefined ? initialData.isActive : true,
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    city: '',
                    country: '',
                    isActive: true,
                });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            showToast('Failed to save customer. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    const container = typeof document !== 'undefined' ? document.body : null;
    if (!container) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto" style={{ maxWidth: '480px' }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                    <h2 className="text-xl font-bold text-[#0d141b] dark:text-white">
                        {initialData ? 'Edit Customer' : 'Add New Customer'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#0d141b] dark:text-white">Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#0d141b] dark:text-white">Email</label>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#0d141b] dark:text-white">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#0d141b] dark:text-white">City</label>
                            <input
                                type="text"
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                                placeholder="New York"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#0d141b] dark:text-white">Country</label>
                            <input
                                type="text"
                                value={formData.country || ''}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                                placeholder="USA"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e7eb] dark:border-[#2d3b4a] mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                            {initialData ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        container
    );
}
