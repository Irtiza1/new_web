'use client';

import { useEffect, useState } from 'react';

interface Product {
    id: number;
    name: string;
    price: number;
    image?: string;
    category?: string;
}

interface RelatedProductsProps {
    currentProductId: number;
    category?: string;
}

export default function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                if (data.success) {
                    // Filter by category and exclude current product
                    const filtered = data.data
                        .filter((p: Product) => p.category === category && p.id !== currentProductId)
                        .slice(0, 4);
                    setProducts(filtered);
                }
            } catch (error) {
                console.error("Failed to fetch related products", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (category) {
            fetchProducts();
        }
    }, [category, currentProductId]);

    if (isLoading) return <div className="animate-pulse space-y-4">
        <div className="h-6 w-32 bg-gray-200 dark:bg-white/5 rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-gray-100 dark:bg-white/5 rounded-lg"></div>)}
        </div>
    </div>;

    if (products.length === 0) return null;

    return (
        <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black tracking-widest uppercase text-[#1c140d] dark:text-white">You May Also Like</h3>
                <div className="h-0.5 flex-1 bg-gray-100 dark:bg-white/10 ml-4"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="group cursor-pointer space-y-2"
                        onClick={() => {
                            // In a real app we'd navigate or update modal, 
                            // for now we'll just show them.
                            window.location.href = `/shop?product=${product.id}`;
                        }}
                    >
                        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 relative">
                            <img
                                src={product.image || 'https://via.placeholder.com/300x400?text=No+Image'}
                                alt={product.name}
                                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate uppercase tracking-tighter">{product.name}</p>
                            <p className="text-[10px] font-medium text-[#c27a2a]">${product.price.toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
