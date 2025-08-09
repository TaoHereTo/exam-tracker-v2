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

interface MixedTextProps {
    text?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
    children?: React.ReactNode;
    as?: React.ElementType;
    forceConfig?: boolean; // 是否强制使用默认配置
}

export const MixedText = memo(function MixedText({
    text,
    className,
    style,
    onClick,
    children,
    as: Component = 'span',
    forceConfig = false
}: MixedTextProps) {
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
                    style={generateMixedTextStyle(part, config)}
                >
                    {part.text}
                </span>
            ))}
        </Component>
    );
});

// 标题组件
interface MixedTitleProps {
    text: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

export const MixedTitle = memo(function MixedTitle({
    text,
    level = 1,
    className,
    style,
    onClick
}: MixedTitleProps) {
    const levelStyles = {
        1: 'text-3xl font-bold',
        2: 'text-2xl font-semibold',
        3: 'text-xl font-medium',
        4: 'text-lg font-medium',
        5: 'text-base font-medium',
        6: 'text-sm font-medium'
    };

    const renderTitle = () => {
        const titleContent = <MixedText text={text} />;

        switch (level) {
            case 1:
                return <h1 className={cn(levelStyles[level], className)} style={style} onClick={onClick}>{titleContent}</h1>;
            case 2:
                return <h2 className={cn(levelStyles[level], className)} style={style} onClick={onClick}>{titleContent}</h2>;
            case 3:
                return <h3 className={cn(levelStyles[level], className)} style={style} onClick={onClick}>{titleContent}</h3>;
            case 4:
                return <h4 className={cn(levelStyles[level], className)} style={style} onClick={onClick}>{titleContent}</h4>;
            case 5:
                return <h5 className={cn(levelStyles[level], className)} style={style} onClick={onClick}>{titleContent}</h5>;
            case 6:
                return <h6 className={cn(levelStyles[level], className)} style={style} onClick={onClick}>{titleContent}</h6>;
            default:
                return <h1 className={cn(levelStyles[1], className)} style={style} onClick={onClick}>{titleContent}</h1>;
        }
    };

    return renderTitle();
});

// 段落组件
interface MixedParagraphProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

export const MixedParagraph = memo(function MixedParagraph({
    text,
    className,
    style,
    onClick
}: MixedParagraphProps) {
    return (
        <p className={cn('text-base leading-relaxed', className)} style={style} onClick={onClick}>
            <MixedText text={text} />
        </p>
    );
});

// 标签组件
interface MixedLabelProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

export const MixedLabel = memo(function MixedLabel({
    text,
    className,
    style,
    onClick
}: MixedLabelProps) {
    return (
        <label className={cn('text-sm font-medium', className)} style={style} onClick={onClick}>
            <MixedText text={text} />
        </label>
    );
}); 