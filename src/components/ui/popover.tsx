"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"

function Popover({
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props}>{children}</PopoverPrimitive.Root>
}

function PopoverTrigger({ className, children, ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return (
    <PopoverPrimitive.Trigger className={cn("outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props}>
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </PopoverPrimitive.Trigger>
  )
}

function PopoverContent({ className, children, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        className={cn(
          "z-[100010] w-auto rounded-md border p-4 outline-none",
          "bg-white dark:bg-black",
          "border-[color:var(--input-border)]",
          "text-black dark:text-white",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        {typeof children === 'string' ? <MixedText text={children} /> : children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }