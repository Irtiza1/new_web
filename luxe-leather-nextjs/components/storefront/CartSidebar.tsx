'use client';

import { useState } from "react";

import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
    const { cartItems, removeFromCart, updateQuantity, cartTotal, discount, totalAfterDiscount, removedItems, validateCheckoutStock } = useCart();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const handleCheckoutRoute = async (route: string) => {
        setError(null);
        setIsValidating(true);
        const result = await validateCheckoutStock();
        setIsValidating(false);
        
        if (result.success) {
            onClose();
            router.push(route);
        } else {
            setError(result.message || "Failed to validate stock.");
        }
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[460px] flex flex-col bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] font-[family-name:var(--font-manrope)] text-[#1b0e10] dark:text-white shadow-2xl transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#1b0e10] dark:text-white text-2xl">shopping_bag</span>
                        <h2 className="text-xl font-medium text-[#1b0e10] dark:text-white">Your Bag</h2>
                        <span className="bg-[#cf1736] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{cartItems.length}</span>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full text-gray-400 hover:text-[#cf1736] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Unavailable items removed notification */}
                {removedItems.length > 0 && (
                    <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0 mt-0.5">warning</span>
                        <div>
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                {removedItems.length === 1
                                    ? `"${removedItems[0]}" was removed from your bag`
                                    : `${removedItems.length} items were removed from your bag`}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                {removedItems.length === 1 ? 'This item is' : 'These items are'} no longer available.
                            </p>
                        </div>
                    </div>
                )}

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6" style={{ scrollbarWidth: 'thin' }}>
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <span className="material-symbols-outlined text-6xl text-gray-300">shopping_cart_off</span>
                            <p className="text-gray-500 text-lg font-medium">Your bag is empty.</p>
                        </div>
                    ) : (
                        cartItems.map((item, index) => (
                            <div key={`${item.id}-${item.variant || index}`} className="group flex gap-5">
                                <div className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 dark:border-gray-700">
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
                                </div>
                                <div className="flex flex-col flex-1 justify-between py-0.5">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-medium text-[#1b0e10] dark:text-white text-base leading-tight">{item.name}</h3>
                                            <button onClick={() => removeFromCart(item.id, item.variant)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {item.variant?.replace(/undefined/g, 'Standard') || 'Standard'}
                                        </p>
                                    </div>
                                    <div className="flex items-end justify-between mt-2">
                                        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md h-8">
                                            <button onClick={() => updateQuantity(item.id, -1, item.variant)} className="px-2.5 h-full hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">remove</span>
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1, item.variant)} className="px-2.5 h-full hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">add</span>
                                            </button>
                                        </div>
                                        <p className="font-medium text-[#1b0e10] dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {/* Shipping Notice */}
                    {cartItems.length > 0 && (
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg flex gap-3 items-start">
                            <span className="material-symbols-outlined text-[#cf1736] text-xl shrink-0 mt-0.5">local_shipping</span>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Free worldwide shipping automatically applied to all orders.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 ? (
                    <div className="border-t border-gray-100 dark:border-gray-800 p-8 bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] space-y-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-20">
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between items-center text-sm text-[#1b0e10]/80 dark:text-gray-400">
                                <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                                <span className="font-medium text-[#1b0e10] dark:text-white">${cartTotal.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <span className="text-xs font-bold uppercase tracking-widest italic">Discount Applied</span>
                                    <span className="font-bold">-${discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm text-[#1b0e10]/80 dark:text-gray-400">
                                <span className="text-xs font-bold uppercase tracking-widest">Shipping</span>
                                <span>Calculated next step</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-medium text-[#1b0e10] dark:text-white pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 mt-2">
                                <span className="text-sm font-bold uppercase tracking-widest">Total</span>
                                <span className="text-xl font-medium text-[#cf1736]">${totalAfterDiscount.toFixed(2)}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mx-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
                                <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0 mt-0.5">error</span>
                                <p className="text-xs font-bold text-red-700 leading-tight">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-4">
                            <button
                                onClick={() => {
                                    onClose();
                                    router.push('/cart');
                                }}
                                className="w-full h-14 flex items-center justify-center gap-3 rounded-xl border-2 border-[#1b0e10] dark:border-[#cf1736] text-[#1b0e10] dark:text-[#cf1736] font-bold uppercase tracking-widest transition-all hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98]"
                            >
                                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                                <span>View Full Cart</span>
                            </button>

                            <button
                                onClick={() => handleCheckoutRoute('/checkout')}
                                disabled={isValidating}
                                className="w-full h-14 flex items-center justify-center gap-3 rounded-xl bg-[#cf1736] hover:bg-[#a3122a] text-white font-bold uppercase tracking-widest transition-all shadow-xl shadow-[#cf1736]/20 hover:shadow-[#cf1736]/30 active:scale-[0.98] disabled:opacity-50"
                            >
                                {isValidating ? (
                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                ) : (
                                    <>
                                        <span>Proceed to Checkout</span>
                                        <span className="material-symbols-outlined text-[20px]">lock</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-tighter mt-4">
                            Trusted Concierge Service • Free Worldwide Shipping
                        </p>
                    </div>
                ) : (
                    <div className="p-8 pb-12">
                        <button onClick={onClose} className="w-full h-12 rounded-lg bg-[#1b0e10] dark:bg-white text-white dark:text-[#1b0e10] font-bold uppercase tracking-widest hover:opacity-90 transition-all">
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
