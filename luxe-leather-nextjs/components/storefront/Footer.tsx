'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { STOREFRONT_NAV_ITEMS } from "@/lib/constants/navigation";

interface NavItem {
    id: string;
    label: string;
    url: string;
    is_visible: boolean;
    opens_in_new_tab: boolean;
    display_order: number;
}

export default function Footer() {
    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const [siteTitle, setSiteTitle] = useState("Luxe Leather Gear");

    useEffect(() => {
        // Fetch site settings
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data && data.data.site_title) {
                    setSiteTitle(data.data.site_title);
                }
            })
            .catch(err => console.error('Error fetching settings in footer:', err));

        const homeItem: NavItem = { id: 'home', label: 'Home', url: '/', is_visible: true, opens_in_new_tab: false, display_order: -1 };

        fetch('/api/nav-items')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    const apiItems = data.data
                        .filter((i: NavItem) => i.is_visible)
                        .sort((a: NavItem, b: NavItem) => a.display_order - b.display_order);
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
        <footer className="bg-[#1b0e10] text-white pt-12 pb-14 border-t border-white/5 relative font-[family-name:var(--font-manrope)]">
            <div className="max-w-[1440px] mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-0 mb-12">
                    {/* Brand Col */}
                    <div className="flex flex-col gap-4 max-w-sm md:w-1/3">
                        <Link href="/" className="inline-block mb-6">
                            <div className="flex items-center gap-2">
                                <img src="/luxe-leather-gear-monogram.png" alt="Luxe Leather Gear Logo" className="h-8 w-auto object-contain rounded" />
                                <span className="text-xl font-medium tracking-tight uppercase font-[family-name:var(--font-playfair)] text-white">
                                    {siteTitle}
                                </span>
                            </div>
                        </Link>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            Premium handcrafted leather goods designed for the modern world.
                            Guaranteed quality, sustainable materials.
                        </p>
                    </div>

                    {/* Links Col - Navigation */}
                    <div className="flex-1 flex md:justify-center">
                        <div>
                            <h4 className="font-bold text-[10px] mb-6 uppercase tracking-[0.2em] text-[#cf1736]">Navigation</h4>
                            <ul className="grid grid-cols-3 gap-y-3 gap-x-8 text-[11px] font-medium text-gray-400">
                                {navItems.map(item => (
                                    <li key={item.id}>
                                        <Link href={item.url} target={item.opens_in_new_tab ? '_blank' : undefined} className="hover:text-white transition-colors tracking-widest uppercase">
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Links Col - Connect */}
                    <div className="md:w-1/3 flex md:justify-end">
                        <div>
                            <h4 className="font-bold text-[10px] mb-6 uppercase tracking-[0.2em] text-[#cf1736]">Connect</h4>
                            <ul className="flex gap-6 text-[11px] font-medium text-gray-400">
                                <li>
                                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors tracking-widest uppercase flex items-center gap-2.5">
                                        <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                        <span>Instagram</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors tracking-widest uppercase flex items-center gap-2.5">
                                        <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>
                                        <span>Facebook</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Stripe */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600">
                    <div className="flex flex-col md:flex-row items-center gap-6 lg:gap-10">
                        <p>© {new Date().getFullYear()} {siteTitle}</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
