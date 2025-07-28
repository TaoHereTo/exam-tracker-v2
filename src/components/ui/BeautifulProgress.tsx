"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BeautifulProgressProps {
    value?: number
    max?: number
    className?: string
    showText?: boolean
    textClassName?: string
    height?: number
    width?: string
}

const BeautifulProgress = React.forwardRef<
    HTMLDivElement,
    BeautifulProgressProps
>(({
    value = 0,
    max = 100,
    className,
    showText = true,
    textClassName,
    height = 20,
    width = "100%"
}, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
        <div
            ref={ref}
            className={cn(
                "relative overflow-hidden rounded-[30px] border border-[#313131]",
                "shadow-[0_8px_20px_rgba(0,0,0,0.5)]",
                className
            )}
            style={{
                width,
                height: `${height}px`,
                background: "radial-gradient(circle, #1b2735, #090a0f)"
            }}
        >
            {/* 进度条 */}
            <div
                className="absolute top-0 left-0 h-full rounded-[30px] transition-all duration-1000 ease-out"
                style={{
                    width: `${percentage}%`,
                    background: "linear-gradient(90deg, #00f260, #0575e6)",
                    boxShadow: "0 0 15px #00f260, 0 0 30px #0575e6"
                }}
            >
                {/* 涟漪效果 */}
                <div
                    className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50"
                    style={{
                        background: "radial-gradient(circle, rgba(255, 255, 255, 0.15), transparent)",
                        animation: "ripple 3s infinite"
                    }}
                />
            </div>

            {/* 进度文本 */}
            {showText && (
                <div
                    className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
                        "text-[10px] font-bold tracking-[1px] text-white",
                        "drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]",
                        textClassName
                    )}
                >
                    {Math.round(percentage)}%
                </div>
            )}

            {/* 粒子效果 */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                        style={{
                            top: `${10 + i * 20}%`,
                            left: `${20 + i * 10}%`,
                            animation: `float 5s infinite ease-in-out`,
                            animationDelay: `${i * 0.5}s`
                        }}
                    />
                ))}
            </div>

            {/* 内联样式 */}
            <style jsx>{`
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.7;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
      `}</style>
        </div>
    )
})

BeautifulProgress.displayName = "BeautifulProgress"

export { BeautifulProgress } 