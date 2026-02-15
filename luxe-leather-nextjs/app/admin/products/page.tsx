'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getAllProducts, createProduct, updateProduct, deleteProduct, Product } from '@/lib/api/products';
import ProductFormModal, { pProduct } from '@/components/admin/ProductFormModal';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
                p.description.toLowerCase().includes(lowerTerm)
            );
        }

        setFilteredProducts(result);
    }, [products, searchTerm, selectedCategory]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await getAllProducts();
            setProducts(data);
            setFilteredProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProduct = async (productData: pProduct) => {
        try {
            await createProduct(productData);
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
            await updateProduct(editingProduct.id, productData);
            await fetchProducts();
            setIsModalOpen(false);
            setEditingProduct(null);
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

        try {
            await deleteProduct(id);
            // Optimistic update
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product.');
            fetchProducts(); // Revert on error
        }
    };

    const openEditModal = (product: Product) => {
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
            <AdminSidebar />

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
                            <option value="Accessories">Accessories</option>
                            <option value="Bags">Bags</option>
                            <option value="Wallets">Wallets</option>
                            <option value="Jackets">Jackets</option>
                            <option value="Travel">Travel</option>
                        </select>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#f6f7f8] dark:bg-[#101922] border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                                    <tr>
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
                                        filteredProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-[#f6f7f8] dark:hover:bg-[#17202b] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                                            {product.images && product.images[0] ? (
                                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
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
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

                        {/* Pagination (Static for now) */}
                        <div className="px-6 py-4 border-t border-[#e5e7eb] dark:border-[#2d3b4a] flex items-center justify-between text-sm text-gray-500">
                            <span>Showing {filteredProducts.length} results</span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 rounded border border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] disabled:opacity-50" disabled>Previous</button>
                                <button className="px-3 py-1 rounded border border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] disabled:opacity-50" disabled>Next</button>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Create/Edit Modal */}
                <ProductFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
                    initialData={editingProduct}
                />
            </div>
        </div>
    );
}
