"use client";

import { Moon, SunDim } from "lucide-react";
import { useState, useRef } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

type props = {
  className?: string;
};

export const AnimatedThemeToggler = ({ className }: props) => {
  const { theme, setTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const changeTheme = async () => {
    if (!buttonRef.current) return;

    const newTheme = theme === "dark" ? "light" : "dark";

    // 检查浏览器是否支持 View Transition API
    if (!document.startViewTransition) {
      // 如果不支持，直接切换主题
      setTheme(newTheme);
      return;
    }

    try {
      await document.startViewTransition(() => {
        setTheme(newTheme);
      }).ready;

      const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
      const y = top + height / 2;
      const x = left + width / 2;

      // 简化计算，减少性能开销
      const maxRad = Math.max(window.innerWidth, window.innerHeight) * 1.2;

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRad}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 800,
          easing: "ease-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    } catch (error) {
      // 如果动画失败，直接切换主题
      console.warn('Theme transition animation failed:', error);
      setTheme(newTheme);
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={changeTheme}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full border border-input-border shadow-sm hover:bg-accent transition-colors",
        className
      )}
    >
      {theme === "dark" ? <SunDim className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};
