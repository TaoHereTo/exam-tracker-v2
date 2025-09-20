import React from 'react';
import { cn } from '@/lib/utils';

interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'centered' | 'full-width';
}

/**
 * 卡片容器组件
 * 减少重复的卡片布局类名使用
 */
export const CardContainer: React.FC<CardContainerProps> = ({
    children,
    className,
    variant = 'default',
    ...props
}) => {
    const baseClasses = "w-full";

    const variantClasses = {
        default: "max-w-4xl mx-auto",
        centered: "max-w-2xl mx-auto",
        'full-width': "w-full"
    };

    return (
        <div
            className={cn(baseClasses, variantClasses[variant], className)}
            {...props}
        >
            {children}
        </div>
    );
};

/**
 * 页面容器组件
 * 减少重复的页面布局类名使用
 */
export const PageContainer: React.FC<CardContainerProps> = ({
    children,
    className,
    variant = 'default',
    ...props
}) => {
    const baseClasses = "w-full min-h-screen";

    const variantClasses = {
        default: "max-w-6xl mx-auto px-4 py-8",
        centered: "max-w-4xl mx-auto px-4 py-8",
        'full-width': "w-full px-4 py-8"
    };

    return (
        <div
            className={cn(baseClasses, variantClasses[variant], className)}
            {...props}
        >
            {children}
        </div>
    );
};
