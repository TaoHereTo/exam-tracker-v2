import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, VariantProps } from "class-variance-authority";
import React from "react";
import { MixedText } from "@/components/ui/MixedText";

const rainbowButtonVariants = cva(
  cn(
    "relative cursor-pointer group transition-all animate-rainbow",
    "inline-flex items-center justify-center gap-2 shrink-0",
    "rounded-xl outline-none focus-visible:ring-[3px] aria-invalid:border-destructive",
    "text-sm font-medium whitespace-nowrap",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    "active:scale-95 active:shadow-inner",
  ),
  {
    variants: {
      variant: {
        default:
          "border-0 bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff_50%,rgba(255,255,255,0.6)_80%,rgba(0,0,0,0)),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] text-foreground [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.125rem)_solid_transparent] before:absolute before:bottom-[-25%] before:left-1/2 before:z-0 before:h-1/4 before:w-[60%] before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] before:[filter:blur(0.75rem)] before:rounded-3xl after:absolute after:inset-0 after:rounded-xl after:border-[1px] after:border-gray-300/80 after:bg-gradient-to-b after:from-gray-100/50 after:to-gray-50/30 after:shadow-[0_0_15px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] dark:text-white dark:before:w-3/5 dark:after:border-white/30 dark:after:from-white/15 dark:after:to-white/5",
        outline:
          "border border-input border-b-transparent bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff_50%,rgba(255,255,255,0.6)_80%,rgba(0,0,0,0)),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] text-foreground [background-clip:padding-box,border-box,border-box] [background-origin:border-box] before:absolute before:bottom-[-25%] before:left-1/2 before:z-0 before:h-1/4 before:w-[60%] before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] before:[filter:blur(0.75rem)] before:rounded-3xl after:absolute after:inset-0 after:rounded-xl after:border-[2px] after:border-gray-300/80 after:bg-gradient-to-b after:from-gray-100/50 after:to-gray-50/30 after:shadow-[0_0_15px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-[linear-gradient(#0a0a0a,#0a0a0a),linear-gradient(#0a0a0a_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] dark:text-white dark:before:w-3/5 dark:after:border-white/30 dark:after:from-white/15 dark:after:to-white/5",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-xl px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof rainbowButtonVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // 处理子元素，确保文字使用MixedText
    const renderChildren = () => {
      if (typeof children === 'string') {
        return <MixedText text={children} />
      }
      return children
    }

    return (
      <Comp
        data-slot="button"
        className={cn(rainbowButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {renderChildren()}
      </Comp>
    );
  },
);

RainbowButton.displayName = "RainbowButton";

export { RainbowButton, rainbowButtonVariants, type RainbowButtonProps };
