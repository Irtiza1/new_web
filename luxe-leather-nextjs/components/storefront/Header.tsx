"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { STOREFRONT_NAV_ITEMS } from "@/lib/constants/navigation";

export default function Header() {
    const { cartCount, openCart } = useCart();
    const router = useRouter();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
            setSearchQuery("");
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-[var(--color-background-light)]/95 dark:bg-[var(--color-background-dark)]/95 backdrop-blur-md border-b border-[#E5E5E5] dark:border-gray-800 transition-all duration-300">
            <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between relative">
                {/* Logo (Left) */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="size-8 text-[#d41132]">
                        <span className="material-symbols-outlined text-[32px]">
                            checkroom
                        </span>
                    </div>
                    <span className="text-xl font-extrabold tracking-tight uppercase">
                        Luxe Leather
                    </span>
                </Link>

                {/* Links (Center) - Hide if search is open on mobile/small screens if needed, but for now keep plain */}
                <nav className={`hidden md:flex items-center gap-8 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
                    {STOREFRONT_NAV_ITEMS.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`text-sm font-bold text-[#1A1A1A] dark:text-white hover:text-[#d41132] transition-colors ${item.name === 'Shipping' ? 'text-[#1a73e8] hover:text-[#1557b0]' : ''}`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Search Bar Overlay */}
                <div className={`absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] px-20 transition-all duration-300 ${isSearchOpen ? 'opacity-100 visible z-10' : 'opacity-0 invisible z-[-1]'}`}>
                    <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl flex items-center gap-4">
                        <span className="material-symbols-outlined text-[24px] text-gray-400">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search jackets, bags, accessories..."
                            className="flex-grow bg-transparent border-none outline-none text-lg font-medium placeholder-gray-400 text-[#1A1A1A] dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus={isSearchOpen}
                        />
                        <button
                            type="button"
                            onClick={() => setIsSearchOpen(false)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <span className="material-symbols-outlined text-[24px] text-gray-500">
                                close
                            </span>
                        </button>
                    </form>
                </div>

                {/* Utilities (Right) */}
                <div className="flex items-center gap-4 z-20">
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        aria-label="Search"
                        className={`p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors ${isSearchOpen ? 'bg-black/5 dark:bg-white/10' : ''}`}
                    >
                        <span className="material-symbols-outlined text-[24px]">
                            search
                        </span>
                    </button>
                    <button
                        aria-label="Account"
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">
                            person
                        </span>
                    </button>
                    <button
                        onClick={openCart}
                        aria-label="Cart"
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors relative"
                    >
                        <span className="material-symbols-outlined text-[24px]">
                            shopping_bag
                        </span>
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#d41132] text-[10px] font-bold text-white">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
