"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.Root>
>(function DropdownMenu({ ...props }, ref) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
})

DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuPortal = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.Portal>
>(function DropdownMenuPortal({ children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props}>
      {children}
    </DropdownMenuPrimitive.Portal>
  )
})

DropdownMenuPortal.displayName = DropdownMenuPrimitive.Portal.displayName

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>
>(function DropdownMenuTrigger({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Trigger 
      ref={ref} 
      className={cn("outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)} 
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </DropdownMenuPrimitive.Trigger>
  )
})

DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Content 
      ref={ref} 
      data-slot="dropdown-menu-content" 
      className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-popover p-1 text-popover-foreground shadow-lg animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 text-left", className)} 
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </DropdownMenuPrimitive.Content>
  )
})

DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.Group>
>(function DropdownMenuGroup({ ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Group 
      ref={ref} 
      data-slot="dropdown-menu-group" 
      {...props} 
    />
  )
})

DropdownMenuGroup.displayName = "DropdownMenuGroup"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.Item>
>(function DropdownMenuItem({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item 
      ref={ref} 
      data-slot="dropdown-menu-item" 
      className={cn("relative flex cursor-default select-none items-center justify-start rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-left", className)} 
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </DropdownMenuPrimitive.Item>
  )
})

DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, checked, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.CheckboxItem 
      ref={ref} 
      className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} 
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
    </DropdownMenuPrimitive.CheckboxItem>
  )
})

DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuRadioGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>
>(function DropdownMenuRadioGroup({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.RadioGroup 
      ref={ref} 
      className={cn("", className)} 
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </DropdownMenuPrimitive.RadioGroup>
  )
})

DropdownMenuRadioGroup.displayName = "DropdownMenuRadioGroup"

const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.RadioItem 
      ref={ref} 
      className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} 
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
    </DropdownMenuPrimitive.RadioItem>
  )
})

DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.Label>
>(function DropdownMenuLabel({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label 
      ref={ref} 
      className={cn("px-2 py-1.5 text-sm font-semibold text-left", className)} 
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </DropdownMenuPrimitive.Label>
  )
})

DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator 
      ref={ref} 
      className={cn("-mx-1 my-1 h-px bg-muted", className)} 
      {...props}
    />
  )
})

DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span">
>(function DropdownMenuShortcut({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
})

DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

const DropdownMenuSub = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.Sub>
>(function DropdownMenuSub({ children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props}>
      {children}
    </DropdownMenuPrimitive.Sub>
  )
})

DropdownMenuSub.displayName = DropdownMenuPrimitive.Sub.displayName

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(function DropdownMenuSubTrigger({ className, inset, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        className
      )}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
})

DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>
>(function DropdownMenuSubContent({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  )
})

DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}