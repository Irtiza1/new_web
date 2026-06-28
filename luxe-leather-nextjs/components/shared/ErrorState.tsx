import React from 'react';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
}

export default function ErrorState({ 
    title = 'Something went wrong', 
    message = 'We encountered an error while loading this data. Please try again.',
    onRetry
}: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 m-4">
            <div className="size-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 shadow-sm">
                <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{message}</p>
            {onRetry && (
                <button 
                    onClick={onRetry}
                    className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-2 text-sm"
                >
                    <span className="material-symbols-outlined text-lg">refresh</span> Try Again
                </button>
            )}
        </div>
    );
}
