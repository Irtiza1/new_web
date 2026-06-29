import React from 'react';

export default function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-6 w-full animate-pulse">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                ))}
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="h-96 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                <div className="h-96 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="h-80 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                <div className="h-80 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
            </div>
        </div>
    );
}
