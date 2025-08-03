import React from 'react';
import { cn } from '@/lib/utils';

interface FlowingPAvatarProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function FlowingPAvatar({ className, size = 'md' }: FlowingPAvatarProps) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg'
    };

    return (
        <div className={cn(
            "relative flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden",
            sizeClasses[size],
            className
        )}>
            {/* 流动背景效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-flow" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-flow-reverse" />

            {/* 主字母 */}
            <span className="relative z-10 font-bold text-white drop-shadow-sm">
                P
            </span>

            {/* 光晕效果 */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 animate-pulse" />
        </div>
    );
}

// 添加流动动画的CSS
const flowStyles = `
  @keyframes flow {
    0% {
      transform: translateX(-100%) translateY(-100%);
      opacity: 0;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      transform: translateX(100%) translateY(100%);
      opacity: 0;
    }
  }
  
  @keyframes flow-reverse {
    0% {
      transform: translateX(100%) translateY(100%);
      opacity: 0;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      transform: translateX(-100%) translateY(-100%);
      opacity: 0;
    }
  }
  
  .animate-flow {
    animation: flow 3s ease-in-out infinite;
  }
  
  .animate-flow-reverse {
    animation: flow-reverse 4s ease-in-out infinite;
  }
`;

// 将样式注入到页面
if (typeof document !== 'undefined') {
    const styleId = 'flowing-p-avatar-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = flowStyles;
        document.head.appendChild(style);
    }
} 