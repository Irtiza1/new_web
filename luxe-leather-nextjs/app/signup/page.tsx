'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authClient, signInWithGoogle } from '@/lib/auth/client';
import { STATIC_ASSET_DEFAULTS } from '@/lib/staticAssets';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [heroImage, setHeroImage] = useState(STATIC_ASSET_DEFAULTS.signup_hero_image);
    const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'google'>('idle');
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/settings')
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data?.signup_hero_image) {
                    setHeroImage(data.data.signup_hero_image);
                }
            })
            .catch(() => {});
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setStatus('submitting');

        const origin = window.location.origin;
        const { error: signUpError } = await authClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/verify-email`,
                data: {
                    name,
                    role: 'customer',
                },
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setStatus('idle');
            return;
        }

        setStatus('sent');
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setStatus('google');

        const { error: googleError } = await signInWithGoogle('/account');
        if (googleError) {
            setError(googleError.message);
            setStatus('idle');
        }
    };

    return (
        <main className="min-h-screen bg-[#f8f5ef] text-[#19130d] flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] bg-white border border-[#eadfce] rounded-2xl overflow-hidden shadow-2xl shadow-[#211812]/10">
                <section className="bg-[#211812] p-8 md:p-10 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url('${heroImage}')` }} />
                    <div className="relative z-10 h-full flex flex-col justify-between min-h-[360px]">
                        <Link href="/" className="inline-flex items-center gap-3 font-black">
                            <span className="material-symbols-outlined text-[#c27a2a]">checkroom</span>
                            Luxe Leather Gear
                        </Link>
                        <div>
                            <p className="text-[#c27a2a] text-xs font-black uppercase tracking-[0.24em] mb-4">Verified commerce account</p>
                            <h1 className="text-4xl md:text-5xl font-black leading-tight font-[family-name:var(--font-playfair)]">
                                Create an account before the next commission.
                            </h1>
                            <p className="text-white/70 mt-5">
                                Email verification protects customer orders and keeps admin access separate from shopper accounts.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="p-8 md:p-10">
                    {status === 'sent' ? (
                        <div className="min-h-[480px] flex flex-col items-center justify-center text-center">
                            <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                                <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                            </div>
                            <h2 className="text-3xl font-black">Check your email</h2>
                            <p className="mt-3 text-[#7c6b5b] max-w-sm">
                                We sent a verification link to {email}. Open it to activate your account.
                            </p>
                            <Link href="/login" className="mt-8 inline-flex h-11 items-center rounded-lg bg-[#1f1711] px-6 text-sm font-black uppercase tracking-widest text-white">
                                Go to login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h2 className="text-3xl font-black tracking-tight">Create account</h2>
                                <p className="text-sm text-[#7c6b5b] mt-2">A verification link will be sent to your email address.</p>
                            </div>

                            {error && (
                                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={status !== 'idle'}
                                className="mb-5 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#eadfce] bg-white text-sm font-black uppercase tracking-widest text-[#19130d] transition-colors hover:bg-[#fbfaf7] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="flex size-6 items-center justify-center rounded-full border border-[#d8c8b6] font-black normal-case">G</span>
                                {status === 'google' ? 'Opening Google...' : 'Continue with Google'}
                            </button>

                            <div className="mb-5 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-[#b6a796]">
                                <span className="h-px flex-1 bg-[#eadfce]" />
                                <span>Email signup</span>
                                <span className="h-px flex-1 bg-[#eadfce]" />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-widest text-[#7c6b5b]">Full name</span>
                                    <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-lg border border-[#eadfce] bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#c27a2a] focus:ring-2 focus:ring-[#c27a2a]/20" />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-widest text-[#7c6b5b]">Email</span>
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-[#eadfce] bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#c27a2a] focus:ring-2 focus:ring-[#c27a2a]/20" />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-widest text-[#7c6b5b]">Password</span>
                                    <input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-[#eadfce] bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#c27a2a] focus:ring-2 focus:ring-[#c27a2a]/20" />
                                </label>
                                <button type="submit" disabled={status === 'submitting'} className="w-full h-12 rounded-lg bg-[#1f1711] text-white font-black uppercase tracking-widest hover:bg-[#c27a2a] transition-colors disabled:opacity-60">
                                    {status === 'submitting' ? 'Creating...' : 'Create account'}
                                </button>
                            </form>
                            <p className="mt-7 text-center text-sm text-[#7c6b5b]">
                                Already have an account? <Link href="/login" className="font-black text-[#a35508] hover:underline">Sign in</Link>
                            </p>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}
