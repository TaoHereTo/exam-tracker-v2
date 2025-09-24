import * as React from "react"

import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"
import { generateFontStyle } from "@/lib/fontUtils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  placeholder?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, onKeyDown, value, placeholder, ...props }, ref) {
    // 生成字体样式 - 同时考虑placeholder和value
    const fontStyle = generateFontStyle(placeholder || String(value || ''));

    return (
      <div className="relative">
        <textarea
          ref={ref}
          data-slot="textarea"
          className={cn(
            "placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:border-blue-500 focus-visible:ring-0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "bg-white dark:bg-[#303030]",
            "border-[color:var(--input-border)]",
            className
          )}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation();
            if (onKeyDown) onKeyDown(e);
          }}
          value={value}
          placeholder={placeholder}
          style={{
            ...fontStyle,
            ...props.style
          }}
          {...props}
        />
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }