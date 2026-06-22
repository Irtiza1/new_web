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
    const [siteTitle, setSiteTitle] = useState("Luxe Leather Gear");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        // Fetch site settings
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data && data.data.site_title) {
                    setSiteTitle(data.data.site_title);
                }
            })
            .catch(err => console.error('Error fetching settings:', err));

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
                        <img src="/luxe-leather-gear-monogram.png" alt="Luxe Leather Gear Logo" className="h-9 w-auto object-contain rounded" />
                        <span className="text-xl font-medium tracking-tight uppercase font-[family-name:var(--font-playfair)]">
                            {siteTitle}
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
                                className="text-sm font-medium text-[#1b0e10] dark:text-white hover:text-[#cf1736] transition-colors"
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
                        
                        {/* Mobile Hamburger Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Menu"
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors flex md:hidden items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-[24px]">
                                menu
                            </span>
                        </button>
                        <div className="relative">
                            <Link
                                href="/account"
                                aria-label="Account"
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors hidden md:flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-[24px]">
                                    person
                                </span>
                            </Link>
                        </div>
                        <button
                            onClick={openCart}
                            aria-label="Cart"
                            className="flex items-center group/cart p-1.5 pl-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all gap-2"
                        >
                            <div className="flex flex-col items-end mr-1 hidden sm:flex">
                                <span className="text-[10px] font-medium text-[#1b0e10]/80 dark:text-gray-400 uppercase tracking-tighter leading-none mb-0.5">Your Bag</span>
                                <span className="text-sm font-medium text-[#1b0e10] dark:text-white leading-none">${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="relative p-2 bg-[#cf1736] text-white rounded-full shadow-sm group-hover/cart:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[20px]">
                                    shopping_bag
                                </span>
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#cf1736] text-[10px] font-bold shadow-sm ring-1 ring-[#cf1736]/10">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] flex md:hidden">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                    
                    {/* Drawer */}
                    <div className="relative flex flex-col w-[80%] max-w-[320px] h-full bg-white dark:bg-[#101922] shadow-2xl animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-xl font-medium tracking-tight uppercase font-[family-name:var(--font-playfair)] text-[#1b0e10] dark:text-white">
                                Menu
                            </span>
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto py-6 px-6 flex flex-col gap-6">
                            {navItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.url}
                                    target={item.opens_in_new_tab ? '_blank' : undefined}
                                    rel={item.opens_in_new_tab ? 'noopener noreferrer' : undefined}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-lg font-medium text-[#1b0e10] dark:text-white hover:text-[#cf1736] transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <div className="h-px w-full bg-gray-100 dark:bg-gray-800 my-2" />
                            <Link 
                                href="/account" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 text-lg font-medium text-[#1b0e10] dark:text-white hover:text-[#cf1736] transition-colors"
                            >
                                <span className="material-symbols-outlined">person</span>
                                My Account
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
