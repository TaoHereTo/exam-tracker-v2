"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        data-slot="dialog-overlay"
        className={cn(
            "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className
        )}
        {...props}
    />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            data-slot="dialog-content"
            className={cn(
                "fixed left-[50%] top-[50%] z-50 grid w-11/12 max-w-5xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-4xl md:max-w-5xl",
                className
            )}
            {...props}
        >
            {typeof children === 'string' ? <MixedText text={children} /> : children}
            <DialogPrimitive.Close data-slot="dialog-close" className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only"><MixedText text="关闭" /></span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
>(function DialogHeader({ className, children, ...props }, ref) {
    return (
        <div
            ref={ref}
            data-slot="dialog-header"
            className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
            {...props}
        >
            {typeof children === 'string' ? <MixedText text={children} /> : children}
        </div>
    )
})
DialogHeader.displayName = "DialogHeader"

const DialogFooter = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
>(function DialogFooter({ className, children, ...props }, ref) {
    return (
        <div
            ref={ref}
            data-slot="dialog-footer"
            className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0", className)}
            {...props}
        >
            {typeof children === 'string' ? <MixedText text={children} /> : children}
        </div>
    )
})
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
    HTMLHeadingElement,
    React.ComponentProps<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, children, ...props }, ref) {
    return (
        <DialogPrimitive.Title
            ref={ref}
            data-slot="dialog-title"
            className={cn("text-lg sm:text-xl font-semibold leading-none tracking-tight", className)}
            {...props}
        >
            {typeof children === 'string' ? <MixedText text={children} /> : children}
        </DialogPrimitive.Title>
    )
})
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.ComponentProps<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, children, ...props }, ref) {
    return (
        <DialogPrimitive.Description
            ref={ref}
            data-slot="dialog-description"
            className={cn("text-sm sm:text-base text-muted-foreground", className)}
            {...props}
        >
            {typeof children === 'string' ? <MixedText text={children} /> : children}
        </DialogPrimitive.Description>
    )
})
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}