import React from 'react';

// 字体管理工具
export interface FontConfig {
    chineseFont: string;
    englishFont: string;
    fallbackFont: string;
}

// 默认字体配置 - 优化高DPI显示
export const defaultFontConfig: FontConfig = {
    chineseFont: '思源宋体',
    englishFont: 'Times New Roman',
    fallbackFont: 'serif'
};

// 中文字符检测正则表达式
const CHINESE_CHAR_REGEX = /[\u4e00-\u9fa5]/;
const ENGLISH_CHAR_REGEX = /[a-zA-Z0-9]/;

// 检测文本是否包含中文字符
export function containsChinese(text: string): boolean {
    return CHINESE_CHAR_REGEX.test(text);
}

// 检测文本是否包含英文字符
export function containsEnglish(text: string): boolean {
    return ENGLISH_CHAR_REGEX.test(text);
}

// 检测文本类型
export function getTextType(text: string): 'chinese' | 'english' | 'mixed' {
    const hasChinese = containsChinese(text);
    const hasEnglish = containsEnglish(text);

    if (hasChinese && !hasEnglish) return 'chinese';
    if (hasEnglish && !hasChinese) return 'english';
    return 'mixed';
}

// 生成字体样式 - 添加高DPI优化
export function generateFontStyle(text: string, config: FontConfig = defaultFontConfig): React.CSSProperties {
    const textType = getTextType(text);

    switch (textType) {
        case 'chinese':
            return {
                fontFamily: `'${config.chineseFont}', ${config.fallbackFont}`,
                fontWeight: 'inherit', // 继承父元素的字体粗细
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility'
            };
        case 'english':
            return {
                fontFamily: `'${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 'inherit', // 继承父元素的字体粗细
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility'
            };
        case 'mixed':
            return {
                fontFamily: `'${config.chineseFont}', '${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 'inherit', // 继承父元素的字体粗细
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility'
            };
        default:
            return {
                fontFamily: `'${config.chineseFont}', '${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 'inherit', // 继承父元素的字体粗细
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility'
            };
    }
}

// 生成CSS类名
export function generateFontClassName(text: string): string {
    const textType = getTextType(text);
    return `font-${textType}`;
}

// 分割混合文本
export function splitMixedText(text: string): Array<{ text: string; type: 'chinese' | 'english' | 'other' }> {
    const parts: Array<{ text: string; type: 'chinese' | 'english' | 'other' }> = [];
    let currentPart = '';
    let currentType: 'chinese' | 'english' | 'other' = 'other';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        let charType: 'chinese' | 'english' | 'other';

        if (CHINESE_CHAR_REGEX.test(char)) {
            charType = 'chinese';
        } else if (ENGLISH_CHAR_REGEX.test(char)) {
            charType = 'english';
        } else {
            charType = 'other';
        }

        if (charType !== currentType && currentPart) {
            parts.push({ text: currentPart, type: currentType });
            currentPart = '';
        }

        currentPart += char;
        currentType = charType;
    }

    if (currentPart) {
        parts.push({ text: currentPart, type: currentType });
    }

    return parts;
}

// 生成混合文本的字体样式 - 添加高DPI优化
export function generateMixedTextStyle(part: { text: string; type: 'chinese' | 'english' | 'other' }, config: FontConfig = defaultFontConfig): React.CSSProperties {
    switch (part.type) {
        case 'chinese':
            return {
                fontFamily: `'${config.chineseFont}', ${config.fallbackFont}`,
                fontWeight: 'inherit', // 继承父元素的字体粗细
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility'
            };
        case 'english':
            return {
                fontFamily: `'${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 'inherit', // 继承父元素的字体粗细
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility'
            };
        case 'other':
            return {
                fontFamily: `'${config.chineseFont}', '${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 'inherit', // 继承父元素的字体粗细
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility'
            };
        default:
            return {
                fontFamily: `'${config.chineseFont}', '${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 'inherit', // 继承父元素的字体粗细
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility'
            };
    }
}

// Function to parse and render formatted text - 添加字体平滑优化
export const renderFormattedText = (text: string) => {
    if (!text || typeof text !== 'string') {
        return text;
    }

    // Use simpler regex patterns that are more compatible
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const italicRegex = /\*([^*]+)\*/g;
    const redRegex = /\{red\}([^{}]+)\{\/red\}/g;

    // Split text by all patterns
    const parts: { text: string; type: 'normal' | 'bold' | 'italic' | 'red' }[] = [];
    let lastIndex = 0;

    // Find all matches using a simpler approach
    const allMatches: { index: number; match: string; type: 'bold' | 'italic' | 'red'; content: string }[] = [];

    // Find bold matches
    let match;
    while ((match = boldRegex.exec(text)) !== null) {
        allMatches.push({
            index: match.index,
            match: match[0],
            type: 'bold',
            content: match[1]
        });
    }

    // Reset and find italic matches (but exclude those already matched by bold)
    italicRegex.lastIndex = 0;
    while ((match = italicRegex.exec(text)) !== null) {
        // Skip if this is part of a bold pattern
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

    // Reset and find red matches
    redRegex.lastIndex = 0;
    while ((match = redRegex.exec(text)) !== null) {
        allMatches.push({
            index: match.index,
            match: match[0],
            type: 'red',
            content: match[1]
        });
    }

    // Sort matches by index
    allMatches.sort((a, b) => a.index - b.index);

    // Remove overlapping matches
    const nonOverlappingMatches = allMatches.filter((current, index) => {
        if (index === 0) return true;
        const previous = allMatches[index - 1];
        return current.index >= previous.index + previous.match.length;
    });

    // Process matches
    for (const { index, match, type, content } of nonOverlappingMatches) {
        // Add text before match
        if (index > lastIndex) {
            parts.push({
                text: text.substring(lastIndex, index),
                type: 'normal'
            });
        }

        // Add formatted text
        parts.push({
            text: content,
            type
        });

        lastIndex = index + match.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push({
            text: text.substring(lastIndex),
            type: 'normal'
        });
    }

    // If no formatting found, return original text
    if (parts.length === 0) {
        return text;
    }

    return parts.map((part, index) => {
        switch (part.type) {
            case 'bold':
                return React.createElement('strong', {
                    key: index,
                    className: 'font-bold',
                    style: {
                        fontWeight: 'bold',
                        fontFamily: 'inherit',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                    }
                }, part.text);
            case 'italic':
                return React.createElement('em', {
                    key: index,
                    className: 'italic',
                    style: {
                        fontStyle: 'italic',
                        fontFamily: 'inherit',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                    }
                }, part.text);
            case 'red':
                return React.createElement('span', {
                    key: index,
                    className: 'text-red-500',
                    style: {
                        color: '#ef4444',
                        fontFamily: 'inherit',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                    }
                }, part.text);
            default:
                return React.createElement(React.Fragment, { key: index }, part.text);
        }
    });
};