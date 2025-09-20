"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'plan' | 'upload'
  showText?: boolean
  textClassName?: string
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = 'default', showText = false, textClassName, ...props }, ref) => {
  const percentage = Math.min(Math.max(value || 0, 0), 100)

  const variantStyles = {
    default: {
      bg: "bg-blue-500",
      indicator: "bg-blue-500",
      text: "text-gray-900 dark:text-gray-100"
    },
    success: {
      bg: "bg-green-500",
      indicator: "bg-green-500",
      text: "text-gray-900 dark:text-gray-100"
    },
    warning: {
      bg: "bg-yellow-500",
      indicator: "bg-yellow-500",
      text: "text-gray-900 dark:text-gray-100"
    },
    danger: {
      bg: "bg-red-500",
      indicator: "bg-red-500",
      text: "text-gray-900 dark:text-gray-100"
    },
    info: {
      bg: "bg-cyan-500",
      indicator: "bg-cyan-500",
      text: "text-gray-900 dark:text-gray-100"
    },
    plan: {
      bg: "bg-[#06b6d4]",
      indicator: "bg-[#06b6d4]",
      text: "text-gray-900 dark:text-gray-100"
    },
    upload: {
      bg: "bg-[#8b5cf6]",
      indicator: "bg-[#8b5cf6]",
      text: "text-gray-900 dark:text-gray-100"
    }
  }

  const currentVariant = variantStyles[variant]

  return (
    <div className="space-y-1">
      {showText && (
        <div className={cn(
          "text-right text-xs font-medium",
          currentVariant.text,
          textClassName
        )}>
          {Math.round(percentage)}%
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        data-slot="progress"
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
          className
        )}
        value={percentage}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full w-full transition-all duration-300 ease-out",
            currentVariant.indicator
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
})

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
