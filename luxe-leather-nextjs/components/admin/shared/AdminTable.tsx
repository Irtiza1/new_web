'use client';

import React from 'react';

interface AdminTableProps {
    headers: string[];
    children: React.ReactNode;
    onSelectAll?: (checked: boolean) => void;
    isAllSelected?: boolean;

    containerClassName?: string;
    stickyHeader?: boolean;
}

export default function AdminTable({
    headers,
    children,
    onSelectAll,
    isAllSelected = false,

    containerClassName = "",
    stickyHeader = true
}: AdminTableProps) {
    return (
        <div className={`overflow-auto flex-1 ${containerClassName}`}>
            <table className="w-full text-left min-w-[800px] border-collapse">
                <thead className={`${stickyHeader ? 'sticky top-0 z-10' : ''} bg-[#f6f7f8] dark:bg-[#101922] border-b border-[#e5e7eb] dark:border-[#2d3b4a]`}>
                    <tr>
                        {onSelectAll && (
                            <th className="px-6 py-4 w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-[#d41132] focus:ring-[#d41132] bg-transparent cursor-pointer"
                                    checked={isAllSelected}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                />
                            </th>
                        )}
                        {headers.map((header, idx) => (
                            <th 
                                key={idx} 
                                className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#4c739a] dark:text-[#94a3b8] ${idx === headers.length - 1 ? 'text-right' : ''}`}
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d3b4a]">
                    {children}
                </tbody>
            </table>
        </div>
    );
}
