// 字体管理工具
export interface FontConfig {
    chineseFont: string;
    englishFont: string;
    fallbackFont: string;
}

// 默认字体配置
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

// 生成字体样式
export function generateFontStyle(text: string, config: FontConfig = defaultFontConfig): React.CSSProperties {
    const textType = getTextType(text);

    switch (textType) {
        case 'chinese':
            return {
                fontFamily: `'${config.chineseFont}', ${config.fallbackFont}`,
                fontWeight: 400
            };
        case 'english':
            return {
                fontFamily: `'${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 400
            };
        case 'mixed':
            return {
                fontFamily: `'${config.chineseFont}', '${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 400
            };
        default:
            return {
                fontFamily: `'${config.chineseFont}', '${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 400
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

// 生成混合文本的字体样式
export function generateMixedTextStyle(part: { text: string; type: 'chinese' | 'english' | 'other' }, config: FontConfig = defaultFontConfig): React.CSSProperties {
    switch (part.type) {
        case 'chinese':
            return {
                fontFamily: `'${config.chineseFont}', ${config.fallbackFont}`,
                fontWeight: 400
            };
        case 'english':
            return {
                fontFamily: `'${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 400
            };
        case 'other':
            return {
                fontFamily: `'${config.chineseFont}', '${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 400
            };
        default:
            return {
                fontFamily: `'${config.chineseFont}', '${config.englishFont}', ${config.fallbackFont}`,
                fontWeight: 400
            };
    }
} 