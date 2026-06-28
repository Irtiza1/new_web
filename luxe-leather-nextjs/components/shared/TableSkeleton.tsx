import React from 'react';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
    return (
        <div className="w-full">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex border-b border-slate-100 dark:border-slate-800/50 px-6 py-4">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <div 
                            key={colIndex} 
                            className={`flex-1 ${colIndex === 0 ? 'max-w-[50px]' : ''} ${colIndex === columns - 1 ? 'flex justify-end' : ''}`}
                        >
                            <div className={`h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse ${
                                colIndex === 0 ? 'w-4 h-4 rounded-sm' : 
                                colIndex === columns - 1 ? 'w-8 h-8 rounded-full' :
                                'w-3/4'
                            }`}></div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
