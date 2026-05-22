"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Coupon } from "@/lib/supabase";

export interface CartItem {
    // ... same ...
    id: string;
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
    dummyPayment?: boolean;
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
    removeFromCart: (id: string, variant?: string) => void;
    updateQuantity: (id: string, delta: number, variant?: string) => void;
    applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
    removeCoupon: () => void;
    checkout: (data: CheckoutData) => Promise<{ success: boolean; clientSecret?: string; orderId?: string; message?: string; dummyMode?: boolean }>;
    clearCart: () => void;
    validateCheckoutStock: () => Promise<{ success: boolean; message?: string }>;
    removedItems: string[]; // names of items removed during last validation
    clearRemovedItems: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    // Names of items silently removed during cart validation (to show user a notification)
    const [removedItems, setRemovedItems] = useState<string[]>([]);

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

    /**
     * Validate cart items against the live product API.
     * Removes any items that are archived (isActive=false) or no longer exist.
     * Called every time the cart is opened so the shopper never sees stale items.
     */
    const validateCart = useCallback(async (items: CartItem[]) => {
        if (items.length === 0) return items;

        const ids = items.map(i => String(i.id)).join(',');
        try {
            const res = await fetch(`/api/products/validate?ids=${encodeURIComponent(ids)}`);
            if (!res.ok) return items; // fail open — don't clear cart on network error

            const result = await res.json();
            const unavailableIds = new Set<string>(result.unavailableIds ?? []);

            if (unavailableIds.size === 0) return items;

            // Split into available and removed
            const available: CartItem[] = [];
            const removed: CartItem[] = [];
            for (const item of items) {
                if (unavailableIds.has(String(item.id))) {
                    removed.push(item);
                } else {
                    available.push(item);
                }
            }

            if (removed.length > 0) {
                setRemovedItems(removed.map(i => i.name));
                setCartItems(available);
                localStorage.setItem('luxeCart', JSON.stringify(available));
            }

            return available;
        } catch (err) {
            console.warn('[CartContext] validateCart error (fail open):', err);
            return items; // fail open
        }
    }, []);

    const openCart = async () => {
        // Validate on every open so archived/deleted products are removed before the user sees them
        const validated = await validateCart(cartItems);
        if (validated !== cartItems) setCartItems(validated);
        setIsOpen(true);
    };
    const closeCart = () => {
        setIsOpen(false);
        setRemovedItems([]); // clear notification after closing
    };
    const clearRemovedItems = () => setRemovedItems([]);

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

    const removeFromCart = (id: string, variant?: string) => {
        setCartItems((prevItems) => prevItems.filter((item) => !(item.id === id && item.variant === variant)));
    };

    const updateQuantity = (id: string, delta: number, variant?: string) => {
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
                    dummyPayment: data.dummyPayment,
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
                dummyMode: result.dummyMode,
            };
        } catch (error: any) {
            console.error('Checkout error:', error);
            return { success: false, message: error.message || 'Checkout failed' };
        }
    };

    const validateCheckoutStock = async (): Promise<{ success: boolean; message?: string }> => {
        try {
            const res = await fetch('/api/products/validate-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cartItems })
            });
            return await res.json();
        } catch (error) {
            console.error('[validateCheckoutStock] error:', error);
            return { success: false, message: 'Failed to validate stock.' };
        }
    };

    const clearCart = useCallback(() => {
        setCartItems([]);
        setAppliedCoupon(null);
        localStorage.removeItem("luxeCart");
        localStorage.removeItem("luxeCoupon");
        setIsOpen(false);
    }, []);

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
                validateCheckoutStock,
                clearCart,
                removedItems,
                clearRemovedItems,
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

