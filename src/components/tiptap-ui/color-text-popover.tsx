'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { ColorTextPopover } from './color-text-popover/color-text-popover';

interface ColorTextPopoverProps {
    editor: Editor | null;
    hideWhenUnavailable?: boolean;
    onColorChanged?: ({ type, label, value }: { type: string; label: string; value: string }) => void;
}

export function ColorTextPopoverComponent({
    editor,
    hideWhenUnavailable = false,
    onColorChanged
}: ColorTextPopoverProps) {
    return (
        <ColorTextPopover
            editor={editor}
            hideWhenUnavailable={hideWhenUnavailable}
            onColorChanged={onColorChanged}
        />
    );
}
