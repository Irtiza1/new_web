'use client';

import { useState, useEffect, useRef } from 'react';


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
            if (!result.success) throw new Error(result.message || 'Failed to send message');
            setFormStatus('success');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Track form submission event
            if (typeof window !== 'undefined') {
                const extWindow = window as unknown as {
                    trackEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
                };
                if (extWindow.trackEvent) {
                    extWindow.trackEvent('contact_submit', {
                        inquiryType: data.get('inquiry_type') as string
                    });
                }
            }
        } catch (err) {
            console.error('Failed to submit contact form:', err);
            alert('Failed to send message. Please try again.');
            setFormStatus('idle');
        }
    };

    return (
        <div className="relative flex min-h-screen size-full flex-col bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-[#1b0e10] dark:text-white group/design-root overflow-x-hidden font-[family-name:var(--font-manrope)]">


            <main className="flex flex-1 flex-col items-center">
                <div className="w-full max-w-[640px] px-4 py-10 md:px-8 md:py-14">
                    <div className="mx-auto mb-7 text-center">
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#cf1736]">Customer Support</p>
                        <h1 className="text-3xl font-medium tracking-tight leading-tight md:text-4xl">Get in Touch</h1>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#1b0e10]/80 dark:text-slate-400">
                            Send us your question, order concern, or custom request. We&apos;ll route it to the right team and reply as soon as possible.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#1b0e10] rounded-xl p-5 md:p-7 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
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
                                    <h3 className="text-xl font-medium text-[#1b0e10] dark:text-white">Message Sent!</h3>
                                    <p className="text-[#1b0e10]/80 dark:text-slate-400 max-w-sm mx-auto text-sm">
                                        Thanks for reaching out. We&apos;ve received your message and will get back to you within 24 hours.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setFormStatus('idle')}
                                    className="mt-1 px-6 py-2.5 bg-[#cf1736] hover:bg-[#a3122a] text-white rounded-lg font-bold text-sm transition-colors uppercase tracking-widest"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-xs font-semibold text-[#1b0e10] dark:text-slate-300 uppercase tracking-widest">Full Name</span>
                                        <input name="name" required className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all placeholder:text-slate-400 text-[#1b0e10] dark:text-white text-sm" placeholder="Jane Doe" type="text" />
                                    </label>
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-xs font-semibold text-[#1b0e10] dark:text-slate-300 uppercase tracking-widest">Email Address</span>
                                        <input name="email" required className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all placeholder:text-slate-400 text-[#1b0e10] dark:text-white text-sm" placeholder="jane@example.com" type="email" />
                                    </label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-xs font-semibold text-[#1b0e10] dark:text-slate-300 uppercase tracking-widest">Phone <span className="text-slate-400 font-normal">(Optional)</span></span>
                                        <input name="phone" className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all placeholder:text-slate-400 text-[#1b0e10] dark:text-white text-sm" placeholder="+1 (555) 000-0000" type="tel" />
                                    </label>
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-xs font-semibold text-[#1b0e10] dark:text-slate-300 uppercase tracking-widest">Inquiry Type</span>
                                        <div className="relative">
                                            <select name="inquiry_type" className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all text-[#1b0e10] dark:text-white appearance-none cursor-pointer text-sm">
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
                                    <span className="text-xs font-semibold text-[#1b0e10] dark:text-slate-300 uppercase tracking-widest">How can we help?</span>
                                    <textarea name="message" required className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#cf1736] focus:border-transparent transition-all placeholder:text-slate-400 text-[#1b0e10] dark:text-white resize-none text-sm" placeholder="Tell us more about your inquiry..." rows={3}></textarea>
                                </label>
                                <button
                                    className={`w-full bg-[#cf1736] hover:bg-[#a3122a] text-white font-bold py-2.5 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-[#cf1736]/20 flex items-center justify-center gap-2 group text-sm tracking-widest uppercase ${formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''}`}
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



            {/* Custom Facebook Messenger Support Widget */}
            <MessengerWidget />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Facebook Messenger Chat Widget
//
// Username source: site_settings DB (Admin › Settings › Facebook Page Username)
//
// UX: A beautiful, interactive live-chat composer styled like Messenger.
// When user types a message and clicks send, it redirects to m.me link
// in a new tab to begin the conversation, keeping them on the site.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Custom Facebook Messenger Chat Widget
//
// UX: A beautiful, interactive live-chat composer styled like Messenger.
// When user types a message and clicks send, it redirects to m.me link
// in a new tab to begin the conversation, keeping them on the site.
// ─────────────────────────────────────────────────────────────────────────────
function MessengerWidget() {
    const [pageId, setPageId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [userMessage, setUserMessage] = useState('');
    const [sent, setSent] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Fetch page id from settings DB
    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data?.facebook_page_id) {
                    setPageId(d.data.facebook_page_id.trim());
                } else {
                    setPageId('61590459932071');
                }
            })
            .catch(() => setPageId('61590459932071'));
    }, []);

    // Focus textarea when popup opens
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [open]);

    if (!pageId) return null;

    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    const handleSend = () => {
        // m.me works perfectly with page IDs!
        const url = `https://m.me/${pageId}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        setSent(true);
        // Reset state after 3 seconds
        setTimeout(() => {
            setSent(false);
            setUserMessage('');
        }, 3000);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 font-[family-name:var(--font-inter)]">

            {/* ── Messenger Popup Card ── */}
            {open && (
                <div className="w-full max-w-[320px] rounded-2xl overflow-hidden shadow-2xl shadow-black/25 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 animate-in slide-in-from-bottom-4 fade-in duration-200">

                    {/* Header: Messenger Blue/Purple Gradient */}
                    <div className="bg-gradient-to-r from-[#0695FF] via-[#7B3FFB] to-[#A334FA] px-4 py-4 flex items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                                <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-xs font-black text-white select-none">
                                    LL
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#7B3FFB] animate-pulse" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm leading-snug">Luxe Leather Support</p>
                                <p className="text-white/70 text-[10px] mt-0.5 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full" />
                                    Active on Messenger
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setOpen(false); setSent(false); setUserMessage(''); }}
                            aria-label="Close chat"
                            className="text-white/60 hover:text-white transition-colors shrink-0"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-4 py-4 bg-slate-50 dark:bg-slate-950 flex flex-col gap-3 min-h-[220px] justify-between">
                        <div className="flex flex-col gap-3">
                            {/* Agent greeting bubble */}
                            <div className="max-w-[230px] bg-slate-200/80 dark:bg-slate-800 rounded-b-2xl rounded-tr-2xl px-3.5 py-2.5 shadow-sm text-slate-800 dark:text-slate-100 self-start">
                                <p className="text-sm leading-relaxed">Hi there! Thanks for visiting Luxe Leather Gear 👋</p>
                                <p className="text-sm leading-relaxed mt-1">Type your message below to chat with us on Messenger.</p>
                                <p className="text-right text-[9px] text-slate-400 dark:text-slate-500 mt-1">{now}</p>
                            </div>

                            {/* Sent State User Bubble */}
                            {sent && (
                                <div className="max-w-[230px] bg-[#0084FF] text-white rounded-b-2xl rounded-tl-2xl px-3.5 py-2.5 shadow-sm self-end animate-in fade-in duration-300">
                                    <p className="text-sm leading-relaxed">{userMessage || 'Hi Luxe Leather Gear, I need help!'}</p>
                                    <p className="text-right text-[9px] text-white/70 mt-1">{now}</p>
                                </div>
                            )}
                        </div>

                        {/* Input Composer */}
                        {!sent ? (
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl px-3.5 py-2.5 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                                    <textarea
                                        ref={inputRef}
                                        value={userMessage}
                                        onChange={e => setUserMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message..."
                                        rows={1}
                                        className="flex-1 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 bg-transparent resize-none focus:outline-none leading-relaxed"
                                    />
                                    <button
                                        onClick={handleSend}
                                        aria-label="Send message on Messenger"
                                        className="w-8 h-8 rounded-full bg-[#0084FF] flex items-center justify-center hover:bg-[#0074E0] transition-colors shrink-0 text-white"
                                    >
                                        <svg className="w-4 h-4 transform rotate-45" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                            <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-center text-[9px] text-slate-400">
                                    Opens Messenger · <span className="font-semibold">{pageId}</span>
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-2 animate-pulse">
                                <p className="text-xs text-[#7B3FFB] font-bold">✓ Opening Messenger...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Floating Messenger Launcher Button ── */}
            <button
                onClick={() => setOpen(o => !o)}
                aria-label={open ? 'Close Messenger chat' : 'Chat with us on Messenger'}
                className="relative w-14 h-14 rounded-full bg-gradient-to-r from-[#0695FF] via-[#7B3FFB] to-[#A334FA] shadow-lg shadow-[#7B3FFB]/30 hover:scale-105 transition-all duration-200 flex items-center justify-center text-white"
            >
                {!open && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center pointer-events-none animate-bounce">
                        <span className="text-white text-[9px] font-black leading-none">1</span>
                    </span>
                )}
                {open ? (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                ) : (
                    // Messenger Speech Bubble with Lightning Bolt SVG
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.458 5.513 3.738 7.202.195.145.31.373.303.618l-.08 2.457c-.012.392.393.673.748.5l2.766-1.347c.18-.088.39-.089.572-.002A10.22 10.22 0 0012 20.516c5.523 0 10-4.145 10-9.258S17.523 2 12 2zm1.255 12.368l-2.452-2.622-4.787 2.622 5.265-5.592 2.452 2.622 4.787-2.622-5.265 5.592z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
