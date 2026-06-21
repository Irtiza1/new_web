"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";


export default function CartPage() {
    const {
        cartItems,
        updateQuantity,
        removeFromCart,
        cartTotal,
        appliedCoupon,
        discount,
        totalAfterDiscount,
        applyCoupon,
        removeCoupon
    } = useCart();

    const [couponCode, setCouponCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const router = useRouter();
    const { validateCheckoutStock } = useCart();

    const handleCheckout = async () => {
        setCheckoutError(null);
        setIsCheckingOut(true);
        const result = await validateCheckoutStock();
        setIsCheckingOut(false);

        if (result.success) {
            router.push('/checkout');
        } else {
            setCheckoutError(result.message || 'Failed to validate stock.');
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsLoading(true);
        setMessage(null);
        const result = await applyCoupon(couponCode);
        if (result.success) {
            setMessage({ text: result.message, type: 'success' });
            setCouponCode("");
        } else {
            setMessage({ text: result.message, type: 'error' });
        }
        setIsLoading(false);
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-[#FDFDFB] dark:bg-[#120d09] font-[family-name:var(--font-manrope)] text-[#1b0e10]">

                <div className="flex-1 flex flex-col items-center justify-center px-4 py-24">
                    <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-8 border border-gray-100 dark:border-white/5">
                        <span className="material-symbols-outlined text-4xl text-gray-300">shopping_cart_off</span>
                    </div>
                    <h1 className="text-3xl font-medium text-[#1b0e10] dark:text-white tracking-tighter mb-4">Your collection is empty</h1>
                    <p className="text-[#1b0e10]/80 dark:text-gray-400 max-w-md text-center mb-10 leading-relaxed">
                        It seems you haven&apos;t added any luxury pieces to your cart yet. Discover our latest arrivals.
                    </p>
                    <Link
                        href="/shop"
                        className="bg-[#cf1736] hover:bg-[#a3122a] text-white px-12 py-4 rounded font-bold uppercase tracking-widest transition-all shadow-lg hover:-translate-y-1"
                    >
                        Explore Shop
                    </Link>
                </div>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFB] dark:bg-[#120d09] font-[family-name:var(--font-manrope)] text-[#1b0e10]">

            <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-32 pb-20">
                <h1 className="text-4xl md:text-5xl font-medium text-[#1b0e10] dark:text-white tracking-tighter mb-12">Your Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-8">
                        {cartItems.map((item) => (
                            <div key={`${item.id}-${item.variant}`} className="flex flex-col sm:flex-row gap-6 pb-8 border-b border-gray-100 dark:border-white/5 group">
                                <div className="w-full sm:w-40 aspect-square bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden shadow-inner shrink-0 ring-1 ring-black/5 dark:ring-white/5">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-medium text-[#1b0e10] dark:text-white">{item.name}</h3>
                                        <button
                                            onClick={() => removeFromCart(item.id, item.variant)}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-500 transition-colors rounded-full"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                    <p className="text-xs font-bold tracking-widest uppercase text-[#cf1736] mb-6">{item.variant}</p>

                                    <div className="flex justify-between items-center mt-auto">
                                        <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1, item.variant)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-all font-bold"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">remove</span>
                                            </button>
                                            <span className="w-12 text-center font-bold text-[#1b0e10] dark:text-white">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1, item.variant)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-all font-bold"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">add</span>
                                            </button>
                                        </div>
                                        <p className="text-xl font-bold text-[#1b0e10] dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="pt-4">
                            <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#cf1736] transition-colors group uppercase tracking-widest">
                                <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-[#1b0e10] rounded-xl p-8 shadow-xl shadow-black/5 border border-gray-100 dark:border-white/5 sticky top-32">
                            <h2 className="text-2xl font-medium text-[#1b0e10] dark:text-white tracking-tight mb-8">Order Summary</h2>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-[#1b0e10]/80 dark:text-gray-400 font-medium">
                                    <span>Subtotal</span>
                                    <span className="text-[#1b0e10] dark:text-white">${cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 dark:text-gray-400 font-medium">
                                    <span>Shipping</span>
                                    <span className="text-green-600 dark:text-green-400 font-bold uppercase text-[10px] tracking-widest">Calculated at Checkout</span>
                                </div>

                                {appliedCoupon && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400 font-medium animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="flex items-center gap-2">
                                            <span>Discount ({appliedCoupon.code})</span>
                                            <button onClick={removeCoupon} className="text-red-400 hover:text-red-500">
                                                <span className="material-symbols-outlined text-[14px]">cancel</span>
                                            </button>
                                        </div>
                                        <span>-${discount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-between">
                                    <span className="text-lg font-medium text-[#1b0e10] dark:text-white uppercase">Total</span>
                                    <span className="text-2xl font-bold text-[#cf1736]">${totalAfterDiscount.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Coupon Section */}
                            {!appliedCoupon ? (
                                <div className="mb-8">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Apply Coupon Code</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Code"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-4 py-3 text-sm focus:border-[#cf1736] outline-none transition-all dark:text-white"
                                        />
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={isLoading || !couponCode}
                                            className="bg-[#1b0e10] hover:bg-[#cf1736] text-white px-0 py-3 rounded font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px] shrink-0"
                                        >
                                            {isLoading ? (
                                                <><span className="animate-spin material-symbols-outlined text-[14px]">progress_activity</span> Checking</>
                                            ) : 'Apply'}
                                        </button>
                                    </div>
                                    {message && (
                                        <p className={`text-[10px] mt-2 font-bold uppercase tracking-tight break-words ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                                            {message.text}
                                        </p>
                                    )}
                                </div>
                            ) : null}

                            {checkoutError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
                                    <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0 mt-0.5">error</span>
                                    <p className="text-xs font-bold text-red-700 leading-tight">
                                        {checkoutError}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut}
                                className="w-full bg-[#cf1736] hover:bg-[#a3122a] text-white h-16 rounded flex items-center justify-center gap-3 font-bold uppercase tracking-widest transition-all shadow-lg shadow-black/10 hover:-translate-y-1 mb-8 disabled:opacity-50"
                            >
                                {isCheckingOut ? (
                                    <span className="animate-spin material-symbols-outlined text-[20px]">progress_activity</span>
                                ) : (
                                    <>
                                        Secure Checkout
                                        <span className="material-symbols-outlined text-[20px]">lock</span>
                                    </>
                                )}
                            </button>

                            <div className="space-y-6">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">We Accept</p>
                                <div className="flex justify-center gap-4 opacity-50 grayscale dark:invert">
                                    <img src="https://img.icons8.com/color/48/000000/visa.png" className="h-6 object-contain" alt="Visa" />
                                    <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="h-6 object-contain" alt="Mastercard" />
                                    <img src="https://img.icons8.com/color/48/000000/amex.png" className="h-6 object-contain" alt="Amex" />
                                    <img src="https://img.icons8.com/color/48/000000/paypal.png" className="h-6 object-contain" alt="Paypal" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
