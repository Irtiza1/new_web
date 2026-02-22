'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';

export default function ContactPage() {
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormStatus('submitting');
        try {
            const form = e.currentTarget;
            const data = new FormData(form);
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.get('name') as string,
                    email: data.get('email') as string,
                    phone: (data.get('phone') as string) || undefined,
                    inquiry_type: (data.get('inquiry_type') as string) || 'Other',
                    message: data.get('message') as string,
                }),
            });

            const result = await res.json();
            if (!result.success) {
                throw new Error(result.message || 'Failed to send message');
            }
            setFormStatus('success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Failed to submit contact form:', err);
            alert('Failed to send message. Please try again.');
            setFormStatus('idle');
        }
    };

    return (
        <div className="relative flex min-h-screen size-full flex-col bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-slate-900 dark:text-white group/design-root overflow-x-hidden font-[family-name:var(--font-manrope)]">
            <Header />

            <main className="flex flex-1 flex-col items-center">
                <div className="max-w-[1280px] w-full px-6 md:px-10 py-16 md:py-24">
                    {/* Heading */}
                    <div className="mb-16">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4 text-center md:text-left">Get in Touch</h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl text-center md:text-left">Have a question, or need assistance with an order? We&apos;re here to help. Reach out and our team will get back to you promptly.</p>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                        {/* Left: Contact Info */}
                        <div className="lg:col-span-5 flex flex-col">
                            <div className="flex flex-col gap-8">
                                {/* Location */}
                                <div className="flex items-start gap-4 group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#d41132]/10 flex items-center justify-center text-[#d41132] group-hover:bg-[#d41132] group-hover:text-white transition-colors duration-300">
                                        <span className="material-symbols-outlined">location_on</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Visit Our Workshop</h3>
                                        <p className="text-lg font-medium group-hover:text-[#d41132] transition-colors">123 Artisan Lane, Brooklyn, NY</p>
                                    </div>
                                </div>
                                {/* WhatsApp */}
                                <div className="flex items-start gap-4 group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#d41132]/10 flex items-center justify-center text-[#d41132] group-hover:bg-[#d41132] group-hover:text-white transition-colors duration-300">
                                        <span className="material-symbols-outlined">chat</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">WhatsApp Support</h3>
                                        <p className="text-lg font-medium group-hover:text-[#d41132] transition-colors">+1 (555) 123-4567</p>
                                    </div>
                                </div>
                                {/* Email */}
                                <div className="flex items-start gap-4 group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#d41132]/10 flex items-center justify-center text-[#d41132] group-hover:bg-[#d41132] group-hover:text-white transition-colors duration-300">
                                        <span className="material-symbols-outlined">mail</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Email Us</h3>
                                        <p className="text-lg font-medium group-hover:text-[#d41132] transition-colors">support@luxeleather.co</p>
                                    </div>
                                </div>
                                {/* Hours */}
                                <div className="flex items-start gap-4 group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#d41132]/10 flex items-center justify-center text-[#d41132] group-hover:bg-[#d41132] group-hover:text-white transition-colors duration-300">
                                        <span className="material-symbols-outlined">schedule</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Working Hours</h3>
                                        <p className="text-lg font-medium">Mon-Fri, 9am - 6pm EST</p>
                                    </div>
                                </div>
                            </div>
                            {/* Guarantee Badge */}
                            <div className="mt-12 inline-flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 px-5 rounded-full shadow-sm w-fit">
                                <span className="material-symbols-outlined text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Guaranteed response within 24 hours</span>
                            </div>
                        </div>

                        {/* Right: Contact Form */}
                        <div className="lg:col-span-7">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 h-full">
                                {formStatus === 'success' ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center gap-6 animate-in fade-in duration-500 min-h-[400px]">
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                                            <span className="material-symbols-outlined text-4xl">mark_email_read</span>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Message Sent!</h3>
                                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                                Thanks for reaching out. We&apos;ve received your message and will get back to you within 24 hours.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setFormStatus('idle')}
                                            className="mt-4 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold hover:bg-black dark:hover:bg-gray-200 transition-colors"
                                        >
                                            Send Another Message
                                        </button>
                                    </div>
                                ) : (
                                    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <label className="flex flex-col gap-2">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</span>
                                                <input name="name" required className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d41132] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900 dark:text-white" placeholder="Jane Doe" type="text" />
                                            </label>
                                            <label className="flex flex-col gap-2">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</span>
                                                <input name="email" required className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d41132] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900 dark:text-white" placeholder="jane@example.com" type="email" />
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <label className="flex flex-col gap-2">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></span>
                                                <input name="phone" className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d41132] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900 dark:text-white" placeholder="+1 (555) 000-0000" type="tel" />
                                            </label>
                                            <label className="flex flex-col gap-2">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Inquiry Type</span>
                                                <div className="relative">
                                                    <select name="inquiry_type" className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d41132] focus:border-transparent transition-all text-slate-900 dark:text-white appearance-none cursor-pointer">
                                                        <option>Order Support</option>
                                                        <option>Wholesale Inquiries</option>
                                                        <option>Custom Requests</option>
                                                        <option>Other</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                                                        <span className="material-symbols-outlined">expand_more</span>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                        <label className="flex flex-col gap-2">
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">How can we help?</span>
                                            <textarea name="message" required className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d41132] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900 dark:text-white resize-none" placeholder="Tell us more about your inquiry..." rows={4}></textarea>
                                        </label>
                                        <div className="pt-2">
                                            <button
                                                className={`w-full bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-[#d41132]/20 flex items-center justify-center gap-2 group ${formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                                                        <span>Send Message</span>
                                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
                                                    </>
                                                )}
                                            </button>
                                            <p className="text-center text-xs text-slate-400 mt-4">
                                                By submitting this form, you agree to our <a className="underline hover:text-slate-600 dark:hover:text-slate-300" href="#">Privacy Policy</a>.
                                            </p>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
