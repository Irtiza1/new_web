'use client';

import React from 'react';

interface AdminBulkActionsBarProps {
    selectedCount: number;
    onCancel: () => void;
    onDelete: () => void;
    isDeleting?: boolean;
    deleteLabel?: string;
}

export default function AdminBulkActionsBar({
    selectedCount,
    onCancel,
    onDelete,
    isDeleting = false,
    deleteLabel = "Delete Selected"
}: AdminBulkActionsBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border border-slate-800 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl flex flex-wrap md:flex-nowrap items-center justify-center gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 w-[90%] md:w-auto">
            <div className="flex items-center gap-3">
                <span className="bg-[#d41132] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedCount}
                </span>
                <p className="text-sm font-medium whitespace-nowrap">items selected</p>
            </div>
            <div className="hidden md:block w-px h-6 bg-slate-700" />
            <div className="flex items-center gap-3">
                <button
                    onClick={onCancel}
                    className="text-sm font-bold text-slate-400 hover:text-white transition-colors px-2"
                >
                    Cancel
                </button>
                <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white text-sm font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                    {isDeleting ? (
                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    ) : (
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                    )}
                    {isDeleting ? 'Deleting...' : deleteLabel}
                </button>
            </div>
        </div>
    );
}
