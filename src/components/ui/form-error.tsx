import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
    error?: string;
    className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
    if (!error) return null;

    return (
        <div className={cn(
            "absolute top-full left-0 mt-1 z-50",
            "flex items-center gap-1.5 px-2 py-1.5 rounded-md",
            "bg-red-500 text-white text-xs font-medium",
            "shadow-lg border border-red-600",
            "animate-in fade-in-0 slide-in-from-top-1 duration-200",
            "before:content-[''] before:absolute before:top-0 before:left-3 before:-translate-y-1",
            "before:w-2 before:h-2 before:bg-red-500 before:rotate-45 before:border-l before:border-t before:border-red-600",
            className
        )}>
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>{error}</span>
        </div>
    );
} 