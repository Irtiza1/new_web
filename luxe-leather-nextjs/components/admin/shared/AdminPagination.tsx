'use client';

import React from 'react';

interface AdminPaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (items: number) => void;
    itemsPerPageOptions?: number[];
}

export default function AdminPagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [2, 3, 5, 10, 20, 50]
}: AdminPaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, totalItems);

    if (totalItems === 0) return null;

    return (
        <div className="px-6 py-4 border-t border-[#e5e7eb] dark:border-[#2d3b4a] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 bg-white dark:bg-[#1a2632] shrink-0">
            <div className="flex items-center gap-4">
                <span>Showing {startIdx + 1}–{endIdx} of {totalItems} results</span>
                {onItemsPerPageChange && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="rowsPerPage" className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider text-slate-400">Rows:</label>
                        <select
                            id="rowsPerPage"
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-[#d41132] transition-all cursor-pointer dark:text-white"
                        >
                            {itemsPerPageOptions.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                >
                    Previous
                </button>
                {(() => {
                    const start = Math.max(0, Math.min(currentPage - 2, totalPages - 3));
                    const end = Math.min(totalPages, start + 3);
                    return Array.from({ length: totalPages }, (_, i) => i + 1).slice(start, end).map(page => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`px-3 py-1 rounded border transition-colors font-bold ${
                                currentPage === page 
                                    ? 'bg-[#d41132] text-white border-[#d41132]' 
                                    : 'border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            {page}
                        </button>
                    ));
                })()}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-[#e5e7eb] dark:border-[#2d3b4a] bg-white dark:bg-[#1a2632] disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
