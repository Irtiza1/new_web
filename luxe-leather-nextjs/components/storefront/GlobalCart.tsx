"use client";

import { useCart } from "@/contexts/CartContext";
import CartSidebar from "./CartSidebar";

export default function GlobalCart() {
    const { isOpen, closeCart } = useCart();
    return <CartSidebar isOpen={isOpen} onClose={closeCart} />;
}
