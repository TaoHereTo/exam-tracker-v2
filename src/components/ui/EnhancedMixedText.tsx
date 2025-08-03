import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import {
    generateFontStyle,
    splitMixedText,
    generateMixedTextStyle,
    getTextType,
    defaultFontConfig
} from '@/lib/fontUtils';
import { useFont } from '@/contexts/FontContext';

interface EnhancedMixedTextProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
    children?: React.ReactNode;
    as?: React.ElementType;
    forceConfig?: boolean; // 是否强制使用默认配置
}

export const EnhancedMixedText = memo(function EnhancedMixedText({
    text,
    className,
    style,
    onClick,
    children,
    as: Component = 'span',
    forceConfig = false
}: EnhancedMixedTextProps) {
    const { fontConfig } = useFont();
    const config = forceConfig ? defaultFontConfig : fontConfig;

    if (!text && !children) return null;

    const content = text || (typeof children === 'string' ? children : '');
    if (!content) return <Component className={className} style={style} onClick={onClick}>{children}</Component>;

    const textType = getTextType(content);

    // 如果是纯中文或纯英文，直接应用字体样式
    if (textType === 'chinese' || textType === 'english') {
        const fontStyle = generateFontStyle(content, config);
        return (
            <Component
                className={cn("enhanced-mixed-text", className)}
                style={{ ...fontStyle, ...style }}
                onClick={onClick}
            >
                {content}
            </Component>
        );
    }

    // 如果是混合文本，分割并分别应用字体
    const parts = splitMixedText(content);

    return (
        <Component className={cn('enhanced-mixed-text-container', className)} style={style} onClick={onClick}>
            {parts.map((part, index) => (
                <span
                    key={index}
                    className="enhanced-mixed-text-part"
                    style={generateMixedTextStyle(part, config)}
                >
                    {part.text}
                </span>
            ))}
        </Component>
    );
});

// 标题组件
interface EnhancedMixedTitleProps {
    text: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

export const EnhancedMixedTitle = memo(function EnhancedMixedTitle({
    text,
    level = 1,
    className,
    style,
    onClick
}: EnhancedMixedTitleProps) {
    const Tag = `h${level}` as React.ElementType;
    const baseClasses = {
        1: 'text-3xl font-bold',
        2: 'text-2xl font-semibold',
        3: 'text-xl font-medium',
        4: 'text-lg font-medium',
        5: 'text-base font-medium',
        6: 'text-sm font-medium'
    };

    return (
        <Tag className={cn(baseClasses[level], className)} style={style} onClick={onClick}>
            <EnhancedMixedText text={text} />
        </Tag>
    );
});

// 段落组件
interface EnhancedMixedParagraphProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

export const EnhancedMixedParagraph = memo(function EnhancedMixedParagraph({
    text,
    className,
    style,
    onClick
}: EnhancedMixedParagraphProps) {
    return (
        <p className={cn('text-base leading-relaxed', className)} style={style} onClick={onClick}>
            <EnhancedMixedText text={text} />
        </p>
    );
});

// 标签组件
interface EnhancedMixedLabelProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

export const EnhancedMixedLabel = memo(function EnhancedMixedLabel({
    text,
    className,
    style,
    onClick
}: EnhancedMixedLabelProps) {
    return (
        <label className={cn('text-sm font-medium', className)} style={style} onClick={onClick}>
            <EnhancedMixedText text={text} />
        </label>
    );
});

// 按钮文字组件
interface EnhancedMixedButtonTextProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

export const EnhancedMixedButtonText = memo(function EnhancedMixedButtonText({
    text,
    className,
    style,
    onClick
}: EnhancedMixedButtonTextProps) {
    return (
        <span className={cn('font-medium', className)} style={style} onClick={onClick}>
            <EnhancedMixedText text={text} />
        </span>
    );
});

// 通用文字容器组件
interface EnhancedMixedTextContainerProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
    as?: React.ElementType;
}

export const EnhancedMixedTextContainer = memo(function EnhancedMixedTextContainer({
    children,
    className,
    style,
    onClick,
    as: Component = 'span'
}: EnhancedMixedTextContainerProps) {
    return (
        <Component className={className} style={style} onClick={onClick}>
            <EnhancedMixedText text="">{children}</EnhancedMixedText>
        </Component>
    );
});

// 高阶组件，用于包装任何组件使其支持混合文本
export function withEnhancedMixedText<P extends object>(
    Component: React.ComponentType<P>
) {
    const WrappedComponent = React.forwardRef<HTMLDivElement, P & { text?: string }>((props, ref) => {
        const { text, ...restProps } = props;

        if (text) {
            return <EnhancedMixedText text={text} {...restProps} />;
        }

        return <Component {...(restProps as P)} ref={ref} />;
    });

    WrappedComponent.displayName = `withEnhancedMixedText(${Component.displayName || Component.name})`;
    return WrappedComponent;
} 