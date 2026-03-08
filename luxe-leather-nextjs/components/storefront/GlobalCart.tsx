"use client";

import { usePathname } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import CartSidebar from "./CartSidebar";

export default function GlobalCart() {
    const { isOpen, closeCart } = useCart();
    const pathname = usePathname();

    // Do not show cart on admin pages
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return <CartSidebar isOpen={isOpen} onClose={closeCart} />;
}
