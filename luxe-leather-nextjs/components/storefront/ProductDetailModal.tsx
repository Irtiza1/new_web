/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";



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
    shipping_info?: {
        policy?: string;
        delivery_regular?: string;
        delivery_custom?: string;
    };
    createdAt: string;
}

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ShopProduct | null;
}

const fallbackColors = [
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
    const [reviewsList, setReviewsList] = useState<any[]>([]);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isZoomed, setIsZoomed] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    // Reset state when product changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedColor(0);
        setSelectedSize(0);
        setSelectedImageIndex(0);
        setIsCustomSize(false);
        setActiveTab('specs');
        setIsZoomed(false);
        setReviewsList([]);
    }, [product?.id]);

    useEffect(() => {
        if (isOpen && product?.id) {
            fetch(`/api/reviews?product_id=${product.id}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.data) {
                        // Filter for approved reviews on the frontend if the API returns all, or if the API already filters we just set it
                        const approved = data.data.filter((r: any) => r.status === 'approved');
                        setReviewsList(approved);
                    }
                })
                .catch(console.error);
        }
    }, [isOpen, product?.id]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imgRef.current) return;
        const { left, top, width, height } = imgRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePos({ x, y });
    };

    if (!isOpen || !product) return null;

    // Get the product image and remove duplicates
    const allImages = Array.from(new Set([product.image, ...(product.images || [])])).filter(Boolean);
    const productImage = allImages[selectedImageIndex % allImages.length];
    const productSizes = (product.sizes && product.sizes.length > 0) ? product.sizes : ['S', 'M', 'L', 'XL'];
     
    const p = product as any;
    const productDescription = p.description || 'Expertly crafted from full-grain vegetable-tanned leather. This piece features heavy-duty hardware and a design that breaks in beautifully over time, developing a unique patina personal to your journey.';
    const displayPrice = isCustomSize ? (p.custom_sizing_price || p.customSizingPrice || p.price + 50) : p.price;

     
    const productColors = (p.colors && p.colors.length > 0) ? p.colors.map((c: any) => ({ name: c.name, color: c.hex || c.color })) : fallbackColors;
    const allowCustomSizing = p.allow_custom_sizing ?? true; // Defaults to true if legacy, or false based on db? let's default to true for existing storefront compatibility

    // const defaultSpecs = [
    //     { label: 'Material', value: '100% Full-Grain Leather' },
    //     { label: 'Artisanship', value: 'Master Hand-Stitched' },
    //     { label: 'Hardware', value: 'Solid Brass / YKK Japan' },
    //     { label: 'Tanning', value: 'Eco-Vegetable Tanned' },
    //     { label: 'Thread', value: 'Nylon Bonded' },
    //     { label: 'Origin', value: 'Artisan Workshop' }
    // ];
    const productSpecs = p.specs && p.specs.length > 0 ? p.specs : [];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'specs':
                return (
                    <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                        {productSpecs.length > 0 ? (
                            productSpecs.map((spec: any, i: number) => (
                                <div key={i} className="flex flex-col gap-1 border-l-2 border-[#cf1736]/20 pl-3">
                                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{spec.label || spec.key}</span>
                                    <span className="text-[#1b0e10] dark:text-white font-medium text-sm">{spec.value}</span>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-4">
                                <p className="text-gray-400 text-sm">No specs available</p>
                            </div>
                        )}
                    </div>
                );
            case 'shipping':
                const shippingInfo = product.shipping_info || {
                    policy: "Free Worldwide Shipping",
                    delivery_regular: "3-5 Working Days",
                    delivery_custom: "12-15 Working Days"
                };
                
                return (
                    <div className="space-y-3">
                        {shippingInfo.policy && (
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-sm mt-1">local_shipping</span>
                                <p><strong>{shippingInfo.policy}</strong></p>
                            </div>
                        )}
                        <div className="flex items-start gap-3 border-t border-gray-100 dark:border-white/5 pt-3">
                            <span className="material-symbols-outlined text-sm mt-1">history</span>
                            <div>
                                <p className="font-bold">Estimated Delivery:</p>
                                {shippingInfo.delivery_regular && <p className="text-xs">• Regular Sizes: {shippingInfo.delivery_regular}</p>}
                                {shippingInfo.delivery_custom && <p className="text-xs">• Custom/Bespoke Orders: {shippingInfo.delivery_custom}</p>}
                            </div>
                        </div>
                    </div>
                );
            case 'reviews':
                return (
                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {reviewsList.length > 0 ? (
                            reviewsList.map((review: any) => (
                                <div key={review.id} className="border-b border-gray-100 dark:border-white/5 pb-3 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm">{review.customer_name}</span>
                                            {review.rating && (
                                                <div className="flex text-[#cf1736]">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{review.comment}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-sm text-gray-500">No reviews yet for this product.</p>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const handleAddToCart = () => {
        const variant = isCustomSize
            ? `Custom Size: ${Object.entries(customMeasurements).map(([k, v]) => `${k}: ${v}`).join(', ')}, Color: ${productColors[selectedColor]?.name || ''}`
            : `Size: ${productSizes[selectedSize]}, Color: ${productColors[selectedColor]?.name || ''}`;

        addToCart({
            id: String(product.id),
            name: product.name,
            price: displayPrice,
            image: productImage as string || '',
            variant: variant
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-[#221910]/40 backdrop-blur-md transition-all duration-300 font-[family-name:var(--font-manrope)]">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] w-full max-w-[1100px] h-full max-h-[85vh] md:max-h-[750px] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative ring-1 ring-white/10 z-10">
                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-[#1b0e10] dark:text-white transition-all shadow-sm backdrop-blur-sm group border border-transparent hover:border-[#cf1736]/20">
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">close</span>
                </button>

                {/* Left: Image Gallery */}
                <div className="w-full md:w-1/2 h-[45vh] md:h-full bg-[#f0efe8] dark:bg-[#1b0e10]/50 flex flex-col p-4 md:p-8 gap-4 relative">
                    <div
                        ref={imgRef}
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setIsZoomed(true)}
                        onMouseLeave={() => setIsZoomed(false)}
                        className="flex-1 w-full relative rounded-lg overflow-hidden shadow-inner group cursor-zoom-in"
                    >
                        {productImage ? (
                            <img
                                alt={product.name}
                                className={`object-cover w-full h-full transition-transform duration-500 ease-out select-none pointer-events-none ${isZoomed ? 'scale-[2.5]' : 'scale-100'}`}
                                src={productImage as string}
                                style={isZoomed ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` } : {}}
                                onContextMenu={(e) => e.preventDefault()}
                                draggable={false}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <span className="material-symbols-outlined text-6xl text-gray-400">image</span>
                            </div>
                        )}
                        {/* Color tint overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                            style={{
                                backgroundColor: productColors[selectedColor]?.color,
                                opacity: selectedColor === 0 ? 0 : 0.12,
                                mixBlendMode: 'multiply'
                            }}
                        />
                        {/* Color name badge */}
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-white/50 flex-shrink-0" style={{ backgroundColor: productColors[selectedColor]?.color }} />
                            <span className="text-white">{productColors[selectedColor]?.name}</span>
                        </div>
                        {product.badge && (
                            <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/70 backdrop-blur px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase text-[#cf1736] shadow-sm">
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
                                    className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-[#cf1736] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover select-none pointer-events-none" onContextMenu={(e) => e.preventDefault()} draggable={false} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Product Details */}
                <div className="w-full md:w-1/2 h-full bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-[#1b0e10] dark:text-white text-3xl md:text-4xl font-medium leading-tight tracking-tight">{product.name}</h2>
                            <button 
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        const url = `${window.location.origin}/shop?search=${encodeURIComponent(product.name)}`;
                                        navigator.clipboard.writeText(url);
                                        const btn = document.getElementById('share-btn');
                                        if (btn) {
                                            const originalHTML = btn.innerHTML;
                                            btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span>';
                                            setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
                                        }
                                    }
                                }}
                                id="share-btn"
                                className="mt-1 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 transition-colors text-gray-500 hover:text-[#cf1736] shrink-0"
                                title="Copy product link"
                            >
                                <span className="material-symbols-outlined text-[18px]">share</span>
                            </button>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-medium text-[#cf1736]">${displayPrice.toFixed(2)}</p>
                                {isCustomSize && <span className="text-[10px] bg-[#cf1736]/10 text-[#cf1736] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Bespoke Pricing</span>}
                            </div>
                            {(product.rating !== undefined && product.rating !== null) && (
                                <div className="flex items-center gap-1 group cursor-pointer">
                                    <div className="flex text-[#cf1736]">
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
                        {['specs', 'shipping', 'reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 text-xs font-bold tracking-widest uppercase transition-all relative ${activeTab === tab ? 'text-[#cf1736]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#cf1736]"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[160px] mb-8 transition-all duration-300 overflow-y-auto pb-4 no-scrollbar">
                        {renderTabContent()}
                    </div>

                    {/* Custom Sizing Toggle */}
                    {allowCustomSizing && (
                        <div className="bg-[#f0efe8]/50 dark:bg-white/5 p-4 rounded-xl border border-dashed border-[#cf1736]/30 mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#cf1736]">architecture</span>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-tight">Need a custom fit?</p>
                                        <p className="text-[10px] text-gray-500">Provide your exact measurements.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsCustomSize(!isCustomSize)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isCustomSize ? 'bg-[#cf1736] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400 hover:text-[#cf1736]'}`}
                                >
                                    {isCustomSize ? 'Use Regular' : 'Enable Bespoke'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-8 flex-1">
                        {/* Colors */}
                        <div className="space-y-3">
                            <span className="text-sm font-bold text-[#1b0e10] dark:text-white uppercase tracking-wider">Select Color: <span className="text-[#cf1736] normal-case font-normal ml-1">{productColors[selectedColor]?.name}</span></span>
                            <div className="flex gap-3">
                                {productColors.map((c: any, i: number) => (
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
                                            className={`w-10 h-10 rounded-full border shadow-sm transition-all ${selectedColor === i ? 'ring-2 ring-[#cf1736] ring-offset-2 dark:ring-offset-[#1b0e10]' : ''}`}
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
                                <span className="text-sm font-bold text-[#1b0e10] dark:text-white uppercase tracking-wider">Select Size</span>
                                <div className="flex flex-wrap gap-2">
                                    {productSizes.map((size, i) => (
                                        <button
                                            key={`${size}-${i}`}
                                            onClick={() => setSelectedSize(i)}
                                            className={`min-w-[56px] h-12 flex items-center justify-center rounded-lg border font-bold text-sm transition-all ${selectedSize === i ? 'border-[#cf1736] bg-[#cf1736]/5 text-[#cf1736]' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <span className="text-sm font-bold text-[#cf1736] uppercase tracking-wider">Bespoke Measurements (Inches)</span>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.keys(customMeasurements).map((field) => (
                                        <div key={field} className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-bold text-gray-400">{field}</span>
                                            <input
                                                type="text"
                                                placeholder="e.g. 42"
                                                value={customMeasurements[field as keyof typeof customMeasurements]}
                                                onChange={(e) => setCustomMeasurements(prev => ({ ...prev, [field]: e.target.value }))}
                                                className="h-10 px-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md text-sm outline-none focus:border-[#cf1736]"
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
                                className="w-full bg-[#cf1736] hover:bg-[#a3122a] text-white h-16 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:grayscale"
                            >
                                <span className="material-symbols-outlined">shopping_bag</span>
                                Add to Collection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
