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
    
    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    }).ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const y = top + height / 2;
    const x = left + width / 2;

    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRad}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
    
    // Reset animation state after a delay
    setTimeout(() => setIsAnimating(false), 700);
  };
  
  return (
    <button 
      ref={buttonRef} 
      onClick={changeTheme} 
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full bg-background border border-input-border shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
      disabled={isAnimating}
    >
      {theme === "dark" ? <SunDim className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};