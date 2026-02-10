import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
    children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = "primary",
            size = "md",
            fullWidth = false,
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles =
            "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";

        const variants = {
            primary:
                "bg-primary hover:bg-primary-hover text-white shadow-sm focus:ring-primary",
            secondary:
                "bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-primary",
            outline:
                "border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary",
            ghost:
                "text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-300",
            danger:
                "bg-error text-white hover:bg-red-600 shadow-sm focus:ring-error",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm gap-1.5",
            md: "px-4 py-2 text-base gap-2",
            lg: "px-6 py-3 text-lg gap-2.5",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && "w-full",
                    className
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;
