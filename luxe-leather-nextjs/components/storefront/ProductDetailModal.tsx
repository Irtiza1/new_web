"use client";

import { useState, useRef, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

interface ReviewData {
    id: string;
    customer_name: string;
    rating: number;
    comment: string | null;
    is_featured: boolean;
    created_at: string;
}

export interface ShopProduct {
    id: string | number;
    name: string;
    price: number;
    description?: string | null;
    category?: string;
    image?: string;
    images?: string[];
    sizes?: string[];
    stock?: number;
    rating?: number;
    reviews?: number;
    badge?: string | null;
    salesCount?: number;
    customSizingPrice?: number;
    createdAt: string;
}

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ShopProduct | null;
}

const defaultColors = [
    { name: "Saddle Tan", color: "#A0522D" },
    { name: "Espresso", color: "#3D2B1F" },
    { name: "Nero", color: "#000000" },
    { name: "Cognac", color: "#8B4513" }
];

export default function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {
    const { addToCart } = useCart();
    const [selectedColor, setSelectedColor] = useState(0);
    const [selectedSize, setSelectedSize] = useState(0);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isCustomSize, setIsCustomSize] = useState(false);
    const [customMeasurements, setCustomMeasurements] = useState({ chest: '', waist: '', shoulders: '', length: '' });
    const [activeTab, setActiveTab] = useState('specs');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isZoomed, setIsZoomed] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);
    const [productReviews, setProductReviews] = useState<ReviewData[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Reset state when product changes
    useEffect(() => {
        setSelectedColor(0);
        setSelectedSize(0);
        setSelectedImageIndex(0);
        setIsCustomSize(false);
        setActiveTab('specs');
        setIsZoomed(false);
    }, [product?.id]);

    // Fetch real reviews for this product
    useEffect(() => {
        if (!product?.id) return;
        setReviewsLoading(true);
        fetch('/api/reviews')
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    // Filter for approved reviews for this product
                    const approvedReviews = (data.data || []).filter(
                        (r: any) => r.status === 'approved' &&
                            (r.product_id === String(product.id) || r.product_id === product.id)
                    );
                    // If no product-specific reviews, show all featured approved reviews
                    if (approvedReviews.length === 0) {
                        const featured = (data.data || []).filter(
                            (r: any) => r.status === 'approved' && r.is_featured
                        );
                        setProductReviews(featured);
                    } else {
                        setProductReviews(approvedReviews);
                    }
                }
            })
            .catch(() => setProductReviews([]))
            .finally(() => setReviewsLoading(false));
    }, [product?.id]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imgRef.current) return;
        const { left, top, width, height } = imgRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePos({ x, y });
    };

    if (!isOpen || !product) return null;

    // Get the product image
    const allImages = [product.image || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2000&auto=format&fit=crop', ...(product.images || [])];
    const productImage = allImages[selectedImageIndex % allImages.length];
    const productSizes = (product.sizes && product.sizes.length > 0) ? product.sizes : ['S', 'M', 'L', 'XL'];
    const productDescription = product.description || 'Expertly crafted from full-grain vegetable-tanned leather. This piece features heavy-duty hardware and a design that breaks in beautifully over time, developing a unique patina personal to your journey.';
    const displayPrice = isCustomSize ? (product.customSizingPrice || product.price + 50) : product.price;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'specs':
                return (
                    <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                        {[
                            { label: 'Material', value: '100% Full-Grain Leather' },
                            { label: 'Artisanship', value: 'Master Hand-Stitched' },
                            { label: 'Hardware', value: 'Solid Brass / YKK Japan' },
                            { label: 'Tanning', value: 'Eco-Vegetable Tanned' },
                            { label: 'Thread', value: 'Nylon Bonded' },
                            { label: 'Origin', value: 'Artisan Workshop' }
                        ].map((spec, i) => (
                            <div key={i} className="flex flex-col gap-1 border-l-2 border-[#c27a2a]/20 pl-3">
                                <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{spec.label}</span>
                                <span className="text-[#1c140d] dark:text-white font-medium text-sm">{spec.value}</span>
                            </div>
                        ))}
                    </div>
                );
            case 'reviews':
                return (
                    <div className="space-y-4">
                        {reviewsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <span className="material-symbols-outlined animate-spin text-xl text-gray-400">progress_activity</span>
                            </div>
                        ) : productReviews.length === 0 ? (
                            <div className="text-center py-6">
                                <span className="material-symbols-outlined text-3xl text-gray-300 dark:text-gray-600 block mb-2">rate_review</span>
                                <p className="text-xs text-gray-400">No reviews yet for this product.</p>
                            </div>
                        ) : (
                            productReviews.map((review) => {
                                const timeAgo = (() => {
                                    const diff = Date.now() - new Date(review.created_at).getTime();
                                    const days = Math.floor(diff / 86400000);
                                    if (days === 0) return 'Today';
                                    if (days === 1) return '1 day ago';
                                    if (days < 7) return `${days} days ago`;
                                    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
                                    return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
                                })();
                                return (
                                    <div key={review.id} className="border-b border-gray-50 dark:border-white/5 pb-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-0.5 text-[#fbbf24]">
                                                    {[...Array(review.rating)].map((_, i) => (
                                                        <span key={i} className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    ))}
                                                    {[...Array(5 - review.rating)].map((_, i) => (
                                                        <span key={i} className="material-symbols-outlined text-[12px] text-gray-200 dark:text-gray-600">star</span>
                                                    ))}
                                                </div>
                                                {review.is_featured && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-1.5 py-0.5 rounded">Featured</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{timeAgo}</span>
                                        </div>
                                        {review.comment && <p className="text-xs text-gray-600 dark:text-gray-400 italic">"{review.comment}"</p>}
                                        <p className="text-[10px] font-black text-[#1c140d] dark:text-white mt-1 uppercase">— {review.customer_name}</p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                );
            case 'shipping':
                return (
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-sm mt-1">local_shipping</span>
                            <p><strong>Free Worldwide Shipping</strong> on all orders above $150.</p>
                        </div>
                        <div className="flex items-start gap-3 border-t border-gray-100 dark:border-white/5 pt-3">
                            <span className="material-symbols-outlined text-sm mt-1">history</span>
                            <div>
                                <p className="font-bold">Estimated Delivery:</p>
                                <p className="text-xs">• Regular Sizes: 3-5 Working Days</p>
                                <p className="text-xs">• Custom/Bespoke Orders: 12-15 Working Days</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleAddToCart = () => {
        const variant = isCustomSize
            ? `Custom Size: ${Object.entries(customMeasurements).map(([k, v]) => `${k}: ${v}`).join(', ')}, Color: ${defaultColors[selectedColor].name}`
            : `Size: ${productSizes[selectedSize]}, Color: ${defaultColors[selectedColor].name}`;

        addToCart({
            id: typeof product.id === 'string' ? parseInt(product.id, 16) % 100000 : Number(product.id),
            name: product.name,
            price: displayPrice,
            image: productImage,
            variant: variant
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-[#221910]/40 backdrop-blur-md transition-all duration-300 font-[family-name:var(--font-inter)]">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-white dark:bg-[#1a130e] w-full max-w-[1100px] h-full max-h-[85vh] md:max-h-[750px] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative ring-1 ring-white/10 z-10">
                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-[#1c140d] dark:text-white transition-all shadow-sm backdrop-blur-sm group border border-transparent hover:border-[#c27a2a]/20">
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">close</span>
                </button>

                {/* Left: Image Gallery */}
                <div className="w-full md:w-1/2 h-[45vh] md:h-full bg-[#F0EFE8] dark:bg-[#251d16] flex flex-col p-4 md:p-8 gap-4 relative">
                    <div
                        ref={imgRef}
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setIsZoomed(true)}
                        onMouseLeave={() => setIsZoomed(false)}
                        className="flex-1 w-full relative rounded-lg overflow-hidden shadow-inner group cursor-zoom-in"
                    >
                        <img
                            alt={product.name}
                            className={`object-cover w-full h-full transition-transform duration-500 ease-out ${isZoomed ? 'scale-[2.5]' : 'scale-100'}`}
                            src={productImage}
                            style={isZoomed ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` } : {}}
                        />
                        {/* Color tint overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                            style={{
                                backgroundColor: defaultColors[selectedColor].color,
                                opacity: selectedColor === 0 ? 0 : 0.12,
                                mixBlendMode: 'multiply'
                            }}
                        />
                        {/* Color name badge */}
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-white/50 flex-shrink-0" style={{ backgroundColor: defaultColors[selectedColor].color }} />
                            <span className="text-white">{defaultColors[selectedColor].name}</span>
                        </div>
                        {product.badge && (
                            <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/70 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-[#c27a2a] shadow-sm">
                                {product.badge}
                            </div>
                        )}
                    </div>

                    {allImages.length > 1 && (
                        <div className="flex gap-2 justify-center pb-2 overflow-x-auto no-scrollbar">
                            {allImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-[#c27a2a] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Product Details */}
                <div className="w-full md:w-1/2 h-full bg-white dark:bg-[#1c140d] flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col gap-2 mb-4">
                        <h2 className="text-[#1c140d] dark:text-white text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">{product.name}</h2>
                        <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-medium text-[#c27a2a]">${displayPrice.toFixed(2)}</p>
                                {isCustomSize && <span className="text-[10px] bg-[#c27a2a]/10 text-[#c27a2a] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Bespoke Pricing</span>}
                            </div>
                            {(product.rating !== undefined && product.rating !== null) && (
                                <div className="flex items-center gap-1 group cursor-pointer">
                                    <div className="flex text-[#c27a2a]">
                                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-bold">{product.rating}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 opacity-50 ml-1">({product.reviews || 0})</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 italic">{productDescription}</p>
                    </div>

                    {/* Tabs Header */}
                    <div className="flex gap-6 border-b border-gray-100 dark:border-white/10 mb-6">
                        {['specs', 'reviews', 'shipping'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 text-xs font-bold tracking-widest uppercase transition-all relative ${activeTab === tab ? 'text-[#c27a2a]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c27a2a]"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[160px] mb-8 transition-all duration-300 overflow-y-auto pb-4 no-scrollbar">
                        {renderTabContent()}
                    </div>

                    {/* Custom Sizing Toggle */}
                    <div className="bg-[#f0efe8]/50 dark:bg-white/5 p-4 rounded-xl border border-dashed border-[#c27a2a]/30 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#c27a2a]">architecture</span>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-tight">Need a custom fit?</p>
                                    <p className="text-[10px] text-gray-500">Provide your exact measurements.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCustomSize(!isCustomSize)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isCustomSize ? 'bg-[#c27a2a] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400 hover:text-[#c27a2a]'}`}
                            >
                                {isCustomSize ? 'Use Regular' : 'Enable Bespoke'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8 flex-1">
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
                                            className={`w-10 h-10 rounded-full border shadow-sm transition-all ${selectedColor === i ? 'ring-2 ring-[#c27a2a] ring-offset-2 dark:ring-offset-[#1a130e]' : ''}`}
                                            style={{ backgroundColor: c.color, borderColor: '#d4d4d4' }}
                                        >
                                            {selectedColor === i && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white text-[20px]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>check</span>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Sizes */}
                        {!isCustomSize ? (
                            <div className="flex flex-col gap-3">
                                <span className="text-sm font-bold text-slate-900 dark:text-white-800 uppercase tracking-wider">Select Size</span>
                                <div className="flex flex-wrap gap-2">
                                    {productSizes.map((size, i) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(i)}
                                            className={`min-w-[56px] h-12 flex items-center justify-center rounded-lg border font-bold text-sm transition-all ${selectedSize === i ? 'border-[#c27a2a] bg-[#c27a2a]/5 text-[#c27a2a]' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <span className="text-sm font-bold text-[#c27a2a] uppercase tracking-wider">Bespoke Measurements (Inches)</span>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.keys(customMeasurements).map((field) => (
                                        <div key={field} className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-bold text-gray-400">{field}</span>
                                            <input
                                                type="text"
                                                placeholder="e.g. 42"
                                                value={customMeasurements[field as keyof typeof customMeasurements]}
                                                onChange={(e) => setCustomMeasurements(prev => ({ ...prev, [field]: e.target.value }))}
                                                className="h-10 px-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md text-sm outline-none focus:border-[#c27a2a]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add to Cart */}
                        <div className="mt-auto">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className="w-full bg-[#1c140d] dark:bg-[#c27a2a] hover:bg-[#c27a2a] dark:hover:bg-[#d88b3a] text-white h-16 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:grayscale"
                            >
                                <span className="material-symbols-outlined">shopping_bag</span>
                                {product.stock === 0 ? 'Out of Stock' : 'Add to Collection'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
