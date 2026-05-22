"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { useCart } from "@/contexts/CartContext";
import AnnouncementBar from "./AnnouncementBar";
import { STOREFRONT_NAV_ITEMS } from "@/lib/constants/navigation";

interface NavItem {
    id: string;
    label: string;
    url: string;
    is_visible: boolean;
    opens_in_new_tab: boolean;
    display_order: number;
}

export default function Header() {
    const { cartCount, cartTotal, openCart } = useCart();

    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const [showAccountToast, setShowAccountToast] = useState(false);

    useEffect(() => {
        const homeItem: NavItem = { id: 'home', label: 'Home', url: '/', is_visible: true, opens_in_new_tab: false, display_order: -1 };

        fetch('/api/nav-items')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    const apiItems = data.data
                        .filter((i: NavItem) => i.is_visible)
                        .sort((a: NavItem, b: NavItem) => a.display_order - b.display_order);
                    // Only add Home if not already in the API data
                    const hasHome = apiItems.some((i: NavItem) => i.url === '/' || i.label.toLowerCase() === 'home');
                    setNavItems(hasHome ? apiItems : [homeItem, ...apiItems]);
                } else {
                    setNavItems(STOREFRONT_NAV_ITEMS.map((i, idx) => ({ id: String(idx), label: i.name, url: i.path, is_visible: true, opens_in_new_tab: false, display_order: idx })));
                }
            })
            .catch(() => {
                setNavItems(STOREFRONT_NAV_ITEMS.map((i, idx) => ({ id: String(idx), label: i.name, url: i.path, is_visible: true, opens_in_new_tab: false, display_order: idx })));
            });
    }, []);

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
                        <span className="text-xl font-extrabold tracking-tight uppercase font-[family-name:var(--font-playfair)]">
                            Luxe Leather
                        </span>
                    </Link>

                    {/* Links (Center) - Dynamic from /api/nav-items */}
                    <nav className="hidden md:flex items-center gap-8 transition-opacity duration-200">
                        {navItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.url}
                                target={item.opens_in_new_tab ? '_blank' : undefined}
                                rel={item.opens_in_new_tab ? 'noopener noreferrer' : undefined}
                                className="text-sm font-bold text-[#1A1A1A] dark:text-white hover:text-[#d41132] transition-colors"
                            >
                                {item.label}
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
                        <div className="relative">
                            <button
                                onClick={() => { setShowAccountToast(true); setTimeout(() => setShowAccountToast(false), 2000); }}
                                aria-label="Account"
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors hidden md:flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-[24px]">
                                    person
                                </span>
                            </button>
                            {showAccountToast && (
                                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg z-50">
                                    Coming soon
                                </div>
                            )}
                        </div>
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
