'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { useColorTextPopover } from './use-color-text-popover';
import { ColorTextButton } from './color-text-button';
import { ColorHighlightButton } from './color-highlight-button';

interface ColorTextPopoverProps {
    editor: Editor | null;
    hideWhenUnavailable?: boolean;
    onColorChanged?: ({ type, label, value }: { type: string; label: string; value: string }) => void;
}

export function ColorTextPopover({
    editor,
    hideWhenUnavailable = false,
    onColorChanged
}: ColorTextPopoverProps) {
    const {
        isVisible,
        canToggle,
        activeTextStyle,
        activeHighlight,
        handleColorChanged,
        label,
        Icon,
    } = useColorTextPopover({
        editor,
        hideWhenUnavailable,
        onColorChanged,
    });

    if (!isVisible) return null;

    return (
        <ColorTextButton
            editor={editor}
            activeTextStyle={activeTextStyle}
            activeHighlight={activeHighlight}
            handleColorChanged={handleColorChanged}
            canToggle={canToggle}
            label={label}
            Icon={Icon}
        />
    );
}
