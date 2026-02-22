"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
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
}

interface CartContextType {
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    cartItems: CartItem[];
    cartCount: number;
    cartTotal: number;
    addToCart: (item: Omit<CartItem, "quantity">) => void;
    removeFromCart: (id: number) => void;
    updateQuantity: (id: number, delta: number) => void;
    checkout: (data: CheckoutData) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("luxeCart");
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (error) {
                console.error("Failed to parse cart data", error);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("luxeCart", JSON.stringify(cartItems));
        }
    }, [cartItems, isLoaded]);

    const openCart = () => setIsOpen(true);
    const closeCart = () => setIsOpen(false);

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const addToCart = (newItem: Omit<CartItem, "quantity">) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === newItem.id);
            if (existingItem) {
                return prevItems.map((item) =>
                    item.id === newItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevItems, { ...newItem, quantity: 1 }];
        });
        setIsOpen(true); // Open cart when adding an item
    };

    const removeFromCart = (id: number) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    const updateQuantity = (id: number, delta: number) => {
        setCartItems((prevItems) =>
            prevItems.map((item) => {
                if (item.id === id) {
                    const newQuantity = item.quantity + delta;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
                }
                return item;
            })
        );
    };

    const checkout = async (data: CheckoutData) => {
        // Find or create the customer
        let customerId: string;
        try {
            // Check if customer exists
            const resFn = await fetch(`/api/customers?email=${encodeURIComponent(data.email)}`);
            const resData = await resFn.json();

            if (resData.success && resData.data && resData.data.length > 0) {
                customerId = resData.data[0].id;
            } else {
                // Create new customer
                const createRes = await fetch('/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        location: [data.city, data.country].filter(Boolean).join(', '),
                    }),
                });
                const createData = await createRes.json();

                if (!createData.success) {
                    throw new Error(createData.message || 'Failed to create customer');
                }
                customerId = createData.data.id;
            }
        } catch (error) {
            console.error('Checkout error (Customer):', error);
            alert('Failed to process customer information');
            return;
        }

        // Create the order
        const orderItems = cartItems.map((item) => ({
            product_id: String(item.id),
            quantity: item.quantity,
            price: item.price,
            size: item.variant?.match(/Size: ([^,]+)/)?.[1],
            color: item.variant?.match(/Color: (.+)/)?.[1],
        }));

        try {
            const orderRes = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customerId,
                    status: 'pending',
                    total: cartTotal,
                    items: orderItems,
                }),
            });
            const orderData = await orderRes.json();

            if (!orderData.success) {
                throw new Error(orderData.message || 'Failed to create order');
            }

            // Clear the cart
            setCartItems([]);
            localStorage.removeItem("luxeCart");
            setIsOpen(false);

            // Redirect or show success
            alert('Order placed successfully!');
            window.location.href = '/shop'; // Or order success page

        } catch (error) {
            console.error('Checkout error (Order):', error);
            alert('Failed to place order. Please try again.');
        }
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
                addToCart,
                removeFromCart,
                updateQuantity,
                checkout,
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

