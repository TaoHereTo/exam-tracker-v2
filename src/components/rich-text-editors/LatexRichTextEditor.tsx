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
    showFullscreenButton?: boolean;
    onFullscreenToggle?: () => void;
    autoFocus?: boolean;
}

export const LatexRichTextEditor: React.FC<LatexRichTextEditorProps> = ({
    content,
    onChange,
    placeholder = '开始输入...',
    className = '',
    editorMinHeight = '300px',
    editorMaxHeight = '600px',
    stickyToolbar = false,
    showFullscreenButton = true,
    onFullscreenToggle,
    autoFocus = false
}) => {
    const editorRef = React.useRef<HTMLDivElement>(null);

    // 自动聚焦逻辑
    useEffect(() => {
        if (autoFocus && editorRef.current) {
            const editorElement = editorRef.current.querySelector('[contenteditable]') as HTMLElement;
            if (editorElement) {
                // 立即聚焦，不需要延迟
                editorElement.focus();
                // 确保光标在编辑器末尾
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(editorElement);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }
    }, [autoFocus, content]); // 添加content依赖，确保内容更新后重新聚焦

    return (
        <div
            ref={editorRef}
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
                showFullscreenButton={showFullscreenButton}
                onFullscreenToggle={onFullscreenToggle}
            />
        </div>
    );
};

export default LatexRichTextEditor;
