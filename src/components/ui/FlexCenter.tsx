import React from 'react';
import { cn } from '@/lib/utils';

interface FlexCenterProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

/**
 * 居中对齐的 Flex 容器组件
 * 减少重复的 "flex items-center" 类名使用
 */
export const FlexCenter: React.FC<FlexCenterProps> = ({
    children,
    className,
    ...props
}) => {
    return (
        <div
            className={cn("flex items-center", className)}
            {...props}
        >
            {children}
        </div>
    );
};

/**
 * 居中对齐的 Flex 容器组件（垂直方向）
 * 减少重复的 "flex items-center justify-center" 类名使用
 */
export const FlexCenterBoth: React.FC<FlexCenterProps> = ({
    children,
    className,
    ...props
}) => {
    return (
        <div
            className={cn("flex items-center justify-center", className)}
            {...props}
        >
            {children}
        </div>
    );
};

/**
 * 居中对齐的 Flex 容器组件（水平方向）
 * 减少重复的 "flex justify-center" 类名使用
 */
export const FlexCenterHorizontal: React.FC<FlexCenterProps> = ({
    children,
    className,
    ...props
}) => {
    return (
        <div
            className={cn("flex justify-center", className)}
            {...props}
        >
            {children}
        </div>
    );
};

