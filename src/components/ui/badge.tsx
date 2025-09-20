import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground",
                outline: "text-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({ className, variant, children, ...props }: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props}>
            {typeof children === 'string' ? <MixedText text={children} /> : children}
        </div>
    )
}

export { Badge, badgeVariants }