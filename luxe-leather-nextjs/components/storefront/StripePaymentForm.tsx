'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
    orderId: string;
    total: number;

    onError: (message: string) => void;
}

export default function StripePaymentForm({ orderId, total, onError }: StripePaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            setMessage('Payment system is loading. Please wait...');
            return;
        }

        setIsProcessing(true);
        setMessage('');

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/order-success?order_id=${orderId}`,
            },
        });

        // If error, it means the payment failed or user cancelled
        // If no error, the user was redirected to return_url (success)
        if (error) {
            if (error.type === 'card_error' || error.type === 'validation_error') {
                setMessage(error.message || 'Payment failed. Please check your card details.');
            } else {
                setMessage('An unexpected error occurred. Please try again.');
            }
            onError(error.message || 'Payment failed');
        }

        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement
                options={{
                    layout: 'tabs',
                }}
            />

            {message && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-4 py-3 rounded-lg">
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={isProcessing || !stripe || !elements}
                className="w-full bg-[#c27a2a] text-white py-5 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl shadow-[#c27a2a]/20 hover:bg-[#a35508] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <>
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Processing...
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined">lock</span>
                        Pay ${total.toFixed(2)}
                    </>
                )}
            </button>

            <p className="text-[10px] text-center text-gray-400 uppercase font-bold tracking-tighter">
                Secured by Stripe · Your card details never touch our servers
            </p>
        </form>
    );
}
