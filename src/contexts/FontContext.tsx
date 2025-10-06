"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FontConfig, defaultFontConfig } from '@/lib/fontUtils';

interface FontContextType {
    fontConfig: FontConfig;
    updateFontConfig: (config: Partial<FontConfig>) => void;
    resetFontConfig: () => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

interface FontProviderProps {
    children: ReactNode;
    initialConfig?: Partial<FontConfig>;
}

// 从本地存储加载字体配置
const loadFontConfigFromStorage = (): FontConfig => {
    if (typeof window === 'undefined') return defaultFontConfig;

    try {
        const stored = localStorage.getItem('font-config');
        if (stored) {
            const parsed = JSON.parse(stored);
            // 如果本地存储中有配置，使用用户的选择
            return parsed;
        }
    } catch (error) {
        console.warn('Failed to load font config from localStorage:', error);
    }

    // 首次使用，检测系统字体
    return defaultFontConfig;
};

// 保存字体配置到本地存储
const saveFontConfigToStorage = (config: FontConfig) => {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem('font-config', JSON.stringify(config));
    } catch (error) {
        console.warn('Failed to save font config to localStorage:', error);
    }
};

export function FontProvider({ children, initialConfig = {} }: FontProviderProps) {
    const [fontConfig, setFontConfig] = useState<FontConfig>(() => {
        const storedConfig = loadFontConfigFromStorage();
        return { ...storedConfig, ...initialConfig };
    });

    // 监听字体配置变化并保存到本地存储
    useEffect(() => {
        saveFontConfigToStorage(fontConfig);

        // 更新全局CSS变量
        updateGlobalFontCSS(fontConfig.chineseFont, fontConfig.englishFont);
    }, [fontConfig]);

    const updateFontConfig = (config: Partial<FontConfig>) => {
        setFontConfig(prev => {
            const newConfig = { ...prev, ...config };
            return newConfig;
        });
    };

    const resetFontConfig = () => {
        setFontConfig(defaultFontConfig);
    };

    return (
        <FontContext.Provider value={{ fontConfig, updateFontConfig, resetFontConfig }}>
            {children}
        </FontContext.Provider>
    );
}

// 更新全局CSS变量的辅助函数
const updateGlobalFontCSS = (chineseFont: string, englishFont: string) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    root.style.setProperty('--chinese-font', `'${chineseFont}'`);
    root.style.setProperty('--english-font', `'${englishFont}'`);

    // 更新或创建全局字体样式
    let globalStyle = document.getElementById('global-font-style');
    if (!globalStyle) {
        globalStyle = document.createElement('style');
        globalStyle.id = 'global-font-style';
        document.head.appendChild(globalStyle);
    }

    globalStyle.textContent = `
        * {
            font-family: var(--chinese-font), var(--english-font), serif;
        }
    `;
};

export function useFont() {
    const context = useContext(FontContext);
    if (context === undefined) {
        throw new Error('useFont must be used within a FontProvider');
    }
    return context;
}