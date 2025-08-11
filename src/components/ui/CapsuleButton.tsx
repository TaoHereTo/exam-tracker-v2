import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const capsuleButtonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 active:shadow-inner active:translate-y-0.5 transition-all duration-150 ease-out",
    {
        variants: {
            variant: {
                default: "bg-white text-black border border-gray-200 hover:bg-gray-50 dark:bg-black dark:text-white dark:border-gray-700 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 active:shadow-md",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 active:shadow-md",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:shadow-inner",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 active:shadow-inner",
                ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:shadow-inner",
                link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
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
