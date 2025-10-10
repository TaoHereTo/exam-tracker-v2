import * as React from 'react';

import {
  Progress as ProgressPrimitive,
  ProgressIndicator as ProgressIndicatorPrimitive,
  type ProgressProps as ProgressPrimitiveProps,
} from '@/components/animate-ui/primitives/radix/progress';
import { cn } from '@/lib/utils';

interface ProgressProps extends ProgressPrimitiveProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'plan' | 'upload';
  showText?: boolean;
  textClassName?: string;
}

function Progress({ className, value, variant = 'default', showText = false, textClassName, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max(value || 0, 0), 100);

  const variantStyles = {
    default: {
      bg: "bg-primary/20",
      indicator: "bg-primary",
      text: "text-gray-900 dark:text-gray-100"
    },
    success: {
      bg: "bg-green-500/20",
      indicator: "bg-green-500",
      text: "text-gray-900 dark:text-gray-100"
    },
    warning: {
      bg: "bg-yellow-500/20",
      indicator: "bg-yellow-500",
      text: "text-gray-900 dark:text-gray-100"
    },
    danger: {
      bg: "bg-red-500/20",
      indicator: "bg-red-500",
      text: "text-gray-900 dark:text-gray-100"
    },
    info: {
      bg: "bg-cyan-500/20",
      indicator: "bg-cyan-500",
      text: "text-gray-900 dark:text-gray-100"
    },
    plan: {
      bg: "bg-[#2A4DD0]/20",
      indicator: "bg-[#2A4DD0]",
      text: "text-gray-900 dark:text-gray-100"
    },
    upload: {
      bg: "bg-[#8b5cf6]/20",
      indicator: "bg-[#8b5cf6]",
      text: "text-gray-900 dark:text-gray-100"
    }
  };

  const currentVariant = variantStyles[variant];

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
      <ProgressPrimitive
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full',
          currentVariant.bg,
          className,
        )}
        value={percentage}
        {...props}
      >
        <ProgressIndicatorPrimitive className={cn(
          "rounded-full h-full w-full flex-1 transition-all duration-300 ease-out",
          currentVariant.indicator
        )} />
      </ProgressPrimitive>
    </div>
  );
}

export { Progress, type ProgressProps };
