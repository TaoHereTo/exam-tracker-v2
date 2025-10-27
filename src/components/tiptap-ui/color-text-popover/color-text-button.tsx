'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TextStyleColorPanel } from './text-style-color-panel';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '@/components/tiptap-ui-primitive/tooltip';

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

    // 使用统一的Tiptap tooltip结构
    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            console.log('Popover onOpenChange:', open); // 调试日志
            setIsOpen(open);
        }}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            disabled={!canToggle}
                           className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none rounded-lg flex items-center justify-center transition-colors bg-transparent hover:bg-[#F3F3F4] dark:hover:bg-accent active:bg-[#F3F3F4] dark:active:bg-accent ${!canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            style={{
                                border: 'none',
                                boxShadow: 'none',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        >
                            <Icon
                                className="h-4 w-4 toolbar-button-icon"
                                style={{
                                    color: activeTextStyle.color || 'inherit',
                                    backgroundColor: activeHighlight.color || 'transparent',
                                }}
                            />
                        </button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
            <PopoverContent
                className="w-auto p-3 bg-background border border-border rounded-lg shadow-lg"
                align="start"
                style={{ zIndex: 9999 }}
                onInteractOutside={(e) => {
                    console.log('PopoverContent onInteractOutside'); // 调试日志
                    // 允许外部交互关闭Popover
                    // e.preventDefault();
                }}
            >
                <TextStyleColorPanel
                    onColorChanged={(colorData) => {
                        console.log('TextStyleColorPanel onColorChanged'); // 调试日志
                        handleColorChanged(colorData);
                        // 不要自动关闭Popover，让用户手动关闭
                        // setIsOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
