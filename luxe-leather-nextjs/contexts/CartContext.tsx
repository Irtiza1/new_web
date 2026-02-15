"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createOrder } from "@/lib/api/orders";
import { getCustomerByEmail, createCustomer } from "@/lib/api/customers";

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
            const existingCustomer = await getCustomerByEmail(data.email);
            customerId = existingCustomer.id;
        } catch {
            // Customer doesn't exist, create one
            const newCustomer = await createCustomer({
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                city: data.city,
                country: data.country,
            });
            customerId = newCustomer.id;
        }

        // Create the order
        const orderItems = cartItems.map((item) => ({
            product_id: String(item.id),
            quantity: item.quantity,
            price: item.price,
            size: item.variant?.match(/Size: ([^,]+)/)?.[1],
            color: item.variant?.match(/Color: (.+)/)?.[1],
        }));

        await createOrder({
            customerId: customerId,
            status: 'pending',
            total: cartTotal,
            items: orderItems,
        });

        // Clear the cart
        setCartItems([]);
        localStorage.removeItem("luxeCart");
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

