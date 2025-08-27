import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border border-[color:var(--input-border)] bg-transparent text-foreground shadow-xs",
        destructive:
          "bg-destructive text-white shadow-xs focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-input border-[color:var(--input-border)]",
        secondary:
          "bg-secondary text-secondary-foreground",
        ghost:
          "",
        pagination:
          "border border-[color:var(--input-border)] bg-input shadow-xs",
        link: "text-primary underline-offset-4",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3 sm:h-12 sm:text-base",
        sm: "h-8 rounded-sm gap-1.5 px-3 has-[>svg]:px-2.5 sm:h-10 sm:text-sm",
        lg: "h-12 rounded-sm px-6 has-[>svg]:px-4 sm:h-14 sm:text-lg",
        icon: "size-10 sm:size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({
    className,
    variant,
    size,
    asChild = false,
    children,
    ...props
  }: ButtonProps, ref) {
    const Comp = asChild ? Slot : "button"

    // 处理子元素，确保文字使用MixedText
    const renderChildren = () => {
      if (typeof children === 'string') {
        return <MixedText text={children} />
      }
      return children
    }

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={variant}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {renderChildren()}
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }