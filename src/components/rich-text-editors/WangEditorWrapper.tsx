'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Fullscreen, Minimize2, Code, Copy, Check, ChevronUp, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';
import { getZIndex } from '@/lib/zIndexConfig';

interface WangEditorWrapperProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    customMinHeight?: string;
    customMaxHeight?: string;
    isInDialog?: boolean;
    externalIsFullscreen?: boolean;
}

export const WangEditorWrapper: React.FC<WangEditorWrapperProps> = ({
    content,
    onChange,
    placeholder = '开始输入...',
    className,
    customMinHeight = '300px',
    customMaxHeight = '800px',
    isInDialog = false,
    externalIsFullscreen = false
}) => {
    const [editor, setEditor] = useState<IDomEditor | null>(null);
    const [html, setHtml] = useState(content);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showHtmlDebug, setShowHtmlDebug] = useState(false);
    const [isHtmlCopied, setIsHtmlCopied] = useState(false);
    const [isHtmlCleaned, setIsHtmlCleaned] = useState(false);

    const actualIsFullscreen = isFullscreen || externalIsFullscreen;

    // 工具栏配置
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
            'color',
            'bgColor',
            '|',
            'justifyLeft',
            'justifyCenter',
            'justifyRight',
            'justifyJustify',
            '|',
            'insertLink',
            'insertImage',
            'insertTable',
            '|',
            'codeBlock',
            'blockquote',
            'divider',
            '|',
            'undo',
            'redo',
            '|',
            'clearStyle',
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

    // 全屏切换
    const handleFullscreenToggle = useCallback(() => {
        setIsFullscreen(!actualIsFullscreen);
    }, [actualIsFullscreen]);

    // HTML 调试切换
    const handleHtmlDebugToggle = useCallback(() => {
        setShowHtmlDebug(!showHtmlDebug);
    }, [showHtmlDebug]);

    // 复制 HTML
    const handleCopyHtml = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(html);
            setIsHtmlCopied(true);
            setTimeout(() => setIsHtmlCopied(false), 2000);
        } catch (error) {
            console.error('复制失败:', error);
        }
    }, [html]);

    // 清理 HTML
    const handleCleanHtml = useCallback(() => {
        if (editor) {
            // 清理 HTML：移除所有格式
            const text = editor.getText();
            editor.clear();
            editor.insertText(text);
            setIsHtmlCleaned(true);
            setTimeout(() => setIsHtmlCleaned(false), 2000);
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
        <TooltipProvider>
            <div
                className={cn(
                    "wang-editor-wrapper border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden",
                    actualIsFullscreen && "fixed inset-0 bg-background",
                    className
                )}
                style={actualIsFullscreen ? { zIndex: getZIndex('URGENT') + 1 } : undefined}
            >
                {/* 工具栏容器 */}
                <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#303030]">
                    <Toolbar
                        editor={editor}
                        defaultConfig={toolbarConfig}
                        mode="default"
                        style={{
                            borderBottom: 'none',
                            backgroundColor: 'transparent'
                        }}
                    />

                    {/* 自定义按钮 */}
                    <div className="flex items-center justify-end gap-1 px-2 pb-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={handleHtmlDebugToggle}
                                >
                                    <Code className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>HTML调试</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={handleFullscreenToggle}
                                >
                                    {actualIsFullscreen ? (
                                        <Minimize2 className="w-4 h-4" />
                                    ) : (
                                        <Fullscreen className="w-4 h-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{actualIsFullscreen ? '退出全屏' : '全屏输入'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* 编辑器容器 */}
                <div className="editor-container-wrapper">
                    <Editor
                        defaultConfig={editorConfig}
                        value={html}
                        onCreated={setEditor}
                        onChange={handleChange}
                        mode="default"
                        style={{
                            height: actualIsFullscreen ? 'calc(100vh - 200px)' : customMinHeight,
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

                {/* HTML 调试区域 */}
                {showHtmlDebug && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">HTML调试</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={handleCleanHtml}
                                        >
                                            <div className="relative">
                                                <RefreshCw className={`w-3 h-3 transition-all duration-300 ${isHtmlCleaned ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'}`} />
                                                <Check className={`w-3 h-3 text-green-500 absolute top-0 left-0 transition-all duration-300 ${isHtmlCleaned ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'}`} />
                                            </div>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isHtmlCleaned ? '已清理' : '清理格式'}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={handleCopyHtml}
                                        >
                                            <div className="relative">
                                                <Copy className={`w-3 h-3 transition-all duration-300 ${isHtmlCopied ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'}`} />
                                                <Check className={`w-3 h-3 text-green-500 absolute top-0 left-0 transition-all duration-300 ${isHtmlCopied ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'}`} />
                                            </div>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isHtmlCopied ? '已复制' : '复制代码'}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2"
                                            onClick={handleHtmlDebugToggle}
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>关闭调试</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                        <div className="p-4">
                            <pre className="text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                {html || '<div>暂无内容</div>'}
                            </pre>
                        </div>
                    </div>
                )}

                {/* 自定义样式 */}
                <style jsx global>{`
                    /* 基础样式 - 按照官方文档的推荐方式 */
                    .wang-editor-wrapper .w-e-text-container {
                        border: none !important;
                    }
                    
                    .wang-editor-wrapper .w-e-scroll {
                        overflow-y: auto !important;
                    }
                    
                    /* wangEditor 暗黑模式适配 */
                    .dark .w-e-text-container {
                        background-color: #303030 !important;
                        color: #e5e5e5 !important;
                    }
                    
                    .dark .w-e-text-placeholder {
                        color: #9CA3AF !important;
                    }
                    
                    .dark .w-e-toolbar {
                        background-color: #303030 !important;
                        border-color: #404040 !important;
                    }
                    
                    .dark .w-e-bar-item button {
                        color: #e5e5e5 !important;
                    }
                    
                    .dark .w-e-bar-item button:hover {
                        background-color: #404040 !important;
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
                    
                    /* 隐藏工具栏边框 */
                    .w-e-toolbar {
                        border-bottom: none !important;
                    }
                `}</style>
            </div>
        </TooltipProvider>
    );
};

export default WangEditorWrapper;

