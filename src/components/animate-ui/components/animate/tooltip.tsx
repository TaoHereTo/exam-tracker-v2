import * as React from 'react';
import * as motion from 'motion/react-client';

import {
  TooltipProvider as TooltipProviderPrimitive,
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
  TooltipContent as TooltipContentPrimitive,
  TooltipArrow as TooltipArrowPrimitive,
  type TooltipProviderProps as TooltipProviderPrimitiveProps,
  type TooltipProps as TooltipPrimitiveProps,
  type TooltipTriggerProps as TooltipTriggerPrimitiveProps,
  type TooltipContentProps as TooltipContentPrimitiveProps,
} from '@/components/animate-ui/primitives/animate/tooltip';
import { cn } from '@/lib/utils';

type TooltipProviderProps = TooltipProviderPrimitiveProps;

function TooltipProvider({ openDelay = 0, ...props }: TooltipProviderProps) {
  return <TooltipProviderPrimitive openDelay={openDelay} {...props} />;
}

type TooltipProps = TooltipPrimitiveProps;

function Tooltip({ sideOffset = 10, ...props }: TooltipProps) {
  return <TooltipPrimitive sideOffset={sideOffset} {...props} />;
}

type TooltipTriggerProps = TooltipTriggerPrimitiveProps;

function TooltipTrigger({ ...props }: TooltipTriggerProps) {
  return <TooltipTriggerPrimitive {...props} />;
}

type TooltipContentProps = Omit<TooltipContentPrimitiveProps, 'asChild'> & {
  children: React.ReactNode;
  layout?: boolean | 'position' | 'size' | 'preserve-aspect';
};

function TooltipContent({
  className,
  children,
  layout = 'preserve-aspect',
  ...props
}: TooltipContentProps) {
  return (
    <TooltipContentPrimitive
      className={cn(
        'w-fit bg-primary text-primary-foreground rounded-md',
        className,
      )}
      style={{
        // 最简化的字体渲染设置
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        // 移除所有可能导致问题的GPU加速设置
        transform: 'none',
        willChange: 'auto',
        backfaceVisibility: 'visible'
      }}
      {...props}
    >
      {/* 最简化的内容结构 - 使用更稳定的居中方式 */}
      <div
        className="overflow-hidden px-3 py-1.5 text-xs text-balance"
        style={{
          textAlign: 'center',
          lineHeight: '1.4',
          display: 'block'
        }}
      >
        {children}
      </div>
      <TooltipArrowPrimitive
        className="fill-primary size-3 data-[side='bottom']:translate-y-[1px] data-[side='right']:translate-x-[1px] data-[side='left']:translate-x-[-1px] data-[side='top']:translate-y-[-1px]"
        tipRadius={2}
      />
    </TooltipContentPrimitive>
  );
}

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  type TooltipProviderProps,
  type TooltipProps,
  type TooltipTriggerProps,
  type TooltipContentProps,
};
