'use client';

import { useState, useEffect } from 'react';
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
                <div className="w-full max-w-[640px] px-4 py-10 md:px-8 md:py-14">
                    <div className="mx-auto mb-7 text-center">
                        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-[#c27a2a]">Customer Support</p>
                        <h1 className="text-3xl font-black tracking-tight leading-tight md:text-4xl">Get in Touch</h1>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Send us your question, order concern, or custom request. We&apos;ll route it to the right team and reply as soon as possible.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 md:p-7 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                        {formStatus === 'success' ? (
                            <div className="flex flex-col items-center justify-center text-center gap-5 animate-in fade-in duration-500 min-h-[280px]">
                                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                    <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M22 7 13.5 15.5a2 2 0 0 1-3 0L2 7" />
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m16 19 2 2 4-4" />
                                    </svg>
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message Sent!</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm">
                                        Thanks for reaching out. We&apos;ve received your message and will get back to you within 24 hours.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setFormStatus('idle')}
                                    className="mt-1 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm hover:bg-black dark:hover:bg-gray-200 transition-colors"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</span>
                                        <input name="name" required className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d41132] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900 dark:text-white text-sm" placeholder="Jane Doe" type="text" />
                                    </label>
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</span>
                                        <input name="email" required className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d41132] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900 dark:text-white text-sm" placeholder="jane@example.com" type="email" />
                                    </label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone <span className="text-slate-400 font-normal">(Optional)</span></span>
                                        <input name="phone" className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d41132] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900 dark:text-white text-sm" placeholder="+1 (555) 000-0000" type="tel" />
                                    </label>
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Inquiry Type</span>
                                        <div className="relative">
                                            <select name="inquiry_type" className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d41132] focus:border-transparent transition-all text-slate-900 dark:text-white appearance-none cursor-pointer text-sm">
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
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">How can we help?</span>
                                    <textarea name="message" required className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d41132] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900 dark:text-white resize-none text-sm" placeholder="Tell us more about your inquiry..." rows={3}></textarea>
                                </label>
                                <button
                                    className={`w-full bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold py-2.5 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-[#d41132]/20 flex items-center justify-center gap-2 group text-sm ${formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                                            <svg className="size-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="m22 2-7 20-4-9-9-4 20-7Z" />
                                                <path d="M22 2 11 13" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            {/* Floating WhatsApp Chat Widget */}
            <WhatsAppWidget />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Chat Widget — popup chat card like the reference image
// ─────────────────────────────────────────────────────────────────────────────
function WhatsAppWidget() {
    const [waUrl, setWaUrl] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Primary: env var (set in .env.local or Vercel env)
        const envNum = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
        if (envNum) {
            const msg = encodeURIComponent('Hi Luxe Leather Co., I need help with an order or inquiry.');
            setWaUrl(`https://wa.me/${envNum}?text=${msg}`);
            return;
        }
        // Fallback: whatsapp_number from Admin › Settings
        fetch('/api/settings')
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    const num = (d.data?.whatsapp_number || '').replace(/\D/g, '');
                    if (num) {
                        const msg = encodeURIComponent('Hi Luxe Leather Co., I need help with an order or inquiry.');
                        setWaUrl(`https://wa.me/${num}?text=${msg}`);
                    }
                }
            })
            .catch(() => null);
    }, []);

    if (!waUrl) return null;

    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

            {/* ── Chat popup card ── */}
            {open && (
                <div className="w-[300px] rounded-2xl overflow-hidden shadow-2xl shadow-black/25 animate-in slide-in-from-bottom-4 fade-in duration-200">

                    {/* Header — dark green WhatsApp brand */}
                    <div className="bg-[#075E54] px-4 py-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                                <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-xs font-black text-white select-none">
                                    LL
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] rounded-full border-2 border-[#075E54]" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm leading-snug">Luxe Leather Support</p>
                                <p className="text-white/65 text-[11px] mt-0.5">Typically replies within a day</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            aria-label="Close chat"
                            className="text-white/50 hover:text-white transition-colors shrink-0"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Chat body — WhatsApp beige bg */}
                    <div className="px-4 py-5 bg-[#ECE5DD]">
                        <div className="max-w-[210px] bg-white rounded-b-2xl rounded-tr-2xl px-3.5 py-2.5 shadow-sm">
                            <p className="text-[#303030] text-sm leading-relaxed">Hi there 👋</p>
                            <p className="text-[#303030] text-sm leading-relaxed">How can I help you?</p>
                            <p className="text-right text-[10px] text-[#aaa] mt-1.5">{now}</p>
                        </div>
                    </div>

                    {/* CTA button */}
                    <div className="px-4 pb-4 bg-[#ECE5DD]">
                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#1db954] text-white font-bold text-sm rounded-full py-3 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Chat on WhatsApp
                        </a>
                    </div>
                </div>
            )}

            {/* ── Floating trigger button ── */}
            <button
                onClick={() => setOpen(o => !o)}
                aria-label={open ? 'Close WhatsApp chat' : 'Chat with us on WhatsApp'}
                className="relative w-14 h-14 rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/40 hover:scale-110 transition-all duration-200 flex items-center justify-center"
            >
                {/* Unread notification badge */}
                {!open && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center pointer-events-none">
                        <span className="text-white text-[8px] font-black leading-none">1</span>
                    </span>
                )}
                {open ? (
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
