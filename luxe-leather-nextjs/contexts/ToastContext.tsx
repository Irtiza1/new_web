'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ToastState {
    text: string;
    type: 'success' | 'error' | 'warning';
}

interface ToastContextType {
    showToast: (text: string, type?: 'success' | 'error' | 'warning') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastState | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((text: string, type: 'success' | 'error' | 'warning' = 'success') => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast({ text, type });
        timerRef.current = setTimeout(() => setToast(null), 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div
                    role="alert"
                    style={{
                        backgroundColor:
                            toast.type === 'success' ? '#16a34a'
                            : toast.type === 'warning' ? '#f59e0b'
                            : '#dc2626'
                    }}
                    className="fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl font-semibold text-white text-sm shadow-xl transition-all"
                >
                    {toast.text}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
