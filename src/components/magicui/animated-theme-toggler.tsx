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
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  
  const changeTheme = async () => {
    if (!buttonRef.current || isAnimating) return;
    
    setIsAnimating(true);
    
    const newTheme = theme === "dark" ? "light" : "dark";
    
    // 检查浏览器是否支持 View Transition API
    if (!document.startViewTransition) {
      // 如果不支持，直接切换主题
      setTheme(newTheme);
      setTimeout(() => setIsAnimating(false), 200);
      return;
    }
    
    try {
      await document.startViewTransition(() => {
        flushSync(() => {
          setTheme(newTheme);
        });
      }).ready;

      const { top, left, width, height } =
        buttonRef.current.getBoundingClientRect();
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
          duration: 400, // 减少动画时间
          easing: "ease-out", // 使用更简单的缓动函数
          pseudoElement: "::view-transition-new(root)",
        },
      );
      
      // Reset animation state after a delay
      setTimeout(() => setIsAnimating(false), 400);
    } catch (error) {
      // 如果动画失败，直接切换主题
      console.warn('Theme transition animation failed:', error);
      setTheme(newTheme);
      setTimeout(() => setIsAnimating(false), 200);
    }
  };
  
  return (
    <button 
      ref={buttonRef} 
      onClick={changeTheme} 
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-black !bg-white dark:!bg-black border border-input-border shadow-sm",
        className
      )}
      disabled={isAnimating}
    >
      {theme === "dark" ? <SunDim className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};