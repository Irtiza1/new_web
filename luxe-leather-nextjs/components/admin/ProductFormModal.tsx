/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (product: pProduct) => Promise<void>;
    initialData?: Product | null;
}

// Partial product type for creation/editing
export type pProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export default function ProductFormModal({ isOpen, onClose, onSubmit, initialData }: ProductFormModalProps) {
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [categories, setCategories] = useState<string[]>([
        'Jackets', 'Full Coats', 'Bags & Satchels', 'Accessories', 'Shoes'
    ]);
    const [sizesInput, setSizesInput] = useState('');

    useEffect(() => {
        setMounted(true);
        // Load categories from admin API
        fetch('/api/categories')
            .then(r => r.json())
            .then(d => { if (d.success && d.data?.length > 0) setCategories(d.data.map((c: { name: string }) => c.name)); })
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
        images: [],
        stock: 0,
        sizes: [],
        specs: [],
        colors: [],
        allow_custom_sizing: false,
        custom_sizing_price: 0,
        shipping_info: {
            policy: 'Free Worldwide Shipping',
            delivery_regular: '3-5 Working Days',
            delivery_custom: '12-15 Working Days'
        },
        is_featured: false,
        featured_tag: null,
        isActive: true,
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
                    images: initialData.images && initialData.images.length > 0 
                        ? initialData.images 
                        : (initialData.image ? [initialData.image] : []),
                    stock: initialData.stock,
                    sizes: initialData.sizes || [],
                    specs: initialData.specs || [],
                    colors: initialData.colors || [],
                    allow_custom_sizing: initialData.allow_custom_sizing || false,
                    custom_sizing_price: initialData.custom_sizing_price || 0,
                    shipping_info: initialData.shipping_info || {
                        policy: 'Free Worldwide Shipping',
                        delivery_regular: '3-5 Working Days',
                        delivery_custom: '12-15 Working Days'
                    },
                    is_featured: initialData.is_featured || false,
                    featured_tag: initialData.featured_tag || null,
                    isActive: initialData.isActive !== undefined ? initialData.isActive : true,
                });
                setSizesInput((initialData.sizes || []).join(', '));
            } else {
                setFormData({
                    name: '',
                    description: '',
                    price: 0,
                    category: categories.length > 0 ? categories[0] : 'Accessories',
                    image: '',
                    images: [],
                    stock: 0,
                    sizes: [],
                    specs: [],
                    colors: [],
                    allow_custom_sizing: false,
                    custom_sizing_price: 0,
                    shipping_info: {
                        policy: 'Free Worldwide Shipping',
                        delivery_regular: '3-5 Working Days',
                        delivery_custom: '12-15 Working Days'
                    },
                    is_featured: false,
                    featured_tag: null,
                    isActive: true,
                });
                setSizesInput('');
            }
        }
    }, [isOpen, initialData, categories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const finalData = {
                ...formData,
                sizes: sizesInput.split(',').map(s => s.trim()).filter(Boolean)
            };
            await onSubmit(finalData);
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            showToast('Failed to save product. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('bucket', 'product-images');
            
            const imageCount = (formData.images || []).length + 1;
            const designation = imageCount === 1 ? 'primary' : 'secondary';
            const paddedCount = imageCount.toString().padStart(2, '0');
            const customName = `${formData.name || 'product'}-${designation}-${paddedCount}`;
            formDataUpload.append('customName', customName);

            const res = await fetch('/api/media', {
                method: 'POST',
                body: formDataUpload,
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            setFormData(prev => {
                const newImages = [...(prev.images || []), data.data.url];
                return { 
                    ...prev, 
                    images: newImages,
                    // Optionally keep image synced to the first image for safety
                    image: newImages[0] 
                };
            });
        } catch (error) {
            console.error('Upload failed:', error);
            showToast('Failed to upload image', 'error');
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
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

                    {/* Pricing */}
                    <div className="grid grid-cols-1 gap-6">
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
                    </div>

                    {/* Featured Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Feature on Homepage</h3>
                            <p className="text-xs text-gray-500">Showcase this product in the Featured Collections section.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.is_featured || false}
                                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#d41132]"></div>
                        </label>
                    </div>

                    {/* Image Gallery */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#0d141b] dark:text-white">Product Images</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {(formData.images || []).map((img, idx) => (
                                <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square">
                                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const newImages = [...(formData.images || [])];
                                            newImages.splice(idx, 1);
                                            setFormData({ ...formData, images: newImages, image: newImages[0] || '' });
                                        }}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                    {idx === 0 && (
                                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold text-center py-1">
                                            PRIMARY
                                        </span>
                                    )}
                                </div>
                            ))}
                            {/* Upload Button Box */}
                            <div 
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                                className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#d41132] hover:bg-red-50 dark:hover:bg-[#d41132]/10 transition-colors aspect-square ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isUploading ? (
                                    <span className="material-symbols-outlined animate-spin text-gray-400">refresh</span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-gray-400 mb-1">add_photo_alternate</span>
                                        <span className="text-xs text-gray-500 font-medium text-center px-2">Upload Image</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/*"
                        />
                        {/* </div> removed here to keep featured toggle inside the wrapper */}

                        <div className="flex items-center mt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })} className={`relative w-11 h-6 rounded-full transition-all ${formData.is_featured ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_featured ? 'translate-x-5' : ''}`} />
                                </div>
                                <span className="text-sm font-medium text-amber-700 dark:text-amber-500">Feature on Homepage</span>
                            </label>
                        </div>

                        {formData.is_featured && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 animate-in fade-in zoom-in-95 duration-200 mt-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-500 mb-3">Featured Badge Tag</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Most Purchased', 'Top Selling', 'New Arrival', 'Top Rated'].map(tag => (
                                        <label key={tag} className="flex items-center gap-2 cursor-pointer group">
                                            <div onClick={() => setFormData({ ...formData, featured_tag: tag })} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${formData.featured_tag === tag ? 'border-amber-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-amber-400'}`}>
                                                {formData.featured_tag === tag && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                                            </div>
                                            <span className={`text-sm font-medium ${formData.featured_tag === tag ? 'text-amber-900 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-300'}`}>{tag}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dynamic Details: Sizes, Colors, Specs, Bespoke */}
                    <div className="flex flex-col gap-6 p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Storefront Details</h3>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#0d141b] dark:text-white">Sizes (comma separated)</label>
                            <input
                                type="text"
                                value={sizesInput}
                                onChange={(e) => setSizesInput(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none"
                                placeholder="e.g. S, M, L, XL"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-[#0d141b] dark:text-white">Colors</label>
                                <button type="button" onClick={() => setFormData({...formData, colors: [...(formData.colors || []), {name: 'New Color', hex: '#000000'}]})} className="text-xs font-bold text-[#d41132] hover:text-[#b30f2a]">
                                    + Add Color
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(formData.colors || []).map((color: any, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input type="color" value={color.hex} onChange={(e) => { const newC = [...(formData.colors||[])]; newC[idx].hex = e.target.value; setFormData({...formData, colors: newC})}} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                                        <input type="text" value={color.name} onChange={(e) => { const newC = [...(formData.colors||[])]; newC[idx].name = e.target.value; setFormData({...formData, colors: newC})}} className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-sm" placeholder="Color Name" />
                                        <button type="button" onClick={() => { const newC = [...(formData.colors||[])]; newC.splice(idx,1); setFormData({...formData, colors: newC})}} className="p-2 text-slate-400 hover:text-red-500">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-[#0d141b] dark:text-white">Specifications</label>
                                <button type="button" onClick={() => setFormData({...formData, specs: [...(formData.specs || []), {label: 'Spec', value: 'Value'}]})} className="text-xs font-bold text-[#d41132] hover:text-[#b30f2a]">
                                    + Add Spec
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(formData.specs || []).map((spec: any, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input type="text" value={spec.label} onChange={(e) => { const newS = [...(formData.specs||[])]; newS[idx].label = e.target.value; setFormData({...formData, specs: newS})}} className="w-1/3 px-3 py-2 rounded-lg bg-white dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-sm" placeholder="Label (e.g. Material)" />
                                        <input type="text" value={spec.value} onChange={(e) => { const newS = [...(formData.specs||[])]; newS[idx].value = e.target.value; setFormData({...formData, specs: newS})}} className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#101922] border border-gray-300 dark:border-gray-600 text-sm" placeholder="Value (e.g. 100% Leather)" />
                                        <button type="button" onClick={() => { const newS = [...(formData.specs||[])]; newS.splice(idx,1); setFormData({...formData, specs: newS})}} className="p-2 text-slate-400 hover:text-red-500">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2"></div>
                        
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Enable Bespoke / Custom Fit</h4>
                                    <p className="text-xs text-slate-500">Allow customers to submit custom measurements.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={formData.allow_custom_sizing || false} onChange={(e) => setFormData({ ...formData, allow_custom_sizing: e.target.checked })} />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#d41132]"></div>
                                </label>
                            </div>
                            
                            {formData.allow_custom_sizing && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Bespoke Price ($)</label>
                                    <input type="number" min="0" step="0.01" value={formData.custom_sizing_price || 0} onChange={(e) => setFormData({ ...formData, custom_sizing_price: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 rounded-lg bg-white dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none" />
                                </div>
                            )}
                        </div>

                        <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2"></div>
                        
                        {/* Shipping Details */}
                        <div className="flex flex-col gap-4">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Shipping Details</h4>
                                <p className="text-xs text-slate-500">Configure delivery expectations for this product.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Shipping Policy</label>
                                    <input 
                                        type="text" 
                                        value={formData.shipping_info?.policy || ''} 
                                        onChange={(e) => setFormData({ ...formData, shipping_info: { ...formData.shipping_info, policy: e.target.value } })} 
                                        className="h-10 px-3 bg-white dark:bg-[#101922] border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none focus:border-[#d41132]" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">Regular Delivery Time</label>
                                        <input 
                                            type="text" 
                                            value={formData.shipping_info?.delivery_regular || ''} 
                                            onChange={(e) => setFormData({ ...formData, shipping_info: { ...formData.shipping_info, delivery_regular: e.target.value } })} 
                                            className="h-10 px-3 bg-white dark:bg-[#101922] border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none focus:border-[#d41132]" 
                                            placeholder="e.g. 3-5 Working Days"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">Custom Delivery Time</label>
                                        <input 
                                            type="text" 
                                            value={formData.shipping_info?.delivery_custom || ''} 
                                            onChange={(e) => setFormData({ ...formData, shipping_info: { ...formData.shipping_info, delivery_custom: e.target.value } })} 
                                            className="h-10 px-3 bg-white dark:bg-[#101922] border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none focus:border-[#d41132]" 
                                            placeholder="e.g. 12-15 Working Days"
                                        />
                                    </div>
                                </div>
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
