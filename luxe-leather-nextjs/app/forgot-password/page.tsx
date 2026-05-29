'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authClient } from '@/lib/auth/client';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        const { error: resetError } = await authClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/account`,
        });

        if (resetError) {
            setError(resetError.message);
        } else {
            setMessage('Password reset instructions were sent to your email.');
        }

        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-[#f8f5ef] flex items-center justify-center px-6 text-[#19130d]">
            <div className="max-w-md w-full bg-white border border-[#eadfce] rounded-2xl p-8 shadow-xl">
                <h1 className="text-3xl font-black">Reset password</h1>
                <p className="mt-2 text-sm text-[#7c6b5b]">Enter your verified email and we will send reset instructions.</p>
                {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
                {message && <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>}
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <label className="block">
                        <span className="text-xs font-black uppercase tracking-widest text-[#7c6b5b]">Email</span>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-[#eadfce] bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#c27a2a] focus:ring-2 focus:ring-[#c27a2a]/20" />
                    </label>
                    <button type="submit" disabled={loading} className="w-full h-12 rounded-lg bg-[#1f1711] text-white font-black uppercase tracking-widest hover:bg-[#c27a2a] transition-colors disabled:opacity-60">
                        {loading ? 'Sending...' : 'Send reset link'}
                    </button>
                </form>
                <Link href="/login" className="mt-6 block text-center text-sm font-black text-[#a35508] hover:underline">
                    Back to login
                </Link>
            </div>
        </main>
    );
}
