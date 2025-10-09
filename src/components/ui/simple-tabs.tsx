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

    useEffect(() => {
        if (!containerRef.current) return;

        const activeTab = containerRef.current.querySelector(`[data-tab-value="${activeValue}"]`) as HTMLElement;
        if (activeTab) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const tabRect = activeTab.getBoundingClientRect();

            setHighlightStyle({
                left: tabRect.left - containerRect.left,
                width: tabRect.width
            });
        }
    }, [activeValue]);

    return (
        <div
            ref={containerRef}
            className={cn('relative inline-flex items-center justify-center rounded-full backdrop-blur-md p-1 text-muted-foreground unselectable', className?.includes('grid') ? 'h-auto' : 'h-9', className)}
            style={{
                zIndex: 10,
                backgroundColor: 'transparent',
                backdropFilter: 'blur(12px) saturate(180%)',
                WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.12), 0 -2px 8px rgba(0,0,0,0.08), 0 0 12px rgba(0,0,0,0.06)'
            }}
        >
            {/* 高亮背景 - 优化的毛玻璃效果 */}
            <motion.div
                className="absolute inset-y-1 backdrop-blur-sm rounded-full"
                style={{
                    // 使用更均匀的颜色，减少发白现象
                    background: `
                        linear-gradient(135deg, 
                            rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.85) 0%, 
                            rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.8) 25%,
                            rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.82) 50%, 
                            rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.8) 75%,
                            rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.85) 100%
                        ),
                        radial-gradient(circle at center, 
                            rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.1) 0%, 
                            transparent 70%
                        )
                    `,
                    backdropFilter: 'blur(8px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(8px) saturate(150%)',
                    // 减少内发光，避免发白
                    boxShadow: `
                        0 2px 8px rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.25),
                        0 1px 3px rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `,
                    // 调整边框透明度，让边缘更柔和
                    border: `1px solid rgba(${hexToRgb(themeColor || '#2A4DD0')}, 0.2)`,
                }}
                initial={false}
                animate={{
                    left: highlightStyle.left,
                    width: highlightStyle.width,
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
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
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                pointerEvents: isActive ? 'auto' : 'none'
            }}
        >
            {children}
        </motion.div>
    );
}
