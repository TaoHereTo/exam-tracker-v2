"use client";

import React, { createContext, useContext, ReactNode } from 'react';

interface ThemeColorContextType {
    themeColor: string;
    setThemeColor: (color: string) => void;
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

interface ThemeColorProviderProps {
    children: ReactNode;
    defaultColor?: string;
}

export function ThemeColorProvider({ children, defaultColor = '#2A4DD0' }: ThemeColorProviderProps) {
    const [themeColor, setThemeColor] = React.useState(defaultColor);

    return (
        <ThemeColorContext.Provider value={{ themeColor, setThemeColor }}>
            {children}
        </ThemeColorContext.Provider>
    );
}

export function useThemeColor() {
    const context = useContext(ThemeColorContext);
    if (context === undefined) {
        throw new Error('useThemeColor must be used within a ThemeColorProvider');
    }
    return context;
}

// 页面主题颜色常量
export const PAGE_THEME_COLORS = {
    'plans': '#2A4DD0',      // 学习计划页面 - 蓝色
    'countdown': '#db2777',   // 倒计时页面 - 粉色
    'notes': '#ea580c',       // 笔记页面 - 橙色
    'schedule': '#8b5cf6',    // 日程管理页面 - 紫色
    'history': '#0d9488',     // 历史记录页面 - 青色
    'knowledge': '#1e3a8a',   // 知识管理页面 - 深蓝色（与保存按钮一致）
    'overview': '#3b82f6',    // 概览页面 - 蓝色
    'charts': '#06b6d4',      // 图表页面 - 青色
    'settings': '#6b7280',    // 设置页面 - 灰色
} as const;

export type PageThemeKey = keyof typeof PAGE_THEME_COLORS;
