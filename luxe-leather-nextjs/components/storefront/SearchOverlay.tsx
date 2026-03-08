'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
            onClose();
            setQuery('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <button
                onClick={onClose}
                className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
            >
                <span className="material-symbols-outlined text-[40px]">close</span>
            </button>

            <div className="w-full max-w-4xl flex flex-col items-center gap-12">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">Search Luxe</h2>
                    <p className="text-white/40 text-sm font-bold tracking-[0.2em] uppercase">Find your next timeless piece</p>
                </div>

                <form onSubmit={handleSubmit} className="w-full group">
                    <div className="relative border-b-2 border-white/10 group-focus-within:border-[#c27a2a] transition-colors pb-4">
                        <input
                            type="text"
                            placeholder="Type to search..."
                            className="w-full bg-transparent text-white text-3xl md:text-5xl font-bold placeholder-white/10 outline-none pr-12"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#c27a2a] transition-all hover:scale-110">
                            <span className="material-symbols-outlined text-[40px]">arrow_forward</span>
                        </button>
                    </div>
                </form>

                <div className="flex flex-wrap items-center justify-center gap-4">
                    <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Popular:</span>
                    {['Jackets', 'Leather Bags', 'Wallets', 'Accessories'].map((pt) => (
                        <button
                            key={pt}
                            onClick={() => {
                                router.push(`/shop?search=${encodeURIComponent(pt)}`);
                                onClose();
                            }}
                            className="px-4 py-2 rounded-full border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
                        >
                            {pt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
