'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import ProductDetailModal, { type ShopProduct } from '@/components/storefront/ProductDetailModal';
import { useCart } from '@/contexts/CartContext';

const FALLBACK_CATEGORIES = ['All Products', 'Jackets', 'Full Coats', 'Bags & Satchels', 'Accessories', 'Shoes'];

function ShopContent() {
    const searchParams = useSearchParams();
    const search = searchParams.get('search');
    const { addToCart } = useCart();
    const [activeCategory, setActiveCategory] = useState('All Products');
    const [visibleCount, setVisibleCount] = useState(4);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState('newest');

    // Load categories from DB
    useEffect(() => {
        fetch('/api/categories')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    const names = ['All Products', ...data.data.filter((c: any) => c.is_visible).map((c: any) => c.name)];
                    setCategories(names);
                }
            })
            .catch(() => { /* fallback remains */ });
    }, []);

    // Fetch products from DB on mount
    useEffect(() => {
        async function loadProducts() {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch('/api/products');
                const result = await res.json();

                if (result.success) {
                    setProducts(result.data);
                } else {
                    throw new Error(result.message || 'Failed to fetch products');
                }
            } catch (err) {
                console.error('Failed to fetch products:', err);
                setError('Failed to load products. Please try again later.');
            } finally {
                setLoading(false);
            }
        }
        loadProducts();
    }, []);

    // Reset visible count when category or search changes
    useEffect(() => {
        setVisibleCount(4);
    }, [activeCategory, search]);

    const openModal = (product: ShopProduct) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 4);
    };

    const getProductImage = (product: ShopProduct) => {
        return product.image || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2000&auto=format&fit=crop';
    };

    const filteredProducts = products.filter(product => {
        if (search) {
            const searchTerm = search.toLowerCase();
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                (product.category || '').toLowerCase().includes(searchTerm) ||
                (product.description || '').toLowerCase().includes(searchTerm);
            if (!matchesSearch) return false;
        }
        if (activeCategory === 'All Products') return true;

        const productCat = (product.category || '').toLowerCase().trim();
        const tabCat = activeCategory.toLowerCase().trim();

        // Flexible matching: 'Bags' matches 'Bags & Satchels', 'Jacket' matches 'Jackets'
        // Check if tab label contains product category word, or product category contains tab word
        const tabWords = tabCat.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3);
        const productCatWords = productCat.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3);

        return tabWords.some(w => productCat.includes(w)) ||
            productCatWords.some(w => tabCat.includes(w)) ||
            productCat === tabCat;
    });

    // Apply Sorting
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'popularity') return (b.salesCount || 0) - (a.salesCount || 0);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0; // Default
    });

    const visibleProducts = sortedProducts.slice(0, visibleCount);
    const hasMoreProducts = visibleCount < filteredProducts.length;

    return (
        <div id="shop-main-container" className="bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-[#0e121b] dark:text-white min-h-screen flex flex-col font-[family-name:var(--font-manrope)] overflow-y-auto h-screen">
            <Header />

            {/* Main Content */}
            <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-8 md:py-12">

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 overflow-hidden whitespace-nowrap">
                    <Link href="/" className="hover:text-[#c27a2a]">Home</Link>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span className="text-gray-300">Shop</span>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span className="text-[#c27a2a] truncate">{activeCategory}</span>
                </nav>

                {/* Page Header & Sorting */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase">The Collection</h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Handcrafted leather goods for the modern nomad.</p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 border-t border-gray-100 dark:border-white/5 pt-6 md:pt-0 md:border-0">
                        <p className="text-[10px] font-black uppercase tracking-tighter text-gray-400">
                            Showing {visibleProducts.length} of {filteredProducts.length} results
                        </p>
                        <div className="relative group">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 pl-4 pr-10 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest outline-none focus:border-[#c27a2a] transition-all cursor-pointer"
                            >
                                <option value="default">Default Sorting</option>
                                <option value="popularity">Sort by Popularity</option>
                                <option value="rating">Sort by Average Rating</option>
                                <option value="newest">Sort by Latest</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm group-hover:text-[#c27a2a] transition-colors">
                                expand_more
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-10 overflow-x-auto pb-4 no-scrollbar">
                    <div className="flex gap-3 min-w-max">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${activeCategory === cat
                                    ? 'bg-[#1c140d] text-white dark:bg-white dark:text-[#1c140d] shadow-xl shadow-[#1c140d]/10'
                                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:border-[#c27a2a] hover:text-[#c27a2a]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="col-span-full text-center py-20">
                        <div className="inline-flex items-center gap-3 text-gray-500">
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            Loading products...
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="col-span-full text-center py-20">
                        <div className="inline-flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-red-400 text-4xl">error</span>
                            <p className="text-red-500 font-medium">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-2 px-4 py-2 bg-[#d41132] text-white rounded-lg text-sm font-bold hover:bg-[#b30f2a] transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Product Grid */}
                {!loading && !error && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                        {visibleProducts.length > 0 ? (
                            visibleProducts.map(product => (
                                <div key={product.id} className="group cursor-pointer" onClick={() => openModal(product)}>
                                    <div className="aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden relative mb-4">
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${getProductImage(product)}')` }}></div>
                                        {product.badge && (
                                            <span className="absolute top-3 left-3 bg-[#0e121b] text-white text-xs font-bold px-2.5 py-1 rounded shadow-md">
                                                {product.badge}
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart({
                                                    id: typeof product.id === 'string' ? parseInt(product.id, 16) % 100000 : product.id,
                                                    name: product.name,
                                                    price: product.price,
                                                    image: getProductImage(product),
                                                    variant: product.sizes ? `Size: ${product.sizes[0]}` : 'Standard'
                                                });
                                            }}
                                            className="absolute bottom-4 right-4 bg-white text-[#0e121b] p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#0e121b] hover:text-white"
                                        >
                                            <span className="material-symbols-outlined text-[20px] block">shopping_bag</span>
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg group-hover:text-[#4e6797] transition-colors">{product.name}</h3>
                                        {!!product.rating && product.rating > 0 && (
                                            <div className="flex items-center gap-1 my-1">
                                                <span className="material-symbols-outlined text-[16px] text-[#fbbf24] fill-current">star</span>
                                                <span className="text-sm font-medium">{product.rating}</span>
                                                {!!product.reviews && <span className="text-xs text-gray-400">({product.reviews})</span>}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <p className="font-bold text-[#c27a2a] uppercase tracking-widest text-[11px]">${Number(product.price || 0).toFixed(2)}</p>
                                        </div>
                                        {product.stock !== undefined && product.stock === 0 && (
                                            <p className="text-xs text-red-500 font-medium mt-1">Out of stock</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 text-gray-500">
                                No products found matching your criteria.
                            </div>
                        )}
                    </div>
                )}

                {/* Load More */}
                {hasMoreProducts && !loading && (
                    <div className="mt-16 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            className="px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-sm hover:border-[#0e121b] dark:hover:border-white hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm"
                        >
                            Load More Products
                        </button>
                    </div>
                )}
            </main>

            {/* CTA Section */}
            <section className="py-20 px-6 bg-[#f8fafc] dark:bg-[#1e293b] text-center border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] dark:text-white">
                        Ready to find your piece?
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        Explore our latest collection of handcrafted leather goods
                    </p>
                    <button
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                document.getElementById('shop-main-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        className="bg-[#d41132] hover:bg-[#b30f2a] text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-red-900/20"
                    >
                        Shop Collection
                    </button>
                </div>
            </section>

            <Footer />

            <ProductDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={selectedProduct} />
        </div>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ShopContent />
        </Suspense>
    );
}
