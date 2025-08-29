"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { MixedText } from "./MixedText";

const AlertDialog = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof AlertDialogPrimitive.Root>
>(function AlertDialog({ ...props }, ref) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
})
AlertDialog.displayName = "AlertDialog"

const AlertDialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof AlertDialogPrimitive.Trigger>
>(function AlertDialogTrigger({ ...props }, ref) {
  return (
    <AlertDialogPrimitive.Trigger ref={ref} data-slot="alert-dialog-trigger" {...props} />
  )
})
AlertDialogTrigger.displayName = "AlertDialogTrigger"

const AlertDialogPortal = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof AlertDialogPrimitive.Portal>
>(function AlertDialogPortal({ ...props }, ref) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
})
AlertDialogPortal.displayName = "AlertDialogPortal"

const AlertDialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof AlertDialogPrimitive.Overlay>
>(function AlertDialogOverlay({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
})
AlertDialogOverlay.displayName = "AlertDialogOverlay"

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof AlertDialogPrimitive.Content>
>(function AlertDialogContent({ className, children, ...props }, ref) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg max-h-[90vh] overflow-y-auto",
          className
        )}
        {...props}
      >
        {typeof children === 'string' ? <MixedText text={children} /> : children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
})
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function AlertDialogHeader({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </div>
  )
})
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function AlertDialogFooter({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </div>
  )
})
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentProps<typeof AlertDialogPrimitive.Title>
>(function AlertDialogTitle({ className, children, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </AlertDialogPrimitive.Title>
  )
})
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<typeof AlertDialogPrimitive.Description>
>(function AlertDialogDescription({ className, children, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </AlertDialogPrimitive.Description>
  )
})
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof AlertDialogPrimitive.Action>
>(function AlertDialogAction({ className, children, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={cn(buttonVariants(), className)}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </AlertDialogPrimitive.Action>
  )
})
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof AlertDialogPrimitive.Cancel>
>(function AlertDialogCancel({ className, children, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </AlertDialogPrimitive.Cancel>
  )
})
AlertDialogCancel.displayName = "AlertDialogCancel"

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}