import React from 'react';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { MixedText } from './MixedText';

interface FormFieldProps {
    label: string | React.ReactNode;
    children: React.ReactNode;
    className?: string;
    htmlFor?: string;
    required?: boolean;
}

export function FormField({
    label,
    children,
    className = '',
    htmlFor,
    required = false
}: FormFieldProps) {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <Label htmlFor={htmlFor} className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
                {typeof label === 'string' ? <MixedText text={label} /> : label}
            </Label>
            {children}
        </div>
    );
} 