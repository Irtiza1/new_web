import React from 'react';

interface FormSkeletonProps {
    fields?: number;
}

export default function FormSkeleton({ fields = 3 }: FormSkeletonProps) {
    return (
        <div className="flex flex-col gap-6 w-full animate-pulse">
            {Array.from({ length: fields }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6">
                    <div className="flex justify-between mb-4">
                        <div className="space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
                        </div>
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-28"></div>
                    </div>
                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
                </div>
            ))}
        </div>
    );
}
