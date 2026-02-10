'use client';

import { useState } from 'react';

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const thumbnails = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCjXcaNRtTPtfhZ17izXf-J5IXJUrv_QS5JM3hQOedP6BR3AfH4rt85cyZGQWgjU-1nJ73vyRS1AwtQDI9ZCE-Qh6SCSPbeO3N4IWAexYrmNOsk1O8_J9Edgr6WW53Z0CMRC4-LlcI1rxHV0DFjZrc2yebCnk19_RLPmscJUdJx69cYtzo0MpMF7qbrLJjDDZQaf3yZmxNcr9QQPWNX_LwII6uzqArNA5arHZ4_wSVUja_9K-vOim0tMJq6t9aVRWZjXSkf3_fkv9Rx',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAA7dD3mcGvFGKGU0X2gXZyrPSJtsyrE7tkPEo07v53_75tqlGBcYTGiBt1lCwPuLa4SBPzZDYJ6KQ2reIUvCcK0P_gG1M9cSyyUWrFU6bm29tmicRq7_5hIIBliXdKW5CWrlPn7CkCPv6c5njaMwxdcfldmvg1qz-odlek4kfkjjaueEVNa-01KhSkeSyMSp-COyJzgEcp4UFpaIgZJdnWRQer0l_mGcIiw7a3cNSALDL7MEJKu4EmcTR7YDcbsHkqkvPIg4xYbI4d',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBKiekxhRDAUlprdjm6Pp7H6swo8mtiQTaq_AcBmAL37z9dH6UILxIxeiZyHLOcAnyTb9AiCmEowsYDssct3sNI1VAUQNxPbhOgLlcjoIgYQii_WIi8Nmzi_nKJ9fLBcreHF2cnepJuAvAMZjvtbA-at6a1OS8y2E-TtthqPQ6MbJQhf_dRiYdviXprqpojLe0ZromG4qLhTwEt9MsQxpWHUW3Jhr48HpopEUh5TN4tvKT1mhFL6o5P5QTImq40-60QHI3pj52GlN2G',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD3YMcx85QSeTla0ik6PDfHDff2xAWnmYD8AbCAcymbrnUtaNsJgMLYUG1owO0mG3roS9agaFY8m7Jy5pEPyE9V0ibH2Dsiua5merOm4vyS5UXPhqbL_1o8ITeBLrcX3tJzCYf9NRea7Z0gexC93iJ2YTu9iPBvYUzUrOKNt2D42oeb6qCZ7g-6XJlKmt-syMkrgTsNXGR0q-eNKp3Evah3mP7TFJetwHJntsAklQN9cLCrY6c9i7eDCFLnegLWtShSaJeMa03NkfmJ',
];

const mainImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-EPgqjYIMCV8c0g-sHVL4YrbwqlECUYsgPP-ZpO2g0f6ZOILIKmoPmQxIv3FimHC6U3Wnvm5JEWnd80n2ynTle7Wv1eH0Q11Hrm5V9tcrPW0isCtWv8BVsJN-AyMe5U1UUEpxzqvptqITh_pnMKwmo1K-u8derJ-cq7fYyk2-HWM--CqkK4R_CQQ344YMPlX9P5At-ZF5B08gBfnhbUhfkG0v5lKXwxjrWJ-a7_FF3bOLqS_utQY8q0OgU3uFaXVND4yZLz4aKYk9';

const colors = [
    { name: 'Black', color: '#171717' },
    { name: 'Dk Brown', color: '#5D4037', selected: true },
    { name: 'Tan', color: '#D2B48C' },
];

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

