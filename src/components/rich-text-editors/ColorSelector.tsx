'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { Palette, Highlighter } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ColorSelectorProps {
    editor: Editor | null;
    type: 'text' | 'highlight';
    showPalette: boolean;
    onTogglePalette: () => void;
}

// 常用颜色
const commonColors = [
    { name: '红色', value: '#FF0000' },
    { name: '绿色', value: '#00FF00' },
    { name: '蓝色', value: '#0000FF' },
    { name: '黄色', value: '#FFFF00' },
    { name: '橙色', value: '#FFA500' },
    { name: '紫色', value: '#800080' },
    { name: '粉色', value: '#FFC0CB' },
    { name: '青色', value: '#00FFFF' },
    { name: '棕色', value: '#A52A2A' },
];

const commonHighlightColors = [
    { name: '黄色高亮', value: '#FFFF00' },
    { name: '绿色高亮', value: '#90EE90' },
    { name: '蓝色高亮', value: '#87CEEB' },
    { name: '粉色高亮', value: '#FFB6C1' },
    { name: '橙色高亮', value: '#FFE4B5' },
    { name: '紫色高亮', value: '#DDA0DD' },
    { name: '青色高亮', value: '#E0FFFF' },
    { name: '红色高亮', value: '#FFA07A' },
];

export const ColorSelector: React.FC<ColorSelectorProps> = ({
    editor,
    type,
    showPalette,
    onTogglePalette
}) => {
    const colors = type === 'text' ? commonColors : commonHighlightColors;
    const currentColor = type === 'text'
        ? editor?.getAttributes('textStyle').color || '#000000'
        : editor?.getAttributes('highlight').color || '#ffff00';

    const handleColorSelect = (color: string) => {
        if (!editor) return;
        if (type === 'text') {
            editor.chain().focus().setColor(color).run();
        } else {
            editor.chain().focus().setHighlight({ color }).run();
        }
        onTogglePalette();
    };

    return (
        <div className="relative color-selector-container">
            <input
                type="color"
                value={currentColor}
                onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleColorSelect(e.target.value);
                }}
                className="w-8 h-8 border border-border rounded cursor-pointer opacity-0 absolute inset-0 z-5"
                title={type === 'text' ? '文字颜色' : '背景高亮'}
            />
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none bg-transparent rounded-sm flex items-center justify-center relative z-10"
                        style={{
                            border: 'none',
                            boxShadow: 'none',
                            outline: 'none',
                            boxSizing: 'border-box',
                            backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onTogglePalette();
                        }}
                    >
                        {type === 'text' ? <Palette className="h-4 w-4" /> : <Highlighter className="h-4 w-4" />}
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    {type === 'text' ? '文字颜色' : '背景高亮'}
                </TooltipContent>
            </Tooltip>

            {/* 颜色选择面板 */}
            {showPalette && (
                <div className="absolute top-10 left-0 z-50 bg-background border border-border rounded-lg shadow-lg p-3 min-w-[240px]">
                    <Tabs defaultValue="common" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-3">
                            <TabsTrigger value="common" className="text-xs">常用</TabsTrigger>
                            <TabsTrigger value="custom" className="text-xs">自定义</TabsTrigger>
                        </TabsList>

                        <TabsContent value="common" className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">
                                {type === 'text' ? '常用文字颜色' : '常用高亮颜色'}
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                                {colors.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => handleColorSelect(color.value)}
                                        className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                                点击颜色块快速选择
                            </div>
                        </TabsContent>

                        <TabsContent value="custom" className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">
                                自定义颜色
                            </div>
                            <div className="flex items-center justify-center">
                                <input
                                    type="color"
                                    value={currentColor}
                                    onChange={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleColorSelect(e.target.value);
                                    }}
                                    className="w-16 h-16 border border-border rounded cursor-pointer"
                                    title={type === 'text' ? '文字颜色' : '背景高亮'}
                                />
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                                选择任意颜色
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
};
