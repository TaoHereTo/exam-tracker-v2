import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    spacing?: 'sm' | 'md' | 'lg';
    direction?: 'horizontal' | 'vertical';
    align?: 'start' | 'center' | 'end' | 'between' | 'around';
}

/**
 * 按钮组组件
 * 减少重复的按钮布局类名使用
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
    children,
    className,
    spacing = 'md',
    direction = 'horizontal',
    align = 'start',
    ...props
}) => {
    const baseClasses = "flex";

    const directionClasses = {
        horizontal: "flex-row",
        vertical: "flex-col"
    };

    const spacingClasses = {
        sm: direction === 'horizontal' ? 'gap-2' : 'gap-2',
        md: direction === 'horizontal' ? 'gap-4' : 'gap-4',
        lg: direction === 'horizontal' ? 'gap-6' : 'gap-6'
    };

    const alignClasses = {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around'
    };

    return (
        <div
            className={cn(
                baseClasses,
                directionClasses[direction],
                spacingClasses[spacing],
                alignClasses[align],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

/**
 * 内联按钮组组件
 * 用于内联的按钮组合
 */
export const InlineButtonGroup: React.FC<ButtonGroupProps> = ({
    children,
    className,
    spacing = 'sm',
    ...props
}) => {
    return (
        <ButtonGroup
            direction="horizontal"
            spacing={spacing}
            align="center"
            className={cn("inline-flex", className)}
            {...props}
        >
            {children}
        </ButtonGroup>
    );
};