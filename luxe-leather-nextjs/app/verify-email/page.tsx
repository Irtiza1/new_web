'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authClient, syncAuthCookieFromSession } from '@/lib/auth/client';

export default function VerifyEmailPage() {
    const [status, setStatus] = useState<'checking' | 'verified' | 'pending'>('checking');

    useEffect(() => {
        async function checkSession() {
            await syncAuthCookieFromSession();
            const { data } = await authClient.auth.getUser();
            setStatus(data.user ? 'verified' : 'pending');
        }
        checkSession();
    }, []);

    return (
        <main className="min-h-screen bg-[#f8f5ef] flex items-center justify-center px-6 text-[#19130d]">
            <div className="max-w-md w-full bg-white border border-[#eadfce] rounded-2xl p-8 text-center shadow-xl">
                <div className="mx-auto size-16 rounded-full bg-[#c27a2a]/10 text-[#a35508] flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-3xl">
                        {status === 'checking' ? 'progress_activity' : status === 'verified' ? 'verified_user' : 'mail'}
                    </span>
                </div>
                <h1 className="text-3xl font-black">
                    {status === 'checking' ? 'Verifying...' : status === 'verified' ? 'Email verified' : 'Verification needed'}
                </h1>
                <p className="mt-3 text-[#7c6b5b]">
                    {status === 'verified'
                        ? 'Your account is active. You can continue to your account or admin area if your role allows it.'
                        : 'Open the verification link from your inbox. If it has expired, sign up again or request a new link from login support.'}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/account" className="h-11 inline-flex items-center justify-center rounded-lg bg-[#1f1711] px-5 text-sm font-black uppercase tracking-widest text-white">
                        Account
                    </Link>
                    <Link href="/login" className="h-11 inline-flex items-center justify-center rounded-lg border border-[#eadfce] px-5 text-sm font-black uppercase tracking-widest">
                        Login
                    </Link>
                </div>
            </div>
        </main>
    );
}
