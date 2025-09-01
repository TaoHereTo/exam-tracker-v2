'use client';

import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useThemeMode } from '@/hooks/useThemeMode';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string | undefined) => void;
    placeholder?: string;
    className?: string;
    height?: number;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    placeholder = '请输入内容...',
    className = '',
    height = 200
}) => {
    const { isDarkMode } = useThemeMode();

    return (
        <div className={`w-full ${className}`} data-color-mode={isDarkMode ? 'dark' : 'light'}>
            <MDEditor
                value={value}
                onChange={onChange}
                height={height}
                preview="edit"
                hideToolbar={false}
                textareaProps={{
                    placeholder: placeholder,
                }}
                className="w-full"
            />
        </div>
    );
};
