import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ReactBitsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

const ReactBitsButton = forwardRef<HTMLButtonElement, ReactBitsButtonProps>(({
    children,
    className,
    variant = 'default',
    size = 'md',
    ...props
}, ref) => {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    const variantClasses = {
        default: 'bg-gradient-to-br from-purple-600 to-blue-600',
        primary: 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600',
        secondary: 'bg-gradient-to-br from-gray-600 to-gray-700',
        destructive: 'bg-gradient-to-br from-red-500 to-red-700',
        outline: 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border border-gray-300 hover:text-gray-900'
    };

    return (
        <button
            ref={ref}
            className={cn(
                'reactbits-button',
                sizeClasses[size],
                // 只有当没有自定义className时才使用默认的variant样式
                !className?.includes('bg-') && variantClasses[variant],
                'justify-center', // 确保文字居中
                className
            )}
            {...props}
        >
            {children}

            {/* 玻璃边框效果 */}
            <div className="glass-effect" />

            {/* 光晕扫过效果 */}
            <div className="shimmer-effect" />
        </button>
    );
});

ReactBitsButton.displayName = 'ReactBitsButton';

export default ReactBitsButton; 