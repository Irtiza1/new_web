"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
    const [cartCount] = useState(2); // Will connect to cart state later

    return (
        <header className="sticky top-0 z-50 w-full bg-[#FAFAF8]/95 dark:bg-[#221013]/95 backdrop-blur-md border-b border-[#E5E5E5] dark:border-gray-800">
            <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
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
                <nav className="hidden md:flex items-center gap-8">
                    <Link
                        href="/"
                        className="text-sm font-bold text-[#1A1A1A] dark:text-white hover:text-[#d41132] transition-colors"
                    >
                        Home
                    </Link>
                    <Link
                        href="/shop"
                        className="text-sm font-bold text-[#1A1A1A] dark:text-white hover:text-[#d41132] transition-colors"
                    >
                        Shop
                    </Link>
                    <Link
                        href="/our-story"
                        className="text-sm font-medium text-[#1A1A1A]/80 dark:text-white/80 hover:text-[#d41132] transition-colors"
                    >
                        Our Story
                    </Link>
                    <Link
                        href="/bespoke"
                        className="text-sm font-medium text-[#1A1A1A]/80 dark:text-white/80 hover:text-[#d41132] transition-colors"
                    >
                        Bespoke
                    </Link>
                    <Link
                        href="/contact"
                        className="text-sm font-medium text-[#1A1A1A]/80 dark:text-white/80 hover:text-[#d41132] transition-colors"
                    >
                        Contact
                    </Link>
                </nav>

                {/* Utilities (Right) */}
                <div className="flex items-center gap-4">
                    <button
                        aria-label="Search"
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
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
