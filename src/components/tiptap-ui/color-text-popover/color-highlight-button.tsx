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
        <Popover open={isOpen} onOpenChange={setIsOpen}>
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
            <PopoverContent className="w-64 p-3" align="start">
                <TextStyleColorPanel
                    onColorChanged={(colorData) => {
                        handleColorChanged({ ...colorData, type: 'highlight' });
                        setIsOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
