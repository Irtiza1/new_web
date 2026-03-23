'use client';

import React from 'react';

interface AdminPageLayoutProps {
    title: string;
    subtitle: string;
    actions?: React.ReactNode;
    stats?: React.ReactNode;
    filters?: React.ReactNode;
    children: React.ReactNode;
    pagination?: React.ReactNode;
    bulkActions?: React.ReactNode;
    withTableCard?: boolean;
    containerClassName?: string;
}

export default function AdminPageLayout({
    title,
    subtitle,
    actions,
    stats,
    filters,
    children,
    pagination,
    bulkActions,
    withTableCard = true,
    containerClassName = ""
}: AdminPageLayoutProps) {
    return (
        <div className={`flex flex-col w-full bg-[#f6f7f8] dark:bg-[#101922] font-[family-name:var(--font-inter)] h-[100dvh] overflow-hidden ${containerClassName}`}>
            <div className="flex-1 flex flex-col w-full min-h-0">
                {/* Header */}
                <header className="w-full px-6 py-4 border-b border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] shrink-0">
                    <div className="max-w-7xl mx-auto flex flex-col gap-4">
                        <div className="flex flex-wrap justify-between items-end gap-4">
                            <div>
                                <h1 className="text-2xl font-black text-[#0d141b] dark:text-white leading-tight">{title}</h1>
                                <p className="text-sm text-[#4c739a] dark:text-[#94a3b8]">{subtitle}</p>
                            </div>
                            {actions && <div className="flex gap-3">{actions}</div>}
                        </div>

                        {/* Quick Stats */}
                        {stats && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {stats}
                            </div>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 w-full p-4 overflow-hidden flex flex-col min-h-0">
                    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
                        {/* Filters */}
                        {filters && (
                            <div className="flex flex-wrap gap-3 mb-4 shrink-0">
                                {filters}
                            </div>
                        )}

                        {/* Card Wrapper */}
                        {withTableCard ? (
                            <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-[#2d3b4a] overflow-hidden flex-1 flex flex-col min-h-0">
                                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                                    {children}
                                </div>
                                {pagination && pagination}
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto min-h-0">
                                {children}
                            </div>
                        )}
                    </div>
                </main>
                
                {bulkActions}
            </div>
        </div>
    );
}
