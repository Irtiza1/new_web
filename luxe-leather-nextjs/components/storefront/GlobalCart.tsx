'use client';

import { useCart } from "@/contexts/CartContext";
import { useState, useEffect } from "react";
import SearchOverlay from "./SearchOverlay";
import CartSidebar from "./CartSidebar";
import { usePathname } from "next/navigation";

export default function GlobalCart() {
    const { isOpen: isCartOpen, closeCart } = useCart();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const pathname = usePathname();

    // Listen for custom search event if needed, or we'll pass it down
    // For now, we'll keep it simple and handle it via a global state if possible, 
    // but React state in layout/header is better.
    // However, SearchOverlay is a "Global" component like Cart.

    // Let's expose an interface to open search globally if needed, 
    // or just handle it in Header. 
    // But since the requirement was "SearchOverlay at root level", 
    // I'll keep it here and use a Custom Event for now to trigger it from Header.

    useEffect(() => {
        const handleOpenSearch = () => setIsSearchOpen(true);
        window.addEventListener('openSearch', handleOpenSearch);
        return () => window.removeEventListener('openSearch', handleOpenSearch);
    }, []);

    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            <CartSidebar isOpen={isCartOpen} onClose={closeCart} />
            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
