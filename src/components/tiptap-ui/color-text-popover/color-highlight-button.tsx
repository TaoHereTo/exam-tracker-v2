'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Highlighter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { TextStyleColorPanel } from './text-style-color-panel';

interface ColorHighlightButtonProps {
    editor: Editor | null;
    activeHighlight: { color?: string };
    handleColorChanged: ({ type, label, value }: { type: string; label: string; value: string }) => void;
    canToggle: boolean;
}

export function ColorHighlightButton({
    editor,
    activeHighlight,
    handleColorChanged,
    canToggle,
}: ColorHighlightButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            console.log('Highlight Popover onOpenChange:', open); // 调试日志
            setIsOpen(open);
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={!canToggle}
                    className="h-8 w-8 p-0"
                    aria-label="Highlight color"
                >
                    <Highlighter
                        className="h-4 w-4"
                        style={{
                            backgroundColor: activeHighlight.color || 'transparent',
                        }}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-3"
                align="start"
                onInteractOutside={(e) => {
                    console.log('Highlight PopoverContent onInteractOutside'); // 调试日志
                    // 允许外部交互关闭Popover
                    // e.preventDefault();
                }}
            >
                <TextStyleColorPanel
                    onColorChanged={(colorData) => {
                        console.log('Highlight TextStyleColorPanel onColorChanged'); // 调试日志
                        handleColorChanged({ ...colorData, type: 'highlight' });
                        // 不要自动关闭Popover，让用户手动关闭
                        // setIsOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
