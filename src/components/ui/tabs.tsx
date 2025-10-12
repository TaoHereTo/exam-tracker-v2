"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"
import { useThemeColor } from "@/contexts/ThemeColorContext"

const Tabs = TabsPrimitive.Root

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
    themeColor?: string;
}

const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    TabsListProps
>(({ className, themeColor, ...props }, ref) => {
    const { themeColor: contextThemeColor } = useThemeColor();
    const finalThemeColor = themeColor || contextThemeColor;

    return (
        <TabsPrimitive.List
            ref={ref}
            className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
                className
            )}
            style={{
                '--tabs-theme-color': finalThemeColor,
                boxShadow: '0 2px 10px rgba(0,0,0,0.12), 0 -2px 8px rgba(0,0,0,0.08), 0 0 12px rgba(0,0,0,0.06)'
            } as React.CSSProperties}
            {...props}
        />
    )
})
TabsList.displayName = TabsPrimitive.List.displayName

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
    themeColor?: string;
}

const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    TabsTriggerProps
>(({ className, themeColor, ...props }, ref) => {
    const { themeColor: contextThemeColor } = useThemeColor();
    const finalThemeColor = themeColor || contextThemeColor;

    return (
        <TabsPrimitive.Trigger
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                // 未选中状态：使用 muted-foreground（浅色模式是灰色，深色模式也是灰色）
                "text-muted-foreground",
                // 悬停状态：颜色变深/亮
                "hover:text-foreground",
                // 选中状态：纯黑/纯白
                "data-[state=active]:text-foreground data-[state=active]:shadow",
                className
            )}
            style={{
                '--tabs-theme-color': finalThemeColor,
            } as React.CSSProperties}
            {...props}
        />
    )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn(
            "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
        )}
        {...props}
    />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
