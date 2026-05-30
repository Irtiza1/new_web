'use client';

import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '@/contexts/CartContext';
import { getStripe } from '@/lib/stripe-client';

import StripePaymentForm from '@/components/storefront/StripePaymentForm';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
    const router = useRouter();
    const { cartItems, cartTotal, totalAfterDiscount, checkout, clearCart } = useCart();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const result = await checkout({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            country: formData.country,
            notes: formData.notes,
        });

        if (result.success && result.clientSecret) {
            setClientSecret(result.clientSecret);
            setOrderId(result.orderId || null);
        } else {
            setError(result.message || 'Failed to initialize payment. Please try again.');
        }

        setIsSubmitting(false);
    };

    const handleDummySubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        const result = await checkout({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            country: formData.country,
            notes: formData.notes,
            dummyPayment: true,
        });

        if (result.success && result.dummyMode && result.orderId) {
            clearCart();
            router.push(`/order-success?order_id=${result.orderId}&redirect_status=succeeded`);
        } else {
            setError(result.message || 'Failed to process dummy payment.');
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0e121b]">

                <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">shopping_cart_off</span>
                    <h2 className="text-2xl font-bold mb-2">Your bag is empty</h2>
                    <p className="text-gray-500 mb-6">Add some premium leather to your collection to proceed.</p>
                    <Link href="/shop" className="bg-[#c27a2a] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#a35508] transition-all">
                        Return to Shop
                    </Link>
                </main>

            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0e121b] font-[family-name:var(--font-manrope)]">


            <main className="flex-grow w-full max-w-[1200px] mx-auto px-6 lg:px-12 py-12 md:py-20">
                <div className="flex flex-col lg:flex-row gap-12 items-start">

                    {/* Left Column */}
                    <div className="w-full lg:w-3/5 space-y-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#1c140d] dark:text-white uppercase">Checkout</h1>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">
                                {clientSecret ? 'Payment Details' : 'Billing & Shipping Details'}
                            </p>
                        </div>

                        {/* Show payment form if clientSecret is ready, otherwise show address form */}
                        {clientSecret && orderId ? (
                            <div className="space-y-6">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3">
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                        Shipping details saved. Enter your payment information below.
                                    </p>
                                </div>

                                <Elements
                                    stripe={getStripe()}
                                    options={{
                                        clientSecret,
                                        appearance: {
                                            theme: 'stripe',
                                            variables: {
                                                colorPrimary: '#c27a2a',
                                                borderRadius: '8px',
                                            },
                                        },
                                    }}
                                >
                                    <StripePaymentForm
                                        orderId={orderId}
                                        total={totalAfterDiscount}

                                        onError={(msg) => setError(msg)}
                                    />
                                </Elements>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-500 tracking-tighter">Full Name*</label>
                                        <input required name="name" value={formData.name} onChange={handleInputChange} type="text" placeholder="John Doe" className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#c27a2a] transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-500 tracking-tighter">Email Address*</label>
                                        <input required name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="john@example.com" className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#c27a2a] transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-500 tracking-tighter">Phone Number*</label>
                                    <input required name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="+92 300 1234567" className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#c27a2a] transition-colors" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-500 tracking-tighter">Shipping Address*</label>
                                    <input required name="address" value={formData.address} onChange={handleInputChange} type="text" placeholder="House #, Street Name" className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#c27a2a] transition-colors" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-500 tracking-tighter">City*</label>
                                        <input required name="city" value={formData.city} onChange={handleInputChange} type="text" placeholder="Lahore" className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#c27a2a] transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-500 tracking-tighter">Country*</label>
                                        <select required name="country" value={formData.country} onChange={handleInputChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#c27a2a] transition-colors dark:text-white">
                                            <option value="" disabled>Select your country</option>
                                            <option value="Pakistan">Pakistan</option>
                                            <option value="United States">United States</option>
                                            <option value="United Kingdom">United Kingdom</option>
                                            <option value="Canada">Canada</option>
                                            <option value="Australia">Australia</option>
                                            <option value="UAE">UAE</option>
                                            <option value="Saudi Arabia">Saudi Arabia</option>
                                            <option value="India">India</option>
                                            <option value="Germany">Germany</option>
                                            <option value="France">France</option>
                                            <option value="Turkey">Turkey</option>
                                            <option value="Malaysia">Malaysia</option>
                                            <option value="Singapore">Singapore</option>
                                            <option value="South Korea">South Korea</option>
                                            <option value="Japan">Japan</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <label className="text-xs font-black uppercase text-gray-500 tracking-tighter">Order Notes (Optional)</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Special measurements or delivery requests..." rows={3} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#c27a2a] transition-colors resize-none" />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">error</span>
                                        {error}
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-[#c27a2a] text-white py-5 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl shadow-[#c27a2a]/20 hover:bg-[#a35508] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                                Preparing Payment...
                                            </>
                                        ) : (
                                            <>
                                                Continue to Payment
                                                <span className="material-symbols-outlined">lock</span>
                                            </>
                                        )}
                                    </button>
                                    <p className="text-[10px] text-center text-gray-400 mt-4 uppercase font-bold tracking-tighter">
                                        You&apos;ll enter card details on the next step · Secured by Stripe
                                    </p>

                                    {process.env.NODE_ENV === 'development' && (
                                        <button
                                            type="button"
                                            onClick={handleDummySubmit}
                                            disabled={isSubmitting}
                                            className="w-full mt-4 bg-slate-800 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest shadow-md hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-sm">bug_report</span>
                                            Bypass Payment (Test Mode)
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="w-full lg:w-2/5 space-y-6 lg:sticky lg:top-32">
                        <div className="bg-white dark:bg-[#1a130e] border border-gray-100 dark:border-white/5 rounded-2xl p-8 shadow-sm">
                            <h3 className="text-lg font-black uppercase tracking-widest text-[#1c140d] dark:text-white mb-6 border-b border-gray-100 dark:border-white/5 pb-4">Order Summary</h3>

                            <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom_scroll">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-white/5">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-[#1c140d] dark:text-white truncate">{item.name}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">{item.variant}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</span>
                                                <span className="text-sm font-bold text-[#c27a2a]">${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-white/5">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span className="font-medium uppercase tracking-tighter">Subtotal</span>
                                    <span className="font-bold text-[#1c140d] dark:text-white">${cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span className="font-medium uppercase tracking-tighter">Shipping</span>
                                    <span className="text-[#137fec] font-bold uppercase tracking-tighter">Free</span>
                                </div>
                                <div className="flex justify-between text-xl font-black text-[#1c140d] dark:text-white pt-4">
                                    <span className="uppercase tracking-tighter">Total</span>
                                    <span>${totalAfterDiscount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#1a130e] p-4 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center gap-2">
                                <span className="material-symbols-outlined text-[#c27a2a]">verified_user</span>
                                <span className="text-[10px] font-black uppercase text-gray-400">Secure Payment</span>
                            </div>
                            <div className="bg-white dark:bg-[#1a130e] p-4 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center gap-2">
                                <span className="material-symbols-outlined text-[#c27a2a]">workspace_premium</span>
                                <span className="text-[10px] font-black uppercase text-gray-400">Quality Assured</span>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
                        </div>
                    </div>
                </div>
            </main>


        </div>
    );
}
