'use client';

import React, { useState, useEffect } from 'react';
import SimpleRichTextEditor from './SimpleRichTextEditor';
import 'katex/dist/katex.min.css';

interface LatexRichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    editorMinHeight?: string;
    editorMaxHeight?: string;
}

export const LatexRichTextEditor: React.FC<LatexRichTextEditorProps> = ({
    content,
    onChange,
    placeholder = '开始输入...',
    className = '',
    editorMinHeight = '200px',
    editorMaxHeight = '400px'
}) => {
    return (
        <div
            className={`latex-rich-text-editor ${className}`}
            style={{
                minHeight: editorMinHeight,
                maxHeight: editorMaxHeight,
                overflow: 'auto'
            }}
        >
            <SimpleRichTextEditor
                content={content}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full h-full"
            />
        </div>
    );
};

export default LatexRichTextEditor;
