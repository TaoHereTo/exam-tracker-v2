import React from "react";
import { cn } from "@/lib/utils";

interface ButtonGroupProps {
    children: React.ReactNode;
    className?: string;
    spacing?: "sm" | "md" | "lg";
    direction?: "horizontal" | "vertical";
    margin?: "none" | "sm" | "md" | "lg";
}

export function ButtonGroup({
    children,
    className,
    spacing = "md",
    direction = "horizontal",
    margin = "md"
}: ButtonGroupProps) {
    const spacingClasses = {
        sm: direction === "horizontal" ? "gap-2" : "space-y-2",
        md: direction === "horizontal" ? "gap-4" : "space-y-4",
        lg: direction === "horizontal" ? "gap-6" : "space-y-6",
    };

    const marginClasses = {
        none: "",
        sm: "my-1",
        md: "my-2",
        lg: "my-3",
    };

    return (
        <div
            className={cn(
                direction === "horizontal" ? "flex items-center" : "flex flex-col",
                spacingClasses[spacing],
                marginClasses[margin],
                className
            )}
        >
            {children}
        </div>
    );
} 