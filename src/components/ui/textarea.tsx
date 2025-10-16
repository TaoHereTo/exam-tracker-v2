import * as React from "react"

import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  placeholder?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, onKeyDown, value, placeholder, ...props }, ref) {
    return (
      <div className="relative">
        <textarea
          ref={ref}
          data-slot="textarea"
          className={cn(
            "placeholder:text-gray-400 dark:placeholder:text-gray-500 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "bg-[color:var(--textarea-background)]",
            "border-[color:var(--input-border)]",
            // 默认状态：无 ring
            "shadow-[0_0_0_0px_transparent]",
            // 过渡动画：只过渡 box-shadow 和 border-color
            "transition-[box-shadow,border-color] duration-200 ease-in-out",
            // 浅色模式焦点状态
            "focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.5)]",
            "focus-visible:border-blue-500 focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.5)]",
            // 深色模式焦点效果
            "dark:focus:border-blue-400 dark:focus:shadow-[0_0_0_3px_rgba(96,165,250,0.5)]",
            "dark:focus-visible:border-blue-400 dark:focus-visible:shadow-[0_0_0_3px_rgba(96,165,250,0.5)]",
            // 错误状态
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className
          )}
          style={{
            fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            fontVariantLigatures: 'common-ligatures',
            fontKerning: 'normal',
            letterSpacing: '0.01em',
            lineHeight: '1.6',
            ...props.style
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation();
            if (onKeyDown) onKeyDown(e);
          }}
          value={value}
          placeholder={placeholder}
          {...props}
        />
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }