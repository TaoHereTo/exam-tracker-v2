'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CircleSlash } from 'lucide-react';

// 预定义的颜色
const TEXT_COLORS = [
    { label: '默认', value: '', color: '#000000' },
    { label: '红色', value: '#ef4444', color: '#ef4444' },
    { label: '橙色', value: '#f97316', color: '#f97316' },
    { label: '黄色', value: '#eab308', color: '#eab308' },
    { label: '绿色', value: '#22c55e', color: '#22c55e' },
    { label: '蓝色', value: '#3b82f6', color: '#3b82f6' },
    { label: '紫色', value: '#a855f7', color: '#a855f7' },
    { label: '粉色', value: '#ec4899', color: '#ec4899' },
    { label: '灰色', value: '#6b7280', color: '#6b7280' },
];

const HIGHLIGHT_COLORS = [
    { label: '无', value: '', color: 'transparent' },
    { label: '黄色', value: '#fef08a', color: '#fef08a' },
    { label: '绿色', value: '#bbf7d0', color: '#bbf7d0' },
    { label: '蓝色', value: '#bfdbfe', color: '#bfdbfe' },
    { label: '紫色', value: '#e9d5ff', color: '#e9d5ff' },
    { label: '粉色', value: '#fce7f3', color: '#fce7f3' },
    { label: '橙色', value: '#fed7aa', color: '#fed7aa' },
    { label: '红色', value: '#fecaca', color: '#fecaca' },
    { label: '灰色', value: '#f3f4f6', color: '#f3f4f6' },
];

interface TextStyleColorPanelProps {
    onColorChanged: ({ type, label, value }: { type: string; label: string; value: string }) => void;
}

export function TextStyleColorPanel({
    onColorChanged
}: TextStyleColorPanelProps) {
    const [textColor, setTextColor] = useState('#000000');
    const [highlightColor, setHighlightColor] = useState('#000000');

    return (
        <div className="space-y-4">
            {/* 文字颜色 */}
            <div className="space-y-2">
                <div className="text-sm font-medium">文字颜色</div>
                <div className="grid grid-cols-6 gap-3">
                    {TEXT_COLORS.map((color, index) => (
                        <button
                            key={`text-${color.value}`}
                            className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-md active:shadow-none rounded-full flex items-center justify-center transition-all duration-200 bg-transparent hover:bg-accent cursor-pointer hover:scale-110"
                            style={{
                                border: 'none',
                                boxShadow: 'none',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            onClick={() => onColorChanged({ type: 'text', label: color.label, value: color.value })}
                            title={color.label}
                        >
                            {index === 0 ? (
                                // 默认颜色显示为圆圈图标
                                <CircleSlash className="h-4 w-4 text-foreground" />
                            ) : (
                                // 其他颜色显示为圆形
                                <div
                                    className="h-4 w-4 rounded-full border border-gray-300 shadow-sm"
                                    style={{
                                        backgroundColor: color.color,
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                    }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <Separator />

            {/* 背景高亮 */}
            <div className="space-y-2">
                <div className="text-sm font-medium">背景高亮</div>
                <div className="grid grid-cols-6 gap-3">
                    {HIGHLIGHT_COLORS.map((color) => (
                        <button
                            key={`highlight-${color.value}`}
                            className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-md active:shadow-none rounded-full flex items-center justify-center transition-all duration-200 bg-transparent hover:bg-accent cursor-pointer hover:scale-110"
                            style={{
                                border: 'none',
                                boxShadow: 'none',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            onClick={() => onColorChanged({ type: 'highlight', label: color.label, value: color.value })}
                            title={color.label}
                        >
                            {color.value === '' ? (
                                <CircleSlash className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <div
                                    className="h-4 w-4 rounded-full border border-gray-300 shadow-sm"
                                    style={{
                                        backgroundColor: color.color,
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                    }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <Separator />

            {/* 自定义颜色选择器 */}
            <div className="space-y-2">
                <div className="text-sm font-medium">自定义颜色</div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-2">文字颜色</div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    type="color"
                                    value={textColor}
                                    onChange={(e) => {
                                        setTextColor(e.target.value);
                                        onColorChanged({
                                            type: 'text',
                                            label: '自定义文字颜色',
                                            value: e.target.value
                                        });
                                    }}
                                    className="absolute inset-0 w-5 h-5 opacity-0 cursor-pointer"
                                />
                                <div
                                    className="w-5 h-5 rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    style={{
                                        backgroundColor: textColor
                                    }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                {textColor}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-2">背景颜色</div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    type="color"
                                    value={highlightColor}
                                    onChange={(e) => {
                                        setHighlightColor(e.target.value);
                                        onColorChanged({
                                            type: 'highlight',
                                            label: '自定义背景颜色',
                                            value: e.target.value
                                        });
                                    }}
                                    className="absolute inset-0 w-5 h-5 opacity-0 cursor-pointer"
                                />
                                <div
                                    className="w-5 h-5 rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    style={{
                                        backgroundColor: highlightColor
                                    }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                {highlightColor}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
