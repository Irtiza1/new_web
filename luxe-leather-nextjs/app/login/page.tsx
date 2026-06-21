'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { authClient, setAuthCookie, signInWithGoogle, syncAuthCookieFromSession } from '@/lib/auth/client';
import { STATIC_ASSET_DEFAULTS } from '@/lib/staticAssets';

function LoginContent() {
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/account';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [heroImage, setHeroImage] = useState(STATIC_ASSET_DEFAULTS.login_hero_image);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'google'>('idle');

    useEffect(() => {
        syncAuthCookieFromSession();
        fetch('/api/settings')
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data?.login_hero_image) {
                    setHeroImage(data.data.login_hero_image);
                }
            })
            .catch(() => {});
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setStatus('submitting');

        const { data, error: signInError } = await authClient.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError || !data.session) {
            setError(signInError?.message || 'Unable to sign in.');
            setStatus('idle');
            return;
        }

        setAuthCookie(data.session.access_token);
        
        // Use a hard redirect so the browser tab shows a loading spinner,
        // preventing the UI from looking 'stuck' while the dev server compiles the next page.
        window.location.href = redirectTo;
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setStatus('google');

        const { error: googleError } = await signInWithGoogle(redirectTo);
        if (googleError) {
            setError(googleError.message);
            setStatus('idle');
        }
    };

    return (
        <main className="min-h-screen bg-[#f8f5ef] text-[#19130d] flex">
            <section className="hidden lg:flex flex-1 relative overflow-hidden bg-[#211812]">
                <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url('${heroImage}')` }} />
                <div className="absolute inset-0 bg-gradient-to-r from-[#211812]/90 via-[#211812]/55 to-transparent" />
                <div className="relative z-10 p-12 flex flex-col justify-between max-w-xl">
                    <Link href="/" className="inline-flex items-center gap-3 text-white font-black tracking-tight">
                        <span className="material-symbols-outlined text-[#c27a2a]">checkroom</span>
                        Luxe Leather Gear
                    </Link>
                    <div>
                        <p className="text-[#c27a2a] text-xs font-black uppercase tracking-[0.24em] mb-4">Secure account access</p>
                        <h1 className="text-5xl font-black text-white leading-tight font-[family-name:var(--font-playfair)]">
                            Return to your workshop ledger.
                        </h1>
                        <p className="text-white/70 mt-5 leading-relaxed">
                            Track orders, manage bespoke requests, and access admin tools through verified role-based access.
                        </p>
                    </div>
                </div>
            </section>

            <section className="w-full lg:w-[520px] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white border border-[#eadfce] rounded-2xl shadow-2xl shadow-[#211812]/10 p-8">
                    <div className="mb-8">
                        <Link href="/" className="lg:hidden inline-flex items-center gap-2 text-sm font-black mb-8">
                            <span className="material-symbols-outlined text-[#c27a2a]">checkroom</span>
                            Luxe Leather Gear
                        </Link>
                        <h2 className="text-3xl font-black tracking-tight">Sign in</h2>
                        <p className="text-sm text-[#7c6b5b] mt-2">Use your verified email address to continue.</p>
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
                        <span>Email login</span>
                        <span className="h-px flex-1 bg-[#eadfce]" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <label className="block">
                            <span className="text-xs font-black uppercase tracking-widest text-[#7c6b5b]">Email</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-2 w-full rounded-lg border border-[#eadfce] bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#c27a2a] focus:ring-2 focus:ring-[#c27a2a]/20"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-black uppercase tracking-widest text-[#7c6b5b]">Password</span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-2 w-full rounded-lg border border-[#eadfce] bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#c27a2a] focus:ring-2 focus:ring-[#c27a2a]/20"
                            />
                        </label>

                        <div className="flex items-center justify-between text-sm">
                            <Link href="/forgot-password" className="font-bold text-[#a35508] hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full h-12 rounded-lg bg-[#1f1711] text-white font-black uppercase tracking-widest hover:bg-[#c27a2a] transition-colors disabled:opacity-60"
                        >
                            {status === 'submitting' ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-[#7c6b5b]">
                        New to Luxe Leather Gear?{' '}
                        <Link href="/signup" className="font-black text-[#a35508] hover:underline">
                            Create account
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}
