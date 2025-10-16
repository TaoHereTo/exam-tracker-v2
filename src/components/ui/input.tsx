import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-500 selection:bg-primary selection:text-primary-foreground bg-white dark:bg-[#303030] border-[color:var(--input-border)] flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
        ...props.style
      }}
      {...props}
    />
  )
}

export { Input }
