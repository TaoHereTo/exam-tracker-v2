'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';
import { Z_INDEX } from '@/lib/zIndexConfig';

interface BeautifulColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    label: string;
    className?: string;
}

export function BeautifulColorPicker({ value, onChange, label, className = '' }: BeautifulColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hexValue, setHexValue] = useState(value);
    const [hsv, setHsv] = useState({ h: 0, s: 0, v: 0 });

    const colorAreaRef = useRef<HTMLDivElement>(null);
    const hueSliderRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 颜色转换函数
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const rgbToHsv = (r: number, g: number, b: number) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        let h = 0, s = 0;
        const v = max;

        if (diff !== 0) {
            s = max === 0 ? 0 : diff / max;
            if (max === r) h = ((g - b) / diff) % 6;
            else if (max === g) h = (b - r) / diff + 2;
            else h = (r - g) / diff + 4;
            h = (h * 60 + 360) % 360;
        }
        return { h, s: s * 100, v: v * 100 };
    };

    const hsvToRgb = (h: number, s: number, v: number) => {
        s /= 100;
        v /= 100;
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let r = 0, g = 0, b = 0;

        if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
        else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
        else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
        else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
        else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
        else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    };

    const rgbToHex = (r: number, g: number, b: number) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    // 同步颜色值
    useEffect(() => {
        setHexValue(value);
        const rgb = hexToRgb(value);
        if (rgb) {
            const hsvValues = rgbToHsv(rgb.r, rgb.g, rgb.b);
            setHsv(hsvValues);
        }
    }, [value]);

    // 颜色变化处理
    const handleColorChange = useCallback((color: string) => {
        setHexValue(color);
        onChange(color);
        const rgb = hexToRgb(color);
        if (rgb) {
            const hsvValues = rgbToHsv(rgb.r, rgb.g, rgb.b);
            setHsv(hsvValues);
        }
    }, [onChange]);

    // 颜色区域点击处理
    const handleColorAreaClick = useCallback((e: React.MouseEvent) => {
        if (!colorAreaRef.current) return;
        const rect = colorAreaRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        const s = x * 100;
        const v = (1 - y) * 100;
        const newHsv = { ...hsv, s, v };
        setHsv(newHsv);

        const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        handleColorChange(hex);
    }, [hsv, handleColorChange]);

    // 色相滑块点击处理
    const handleHueSliderClick = useCallback((e: React.MouseEvent) => {
        if (!hueSliderRef.current) return;
        const rect = hueSliderRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const hue = x * 360;

        const newHsv = { ...hsv, h: hue };
        setHsv(newHsv);

        const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        handleColorChange(hex);
    }, [hsv, handleColorChange]);

    // HEX 输入处理
    const handleHexInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value;
        setHexValue(hex);
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            handleColorChange(hex);
        }
    }, [handleColorChange]);

    // 处理外部点击关闭 - 使用更简单的方法
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            // 延迟添加事件监听器，避免立即触发
            const timer = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 100);

            return () => {
                clearTimeout(timer);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
            {/* 触发器按钮 */}
            <Button
                variant="outline"
                size="sm"
                className={`w-6 h-6 rounded-full p-0 border-2 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 ${className}`}
                style={{
                    backgroundColor: value,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
                onClick={() => setIsOpen(!isOpen)}
            />

            {/* 弹出菜单 */}
            {isOpen && (
                <div
                    className="absolute bottom-full left-0 mb-2 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg"
                    style={{ zIndex: Z_INDEX.MAXIMUM }}
                >
                    <div className="space-y-4">
                        {/* 标题和操作按钮 */}
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">{label}</div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-8 h-8 rounded-full p-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    className="w-8 h-8 rounded-full p-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 bg-green-500 hover:bg-green-600"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Check className="h-4 w-4 text-white" />
                                </Button>
                            </div>
                        </div>

                        {/* HSV 颜色选择器 */}
                        <div className="space-y-3">
                            <Label className="text-xs text-muted-foreground">颜色选择器</Label>

                            {/* 颜色区域 */}
                            <div className="relative">
                                <div
                                    ref={colorAreaRef}
                                    className="w-full h-32 rounded-lg border border-gray-300 cursor-crosshair relative overflow-hidden"
                                    style={{
                                        background: `linear-gradient(to right, hsl(${hsv.h}, 100%, 50%), hsl(${hsv.h}, 0%, 50%)), linear-gradient(to top, #000, transparent)`
                                    }}
                                    onClick={handleColorAreaClick}
                                >
                                    {/* 颜色选择器指示器 */}
                                    <div
                                        className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg pointer-events-none"
                                        style={{
                                            left: `${hsv.s}%`,
                                            top: `${100 - hsv.v}%`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* 色相滑块 */}
                            <div className="relative">
                                <div
                                    ref={hueSliderRef}
                                    className="w-full h-4 rounded border border-gray-300 cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                                    }}
                                    onClick={handleHueSliderClick}
                                >
                                    {/* 色相滑块指示器 */}
                                    <div
                                        className="absolute w-2 h-full border border-white rounded shadow-lg pointer-events-none"
                                        style={{
                                            left: `${(hsv.h / 360) * 100}%`,
                                            transform: 'translateX(-50%)'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 颜色预览 */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">颜色预览</Label>
                            <div className="flex items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50">
                                <span
                                    className="text-lg font-semibold"
                                    style={{ color: value }}
                                >
                                    预览文字 Preview Text
                                </span>
                            </div>
                        </div>

                        {/* 颜色值输入 */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">颜色值</Label>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded border border-gray-300"
                                    style={{ backgroundColor: value }}
                                />
                                <Input
                                    value={hexValue}
                                    onChange={handleHexInputChange}
                                    placeholder="#000000"
                                    className="font-mono text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}