export default function ProductDetailModal({ isOpen, onClose }: ProductDetailModalProps) {
    const [selectedColor, setSelectedColor] = useState(1);
    const [selectedSize, setSelectedSize] = useState(1); // M default
    const [activeThumb, setActiveThumb] = useState(0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#221910]/40 backdrop-blur-md transition-all duration-300 font-[family-name:var(--font-inter)]">
            {/* Modal Card */}
            <div className="bg-white dark:bg-[#1a130e] w-full max-w-[1100px] h-full max-h-[85vh] md:max-h-[750px] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative ring-1 ring-white/10">
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-[#1c140d] dark:text-white transition-all shadow-sm backdrop-blur-sm group border border-transparent hover:border-[#c27a2a]/20">
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">close</span>
                </button>

                {/* Left: Image Gallery */}
                <div className="w-full md:w-1/2 h-[40vh] md:h-full bg-[#F0EFE8] dark:bg-[#251d16] flex flex-col p-6 md:p-8 gap-4 relative">
                    <div className="flex-1 w-full relative rounded-lg overflow-hidden shadow-inner group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="Handcrafted Biker Jacket" className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out" src={activeThumb === 0 ? mainImage : thumbnails[activeThumb]} />
                        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/70 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-[#c27a2a] shadow-sm">
                            New Arrival
                        </div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
                        {thumbnails.map((thumb, i) => (
                            <button key={i} onClick={() => setActiveThumb(i)} className={`flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${activeThumb === i ? 'border-[#c27a2a] ring-2 ring-[#c27a2a]/20' : 'border-transparent hover:border-[#c27a2a]/50 opacity-70 hover:opacity-100'}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt={`View ${i + 1}`} className="w-full h-full object-cover" src={thumb} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Product Details */}
                <div className="w-full md:w-1/2 h-full overflow-y-auto p-6 md:p-10 lg:p-12 flex flex-col">
                    <p className="text-xs font-bold tracking-widest uppercase text-[#c27a2a]/80 mb-3">Men&apos;s Collection / Outerwear</p>
                    <div className="flex flex-col gap-2 mb-4">
                        <h2 className="text-[#1c140d] dark:text-white text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">Handcrafted Biker Jacket</h2>
                        <div className="flex items-baseline justify-between">
                            <p className="text-2xl font-medium text-[#c27a2a]">$249.00</p>
                            <div className="flex items-center gap-1 group cursor-pointer">
                                <div className="flex text-[#c27a2a]">
                                    {[1, 2, 3, 4].map(i => (
                                        <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    ))}
                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-[#c27a2a] transition-colors ml-1 underline decoration-gray-300 dark:decoration-gray-600 underline-offset-4">(124 reviews)</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-px w-full bg-gray-100 dark:bg-white/10 my-2"></div>
                    <div className="prose prose-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                        <p>
                            Expertly crafted from full-grain vegetable-tanned leather. This jacket features heavy-duty hardware and a tailored fit that breaks in beautifully over time, developing a unique patina personal to your journey.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6 flex-1">
                        {/* Colors */}
                        <div className="space-y-3">
                            <span className="text-sm font-semibold text-[#1c140d] dark:text-white uppercase tracking-wider">Select Color: <span className="text-[#c27a2a] normal-case font-normal ml-1">{colors[selectedColor].name}</span></span>
                            <div className="flex gap-3">
                                {colors.map((c, i) => (
                                    <label key={i} className="relative cursor-pointer group" onClick={() => setSelectedColor(i)}>
                                        <div className={`w-10 h-10 rounded-full border shadow-sm transition-all ${selectedColor === i ? 'ring-2 ring-offset-2 dark:ring-offset-[#1a130e]' : ''}`} style={{ backgroundColor: c.color, borderColor: '#d4d4d4', ...(selectedColor === i ? { ringColor: c.color } : {}) }}>
                                            {selectedColor === i && <span className="material-symbols-outlined text-white/90 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg">check</span>}
                                        </div>
                                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap dark:text-white">{c.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Sizes */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-[#1c140d] dark:text-white uppercase tracking-wider">Select Size</span>
                                <button className="text-xs text-[#c27a2a] hover:text-[#c27a2a]/80 underline decoration-dashed underline-offset-4">Size Guide</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {sizes.map((size, i) => (
                                    <button key={size} onClick={() => setSelectedSize(i)} className={`px-4 py-2.5 rounded border text-sm font-medium transition-all text-center min-w-[3rem] ${selectedSize === i ? 'bg-[#c27a2a] text-white border-[#c27a2a]' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#c27a2a]'}`}>
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Add to Bag */}
                        <div className="pt-4">
                            <button className="w-full bg-[#c27a2a] hover:bg-[#a35508] active:scale-[0.99] text-white font-bold text-lg py-4 rounded-lg shadow-lg shadow-[#c27a2a]/20 transition-all flex items-center justify-center gap-2 group">
                                <span>Add to Bag</span>
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">shopping_bag</span>
                            </button>
                        </div>

                        {/* Utility Info */}
                        <div className="bg-[#FAFAF8] dark:bg-white/5 rounded-lg p-4 flex flex-col gap-3 mt-auto">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-[#c27a2a] mt-0.5" style={{ fontSize: '20px' }}>local_shipping</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[#1c140d] dark:text-white">Free Express Shipping</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">On all orders over $300. Arrives within 3-5 business days.</span>
                                </div>
                            </div>
                            <div className="h-px w-full bg-gray-200 dark:bg-white/10"></div>
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-[#c27a2a] mt-0.5" style={{ fontSize: '20px' }}>assignment_return</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[#1c140d] dark:text-white">30-Day Returns</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Not the right fit? Return or exchange for free.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
