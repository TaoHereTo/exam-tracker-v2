import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import {
    generateFontStyle,
    splitMixedText,
    generateMixedTextStyle,
    getTextType,
    defaultFontConfig,
    renderFormattedText
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

    // More accurate check for formatting markers
    const hasBoldFormatting = /\*\*[^*]+\*\*/.test(content);
    const hasItalicFormatting = /(?<!\*)\*[^*]+\*(?!\*)/.test(content);
    const hasRedFormatting = /\{red\}[^}]+\{\/red\}/.test(content);
    const hasFormatting = hasBoldFormatting || hasItalicFormatting || hasRedFormatting;

    // 基础样式 - 字体渲染已在全局CSS中统一处理
    const baseStyle = {
        ...style,
        fontWeight: 'inherit' // 确保继承父元素的字体粗细
    };

    // 特别优化"退出登录"文本
    if (content === "退出登录") {
        baseStyle.fontWeight = '600';
        baseStyle.letterSpacing = '0.02em';
    }

    // 特别优化侧边栏菜单项文本
    const sidebarMenuItems = [
        "AI分析", "成绩概览", "数据图表", "最佳成绩", "新的记录", "刷题历史",
        "学习计划", "倒计时", "日程管理", "知识点录入", "知识点汇总",
        "文本摘录", "暂定"
    ];

    if (sidebarMenuItems.includes(content)) {
        baseStyle.fontWeight = '500';
        baseStyle.letterSpacing = '0.01em';
    }

    if (hasFormatting) {
        // Render formatted text
        return (
            <Component
                className={cn("mixed-text", className)}
                style={{ ...baseStyle, fontFamily: 'inherit' }}
                onClick={onClick}
            >
                {renderFormattedText(content)}
            </Component>
        );
    }

    const textType = getTextType(content);

    // 如果是纯中文或纯英文，直接应用字体样式
    if (textType === 'chinese' || textType === 'english') {
        const fontStyle = generateFontStyle(content, config);
        return (
            <Component
                className={cn("mixed-text", className)}
                style={{ ...fontStyle, ...baseStyle }}
                onClick={onClick}
            >
                {content}
            </Component>
        );
    }

    // 如果是混合文本，使用统一的字体样式，不分割
    const fontStyle = generateFontStyle(content, config);
    return (
        <Component
            className={cn("mixed-text", className)}
            style={{ ...fontStyle, ...baseStyle }}
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

    // 标题样式 - 字体渲染已在全局CSS中统一处理
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
    // 段落样式 - 字体渲染已在全局CSS中统一处理
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
    // 添加字体平滑属性到标签样式
    const labelStyle: React.CSSProperties = {
        ...style,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility'
    };

    return (
        <label className={cn('text-sm font-medium', className)} style={labelStyle} onClick={onClick}>
            <MixedText text={text} />
        </label>
    );
});