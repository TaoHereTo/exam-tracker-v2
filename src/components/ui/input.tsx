import * as React from "react"

import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"
import { generateFontStyle } from "@/lib/fontUtils"

interface InputProps extends React.ComponentProps<"input"> {
  placeholder?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type, onKeyDown, value, placeholder, ...props }, ref) {
    // 生成字体样式 - 优先根据实际输入值决定字体，其次才根据占位符
    const valueText = (value !== undefined && value !== null) ? String(value) : '';
    const basisText = valueText.trim().length > 0 ? valueText : (placeholder || '');
    const fontStyle = generateFontStyle(basisText);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={type}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input flex h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm sm:text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 md:text-base",
            "border-[color:var(--input-border)]",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
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

Input.displayName = "Input"

export { Input }