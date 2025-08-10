import React from 'react';
import { MixedText } from './MixedText';

interface PageTitleProps {
    children: React.ReactNode;
    className?: string;
}

export function PageTitle({ children, className = "" }: PageTitleProps) {
    // 如果 children 是字符串，使用 MixedText
    if (typeof children === 'string') {
        return (
            <h1 className={`text-3xl font-bold ${className}`}>
                <MixedText text={children} />
            </h1>
        );
    }

    // 如果 children 是其他类型，直接渲染
    return (
        <h1 className={`text-3xl font-bold ${className}`}>
            {children}
        </h1>
    );
} 