'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global Error Boundary Caught:', error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-[#0a0f14]">
            <div className="bg-white dark:bg-[#15202b] max-w-md w-full p-8 rounded-3xl shadow-xl text-center border border-slate-100 dark:border-slate-800">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
                    <span className="material-symbols-outlined text-4xl">warning</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Something Went Wrong</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
                    We encountered an unexpected error while trying to load this page. Our team has been notified.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={reset}
                        className="w-full bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">refresh</span> Try Again
                    </button>
                    <Link
                        href="/"
                        className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">home</span> Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
