"use client";

import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface TabsContextType {
    activeValue: string;
    setActiveValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('useTabsContext must be used within a Tabs component');
    }
    return context;
};

interface TabsProps {
    defaultValue: string;
    className?: string;
    children: React.ReactNode;
}

export function Tabs({ defaultValue, className, children }: TabsProps) {
    const [activeValue, setActiveValue] = useState(defaultValue);

    return (
        <TabsContext.Provider value={{ activeValue, setActiveValue }}>
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
    const { activeValue } = useTabsContext();
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
            className={cn('relative inline-flex items-center justify-center rounded-full bg-white dark:bg-muted/40 backdrop-blur-md border border-white/20 dark:border-white/20 border-white p-1 text-muted-foreground shadow-lg unselectable', className?.includes('grid') ? 'h-auto' : 'h-9', className)}
            style={{ zIndex: 10 }}
        >
            {/* 高亮背景 */}
            <motion.div
                className="absolute inset-y-1 bg-black dark:bg-white backdrop-blur-sm rounded-full shadow-md border border-white/20"
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
                    ? 'text-white dark:text-black'
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
}

export function TabsContent({ value, className, children }: TabsContentProps) {
    const { activeValue } = useTabsContext();
    const isActive = activeValue === value;

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
