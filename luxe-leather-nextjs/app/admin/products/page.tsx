'use client';

import { useState, useEffect } from 'react';
import AdminPageLayout from '@/components/admin/shared/AdminPageLayout';
import AdminTable from '@/components/admin/shared/AdminTable';
import AdminPagination from '@/components/admin/shared/AdminPagination';
import AdminBulkActionsBar from '@/components/admin/shared/AdminBulkActionsBar';

import { useToast } from '@/contexts/ToastContext';
import { Product } from '@/lib/supabase';

// Extend Product to handle potential array of images from legacy/API difference
interface ExtendedProduct extends Product {
    images?: string[];
    sale_price?: number;
}

import ProductFormModal, { pProduct } from '@/components/admin/ProductFormModal';
import ConfirmModal from '@/components/admin/ConfirmModal';
import AdminFilterTabs from '@/components/admin/shared/AdminFilterTabs';

export default function AdminProductsPage() {
    const { showToast } = useToast();
    const [products, setProducts] = useState<ExtendedProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ExtendedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ExtendedProduct | null>(null);
    const [categories, setCategories] = useState<string[]>(['Jackets', 'Full Coats', 'Bags & Satchels', 'Accessories', 'Shoes']);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (activeMenu && !target.closest('.action-menu-trigger') && !target.closest('.action-menu')) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeMenu]);

    const toggleMenu = (productId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === productId ? null : productId);
    };

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
                    showToast('Failed to delete product. Please try again.', 'error');
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
                        showToast(`Bulk delete completed. Success: ${successCount}, Failed: ${failCount}`, 'error');
                    }
                } catch (error) {
                    console.error('Bulk delete error:', error);
                    showToast('An error occurred during bulk deletion.', 'error');
                } finally {
                    setIsBulkDeleting(false);
                    fetchProducts(); // Refresh to ensure sync
                }
            }
        });
    };

    const toggleSelectAll = () => {
        const visibleIds = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => p.id);
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
        <AdminPageLayout
            title="Product Inventory"
            subtitle="Manage your catalog, stock levels, and pricing."
            actions={
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white text-sm font-bold rounded-lg shadow-md transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Add Product
                </button>
            }
            stats={
                <>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total Products</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{products.length}</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Total Inventory</p>
                        <p className="text-base font-black text-[#0d141b] dark:text-white leading-none mt-0.5">{totalInventory} units</p>
                    </div>
                    <div className="bg-[#f6f7f8] dark:bg-[#101922] p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <p className="text-[10px] font-bold text-[#4c739a] dark:text-[#94a3b8] uppercase tracking-wider">Low Stock Alerts</p>
                        <p className={`text-base font-black leading-none mt-0.5 ${lowStockCount > 0 ? 'text-[#d41132]' : 'text-emerald-500'}`}>{lowStockCount}</p>
                    </div>
                </>
            }
            filters={
                <>
                    <div className="flex-1 min-w-[200px] relative">
                        <span className="absolute left-3 top-2.5 text-black/40 dark:text-white/40 material-symbols-outlined text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-[#1a2632] border border-[#e5e7eb] dark:border-[#2d3b4a] focus:ring-2 focus:ring-[#d41132] outline-none transition-all dark:text-white"
                        />
                    </div>
                    <AdminFilterTabs
                        tabs={[
                            { label: 'All Categories', value: 'All' },
                            ...categories.map(cat => ({ label: cat, value: cat }))
                        ]}
                        activeTab={selectedCategory}
                        onTabChange={setSelectedCategory}
                    />
                </>
            }
            pagination={
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filteredProducts.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(val) => {
                        setItemsPerPage(val);
                        setCurrentPage(1);
                    }}
                />
            }
            bulkActions={
                <AdminBulkActionsBar
                    selectedCount={selectedIds.size}
                    onCancel={() => setSelectedIds(new Set())}
                    onDelete={handleBulkDelete}
                    isDeleting={isBulkDeleting}
                />
            }
        >
            <AdminTable
                headers={['Product', 'Category', 'Price', 'Stock', 'Actions']}
                onSelectAll={toggleSelectAll}
                isAllSelected={filteredProducts.length > 0 && filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(p => selectedIds.has(p.id))}
            >
                {isLoading ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                Loading products...
                            </div>
                        </td>
                    </tr>
                ) : filteredProducts.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No products found matching your criteria.
                        </td>
                    </tr>
                ) : (
                    filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product) => (
                        <tr key={product.id} className={`hover:bg-[#f6f7f8] dark:hover:bg-[#17202b] transition-colors group ${selectedIds.has(product.id) ? 'bg-[#d41132]/5 dark:bg-[#d41132]/10' : ''}`}>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
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
                            <td className="px-6 py-4 text-right relative">
                                <button
                                    onClick={(e) => toggleMenu(product.id, e)}
                                    className="action-menu-trigger text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                                {activeMenu === product.id && (
                                    <div className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 action-menu animate-in zoom-in-95 duration-150 origin-top-right">
                                        <button onClick={() => { openEditModal(product); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">edit</span> Edit Product
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                        <button onClick={() => { handleDeleteProduct(product.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">delete</span> Delete
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </AdminTable>

            <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
                initialData={editingProduct}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </AdminPageLayout>
    );
}
