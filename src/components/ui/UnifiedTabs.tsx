"use client";

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/ui/simple-tabs";
import { cn } from "@/lib/utils";

// 统一的 Tabs 组件接口
interface UnifiedTabsProps {
    defaultValue: string;
    className?: string;
    children: React.ReactNode;
}

interface UnifiedTabsListProps {
    className?: string;
    children: React.ReactNode;
}

interface UnifiedTabsTriggerProps {
    value: string;
    className?: string;
    children: React.ReactNode;
}

interface UnifiedTabsContentProps {
    value: string;
    className?: string;
    children: React.ReactNode;
}

// 导出统一的组件
export function UnifiedTabs({ defaultValue, className, children }: UnifiedTabsProps) {
    return (
        <Tabs defaultValue={defaultValue} className={className}>
            {children}
        </Tabs>
    );
}

export function UnifiedTabsList({ className, children }: UnifiedTabsListProps) {
    return (
        <TabsList className={className}>
            {children}
        </TabsList>
    );
}

export function UnifiedTabsTrigger({ value, className, children }: UnifiedTabsTriggerProps) {
    return (
        <TabsTrigger value={value} className={className}>
            {children}
        </TabsTrigger>
    );
}

export function UnifiedTabsContents({ className, children, ...props }: { className?: string; children: React.ReactNode;[key: string]: unknown }) {
    return (
        <TabsContents className={className} {...props}>
            {children}
        </TabsContents>
    );
}

export function UnifiedTabsContent({ value, className, children }: UnifiedTabsContentProps) {
    return (
        <TabsContent value={value} className={className}>
            {children}
        </TabsContent>
    );
}

// 导出类型
export type { UnifiedTabsProps, UnifiedTabsListProps, UnifiedTabsTriggerProps, UnifiedTabsContentProps };