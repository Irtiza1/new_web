'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '@/lib/supabase';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (product: pProduct) => Promise<void>;
    initialData?: Product | null;
}

// Partial product type for creation/editing
export type pProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export default function ProductFormModal({ isOpen, onClose, onSubmit, initialData }: ProductFormModalProps) {
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [categories, setCategories] = useState<string[]>([
        'Jackets', 'Full Coats', 'Bags & Satchels', 'Accessories', 'Shoes'
    ]);

    useEffect(() => {
        setMounted(true);
        // Load categories from admin API
        fetch('/api/categories')
            .then(r => r.json())
            .then(d => { if (d.success && d.data?.length > 0) setCategories(d.data.map((c: any) => c.name)); })
            .catch(() => { });
        return () => setMounted(false);
    }, []);

    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState<pProduct>({
        name: '',
        description: '',
        price: 0,
        category: 'Accessories',
        image: '',
        stock: 0,
    });

    // Reset or populate form
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    description: initialData.description,
                    price: initialData.price,
                    category: initialData.category,
                    image: initialData.image || '',
                    stock: initialData.stock,
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    price: 0,
                    category: 'Accessories',
                    image: '',
                    stock: 0,
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
            alert('Failed to save product. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/media', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            setFormData(prev => ({ ...prev, image: data.url }));
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    const container = typeof document !== 'undefined' ? document.body : null;
    if (!container) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto" style={{ maxWidth: '672px' }}>
                <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                    <h2 className="text-xl font-bold text-[#0d141b] dark:text-white">
                        {initialData ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#0d141b] dark:text-white">Product Name</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                                placeholder="e.g. Classic Leather Wallet"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#0d141b] dark:text-white">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Pricing & Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#0d141b] dark:text-white">Price ($)</label>
                            <input
                                required
                                type="number"
                                min="0" step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#0d141b] dark:text-white">Stock</label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Image */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#0d141b] dark:text-white">Product Image</label>
                        <div className="flex gap-4 items-center">
                            {formData.image && (
                                <img
                                    src={formData.image}
                                    alt="Preview"
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                            )}
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="flex-1 px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                                    placeholder="https://example.com/image.jpg"
                                />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center"
                                >
                                    {isUploading ? (
                                        <span className="material-symbols-outlined animate-spin">refresh</span>
                                    ) : (
                                        <span className="material-symbols-outlined">cloud_upload</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#0d141b] dark:text-white">Description</label>
                        <textarea
                            required
                            rows={4}
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none transition-all resize-none"
                            placeholder="Product description..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || isUploading}
                            className="px-6 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                            {initialData ? 'Update Product' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        container
    );
}
