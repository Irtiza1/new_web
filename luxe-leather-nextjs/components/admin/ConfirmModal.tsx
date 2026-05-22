'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = true
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm();
        } finally {
            setIsConfirming(false);
        }
    };

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const container = typeof document !== 'undefined' ? document.body : null;
    if (!container) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15202b] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-4">
                    <div className={`w-12 h-12 rounded-full ${isDestructive ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'} flex items-center justify-center mb-2`}>
                        <span className="material-symbols-outlined text-3xl">
                            {isDestructive ? 'warning' : 'info'}
                        </span>
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-bold dark:text-white leading-tight">
                            {title}
                        </h3>
                        <p className="mt-3 text-slate-500 dark:text-slate-400 leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl transition-all text-sm"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isConfirming}
                            className={`flex-1 px-4 py-3 ${isDestructive ? 'bg-[#d41132] hover:bg-[#b30f2a]' : 'bg-slate-900 hover:bg-black'} text-white font-bold rounded-xl transition-all text-sm shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {isConfirming && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        container
    );
}
