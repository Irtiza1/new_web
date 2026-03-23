'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { Product } from '@/lib/supabase';

// Extend Product to handle potential array of images from legacy/API difference
interface ExtendedProduct extends Product {
    images?: string[];
    sale_price?: number;
}

import ProductFormModal, { pProduct } from '@/components/admin/ProductFormModal';
import ConfirmModal from '@/components/admin/ConfirmModal';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<ExtendedProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ExtendedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ExtendedProduct | null>(null);
    const [categories, setCategories] = useState<string[]>(['Jackets', 'Full Coats', 'Bags & Satchels', 'Accessories', 'Shoes']);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fetch categories
    useEffect(() => {
        fetch('/api/categories').then(r => r.json()).then(d => {
            if (d.success && d.data?.length > 0) setCategories(d.data.map((c: any) => c.name));
        }).catch(() => { });
    }, []);

    // Fetch products on load
    useEffect(() => {
        fetchProducts();
    }, []);

    // Filter products when search or category changes
    useEffect(() => {
        let result = products;

        if (selectedCategory !== 'All') {
            result = result.filter(p => p.category === selectedCategory);
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lowerTerm) ||
                (p.description && p.description.toLowerCase().includes(lowerTerm))
            );
        }

        setFilteredProducts(result);
        setCurrentPage(1);
    }, [products, searchTerm, selectedCategory]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/products');
            const result = await res.json();
            if (result.success) {
                setProducts(result.data);
                setFilteredProducts(result.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProduct = async (productData: pProduct) => {
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            if (!res.ok) throw new Error('Failed to create product');

            await fetchProducts();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    };

    const handleUpdateProduct = async (productData: pProduct) => {
        if (!editingProduct) return;
        try {
            const res = await fetch(`/api/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            if (!res.ok) throw new Error('Failed to update product');

            await fetchProducts();
            setIsModalOpen(false);
            setEditingProduct(null);
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (isBulkDeleting) return;
        
        setConfirmModal({
            isOpen: true,
            title: 'Delete Product',
            message: 'Are you sure you want to delete this product? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetch(`/api/products/${id}`, {
                        method: 'DELETE',
                    });

                    if (!res.ok) throw new Error('Failed to delete product');

                    // Optimistic update
                    setProducts(products.filter(p => p.id !== id));
                    setSelectedIds(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                } catch (error) {
                    console.error('Error deleting product:', error);
                    alert('Failed to delete product. Please try again.');
                    fetchProducts(); // Revert on error
                }
            }
        });
    };

    const handleBulkDelete = async () => {
        if (isBulkDeleting || selectedIds.size === 0) return;
        
        const count = selectedIds.size;
        setConfirmModal({
            isOpen: true,
            title: `Delete ${count} Products`,
            message: `Are you sure you want to delete ${count} products? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsBulkDeleting(true);
                const idsToDelete = Array.from(selectedIds);
                let successCount = 0;
                let failCount = 0;

                try {
                    await Promise.all(idsToDelete.map(async (id) => {
                        try {
                            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
                            if (res.ok) successCount++;
                            else failCount++;
                        } catch (err) {
                            failCount++;
                        }
                    }));

                    if (successCount > 0) {
                        setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
                        setSelectedIds(new Set());
                    }

                    if (failCount > 0) {
                        alert(`Bulk delete completed. Success: ${successCount}, Failed: ${failCount}`);
                    }
                } catch (error) {
                    console.error('Bulk delete error:', error);
                    alert('An error occurred during bulk deletion.');
                } finally {
                    setIsBulkDeleting(false);
                    fetchProducts(); // Refresh to ensure sync
                }
            }
        });
    };

    const toggleSelectAll = () => {
        const visibleIds = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(p => p.id);
        const allVisibleSelected = visibleIds.every(id => selectedIds.has(id));

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleIds.forEach(id => next.delete(id));
            } else {
                visibleIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const openEditModal = (product: ExtendedProduct) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    // Calculate stats
    const totalInventory = products.reduce((acc, curr) => acc + curr.stock, 0);
    const lowStockCount = products.filter(p => p.stock < 5).length;
    const totalValue = products.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] font-[family-name:var(--font-inter)]">
            {/* <AdminSidebar /> removed for layout */}

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="w-full px-6 py-4 border-b border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] sticky top-0 z-10 shadow-sm shrink-0">
                    <div className="max-w-7xl mx-auto flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/admin" className="text-[#4c739a] dark:text-[#94a3b8] font-medium hover:text-[#d41132] transition-colors">Home</Link>
                            <span className="text-[#4c739a] dark:text-[#94a3b8] font-medium">/</span>
                            <span className="text-[#0d141b] dark:text-white font-medium">Products</span>
                        </div>

                        <div className="flex flex-wrap justify-between items-end gap-4">
                            <div>
                                <h1 className="text-2xl font-black text-[#0d141b] dark:text-white">Product Inventory</h1>
                                <p className="text-sm text-[#4c739a] dark:text-[#94a3b8]">Manage your catalog, stock levels, and pricing.</p>
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="flex items-center gap-2 px-4 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white text-sm font-bold rounded-lg shadow-md transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Add Product
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-2">
                            <div className="bg-[#f6f7f8] dark:bg-[#101922] p-3 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                                <p className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8]">Total Products</p>
                                <p className="text-lg font-black text-[#0d141b] dark:text-white">{products.length}</p>
                            </div>
                            <div className="bg-[#f6f7f8] dark:bg-[#101922] p-3 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                                <p className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8]">Total Inventory</p>
                                <p className="text-lg font-black text-[#0d141b] dark:text-white">{totalInventory} units</p>
                            </div>
                            <div className="bg-[#f6f7f8] dark:bg-[#101922] p-3 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                                <p className="text-xs font-bold text-[#4c739a] dark:text-[#94a3b8]">Low Stock Alerts</p>
                                <p className={`text-lg font-black ${lowStockCount > 0 ? 'text-[#d41132]' : 'text-emerald-500'}`}>{lowStockCount}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 w-full max-w-7xl mx-auto p-6 overflow-y-auto">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex-1 min-w-[200px] relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-[20px]">search</span>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-[#1a2632] border border-[#e5e7eb] dark:border-[#2d3b4a] focus:ring-2 focus:ring-[#d41132] outline-none transition-all"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 rounded-lg bg-white dark:bg-[#1a2632] border border-[#e5e7eb] dark:border-[#2d3b4a] focus:ring-2 focus:ring-[#d41132] outline-none transition-all text-sm font-medium"
                        >
                            <option value="All">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#f6f7f8] dark:bg-[#101922] border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                                    <tr>
                                        <th className="px-6 py-4 w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent"
                                                checked={filteredProducts.length > 0 && filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).every(p => selectedIds.has(p.id))}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#4c739a] dark:text-[#94a3b8]">Product</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#4c739a] dark:text-[#94a3b8]">Category</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#4c739a] dark:text-[#94a3b8]">Price</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#4c739a] dark:text-[#94a3b8]">Stock</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#4c739a] dark:text-[#94a3b8] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d3b4a]">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                                    Loading products...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No products found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((product) => (
                                            <tr key={product.id} className={`hover:bg-[#f6f7f8] dark:hover:bg-[#17202b] transition-colors group ${selectedIds.has(product.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent"
                                                        checked={selectedIds.has(product.id)}
                                                        onChange={() => toggleSelect(product.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                                            {(product.image || (product.images && product.images[0])) ? (
                                                                <img src={product.image || (product.images && product.images[0])} alt={product.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                    <span className="material-symbols-outlined text-sm">image</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#0d141b] dark:text-white text-sm">{product.name}</p>
                                                            {product.sale_price && (
                                                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">SALE</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    {product.category}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[#0d141b] dark:text-white">
                                                    {product.sale_price ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-[#d41132]">${product.sale_price.toFixed(2)}</span>
                                                            <span className="text-xs text-gray-400 line-through">${product.price.toFixed(2)}</span>
                                                        </div>
                                                    ) : (
                                                        <span>${product.price.toFixed(2)}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold ${product.stock === 0 ? 'text-red-500' :
                                                            product.stock < 5 ? 'text-amber-500' : 'text-emerald-500'
                                                            }`}>
                                                            {product.stock} units
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {product.stock === 0 ? 'Out of Stock' : product.stock < 5 ? 'Low Stock' : 'In Stock'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 transition-opacity">
                                                        <button
                                                            onClick={() => openEditModal(product)}
                                                            className="p-1.5 text-gray-500 hover:text-[#0d141b] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {(() => {
                            const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
                            const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
                            const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, filteredProducts.length);
                            return (
                                <div className="px-6 py-4 border-t border-[#e5e7eb] dark:border-[#2d3b4a] flex items-center justify-between text-sm text-gray-500">
                                    <span>Showing {startIdx + 1}–{endIdx} of {filteredProducts.length} results</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 rounded border border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >Previous</button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                                            Math.max(0, currentPage - 3),
                                            Math.min(totalPages, currentPage + 2)
                                        ).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-1 rounded border transition-colors ${currentPage === page ? 'bg-[#d41132] text-white border-[#d41132]' : 'border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                            >{page}</button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 rounded border border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >Next</button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </main>

                {/* Create/Edit Modal */}
                <ProductFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
                    initialData={editingProduct}
                />

                {/* Bulk Action Bar */}
                {selectedIds.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl border border-slate-800 flex flex-wrap md:flex-nowrap items-center justify-center gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 w-[90%] md:w-auto">
                        <div className="flex items-center gap-3">
                            <span className="bg-[#d41132] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {selectedIds.size}
                            </span>
                            <p className="text-sm font-medium whitespace-nowrap">items selected</p>
                        </div>
                        <div className="hidden md:block w-px h-6 bg-slate-700" />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="text-sm font-bold text-slate-400 hover:text-white transition-colors px-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                                className="flex items-center gap-2 px-4 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white text-sm font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
                            >
                                {isBulkDeleting ? (
                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                )}
                                {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
                            </button>
                        </div>
                    </div>
                )}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    </div>
);
}
