'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

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
    const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
    const [bankDetails, setBankDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data.bank_transfer_details) {
                    setBankDetails(data.data.bank_transfer_details);
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            }
        }
        fetchSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPaymentSlip(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!paymentSlip) {
            setError('Please upload your payment slip to complete the order.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await checkout({
            ...formData,
            paymentSlip
        });

        if (result.success && result.orderId) {
            clearCart();
            router.push(`/order-success?order_id=${result.orderId}&redirect_status=succeeded`);
        } else {
            setError(result.message || 'Failed to process checkout. Please try again.');
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#120d09] text-[#1b0e10] dark:text-white font-[family-name:var(--font-manrope)]">

                <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">shopping_cart_off</span>
                    <h2 className="text-2xl font-medium mb-2">Your bag is empty</h2>
                    <p className="text-[#1b0e10]/80 dark:text-gray-400 mb-6">Add some premium leather to your collection to proceed.</p>
                    <Link href="/shop" className="bg-[#cf1736] text-white px-8 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-[#a3122a] transition-all">
                        Return to Shop
                    </Link>
                </main>

            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#120d09] text-[#1b0e10] dark:text-white font-[family-name:var(--font-manrope)]">


            <main className="flex-grow w-full max-w-[1200px] mx-auto px-6 lg:px-12 py-12 md:py-20">
                <div className="flex flex-col lg:flex-row gap-12 items-start">

                    {/* Left Column */}
                    <div className="w-full lg:w-3/5 space-y-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-[#1b0e10] dark:text-white">Checkout</h1>
                            <p className="text-sm text-[#1b0e10]/60 dark:text-gray-400 font-bold uppercase tracking-widest mt-2">
                                Billing & Shipping Details
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-[#1b0e10]/80 dark:text-gray-400 tracking-tighter">Full Name*</label>
                                        <input required name="name" value={formData.name} onChange={handleInputChange} type="text" placeholder="John Doe" className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#cf1736] transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-[#1b0e10]/80 dark:text-gray-400 tracking-tighter">Email Address*</label>
                                        <input required name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="john@example.com" className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#cf1736] transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-[#1b0e10]/80 dark:text-gray-400 tracking-tighter">Phone Number*</label>
                                    <input required name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="+92 300 1234567" className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#cf1736] transition-colors" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-[#1b0e10]/80 dark:text-gray-400 tracking-tighter">Shipping Address*</label>
                                    <input required name="address" value={formData.address} onChange={handleInputChange} type="text" placeholder="House #, Street Name" className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#cf1736] transition-colors" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-[#1b0e10]/80 dark:text-gray-400 tracking-tighter">City*</label>
                                        <input required name="city" value={formData.city} onChange={handleInputChange} type="text" placeholder="Lahore" className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#cf1736] transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-[#1b0e10]/80 dark:text-gray-400 tracking-tighter">Country*</label>
                                        <select required name="country" value={formData.country} onChange={handleInputChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#cf1736] transition-colors dark:text-white">
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
                                    <label className="text-xs font-bold uppercase text-[#1b0e10]/80 dark:text-gray-400 tracking-tighter">Order Notes (Optional)</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Special measurements or delivery requests..." rows={3} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-lg outline-none focus:border-[#cf1736] transition-colors resize-none" />
                                </div>

                                {/* Bank Details & Slip Upload */}
                                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-white/10">
                                    <h2 className="text-xl font-medium text-[#1b0e10] dark:text-white">Payment Details</h2>
                                    
                                    <div className="bg-[#f6f7f8] dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10">
                                        <p className="text-sm text-[#1b0e10] dark:text-gray-300 font-medium mb-4">
                                            Please transfer <span className="font-bold text-[#cf1736]">${totalAfterDiscount.toFixed(2)}</span> to the following bank account.
                                        </p>
                                        <pre className="text-sm font-mono text-[#1b0e10]/80 dark:text-gray-400 whitespace-pre-wrap leading-relaxed bg-white dark:bg-black/20 p-4 rounded-lg border border-gray-100 dark:border-white/5">
                                            {bankDetails || 'Loading bank details...'}
                                        </pre>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-[#1b0e10]/80 dark:text-gray-400 tracking-tighter">Upload Payment Slip*</label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex-1 cursor-pointer bg-white dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 hover:border-[#cf1736] dark:hover:border-[#cf1736] rounded-lg p-6 flex flex-col items-center justify-center transition-all group">
                                                <input required type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                                <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-[#cf1736] transition-colors mb-2">cloud_upload</span>
                                                <span className="text-sm font-medium text-[#1b0e10] dark:text-white">
                                                    {paymentSlip ? paymentSlip.name : 'Click to upload your receipt'}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP (Max 5MB)</span>
                                            </label>
                                        </div>
                                    </div>
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
                                        disabled={isSubmitting || !paymentSlip}
                                        className="w-full bg-[#cf1736] text-white py-5 rounded-lg font-bold text-sm uppercase tracking-widest shadow-xl shadow-[#cf1736]/20 hover:bg-[#a3122a] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                                Processing Order...
                                            </>
                                        ) : (
                                            <>
                                                Submit Order & Upload Slip
                                                <span className="material-symbols-outlined">receipt_long</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="w-full lg:w-2/5 space-y-6 lg:sticky lg:top-32">
                        <div className="bg-white dark:bg-[#1b0e10] border border-gray-100 dark:border-white/5 rounded-2xl p-8 shadow-sm">
                            <h3 className="text-lg font-medium uppercase tracking-widest text-[#1b0e10] dark:text-white mb-6 border-b border-gray-100 dark:border-white/5 pb-4">Order Summary</h3>

                            <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom_scroll">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-white/5">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-[#1b0e10] dark:text-white truncate">{item.name}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">{item.variant}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</span>
                                                <span className="text-sm font-bold text-[#cf1736]">${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-white/5">
                                <div className="flex justify-between text-sm text-[#1b0e10]/80 dark:text-gray-500">
                                    <span className="font-medium uppercase tracking-tighter">Subtotal</span>
                                    <span className="font-medium text-[#1b0e10] dark:text-white">${cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-[#1b0e10]/80 dark:text-gray-500">
                                    <span className="font-medium uppercase tracking-tighter">Shipping</span>
                                    <span className="text-[#137fec] font-medium uppercase tracking-tighter">Free</span>
                                </div>
                                <div className="flex justify-between text-xl font-medium text-[#1b0e10] dark:text-white pt-4">
                                    <span className="uppercase tracking-tighter">Total</span>
                                    <span>${totalAfterDiscount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#1b0e10] p-4 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center gap-2">
                                <span className="material-symbols-outlined text-[#cf1736]">verified_user</span>
                                <span className="text-[10px] font-bold uppercase text-gray-400">Secure Payment</span>
                            </div>
                            <div className="bg-white dark:bg-[#1b0e10] p-4 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center gap-2">
                                <span className="material-symbols-outlined text-[#cf1736]">workspace_premium</span>
                                <span className="text-[10px] font-bold uppercase text-gray-400">Quality Assured</span>
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
