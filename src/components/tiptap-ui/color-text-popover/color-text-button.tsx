'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TextStyleColorPanel } from './text-style-color-panel';

interface ColorTextButtonProps {
    editor: Editor | null;
    activeTextStyle: { color?: string };
    activeHighlight: { color?: string };
    handleColorChanged: ({ type, label, value }: { type: string; label: string; value: string }) => void;
    canToggle: boolean;
    label: string;
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export function ColorTextButton({
    editor,
    activeTextStyle,
    activeHighlight,
    handleColorChanged,
    canToggle,
    label,
    Icon,
}: ColorTextButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    // 按照其他工具栏按钮的标准模式，使用title属性
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={!canToggle}
                    onClick={() => {
                        if (canToggle) {
                            setIsOpen(!isOpen);
                        }
                    }}
                    className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none rounded-sm flex items-center justify-center transition-colors bg-transparent hover:bg-accent ${!canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{
                        border: 'none',
                        boxShadow: 'none',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                    title={label}
                >
                    <Icon
                        className="h-4 w-4"
                        style={{
                            color: activeTextStyle.color || 'currentColor',
                            backgroundColor: activeHighlight.color || 'transparent',
                        }}
                    />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-64 p-3 bg-background border border-border rounded-lg shadow-lg"
                align="start"
                style={{ zIndex: 9999 }}
            >
                <TextStyleColorPanel
                    onColorChanged={(colorData) => {
                        handleColorChanged(colorData);
                        setIsOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
