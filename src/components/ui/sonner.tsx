"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "#000",
          "--normal-border": "var(--border)",
          "--dark-normal-text": "#fff", // 新增：深色模式下主文本为白色
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
