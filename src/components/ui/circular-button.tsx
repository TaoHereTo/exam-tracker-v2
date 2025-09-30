"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const circularButtonVariants = cva(
    "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background select-none",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 dark:hover:bg-primary/80",
                destructive:
                    "bg-destructive text-white shadow-sm hover:bg-destructive/90 dark:hover:bg-destructive/80",
                outline:
                    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/20",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 dark:hover:bg-secondary/80",
                ghost:
                    "hover:bg-accent hover:text-accent-foreground",
                success:
                    "bg-[#2C9678] text-white shadow-sm hover:bg-[#2C9678]/90 dark:hover:bg-[#2C9678]/80",
                warning:
                    "bg-[#f59e0b] text-white shadow-sm hover:bg-[#f59e0b]/90 dark:hover:bg-[#f59e0b]/80",
                gray:
                    "bg-[#6b7280] text-white shadow-sm hover:bg-[#6b7280]/90 dark:hover:bg-[#6b7280]/80",
                theme:
                    "border border-input-border bg-white shadow-sm hover:bg-accent hover:text-accent-foreground dark:bg-background dark:border-input-border dark:hover:bg-accent dark:hover:text-accent-foreground",
            },
            size: {
                sm: "h-6 w-6",
                default: "h-8 w-8",
                lg: "h-9 w-9",
                xl: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface CircularButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof circularButtonVariants> {
    asChild?: boolean;
}

const CircularButton = React.forwardRef<HTMLButtonElement, CircularButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        return (
            <button
                className={cn(circularButtonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);

CircularButton.displayName = "CircularButton";

export { CircularButton, circularButtonVariants };
