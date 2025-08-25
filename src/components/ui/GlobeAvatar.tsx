"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import createGlobe, { COBEOptions } from "cobe";

interface GlobeAvatarProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const GLOBE_CONFIG: COBEOptions = {
    width: 800,
    height: 800,
    onRender: () => { },
    devicePixelRatio: 5,
    phi: 0,
    theta: 0.3,
    dark: 0,
    diffuse: 0.4,
    mapSamples: 128000,
    mapBrightness: 1.2,
    baseColor: [1, 1, 1],
    markerColor: [251 / 255, 100 / 255, 21 / 255],
    glowColor: [1, 1, 1],
    markers: [
        { location: [14.5995, 120.9842], size: 0.012 },
        { location: [19.076, 72.8777], size: 0.035 },
        { location: [23.8103, 90.4125], size: 0.02 },
        { location: [30.0444, 31.2357], size: 0.025 },
        { location: [39.9042, 116.4074], size: 0.028 },
        { location: [-23.5505, -46.6333], size: 0.035 },
        { location: [19.4326, -99.1332], size: 0.035 },
        { location: [40.7128, -74.006], size: 0.035 },
        { location: [34.6937, 135.5022], size: 0.02 },
        { location: [41.0082, 28.9784], size: 0.025 },
    ],
};

export function GlobeAvatar({ className, size = 'md' }: GlobeAvatarProps) {
    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-14 h-14',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20'
    };

    const phiRef = useRef(0);
    const widthRef = useRef(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const onResize = () => {
            if (canvasRef.current) {
                widthRef.current = canvasRef.current.offsetWidth;
            }
        };

        window.addEventListener("resize", onResize);
        onResize();

        if (!canvasRef.current) {
            return;
        }

        const globe = createGlobe(canvasRef.current, {
            ...GLOBE_CONFIG,
            width: widthRef.current * 5,
            height: widthRef.current * 5,
            onRender: (state) => {
                // 始终自动旋转，不响应鼠标拖动
                phiRef.current += 0.005;
                state.phi = phiRef.current;
                state.width = widthRef.current * 5;
                state.height = widthRef.current * 5;
            },
        });

        setTimeout(() => {
            if (canvasRef.current) {
                canvasRef.current.style.opacity = "1";
            }
        }, 0);

        return () => {
            globe.destroy();
            window.removeEventListener("resize", onResize);
        };
    }, []);

    return (
        <div className={cn(
            "relative rounded-lg overflow-hidden",
            sizeClasses[size],
            className
        )}>
            <canvas
                className="size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size] [image-rendering:crisp-edges] [image-rendering:-webkit-optimize-contrast] pointer-events-none"
                style={{ imageRendering: 'crisp-edges' }}
                ref={canvasRef}
            />
        </div>
    );
}