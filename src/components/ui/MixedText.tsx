import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface MixedTextProps {
    text?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
    children?: React.ReactNode;
    as?: React.ElementType;
}

export const MixedText = memo(function MixedText({
    text,
    className,
    style,
    onClick,
    children,
    as: Component = 'span',
}: MixedTextProps) {

    if (!text && !children) return null;

    const content = text || (typeof children === 'string' ? children : '');
    if (!content) return <Component className={className} style={style} onClick={onClick}>{children}</Component>;

    // More accurate check for formatting markers
    const hasBoldFormatting = /\*\*[^*]+\*\*/.test(content);
    const hasItalicFormatting = /(?<!\*)\*[^*]+\*(?!\*)/.test(content);
    const hasRedFormatting = /\{red\}[^}]+\{\/red\}/.test(content);
    const hasFormatting = hasBoldFormatting || hasItalicFormatting || hasRedFormatting;

    if (hasFormatting) {
        // Simple formatted text rendering without font optimization
        const renderFormattedText = (text: string) => {
            if (!text || typeof text !== 'string') {
                return text;
            }

            const boldRegex = /\*\*([^*]+)\*\*/g;
            const italicRegex = /\*([^*]+)\*/g;
            const redRegex = /\{red\}([^{}]+)\{\/red\}/g;

            const parts: { text: string; type: 'normal' | 'bold' | 'italic' | 'red' }[] = [];
            let lastIndex = 0;

            const allMatches: { index: number; match: string; type: 'bold' | 'italic' | 'red'; content: string }[] = [];

            let match;
            while ((match = boldRegex.exec(text)) !== null) {
                allMatches.push({
                    index: match.index,
                    match: match[0],
                    type: 'bold',
                    content: match[1]
                });
            }

            italicRegex.lastIndex = 0;
            while ((match = italicRegex.exec(text)) !== null) {
                const isBoldPattern = text.substring(match.index - 1, match.index + match[0].length + 1).includes('**');
                if (!isBoldPattern) {
                    allMatches.push({
                        index: match.index,
                        match: match[0],
                        type: 'italic',
                        content: match[1]
                    });
                }
            }

            redRegex.lastIndex = 0;
            while ((match = redRegex.exec(text)) !== null) {
                allMatches.push({
                    index: match.index,
                    match: match[0],
                    type: 'red',
                    content: match[1]
                });
            }

            allMatches.sort((a, b) => a.index - b.index);

            const nonOverlappingMatches = allMatches.filter((current, index) => {
                if (index === 0) return true;
                const previous = allMatches[index - 1];
                return current.index >= previous.index + previous.match.length;
            });

            for (const { index, match, type, content } of nonOverlappingMatches) {
                if (index > lastIndex) {
                    parts.push({
                        text: text.substring(lastIndex, index),
                        type: 'normal'
                    });
                }

                parts.push({
                    text: content,
                    type
                });

                lastIndex = index + match.length;
            }

            if (lastIndex < text.length) {
                parts.push({
                    text: text.substring(lastIndex),
                    type: 'normal'
                });
            }

            if (parts.length === 0) {
                return text;
            }

            return parts.map((part, index) => {
                switch (part.type) {
                    case 'bold':
                        return React.createElement('strong', {
                            key: index,
                            className: 'font-bold'
                        }, part.text);
                    case 'italic':
                        return React.createElement('em', {
                            key: index,
                            className: 'italic'
                        }, part.text);
                    case 'red':
                        return React.createElement('span', {
                            key: index,
                            className: 'text-red-500'
                        }, part.text);
                    default:
                        return React.createElement(React.Fragment, { key: index }, part.text);
                }
            });
        };

        return (
            <Component
                className={cn("mixed-text", className)}
                style={style}
                onClick={onClick}
            >
                {renderFormattedText(content)}
            </Component>
        );
    }

    // Simple text rendering without font optimization
    return (
        <Component
            className={cn("mixed-text", className)}
            style={style}
            onClick={onClick}
        >
            {content}
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

    const titleStyle: React.CSSProperties = {
        ...style
    };

    const renderTitle = () => {
        const titleContent = <MixedText text={text} />;

        switch (level) {
            case 1:
                return <h1 className={cn(levelStyles[level], className)} style={titleStyle} onClick={onClick}>{titleContent}</h1>;
            case 2:
                return <h2 className={cn(levelStyles[level], className)} style={titleStyle} onClick={onClick}>{titleContent}</h2>;
            case 3:
                return <h3 className={cn(levelStyles[level], className)} style={titleStyle} onClick={onClick}>{titleContent}</h3>;
            case 4:
                return <h4 className={cn(levelStyles[level], className)} style={titleStyle} onClick={onClick}>{titleContent}</h4>;
            case 5:
                return <h5 className={cn(levelStyles[level], className)} style={titleStyle} onClick={onClick}>{titleContent}</h5>;
            case 6:
                return <h6 className={cn(levelStyles[level], className)} style={titleStyle} onClick={onClick}>{titleContent}</h6>;
            default:
                return <h1 className={cn(levelStyles[1], className)} style={titleStyle} onClick={onClick}>{titleContent}</h1>;
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
    const paragraphStyle: React.CSSProperties = {
        ...style
    };

    return (
        <p className={cn('text-base leading-relaxed', className)} style={paragraphStyle} onClick={onClick}>
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
    const labelStyle: React.CSSProperties = {
        ...style
    };

    return (
        <label className={cn('text-sm font-medium', className)} style={labelStyle} onClick={onClick}>
            <MixedText text={text} />
        </label>
    );
});