'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import { cn } from '@/lib/utils';
import EditorCatalog from './EditorCatalog';

interface WangEditorWrapperProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    customMinHeight?: string;
    customMaxHeight?: string;
    showCatalog?: boolean; // 是否显示目录
}

export const WangEditorWrapper: React.FC<WangEditorWrapperProps> = ({
    content,
    onChange,
    placeholder = '开始输入...',
    className,
    customMinHeight = '300px',
    customMaxHeight = '800px',
    showCatalog = false
}) => {
    const [editor, setEditor] = useState<IDomEditor | null>(null);
    const [html, setHtml] = useState(content);
    const [catalogVisible, setCatalogVisible] = useState<boolean>(true); // 目录是否可见

    // 工具栏配置 - 使用官方的菜单分组功能
    const toolbarConfig: Partial<IToolbarConfig> = useMemo(() => ({
        toolbarKeys: [
            'headerSelect',
            'bold',
            'italic',
            'underline',
            'through',
            '|',
            'bulletedList',
            'numberedList',
            '|',
            'fontSize',
            'fontFamily',
            'lineHeight', // 行高
            '|',
            'color',
            'bgColor',
            '|',
            // 使用官方的菜单分组功能，将对齐按钮放在一个下拉组中
            {
                key: 'alignGroup',
                title: '对齐',
                iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8zM972.8 102.4v102.4H51.2V102.4h921.6z"></path></svg>',
                menuKeys: ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyJustify']
            },
            // 缩进菜单分组
            {
                key: 'indentGroup',
                title: '缩进',
                iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M0 64h1024v128H0z m384 192h640v128H384z m0 192h640v128H384z m0 192h640v128H384zM0 832h1024v128H0z m0-128V320l256 192z"></path></svg>',
                menuKeys: ['indent', 'delIndent']
            },
            '|',
            'insertLink',
            // 图片菜单分组 - 包含上传和网络图片
            {
                key: 'imageGroup',
                title: '图片',
                iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-384 256 320h64l224.01-192z"></path></svg>',
                menuKeys: ['uploadImage', 'insertImage']
            },
            'insertTable',
            '|',
            'blockquote',
            'divider',
            '|',
            'undo',
            'redo',
            '|',
            'clearStyle',
            '|',
            'fullScreen',
        ],
    }), []);

    // 编辑器配置
    const editorConfig: Partial<IEditorConfig> = useMemo(() => ({
        placeholder,
        autoFocus: false,
        scroll: true,
        MENU_CONF: {
            // 上传图片配置（可以根据需要配置）
            uploadImage: {
                // 自定义上传
                async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
                    // 这里可以实现图片上传逻辑
                    // 暂时使用 base64
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64 = e.target?.result as string;
                        insertFn(base64, '', '');
                    };
                    reader.readAsDataURL(file);
                },
            },
        },
    }), [placeholder]);

    // 当 content prop 变化时更新编辑器
    useEffect(() => {
        if (editor && html !== content) {
            setHtml(content);
        }
    }, [content, editor, html]);

    // 当编辑器内容变化时
    const handleChange = useCallback((editor: IDomEditor) => {
        const newHtml = editor.getHtml();
        setHtml(newHtml);
        onChange(newHtml);
    }, [onChange]);

    // 创建编辑器实例后
    useEffect(() => {
        if (editor) {
            // 编辑器已创建
            return () => {
                // 组件销毁时销毁编辑器
                if (editor) {
                    editor.destroy();
                }
            };
        }
    }, [editor]);


    // 计算字数
    const wordCount = useMemo(() => {
        if (!editor) return 0;
        const text = editor.getText();
        const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
        const englishWords = text.replace(/[\u4e00-\u9fff]/g, '').replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(w => w.length > 0);
        return chineseChars.length + englishWords.length;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, html]); // html 依赖是必要的，因为编辑器内容变化时需要重新计算

    const charCount = useMemo(() => {
        if (!editor) return 0;
        return editor.getText().length;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, html]); // html 依赖是必要的，因为编辑器内容变化时需要重新计算

    return (
        <div className={cn("wang-editor-with-catalog flex gap-4 flex-row-reverse", className)}>
            {/* 目录 - 显示在左侧，可收起 */}
            {showCatalog && (
                <EditorCatalog
                    editor={editor}
                    className={cn(
                        "sticky top-4 order-first transition-all duration-300",
                        catalogVisible ? "w-64 min-w-[256px]" : "w-10 min-w-[40px]"
                    )}
                    isVisible={catalogVisible}
                    onToggle={() => setCatalogVisible(!catalogVisible)}
                />
            )}

            <div
                className={cn(
                    "wang-editor-wrapper border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden",
                    showCatalog ? "flex-1" : "w-full"
                )}
            >
                {/* Toolbar 和 Editor 必须直接在同一个父元素下，不能有额外包装 */}
                <div className="editor-main-container">
                    <Toolbar
                        editor={editor}
                        defaultConfig={toolbarConfig}
                        mode="default"
                        style={{
                            borderBottom: 'none',
                            backgroundColor: 'transparent'
                        }}
                    />

                    <Editor
                        defaultConfig={editorConfig}
                        value={html}
                        onCreated={setEditor}
                        onChange={handleChange}
                        mode="default"
                        style={{
                            height: customMinHeight,
                            overflowY: 'hidden'
                        }}
                    />
                </div>

                {/* 字数统计 */}
                <div className="flex items-center justify-end px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#303030]">
                    <div className="flex items-center gap-2">
                        <span>字数: {wordCount}</span>
                        <span>字符: {charCount}</span>
                    </div>
                </div>

                {/* 自定义样式 */}
                <style jsx global>{`
                    /* 基础样式 - 按照官方文档的推荐方式 */
                    .wang-editor-wrapper .w-e-text-container {
                        border: none !important;
                    }
                    
                    .wang-editor-wrapper .w-e-scroll {
                        overflow-y: auto !important;
                    }
                    
                    /* 工具栏毛玻璃效果 */
                    .wang-editor-wrapper .w-e-toolbar {
                        background-color: transparent !important;
                        backdrop-filter: blur(8px) !important;
                        background: rgba(var(--muted-rgb, 240, 240, 240), 0.3) !important;
                        border-bottom: 1px solid hsl(var(--border)) !important;
                        position: sticky !important;
                        top: 0 !important;
                        z-index: 10 !important;
                    }
                    
                    .dark .wang-editor-wrapper .w-e-toolbar {
                        background: rgba(48, 48, 48, 0.3) !important;
                    }
                    
                    /* 全屏模式样式 */
                    .w-e-full-screen-container {
                        z-index: 9999 !important;
                        background-color: hsl(var(--background)) !important;
                    }
                    
                    .w-e-full-screen-container .w-e-toolbar {
                        backdrop-filter: blur(8px) !important;
                    }
                    
                    /* 自定义 tooltip 样式 - 匹配项目的 Tooltip 组件 */
                    .wang-editor-wrapper .w-e-tooltip {
                        background-color: hsl(var(--popover)) !important;
                        color: hsl(var(--popover-foreground)) !important;
                        border: 1px solid hsl(var(--border)) !important;
                        border-radius: 0.5rem !important;
                        padding: 0.5rem 0.75rem !important;
                        font-size: 0.875rem !important;
                        line-height: 1.25rem !important;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
                        z-index: 50 !important;
                        animation: fadeIn 0.15s ease-in-out !important;
                    }
                    
                    .wang-editor-wrapper .w-e-tooltip::before {
                        border-top-color: hsl(var(--popover)) !important;
                    }
                    
                    /* 暗黑模式下的 tooltip */
                    .dark .wang-editor-wrapper .w-e-tooltip {
                        background-color: hsl(var(--popover)) !important;
                        border-color: hsl(var(--border)) !important;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2) !important;
                    }
                    
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(-4px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    /* wangEditor 暗黑模式适配 */
                    .dark .w-e-text-container {
                        background-color: #303030 !important;
                        color: #e5e5e5 !important;
                    }
                    
                    .dark .w-e-text-placeholder {
                        color: #9CA3AF !important;
                    }
                    
                    .dark .w-e-bar-item button {
                        color: #e5e5e5 !important;
                    }
                    
                    .dark .w-e-bar-item button:hover {
                        background-color: rgba(64, 64, 64, 0.5) !important;
                    }
                    
                    /* 亮色模式下的工具栏按钮 hover 效果 */
                    .wang-editor-wrapper .w-e-bar-item button:hover {
                        background-color: rgba(0, 0, 0, 0.05) !important;
                    }
                    
                    .dark .wang-editor-wrapper .w-e-bar-item button:hover {
                        background-color: rgba(255, 255, 255, 0.1) !important;
                    }
                    
                    .dark .w-e-drop-panel {
                        background-color: #303030 !important;
                        border-color: #404040 !important;
                        color: #e5e5e5 !important;
                    }
                    
                    .dark .w-e-modal {
                        background-color: #303030 !important;
                        border-color: #404040 !important;
                        color: #e5e5e5 !important;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default WangEditorWrapper;

