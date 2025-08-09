"use client";

import { useEffect, useRef } from 'react';

interface PerformanceMonitorProps {
  enabled?: boolean;
  onMemoryWarning?: (memoryUsage: number) => void;
  onPerformanceWarning?: (fps: number) => void;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development',
  onMemoryWarning,
  onPerformanceWarning
}: PerformanceMonitorProps) {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const memoryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fpsCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 内存使用监控
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as Performance & { memory: PerformanceMemory }).memory;
        const usedMemoryMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMemoryMB = memory.totalJSHeapSize / 1024 / 1024;

        // 如果内存使用超过200MB，发出警告
        if (usedMemoryMB > 200) {
          console.warn(`内存使用过高: ${usedMemoryMB.toFixed(2)}MB / ${totalMemoryMB.toFixed(2)}MB`);
          onMemoryWarning?.(usedMemoryMB);
        }
      }
    };

    // FPS监控
    const checkFPS = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTimeRef.current;
      const fps = 1000 / deltaTime;

      // 如果FPS低于10，发出警告
      if (fps < 10) {
        console.warn(`FPS过低: ${fps.toFixed(1)}`);
        onPerformanceWarning?.(fps);
      }

      lastTimeRef.current = currentTime;
      frameCountRef.current = 0;
    };

    // 设置监控间隔
    memoryCheckIntervalRef.current = setInterval(checkMemoryUsage, 5000); // 每5秒检查一次内存
    fpsCheckIntervalRef.current = setInterval(checkFPS, 1000); // 每秒检查一次FPS

    // 清理函数
    return () => {
      if (memoryCheckIntervalRef.current) {
        clearInterval(memoryCheckIntervalRef.current);
      }
      if (fpsCheckIntervalRef.current) {
        clearInterval(fpsCheckIntervalRef.current);
      }
    };
  }, [enabled, onMemoryWarning, onPerformanceWarning]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (memoryCheckIntervalRef.current) {
        clearInterval(memoryCheckIntervalRef.current);
      }
      if (fpsCheckIntervalRef.current) {
        clearInterval(fpsCheckIntervalRef.current);
      }
    };
  }, []);

  return null; // 这是一个纯监控组件，不渲染任何内容
}
