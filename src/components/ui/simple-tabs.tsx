"use client";

import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useThemeColor } from '@/contexts/ThemeColorContext';

interface TabsContextType {
    activeValue: string;
    setActiveValue: (value: string) => void;
    themeColor?: string;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('useTabsContext must be used within a Tabs component');
    }
    return context;
};

// 辅助函数：将十六进制颜色转换为RGB
const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `${r}, ${g}, ${b}`;
    }
    // 默认返回蓝色
    return '42, 77, 208';
};

interface TabsProps {
    defaultValue: string;
    className?: string;
    children: React.ReactNode;
    themeColor?: string;
}

export function Tabs({ defaultValue, className, children, themeColor }: TabsProps) {
    const [activeValue, setActiveValue] = useState(defaultValue);
    const { themeColor: contextThemeColor } = useThemeColor();

    // 优先使用传入的themeColor，其次使用上下文中的themeColor
    const finalThemeColor = themeColor || contextThemeColor;

    return (
        <TabsContext.Provider value={{ activeValue, setActiveValue, themeColor: finalThemeColor }}>
            <div className={cn('w-full', className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

interface TabsContentsProps {
    className?: string;
    children: React.ReactNode;
}

export function TabsContents({ className, children }: TabsContentsProps) {
    return (
        <div className={cn('relative', className)}>
            {children}
        </div>
    );
}

interface TabsListProps {
    className?: string;
    children: React.ReactNode;
}

export function TabsList({ className, children }: TabsListProps) {
    const { activeValue, themeColor } = useTabsContext();
    const containerRef = useRef<HTMLDivElement>(null);
    const [highlightStyle, setHighlightStyle] = useState({ left: 0, width: 0 });
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // 检测深色模式
        const checkDarkMode = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkDarkMode();

        // 监听主题变化
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        const activeTab = containerRef.current.querySelector(`[data-tab-value="${activeValue}"]`) as HTMLElement;
        if (activeTab) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const tabRect = activeTab.getBoundingClientRect();

            // 四舍五入到整数像素，避免亚像素渲染问题
            const left = Math.round(tabRect.left - containerRect.left);
            const width = Math.round(tabRect.width);

            setHighlightStyle({ left, width });
        }
    }, [activeValue]);

    return (
        <div
            ref={containerRef}
            className={cn('relative inline-flex items-center justify-center rounded-full p-1 text-muted-foreground unselectable', className?.includes('grid') ? 'h-auto' : 'h-9', className)}
            style={{
                zIndex: 10,
                backgroundColor: 'transparent',
                boxShadow: isDark
                    ? `0 2px 8px rgba(0,0,0,0.3), 0 -2px 6px rgba(0,0,0,0.2), 0 0 10px rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.25)`
                    : `0 0 10px rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.3), 0 0 20px rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.15)`,
            }}
        >
            {/* 高亮背景 - 使用 Tween 动画（完全消除抖动） */}
            <motion.div
                className="absolute inset-y-1 rounded-full"
                style={{
                    backgroundColor: themeColor || '#2A4DD0',
                    boxShadow: `
                        0 2px 6px rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.35),
                        0 1px 3px rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.25),
                        0 0 12px rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.3)
                    `,
                    willChange: 'transform',
                }}
                initial={false}
                animate={{
                    left: highlightStyle.left,
                    width: highlightStyle.width,
                }}
                transition={{
                    // 使用 tween 动画替代 spring，完全消除抖动
                    type: "tween",
                    duration: 0.25,
                    ease: [0.4, 0.0, 0.2, 1], // cubic-bezier 缓动函数，提供平滑过渡
                }}
            />
            {children}
        </div>
    );
}

interface TabsTriggerProps {
    value: string;
    className?: string;
    children: React.ReactNode;
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps) {
    const { activeValue, setActiveValue } = useTabsContext();
    const isActive = activeValue === value;

    return (
        <button
            data-tab-value={value}
            className={cn(
                'relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 leading-none unselectable',
                isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground',
                className
            )}
            onClick={() => setActiveValue(value)}
        >
            {children}
        </button>
    );
}

interface TabsContentProps {
    value: string;
    className?: string;
    children: React.ReactNode;
    staticLayout?: boolean;
}

export function TabsContent({ value, className, children, staticLayout = false }: TabsContentProps) {
    const { activeValue } = useTabsContext();
    const isActive = activeValue === value;

    if (staticLayout) {
        return (
            <div className={cn('mt-2', className)} style={{ display: isActive ? 'block' : 'none' }}>
                {children}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn('mt-2', className)}
            style={{
                position: 'relative',
                pointerEvents: isActive ? 'auto' : 'none',
                display: isActive ? 'block' : 'none'
            }}
        >
            {children}
        </motion.div>
    );
}
