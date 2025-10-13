'use client';

import { useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { Palette, Highlighter } from 'lucide-react';

interface ColorChangeHandler {
    ({ type, label, value }: { type: string; label: string; value: string }): void;
}

interface UseColorTextPopoverProps {
    editor: Editor | null;
    hideWhenUnavailable?: boolean;
    onColorChanged?: ColorChangeHandler;
}

export function useColorTextPopover({
    editor,
    hideWhenUnavailable = false,
    onColorChanged,
}: UseColorTextPopoverProps) {
    const isVisible = useMemo(() => {
        if (!editor) return false;
        if (hideWhenUnavailable) {
            return editor.isActive('textStyle') || editor.isActive('highlight');
        }
        return true;
    }, [editor, hideWhenUnavailable]);

    const canToggle = useMemo(() => {
        if (!editor) return false;
        return true; // 简化逻辑，始终允许颜色操作
    }, [editor]);

    const activeTextStyle = useMemo(() => {
        if (!editor) return { color: '' };
        return editor.getAttributes('textStyle');
    }, [editor]);

    const activeHighlight = useMemo(() => {
        if (!editor) return { color: '' };
        return editor.getAttributes('highlight');
    }, [editor]);

    const handleColorChanged = useCallback<ColorChangeHandler>(
        ({ type, label, value }) => {
            if (!editor) return;

            if (type === 'text') {
                if (value) {
                    editor.chain().focus().setColor(value).run();
                } else {
                    editor.chain().focus().unsetColor().run();
                }
            } else if (type === 'highlight') {
                if (value) {
                    editor.chain().focus().setHighlight({ color: value }).run();
                } else {
                    editor.chain().focus().unsetHighlight().run();
                }
            }

            onColorChanged?.({ type, label, value });
        },
        [editor, onColorChanged]
    );

    const label = '文字颜色';
    const Icon = Highlighter;

    return {
        isVisible,
        canToggle,
        activeTextStyle,
        activeHighlight,
        handleColorChanged,
        label,
        Icon,
    };
}
