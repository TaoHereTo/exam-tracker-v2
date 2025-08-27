"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof TabsPrimitive.Root>
>(function Tabs({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Root
      ref={ref}
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
})

Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof TabsPrimitive.List>
>(function TabsList({ className, children, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted/20 backdrop-blur-md border border-gray-300/70 dark:border-gray-600/70 shadow-lg p-1 text-muted-foreground w-fit",
        className
      )}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </TabsPrimitive.List>
  )
})

TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, children, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white/70 data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:backdrop-blur-sm data-[state=active]:border data-[state=active]:border-white/20 data-[state=active]:font-medium dark:data-[state=active]:bg-white/15 dark:data-[state=active]:border-white/10",
        className
      )}
      style={{
        outline: 'none'
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = 'none';
        // Only remove box-shadow if not in active state
        if (e.currentTarget.dataset.state !== 'active') {
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </TabsPrimitive.Trigger>
  )
})

TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof TabsPrimitive.Content>
>(function TabsContent({ className, children, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      data-slot="tabs-content"
      className={cn("mt-2 rounded-md border border-muted bg-background p-6", className)}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </TabsPrimitive.Content>
  )
})

TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }