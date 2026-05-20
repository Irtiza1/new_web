"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Coupon } from "@/lib/supabase";

export interface CartItem {
    // ... same ...
    id: number;
    name: string;
    variant?: string;
    quantity: number;
    price: number;
    image: string;
}

interface CheckoutData {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    notes?: string;
}

interface CartContextType {
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    cartItems: CartItem[];
    cartCount: number;
    cartTotal: number;
    appliedCoupon: Coupon | null;
    discount: number;
    totalAfterDiscount: number;
    addToCart: (item: Omit<CartItem, "quantity">) => void;
    removeFromCart: (id: number, variant?: string) => void;
    updateQuantity: (id: number, delta: number, variant?: string) => void;
    applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
    removeCoupon: () => void;
    checkout: (data: CheckoutData) => Promise<{ success: boolean; clientSecret?: string; orderId?: string; message?: string }>;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("luxeCart");
        const savedCoupon = localStorage.getItem("luxeCoupon");
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (error) {
                console.error("Failed to parse cart data", error);
            }
        }
        if (savedCoupon) {
            try {
                setAppliedCoupon(JSON.parse(savedCoupon));
            } catch (error) {
                console.warn("Failed to parse coupon data");
            }
        }
        setIsLoaded(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("luxeCart", JSON.stringify(cartItems));
            if (appliedCoupon) {
                localStorage.setItem("luxeCoupon", JSON.stringify(appliedCoupon));
            } else {
                localStorage.removeItem("luxeCoupon");
            }
        }
    }, [cartItems, appliedCoupon, isLoaded]);

    const openCart = () => setIsOpen(true);
    const closeCart = () => setIsOpen(false);

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const discount = appliedCoupon
        ? (appliedCoupon.discountType === 'percentage'
            ? (cartTotal * (appliedCoupon.value / 100))
            : appliedCoupon.value)
        : 0;

    const totalAfterDiscount = Math.max(0, cartTotal - discount);

    const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
        try {
            const res = await fetch(`/api/coupons?code=${encodeURIComponent(code)}`);
            const result = await res.json();

            if (!result.success) {
                return { success: false, message: result.message };
            }

            const coupon = result.data;
            if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
                return { success: false, message: `Minimum order amount for this coupon is $${coupon.minOrderAmount}` };
            }

            setAppliedCoupon(coupon);
            return { success: true, message: 'Coupon applied successfully!' };
        } catch (error) {
            return { success: false, message: 'Failed to apply coupon' };
        }
    };

    const removeCoupon = () => setAppliedCoupon(null);

    // Note: since the same product id can have multiple variants, we match by id AND variant
    // where needed, or we rely on the component using a composite id.
    // However, since `CartItem` id is a number, we will just match on id + variant when adding.
    const addToCart = (newItem: Omit<CartItem, "quantity">) => {
        setCartItems((prevItems) => {
            // Check if item with same id AND same variant already exists
            const existingItem = prevItems.find(
                (item) => item.id === newItem.id && item.variant === newItem.variant
            );
            if (existingItem) {
                return prevItems.map((item) =>
                    (item.id === newItem.id && item.variant === newItem.variant)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevItems, { ...newItem, quantity: 1 }];
        });
        setIsOpen(true); // Open cart when adding an item
    };

    const removeFromCart = (id: number, variant?: string) => {
        setCartItems((prevItems) => prevItems.filter((item) => !(item.id === id && item.variant === variant)));
    };

    const updateQuantity = (id: number, delta: number, variant?: string) => {
        setCartItems((prevItems) =>
            prevItems.map((item) => {
                if (item.id === id && item.variant === variant) {
                    const newQuantity = item.quantity + delta;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
                }
                return item;
            })
        );
    };

    const checkout = async (data: CheckoutData): Promise<{ success: boolean; clientSecret?: string; orderId?: string; message?: string }> => {
        try {
            const res = await fetch('/api/checkout/payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: data,
                    items: cartItems,
                    total: totalAfterDiscount,
                }),
            });
            const result = await res.json();

            if (!result.success) {
                return { success: false, message: result.message || 'Failed to create payment' };
            }

            return {
                success: true,
                clientSecret: result.clientSecret,
                orderId: result.orderId,
            };
        } catch (error: any) {
            console.error('Checkout error:', error);
            return { success: false, message: error.message || 'Checkout failed' };
        }
    };

    const clearCart = () => {
        setCartItems([]);
        setAppliedCoupon(null);
        localStorage.removeItem("luxeCart");
        localStorage.removeItem("luxeCoupon");
        setIsOpen(false);
    };

    return (
        <CartContext.Provider
            value={{
                isOpen,
                openCart,
                closeCart,
                cartItems,
                cartCount,
                cartTotal,
                appliedCoupon,
                discount,
                totalAfterDiscount,
                addToCart,
                removeFromCart,
                updateQuantity,
                applyCoupon,
                removeCoupon,
                checkout,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

