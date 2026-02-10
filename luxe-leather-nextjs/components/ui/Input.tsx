import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, icon, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "w-full px-4 py-2 rounded-lg border transition-all duration-200",
                            "bg-surface-light dark:bg-surface-dark",
                            "text-text-primary-light dark:text-text-primary-dark",
                            "placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark",
                            "border-border-light dark:border-border-dark",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            error && "border-error focus:ring-error",
                            icon && "pl-10",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1.5 text-sm text-error flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">error</span>
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
