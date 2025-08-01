'use client';

import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface ConfettiLoaderProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export const ConfettiLoader: React.FC<ConfettiLoaderProps> = ({
    size = 'large',
    className = ''
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<AnimationItem | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            // 销毁之前的动画
            if (animationRef.current) {
                animationRef.current.destroy();
            }

            // 创建新的动画
            animationRef.current = lottie.loadAnimation({
                container: containerRef.current,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: '/confetti-animation.json', // 动画文件路径
            });

            return () => {
                if (animationRef.current) {
                    animationRef.current.destroy();
                }
            };
        }
    }, []);

    const sizeClasses = {
        small: 'w-32 h-32',
        medium: 'w-48 h-48',
        large: 'w-64 h-64'
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                ref={containerRef}
                className={`${sizeClasses[size]} flex items-center justify-center`}
            />
        </div>
    );
}; 