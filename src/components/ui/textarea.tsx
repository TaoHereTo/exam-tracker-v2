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
            "placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "bg-[color:var(--textarea-background)]",
            "border-[color:var(--input-border)]",
            className
          )}
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