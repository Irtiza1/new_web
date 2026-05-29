'use client';

import { useState, useEffect, useRef } from 'react';
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
function MessengerWidget() {
    const [pageId, setPageId] = useState<string | null>(null);

    // Fetch page id from settings DB
    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data?.facebook_page_id) {
                    setPageId(d.data.facebook_page_id.trim());
                } else {
                    // Fallback to the provided ID
                    setPageId('61590459932071');
                }
            })
            .catch(() => setPageId('61590459932071'));
    }, []);

    useEffect(() => {
        if (!pageId) return;

        // Set up the chatbox attributes
        const chatbox = document.getElementById('fb-customer-chat');
        if (chatbox) {
            chatbox.setAttribute("page_id", pageId);
            chatbox.setAttribute("attribution", "biz_inbox");
        }

        // Initialize SDK
        (window as any).fbAsyncInit = function() {
            if ((window as any).FB) {
                (window as any).FB.init({
                    xfbml: true,
                    version: 'v18.0'
                });
            }
        };

        // Load SDK script dynamically
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s) as HTMLScriptElement; 
            js.id = id;
            js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
            if (fjs && fjs.parentNode) {
                fjs.parentNode.insertBefore(js, fjs);
            } else {
                d.head.appendChild(js);
            }
        }(document, 'script', 'facebook-jssdk'));
    }, [pageId]);

    if (!pageId) return null;

    return (
        <>
            <div id="fb-root"></div>
            <div id="fb-customer-chat" className="fb-customerchat"></div>
        </>
    );
}
