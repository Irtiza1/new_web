'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import ProductDetailModal, { type ShopProduct } from '@/components/storefront/ProductDetailModal';
import { useCart } from '@/contexts/CartContext';
import { getAllProducts } from '@/lib/api/products';

const categories = ['All Products', 'Jackets', 'Full Coats', 'Bags & Satchels', 'Accessories', 'Shoes'];

function ShopContent() {
    const searchParams = useSearchParams();
    const search = searchParams.get('search');
    const { addToCart } = useCart();
    const [activeCategory, setActiveCategory] = useState('All Products');
    const [visibleCount, setVisibleCount] = useState(4);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch products from DB on mount
    useEffect(() => {
        async function loadProducts() {
            try {
                setLoading(true);
                setError(null);
                const data = await getAllProducts();
                setProducts(data);
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

    const filteredProducts = products.filter(product => {
        // Filter by Search Term
        if (search) {
            const searchTerm = search.toLowerCase();
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                (product.category || '').toLowerCase().includes(searchTerm);
            if (!matchesSearch) return false;
        }

        // Filter by Category
        if (activeCategory === 'All Products') return true;
        return product.category === activeCategory;
    });

    const visibleProducts = filteredProducts.slice(0, visibleCount);
    const hasMoreProducts = visibleCount < filteredProducts.length;

    // Helper to get product image
    const getProductImage = (product: ShopProduct) => {
        return product.image || '';
    };

    return (
        <div id="shop-main-container" className="bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-[#0e121b] dark:text-white min-h-screen flex flex-col font-[family-name:var(--font-manrope)] overflow-y-auto h-screen">
            <Header />

            {/* Main Content */}
            <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
                {/* Page Header */}
                <div className="mb-12 text-center md:text-left">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Our Collection</h2>
                    <p className="text-lg text-[#4e6797] dark:text-gray-400">Discover our premium leather goods, handcrafted by artisans for a lifetime of adventure.</p>
                </div>

                {/* Filter Tabs */}
                <div className="mb-10 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    <div className="flex gap-3 min-w-max">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${activeCategory === cat
                                    ? 'bg-[#0e121b] text-white dark:bg-white dark:text-[#0e121b] shadow-lg shadow-gray-200/50 dark:shadow-none hover:scale-105 active:scale-95'
                                    : 'bg-white dark:bg-gray-800 text-[#0e121b] dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#0e121b] dark:hover:border-white hover:bg-gray-50 dark:hover:bg-gray-700'
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
                                        {product.rating && (
                                            <div className="flex items-center gap-1 my-1">
                                                <span className="material-symbols-outlined text-[16px] text-[#fbbf24] fill-current">star</span>
                                                <span className="text-sm font-medium">{product.rating}</span>
                                                {product.reviews && <span className="text-xs text-gray-400">({product.reviews})</span>}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-[#0e121b] dark:text-gray-200">${product.price}</p>
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

            {/* WhatsApp FAB */}
            <a href="#" className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#d41132] text-white rounded-full shadow-lg hover:bg-#a20e26 hover:scale-110 transition-all duration-300">
                <svg fill="currentColor" height="30px" viewBox="0 0 256 256" width="30px"><path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z"></path></svg>
            </a>
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
