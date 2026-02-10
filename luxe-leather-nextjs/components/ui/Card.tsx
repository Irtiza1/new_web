import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: "default" | "bordered" | "elevated";
    padding?: "none" | "sm" | "md" | "lg";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        { className, children, variant = "default", padding = "md", ...props },
        ref
    ) => {
        const variants = {
            default:
                "bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark",
            bordered:
                "bg-surface-light dark:bg-surface-dark border-2 border-border-light dark:border-border-dark",
            elevated:
                "bg-surface-light dark:bg-surface-dark shadow-lg border border-border-light dark:border-border-dark",
        };

        const paddings = {
            none: "",
            sm: "p-4",
            md: "p-6",
            lg: "p-8",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-xl transition-colors duration-200",
                    variants[variant],
                    paddings[padding],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";

export default Card;
