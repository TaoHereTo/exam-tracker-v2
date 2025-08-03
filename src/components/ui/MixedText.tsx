import React from 'react';
import { cn } from '@/lib/utils';
import {
    generateFontStyle,
    splitMixedText,
    generateMixedTextStyle,
    getTextType,
    defaultFontConfig
} from '@/lib/fontUtils';

interface MixedTextProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
    children?: React.ReactNode;
    as?: React.ElementType;
}

export function MixedText({
    text,
    className,
    style,
    onClick,
    children,
    as: Component = 'span'
}: MixedTextProps) {
    if (!text && !children) return null;

    const content = text || (typeof children === 'string' ? children : '');
    if (!content) return <Component className={className} style={style} onClick={onClick}>{children}</Component>;

    const textType = getTextType(content);

    // 如果是纯中文或纯英文，直接应用字体样式
    if (textType === 'chinese' || textType === 'english') {
        const fontStyle = generateFontStyle(content);
        return (
            <Component
                className={cn("mixed-text", className)}
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
        <Component className={cn('mixed-text-container', className)} style={style} onClick={onClick}>
            {parts.map((part, index) => (
                <span
                    key={index}
                    className="mixed-text-part"
                    style={generateMixedTextStyle(part)}
                >
                    {part.text}
                </span>
            ))}
        </Component>
    );
}

// 标题组件
interface MixedTitleProps {
    text: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

export function MixedTitle({ text, level = 1, className, style, onClick }: MixedTitleProps) {
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
            <MixedText text={text} />
        </Tag>
    );
}

// 段落组件
interface MixedParagraphProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

export function MixedParagraph({ text, className, style, onClick }: MixedParagraphProps) {
    return (
        <p className={cn('text-base leading-relaxed', className)} style={style} onClick={onClick}>
            <MixedText text={text} />
        </p>
    );
}

// 标签组件
interface MixedLabelProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

export function MixedLabel({ text, className, style, onClick }: MixedLabelProps) {
    return (
        <label className={cn('text-sm font-medium', className)} style={style} onClick={onClick}>
            <MixedText text={text} />
        </label>
    );
}

// 按钮文字组件
interface MixedButtonTextProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

export function MixedButtonText({ text, className, style, onClick }: MixedButtonTextProps) {
    return (
        <span className={cn('font-medium', className)} style={style} onClick={onClick}>
            <MixedText text={text} />
        </span>
    );
}

// 通用文字容器组件
interface MixedTextContainerProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
    as?: React.ElementType;
}

export function MixedTextContainer({
    children,
    className,
    style,
    onClick,
    as: Component = 'span'
}: MixedTextContainerProps) {
    return (
        <Component className={className} style={style} onClick={onClick}>
            <MixedText text="">{children}</MixedText>
        </Component>
    );
}

// 高阶组件，用于包装任何组件使其支持混合文本
export function withMixedText<P extends object>(
    Component: React.ComponentType<P>
) {
    const WrappedComponent = React.forwardRef<HTMLDivElement, P & { text?: string }>((props, ref) => {
        const { text, ...restProps } = props;

        if (text) {
            return <MixedText text={text} {...restProps} />;
        }

        return <Component {...(restProps as P)} ref={ref} />;
    });

    WrappedComponent.displayName = `withMixedText(${Component.displayName || Component.name})`;
    return WrappedComponent;
}

// 导出字体配置，方便其他组件使用
export { defaultFontConfig }; 