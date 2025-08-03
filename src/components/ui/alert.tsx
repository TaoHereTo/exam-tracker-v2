import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"

const alertVariants = cva(
    "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
    {
        variants: {
            variant: {
                default: "bg-background text-foreground",
                destructive:
                    "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Alert({ className, variant, children, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
    return (
        <div className={cn(alertVariants({ variant }), className)} {...props}>
            {typeof children === 'string' ? <MixedText text={children} /> : children}
        </div>
    )
}

function AlertTitle({ className, children, ...props }: React.ComponentProps<"h5">) {
    return (
        <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props}>
            {typeof children === 'string' ? <MixedText text={children} /> : children}
        </h5>
    )
}

function AlertDescription({ className, children, ...props }: React.ComponentProps<"div">) {
    return (
        <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props}>
            {typeof children === 'string' ? <MixedText text={children} /> : children}
        </div>
    )
}

export { Alert, AlertTitle, AlertDescription } 