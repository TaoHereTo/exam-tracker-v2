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
    stickyToolbar?: boolean;
}

export const LatexRichTextEditor: React.FC<LatexRichTextEditorProps> = ({
    content,
    onChange,
    placeholder = '开始输入...',
    className = '',
    editorMinHeight = '300px',
    editorMaxHeight = '600px',
    stickyToolbar = false
}) => {
    return (
        <div
            className={`latex-rich-text-editor ${className}`}
            style={{
                minHeight: editorMinHeight,
                maxHeight: editorMaxHeight,
                overflow: 'visible' // 改为visible，不要外层滚动
            }}
        >
            <SimpleRichTextEditor
                content={content}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full"
                stickyToolbar={stickyToolbar}
                customMinHeight={editorMinHeight}
                customMaxHeight={editorMaxHeight}
            />
        </div>
    );
};

export default LatexRichTextEditor;
