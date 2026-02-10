"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    closeOnOverlayClick?: boolean;
    showCloseButton?: boolean;
    title?: string;
}

export default function Modal({
    isOpen,
    onClose,
    children,
    size = "md",
    closeOnOverlayClick = true,
    showCloseButton = true,
    title,
}: ModalProps) {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-full mx-4",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={closeOnOverlayClick ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative z-10 w-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl",
                    "max-h-[90vh] overflow-hidden flex flex-col",
                    sizes[size]
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
                        {title && (
                            <h2
                                id="modal-title"
                                className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark"
                            >
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="ml-auto p-1 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Close modal"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="overflow-y-auto flex-1">{children}</div>
            </div>
        </div>
    );
}
