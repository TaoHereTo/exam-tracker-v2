import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-95 transition-transform",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
                destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
                outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
                secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
                link: "text-primary underline-offset-4 hover:underline",
                // ReactBits风格变体
                reactbits: "bg-gradient-to-br from-purple-600 to-blue-600 text-white",
                reactbitsPrimary: "bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white",
                reactbitsSecondary: "bg-gradient-to-br from-gray-600 to-gray-700 text-white",
                reactbitsDestructive: "bg-gradient-to-br from-red-500 to-red-700 text-white",
                reactbitsOutline: "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border border-gray-300 hover:text-gray-900",
            },
            size: {
                default: "h-9 px-4 py-2 has-[>svg]:px-3",
                sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
                lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

type GradientColor = 'purple' | 'green' | 'yellow' | 'red' | 'blue' | 'gray';
interface UnifiedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    children: React.ReactNode;
    asChild?: boolean;
    gradient?: GradientColor;
}

const UnifiedButton = forwardRef<HTMLButtonElement, UnifiedButtonProps>(({
    className,
    variant,
    size,
    asChild = false,
    children,
    ...props
}, ref) => {
    const Comp = asChild ? "button" : "button";
    const isReactBitsStyle = variant?.startsWith('reactbits');

    // 处理reactbits风格的自定义渐变色
    let gradientClass = '';
    if (isReactBitsStyle) {
        switch (props.gradient) {
            case 'green':
                gradientClass = 'bg-gradient-to-br from-green-600 to-emerald-700';
                break;
            case 'yellow':
                gradientClass = 'bg-gradient-to-br from-orange-600 to-amber-700';
                break;
            case 'red':
                gradientClass = 'bg-gradient-to-br from-red-600 to-red-800';
                break;
            case 'blue':
                gradientClass = 'bg-gradient-to-br from-blue-600 to-indigo-700';
                break;
            case 'gray':
                gradientClass = 'bg-gradient-to-br from-gray-500 to-gray-700';
                break;
            default:
                gradientClass = 'bg-gradient-to-br from-purple-600 to-blue-600';
        }
    }

    return (
        <Comp
            ref={ref}
            data-slot="button"
            className={cn(
                buttonVariants({ variant, size }),
                isReactBitsStyle && [gradientClass, 'reactbits-button'],
                className
            )}
            {...props}
        >
            {children}
            {/* ReactBits风格的特殊效果 */}
            {isReactBitsStyle && (
                <>
                    <div className="glass-effect" />
                    <div className="shimmer-effect" />
                </>
            )}
        </Comp>
    );
});

UnifiedButton.displayName = 'UnifiedButton';

export { UnifiedButton, buttonVariants }; 