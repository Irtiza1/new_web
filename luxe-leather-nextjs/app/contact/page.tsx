'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '');
const whatsappMessage = encodeURIComponent('Hi Luxe Leather Co., I need help with an order or inquiry.');
const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}` : '';

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
                <div className="w-full max-w-[1040px] px-6 py-16 md:px-10 md:py-24">
                    <div className="mx-auto mb-10 max-w-3xl text-center">
                        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.28em] text-[#c27a2a]">Customer Support</p>
                        <h1 className="text-4xl font-black tracking-tight leading-tight md:text-5xl">Get in Touch</h1>
                        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500 dark:text-slate-400 md:text-lg">
                            Send us your question, order concern, or custom request. We&apos;ll route it to the right team and reply as soon as possible.
                        </p>
                        {whatsappUrl && (
                            <div className="mt-6 flex justify-center">
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-5 text-sm font-black uppercase tracking-[0.16em] text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                                >
                                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M21 11.5a8.4 8.4 0 0 1-12.5 7.3L3 20l1.4-5.2A8.5 8.5 0 1 1 21 11.5Z" />
                                        <path d="M8.8 8.7c.2-.4.4-.4.7-.4h.5c.2 0 .5 0 .7.5l.8 1.9c.1.3 0 .5-.1.7l-.5.6c.8 1.4 1.9 2.5 3.3 3.1l.7-.7c.2-.2.4-.3.7-.2l1.8.8c.4.2.5.4.5.7v.5c0 .3 0 .6-.4.8-.6.4-1.2.6-1.9.6-3.5 0-7.8-4.2-7.8-7.7 0-.7.2-1.3.5-1.8Z" />
                                    </svg>
                                    Chat on WhatsApp
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="mx-auto max-w-4xl">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                                {formStatus === 'success' ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center gap-6 animate-in fade-in duration-500 min-h-[400px]">
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                                            <svg className="size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M22 7 13.5 15.5a2 2 0 0 1-3 0L2 7" />
                                                <rect width="20" height="16" x="2" y="4" rx="2" />
                                                <path d="m16 19 2 2 4-4" />
                                            </svg>
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
                                                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                            <path d="m6 9 6 6 6-6" />
                                                        </svg>
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
                                                        <svg className="size-5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                            <path d="m22 2-7 20-4-9-9-4 20-7Z" />
                                                            <path d="M22 2 11 13" />
                                                        </svg>
                                                    </>
                                                )}
                                            </button>
                                            <p className="text-center text-xs text-slate-400 mt-4">
                                                By submitting this form, you agree to our <Link href="/shipping" className="underline hover:text-slate-600 dark:hover:text-slate-300">Terms & Policies</Link>.
                                            </p>
                                        </div>
                                    </form>
                                )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
