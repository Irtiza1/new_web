import { useState, useEffect } from 'react';
import { useCart } from "@/contexts/CartContext";

// Flexible Product interface that works with both DB and hardcoded data
export interface ShopProduct {
    id: string | number;
    name: string;
    price: number;
    description?: string | null;
    category?: string;
    image?: string;
    sizes?: string[];
    stock?: number;
    rating?: number;
    reviews?: number;
    badge?: string | null;
}

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ShopProduct | null;
}

const defaultColors = [
    { name: 'Black', color: '#171717' },
    { name: 'Dk Brown', color: '#5D4037', selected: true },
    { name: 'Tan', color: '#D2B48C' },
];

export default function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {
    const { addToCart } = useCart();
    const [selectedColor, setSelectedColor] = useState(1);
    const [selectedSize, setSelectedSize] = useState(0);

    // Reset state when product changes
    useEffect(() => {
        if (isOpen) {
            setSelectedColor(1);
            setSelectedSize(0);
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    // Get the product image
    const productImage = product.image || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2000&auto=format&fit=crop';
    const productSizes = (product.sizes && product.sizes.length > 0) ? product.sizes : ['S', 'M', 'L', 'XL'];
    const productDescription = product.description || 'Expertly crafted from full-grain vegetable-tanned leather. This piece features heavy-duty hardware and a design that breaks in beautifully over time, developing a unique patina personal to your journey.';

    const handleAddToCart = () => {
        addToCart({
            id: typeof product.id === 'string' ? parseInt(product.id, 16) % 100000 : product.id,
            name: product.name,
            price: product.price,
            image: productImage,
            variant: `Size: ${productSizes[selectedSize]}, Color: ${defaultColors[selectedColor].name}`
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-[#221910]/40 backdrop-blur-md transition-all duration-300 font-[family-name:var(--font-inter)]">
            <div className="absolute inset-0" onClick={onClose}></div>
            {/* Modal Card */}
            <div className="bg-white dark:bg-[#1a130e] w-full max-w-[1100px] h-full max-h-[85vh] md:max-h-[750px] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative ring-1 ring-white/10 z-10">
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-[#1c140d] dark:text-white transition-all shadow-sm backdrop-blur-sm group border border-transparent hover:border-[#c27a2a]/20">
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">close</span>
                </button>

                {/* Left: Image Gallery */}
                <div className="w-full md:w-1/2 h-[40vh] md:h-full bg-[#F0EFE8] dark:bg-[#251d16] flex flex-col p-6 md:p-8 gap-4 relative">
                    <div className="flex-1 w-full relative rounded-lg overflow-hidden shadow-inner group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt={product.name} className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out" src={productImage} />
                        {product.badge && (
                            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/70 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-[#c27a2a] shadow-sm">
                                {product.badge}
                            </div>
                        )}

                    </div>
                </div>

                {/* Right: Product Details */}
                <div className="w-full md:w-1/2 h-full overflow-y-auto p-6 md:p-10 lg:p-12 flex flex-col">
                    <p className="text-xs font-bold tracking-widest uppercase text-[#c27a2a]/80 mb-3">Shop / {product.name}</p>
                    <div className="flex flex-col gap-2 mb-4">
                        <h2 className="text-[#1c140d] dark:text-white text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">{product.name}</h2>
                        <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-medium text-[#c27a2a]">${product.price.toFixed(2)}</p>
                            </div>
                            {(product.rating !== undefined && product.rating !== null) && (
                                <div className="flex items-center gap-1 group cursor-pointer">
                                    <div className="flex text-[#c27a2a]">
                                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-bold">{product.rating} / 5.0</span>
                                    {product.reviews !== undefined && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400 underline decoration-gray-300 dark:decoration-gray-600 underline-offset-4 ml-1">({product.reviews} reviews)</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="h-px w-full bg-gray-100 dark:bg-white/10 my-2"></div>
                    <div className="prose prose-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                        <p>{productDescription}</p>
                    </div>

                    <div className="flex flex-col gap-6 flex-1">
                        {/* Colors */}
                        <div className="space-y-3">
                            <span className="text-sm font-semibold text-[#1c140d] dark:text-white uppercase tracking-wider">Select Color: <span className="text-[#c27a2a] normal-case font-normal ml-1">{defaultColors[selectedColor].name}</span></span>
                            <div className="flex gap-3">
                                {defaultColors.map((c, i) => (
                                    <label key={i} className="relative cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="color-choice"
                                            value={c.name}
                                            className="sr-only"
                                            checked={selectedColor === i}
                                            onChange={() => setSelectedColor(i)}
                                        />
                                        <div
                                            onClick={() => setSelectedColor(i)}
                                            className={`w-10 h-10 rounded-full border shadow-sm transition-all ${selectedColor === i ? 'ring-2 ring-offset-2 dark:ring-offset-[#1a130e]' : ''}`}
                                            style={{ backgroundColor: c.color, borderColor: '#d4d4d4', ...(selectedColor === i ? { ringColor: c.color } : {}) }}
                                        >
                                            {selectedColor === i && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white text-[20px]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>check</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            {c.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Sizes */}
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-900 dark:text-white-800">Select Size</span>
                                <button className="text-xs text-[#c27a2a] hover:text-[#c27a2a]/80 underline decoration-dashed underline-offset-4">Size Guide</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {productSizes.map((size, i) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(i)}
                                        className={`min-w-[56px] h-12 flex items-center justify-center rounded-lg border-2 font-bold text-sm transition-all ${selectedSize === i
                                            ? 'border-[#d41132] bg-[#d41132]/5 text-[#d41132] shadow-sm'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Stock indicator */}
                        {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
                            <p className="text-sm text-amber-600 font-medium">Only {product.stock} left in stock!</p>
                        )}
                        {product.stock === 0 && (
                            <p className="text-sm text-red-500 font-medium">Out of stock</p>
                        )}

                        {/* Add to Bag */}
                        <div className="pt-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className="w-full bg-[#c27a2a] hover:bg-[#a35508] active:scale-[0.99] text-white font-bold text-lg py-4 rounded-lg shadow-lg shadow-[#c27a2a]/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Bag'}</span>
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">shopping_bag</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
