import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const capsuleButtonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-white text-black border border-gray-200 hover:bg-gray-50 dark:bg-black dark:text-white dark:border-gray-700 dark:hover:bg-gray-900",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-6 py-2",
                sm: "h-9 rounded-full px-3",
                lg: "h-11 rounded-full px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

interface CapsuleButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof capsuleButtonVariants> {
    asChild?: boolean
}

const CapsuleButton = React.forwardRef<HTMLButtonElement, CapsuleButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        return (
            <button
                className={cn(capsuleButtonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
CapsuleButton.displayName = "CapsuleButton"

export { CapsuleButton, capsuleButtonVariants }
export type { CapsuleButtonProps }
