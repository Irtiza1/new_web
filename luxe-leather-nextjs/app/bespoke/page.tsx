'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import { createCustomRequest } from '@/lib/api/custom-requests';

export default function BespokePage() {
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormStatus('submitting');
        try {
            const form = e.currentTarget;
            const data = new FormData(form);
            await createCustomRequest({
                name: data.get('name') as string,
                email: data.get('email') as string,
                phone: (data.get('phone') as string) || undefined,
                itemType: data.get('item_type') as string,
                description: data.get('description') as string,
                budget: (data.get('budget_min') as string) || undefined,
                deadline: (data.get('deadline') as string) || undefined,
            });
            setFormStatus('success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Failed to submit request:', err);
            alert('Failed to submit request. Please try again.');
            setFormStatus('idle');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-slate-900 antialiased overflow-x-hidden font-[family-name:var(--font-manrope)]">
            <Header />

            {/* Hero Section */}
            <div className="w-full bg-[#1A1A1A] text-white py-20 px-4 md:px-10">
                <div className="max-w-[960px] mx-auto text-center flex flex-col gap-4">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">Custom Orders</h1>
                    <p className="text-lg md:text-xl text-slate-300 font-light tracking-wide">Bring your vision to life</p>
                </div>
            </div>

            <main className="flex flex-col items-center w-full grow">
                <div className="w-full max-w-[1024px] px-4 md:px-8 py-12 flex flex-col gap-16">
                    {/* Process Flow */}
                    <section className="flex flex-col gap-8">
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">The Process</h2>
                            <p className="text-slate-500 text-base">From imagination to reality in four simple steps.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative">
                            <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-[2px] bg-slate-200 -z-10"></div>
                            {[
                                { icon: 'lightbulb', step: '1. Idea', desc: 'Share your vision regarding style and materials.', highlight: true },
                                { icon: 'receipt_long', step: '2. Quote', desc: 'Receive a comprehensive custom quote.', highlight: false },
                                { icon: 'handyman', step: '3. Craft', desc: 'Expert artisans bring your design to life.', highlight: false },
                                { icon: 'local_shipping', step: '4. Delivery', desc: 'Your bespoke piece, delivered to your door.', highlight: false },
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center md:items-start gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`flex items-center justify-center w-14 h-14 rounded-full border ${item.highlight ? 'bg-blue-50 text-[#d41132] border-blue-100' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-lg font-bold">{item.step}</h3>
                                        <p className="text-slate-500 text-sm mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Request Form */}
                    <section className="w-full">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 md:p-10 border-b border-slate-100">
                                <h2 className="text-2xl font-bold leading-tight">Tell us about your dream piece</h2>
                                <p className="text-slate-500 mt-2">Please fill out the details below so we can start the conversation.</p>
                            </div>

                            {formStatus === 'success' ? (
                                <div className="p-10 flex flex-col items-center text-center gap-6 animate-in fade-in duration-500">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-slate-900">Request Received!</h3>
                                        <p className="text-slate-500 max-w-md mx-auto">
                                            Thank you for sharing your vision. Our artisans will review your request and send a comprehensive quote to your email within 24-48 hours.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setFormStatus('idle')}
                                        className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors"
                                    >
                                        Submit Another Request
                                    </button>
                                </div>
                            ) : (
                                <form className="p-6 md:p-10 flex flex-col gap-8" onSubmit={handleSubmit}>
                                    <div>
                                        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-4">Contact Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <label className="flex flex-col gap-2">
                                                <span className="text-sm font-semibold text-slate-700">Full Name</span>
                                                <input name="name" required className="w-full h-12 rounded-lg border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#d41132] focus:ring-[#d41132]/20 px-4" placeholder="Jane Doe" type="text" />
                                            </label>
                                            <label className="flex flex-col gap-2">
                                                <span className="text-sm font-semibold text-slate-700">Email Address</span>
                                                <input name="email" required className="w-full h-12 rounded-lg border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#d41132] focus:ring-[#d41132]/20 px-4" placeholder="jane@example.com" type="email" />
                                            </label>
                                            <label className="flex flex-col gap-2">
                                                <span className="text-sm font-semibold text-slate-700">Phone Number</span>
                                                <input name="phone" className="w-full h-12 rounded-lg border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#d41132] focus:ring-[#d41132]/20 px-4" placeholder="+1 (555) 000-0000" type="tel" />
                                            </label>
                                        </div>
                                    </div>
                                    <hr className="border-slate-100" />
                                    <div>
                                        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-4">Project Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <label className="flex flex-col gap-2">
                                                <span className="text-sm font-semibold text-slate-700">Item Type</span>
                                                <select name="item_type" className="w-full h-12 rounded-lg border-slate-200 bg-slate-50 text-slate-900 focus:border-[#d41132] focus:ring-[#d41132]/20 px-4">
                                                    <option disabled value="">Select an item type...</option>
                                                    <option value="bag">Leather Bag / Tote</option>
                                                    <option value="wallet">Wallet / Cardholder</option>
                                                    <option value="belt">Belt</option>
                                                    <option value="jacket">Jacket</option>
                                                    <option value="accessories">Small Accessories</option>
                                                    <option value="furniture">Furniture Upholstery</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <label className="flex flex-col gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Est. Budget (USD)</span>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                                        <input name="budget_min" className="w-full h-12 pl-8 rounded-lg border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#d41132] focus:ring-[#d41132]/20 px-4" placeholder="500" type="number" />
                                                    </div>
                                                </label>
                                                <label className="flex flex-col gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Desired Deadline</span>
                                                    <input name="deadline" className="w-full h-12 rounded-lg border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#d41132] focus:ring-[#d41132]/20 px-4" type="date" />
                                                </label>
                                            </div>
                                        </div>
                                        <label className="flex flex-col gap-2 mb-6">
                                            <span className="text-sm font-semibold text-slate-700">Description</span>
                                            <textarea name="description" required className="w-full rounded-lg border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#d41132] focus:ring-[#d41132]/20 p-4 resize-none" placeholder="Describe your vision (leather type, color preference, stitching details, dimensions, hardware finish...)" rows={4}></textarea>
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm font-semibold text-slate-700">Inspiration / Sketches</span>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                            />
                                            <div
                                                onClick={handleFileClick}
                                                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${fileName ? 'border-[#d41132] bg-[#d41132]/5' : 'border-slate-300 bg-slate-50'} rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group`}
                                            >
                                                {fileName ? (
                                                    <>
                                                        <span className="material-symbols-outlined text-[#d41132] mb-2">check_circle</span>
                                                        <p className="text-sm font-medium text-slate-900">{fileName}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Click to change file</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-[#d41132] mb-2 transition-colors">cloud_upload</span>
                                                        <p className="mb-1 text-sm text-slate-500"><span className="font-semibold text-[#d41132]">Click to upload</span> or drag and drop</p>
                                                        <p className="text-xs text-slate-400">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2">
                                        <p className="text-xs text-slate-400 text-center sm:text-left flex-1">
                                            By submitting this form, you agree to our privacy policy. Custom orders typically require 4-6 weeks for completion.
                                        </p>
                                        <button
                                            className={`w-full sm:w-auto px-8 h-12 bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 ${formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            type="submit"
                                            disabled={formStatus === 'submitting'}
                                        >
                                            {formStatus === 'submitting' ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    <span>Sending...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Request Quote</span>
                                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </section>

                    {/* Trust Signals */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-t border-slate-200/60">
                        {[
                            { icon: 'verified', title: 'Lifetime Warranty', desc: 'We stand by the quality of our craftsmanship forever.' },
                            { icon: 'fingerprint', title: 'Handcrafted Unique', desc: 'Every piece is handmade and completely one-of-a-kind.' },
                            { icon: 'public', title: 'Ethically Sourced', desc: 'Premium vegetable-tanned leathers from sustainable tanneries.' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="p-2 rounded-full bg-slate-100 text-slate-700 shrink-0">
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold">{item.title}</h4>
                                    <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
