'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { authClient, setAuthCookie, syncAuthCookieFromSession } from '@/lib/auth/client';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(searchParams.get('error_description') || searchParams.get('error'));

    useEffect(() => {
        async function completeOAuth() {
            if (error) return;

            const code = searchParams.get('code');
            const redirectTo = searchParams.get('redirectTo') || '/account';

            try {
                if (code) {
                    const { data, error: exchangeError } = await authClient.auth.exchangeCodeForSession(code);
                    if (exchangeError) throw exchangeError;

                    if (data.session?.access_token) {
                        setAuthCookie(data.session.access_token);
                    }
                } else {
                    await syncAuthCookieFromSession();
                }

                router.replace(redirectTo);
                router.refresh();
            } catch (callbackError) {
                setError(callbackError instanceof Error ? callbackError.message : 'Unable to finish Google sign in.');
            }
        }

        completeOAuth();
    }, [error, router, searchParams]);

    return (
        <main className="min-h-screen bg-[#f8f5ef] flex items-center justify-center px-6 text-[#19130d]">
            <div className="w-full max-w-md rounded-2xl border border-[#eadfce] bg-white p-8 text-center shadow-2xl shadow-[#211812]/10">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-[#f4eadb] text-[#c27a2a]">
                    <span className="material-symbols-outlined text-3xl">{error ? 'error' : 'verified_user'}</span>
                </div>
                <h1 className="text-3xl font-black">{error ? 'Sign in failed' : 'Finishing sign in'}</h1>
                <p className="mt-3 text-sm font-medium text-[#7c6b5b]">
                    {error || 'Securely connecting your Google account to Luxe Leather Gear'}
                </p>
                {error && (
                    <Link href="/login" className="mt-7 inline-flex h-11 items-center rounded-lg bg-[#1f1711] px-6 text-sm font-black uppercase tracking-widest text-white">
                        Back to login
                    </Link>
                )}
            </div>
        </main>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={null}>
            <AuthCallbackContent />
        </Suspense>
    );
}
