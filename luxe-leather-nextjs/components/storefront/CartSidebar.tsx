'use client';

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
    const { cartItems, removeFromCart, updateQuantity, cartTotal, closeCart, discount, totalAfterDiscount } = useCart();
    const router = useRouter();

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[460px] flex flex-col bg-white dark:bg-[#111827] shadow-2xl transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#137fec] text-2xl">shopping_bag</span>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Bag</h2>
                        <span className="bg-[#137fec] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{cartItems.length}</span>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

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
                                            <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-tight">{item.name}</h3>
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
                                        <p className="font-medium text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {/* Shipping Notice */}
                    {cartItems.length > 0 && (
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg flex gap-3 items-start">
                            <span className="material-symbols-outlined text-[#137fec] text-xl shrink-0 mt-0.5">local_shipping</span>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Free shipping automatically applied to all orders over $200.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 ? (
                    <div className="border-t border-gray-100 dark:border-gray-800 p-8 bg-white dark:bg-[#111827] space-y-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-20">
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                                <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                                <span className="font-medium text-slate-900 dark:text-white">${cartTotal.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <span className="text-xs font-bold uppercase tracking-widest italic">Discount Applied</span>
                                    <span className="font-bold">-${discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                                <span className="text-xs font-bold uppercase tracking-widest">Shipping</span>
                                <span>Calculated next step</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 mt-2">
                                <span className="text-sm font-black uppercase tracking-widest">Total</span>
                                <span className="text-xl font-black text-[#c27a2a]">${totalAfterDiscount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link
                                href="/cart"
                                onClick={onClose}
                                className="w-full h-14 flex items-center justify-center gap-3 rounded-xl border-2 border-[#1c140d] dark:border-[#c27a2a] text-[#1c140d] dark:text-[#c27a2a] font-black uppercase tracking-widest transition-all hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98]"
                            >
                                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                                <span>View Full Cart</span>
                            </Link>

                            <button
                                onClick={() => {
                                    onClose();
                                    router.push('/checkout');
                                }}
                                className="w-full h-14 flex items-center justify-center gap-3 rounded-xl bg-[#c27a2a] hover:bg-[#a35508] text-white font-black uppercase tracking-widest transition-all shadow-xl shadow-[#c27a2a]/20 hover:shadow-[#c27a2a]/30 active:scale-[0.98]"
                            >
                                <span>Proceed to Checkout</span>
                                <span className="material-symbols-outlined text-[20px]">lock</span>
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-tighter mt-4">
                            Trusted Concierge Service • Free Worldwide Shipping
                        </p>
                    </div>
                ) : (
                    <div className="p-8 pb-12">
                        <button onClick={onClose} className="w-full h-12 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-all">
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
