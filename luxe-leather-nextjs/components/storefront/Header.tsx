"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import AnnouncementBar from "./AnnouncementBar";
import { STOREFRONT_NAV_ITEMS } from "@/lib/constants/navigation";

export default function Header() {
    const { cartCount, cartTotal, openCart } = useCart();
    const router = useRouter();
    {/* Search Bar Overlay - REMOVED, now uses SearchOverlay.tsx */ }

    return (
        <>
            <AnnouncementBar />
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

                    {/* Links (Center) */}
                    <nav className="hidden md:flex items-center gap-8 transition-opacity duration-200">
                        {STOREFRONT_NAV_ITEMS.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className="text-sm font-bold text-[#1A1A1A] dark:text-white hover:text-[#d41132] transition-colors"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Utilities (Right) */}
                    <div className="flex items-center gap-2 z-20">
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('openSearch'))}
                            aria-label="Search"
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-[24px]">
                                search
                            </span>
                        </button>
                        <button
                            aria-label="Account"
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors hidden md:flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-[24px]">
                                person
                            </span>
                        </button>
                        <button
                            onClick={openCart}
                            aria-label="Cart"
                            className="flex items-center group/cart p-1.5 pl-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all gap-2"
                        >
                            <div className="flex flex-col items-end mr-1 hidden sm:flex">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-0.5">Your Bag</span>
                                <span className="text-sm font-black text-[#1c140d] dark:text-white leading-none">${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="relative p-2 bg-[#c27a2a] text-white rounded-full shadow-sm group-hover/cart:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[20px]">
                                    shopping_bag
                                </span>
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#c27a2a] text-[10px] font-black shadow-sm ring-1 ring-[#c27a2a]/10">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            </header>
        </>
    );
}
