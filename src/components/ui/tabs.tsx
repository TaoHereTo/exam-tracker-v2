"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
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
}

function TabsTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
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
}

function TabsContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("mt-2 rounded-md border border-muted bg-background p-6", className)}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </TabsPrimitive.Content>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
