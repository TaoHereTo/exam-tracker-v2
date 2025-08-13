import React, { useEffect, useRef, useState } from 'react';
import { useFormContext } from '@/components/forms/BaseForm';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { MixedText } from './MixedText';

interface FormErrorProps {
    error?: string;
    className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
    const [visible, setVisible] = useState<boolean>(false);
    const timerRef = useRef<number | null>(null);

    // 尝试获取表单上下文，如果不在BaseForm中则使用props中的error
    let contextError: string | undefined;
    let errorsVersion: number = 0;

    try {
        const context = useFormContext();
        contextError = context.errors[className || ''] || error;
        errorsVersion = context.errorsVersion;
    } catch {
        // 如果不在BaseForm上下文中，直接使用props中的error
        contextError = error;
    }

    useEffect(() => {
        // 当错误变化时，展示并在一段时间后自动隐藏
        if (contextError) {
            setVisible(true);
            if (timerRef.current) window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => {
                setVisible(false);
            }, 5000);
        } else {
            setVisible(false);
        }
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [contextError, errorsVersion]);

    if (!contextError || !visible) return null;

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
            <span><MixedText text={contextError} /></span>
        </div>
    );
}