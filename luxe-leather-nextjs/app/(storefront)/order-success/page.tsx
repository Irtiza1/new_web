'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { Suspense } from 'react';
import { createOrderNumber } from '@/lib/utils/orderNumber';

interface OrderSummary {
    id: string;
    total: number;
    itemCount: number;
}

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const { clearCart } = useCart();
    const [order, setOrder] = useState<OrderSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

     
    useEffect(() => {
        const paymentIntent = searchParams.get('payment_intent');
        const orderId = searchParams.get('order_id');
        const redirectStatus = searchParams.get('redirect_status');

        if (redirectStatus === 'succeeded' && orderId) {
            // Payment succeeded via Stripe redirect
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOrder({
                id: orderId,
                total: 0, // We don't have total in URL, but order is confirmed
                itemCount: 0,
            });
            clearCart();
            setLoading(false);
            return;
        }

        if (paymentIntent && redirectStatus === 'succeeded') {
            // Stripe redirect with payment_intent but no order_id
            setOrder({
                id: paymentIntent,
                total: 0,
                itemCount: 0,
            });
            clearCart();
            setLoading(false);
            return;
        }

        // Fallback: check localStorage for order data (non-Stripe flow)
        const data = localStorage.getItem('lastOrder');
        if (data) {
            try {
                setOrder(JSON.parse(data));
                localStorage.removeItem('lastOrder');
                clearCart();
            } catch {
                // ignore parse errors
            }
            setLoading(false);
            return;
        }

        // No order data found
        setError('No order information found.');
        setLoading(false);
    }, [searchParams, clearCart]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] font-[family-name:var(--font-manrope)] flex items-center justify-center p-6 text-[#1b0e10] dark:text-white">
                <div className="flex items-center gap-3 text-[#1b0e10]/80 dark:text-slate-400">
                    <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                    Verifying your payment...
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] font-[family-name:var(--font-manrope)] flex items-center justify-center p-6 text-[#1b0e10] dark:text-white">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-600 text-4xl">warning</span>
                    </div>
                    <h1 className="text-2xl font-medium text-[#1b0e10] dark:text-white">Something went wrong</h1>
                    <p className="text-[#1b0e10]/80 dark:text-slate-400 text-sm">{error || 'Unable to verify your order. Please contact support.'}</p>
                    <Link href="/shop" className="block w-full py-3 bg-[#cf1736] hover:bg-[#a3122a] text-white font-bold uppercase tracking-widest rounded-lg transition-colors text-sm">
                        Return to Shop
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] font-[family-name:var(--font-manrope)] flex items-center justify-center p-6 text-[#1b0e10] dark:text-white">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Success Icon */}
                <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-medium text-[#1b0e10] dark:text-white">Payment Successful!</h1>
                    <p className="text-[#1b0e10]/80 dark:text-slate-400 text-sm">Thank you for your purchase. Your order has been confirmed and is being processed.</p>
                </div>

                <div className="bg-white dark:bg-[#1b0e10] rounded-xl p-6 space-y-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-sm">
                        <span className="text-[#1b0e10]/80 dark:text-slate-400">Order ID</span>
                        <span className="font-mono font-bold text-[#1b0e10] dark:text-white">{createOrderNumber(new Date(), order.id)}</span>
                    </div>
                    {order.total > 0 && (
                        <>
                            <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#1b0e10]/80 dark:text-slate-400">Items</span>
                                <span className="font-bold text-[#1b0e10] dark:text-white">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#1b0e10]/80 dark:text-slate-400">Total Paid</span>
                                <span className="font-bold text-lg text-[#cf1736]">${order.total.toFixed(2)}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="space-y-3 pt-2">
                    <p className="text-xs text-slate-400">Estimated delivery: 5-7 business days</p>
                    <Link href="/shop" className="block w-full py-3 bg-[#cf1736] hover:bg-[#a3122a] text-white font-bold uppercase tracking-widest rounded-lg transition-colors text-sm">
                        Continue Shopping
                    </Link>
                    <Link href="/contact" className="block w-full py-3 border border-slate-200 dark:border-slate-700 text-[#1b0e10] dark:text-white font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                        Need Help? Contact Us
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-2xl text-slate-400">progress_activity</span>
            </div>
        }>
            <OrderSuccessContent />
        </Suspense>
    );
}
