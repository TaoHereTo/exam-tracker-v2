'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useThemeMode } from '@/hooks/useThemeMode';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Strikethrough, Minus, List, ListOrdered, Link, Maximize2, Eye, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

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
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPreview, setIsPreview] = useState(false);

    // 格式化函数
    const formatText = (prefix: string, suffix?: string) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);

        let newText: string;
        let newCursorStart: number;
        let newCursorEnd: number;

        if (selectedText.length >= prefix.length + (suffix || prefix).length &&
            selectedText.startsWith(prefix) &&
            selectedText.endsWith(suffix || prefix)) {
            // 如果已经有标记，则移除
            newText = selectedText.slice(prefix.length, suffix ? -suffix.length : -prefix.length);
            newCursorStart = start;
            newCursorEnd = start + newText.length;
        } else {
            // 如果没有标记，则添加
            newText = `${prefix}${selectedText}${suffix || prefix}`;
            newCursorStart = start + prefix.length;
            newCursorEnd = start + prefix.length + selectedText.length;
        }

        const newValue = value.substring(0, start) + newText + value.substring(end);
        onChange(newValue);

        // 设置光标位置
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.setSelectionRange(newCursorStart, newCursorEnd);
                textareaRef.current.focus();
            }
        }, 0);
    };

    // 插入文本函数
    const insertText = (text: string) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);

        const newValue = value.substring(0, start) + text + value.substring(end);
        onChange(newValue);

        // 设置光标位置
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursorPos = start + text.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                textareaRef.current.focus();
            }
        }, 0);
    };

    // 全屏切换
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        if (isPreview) setIsPreview(false);
    };

    // 预览切换
    const togglePreview = () => {
        setIsPreview(!isPreview);
        if (isFullscreen) setIsFullscreen(false);
    };

    // 全屏样式
    const fullscreenStyle = isFullscreen ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        padding: '20px',
    } : {};

    return (
        <TooltipProvider>
            <div className={`w-full ${className}`} style={fullscreenStyle}>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                    {/* 工具栏 */}
                    <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            formatText('**');
                                        }}
                                        className="h-8 w-8 p-0"
                                        type="button"
                                    >
                                        <Bold className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>粗体 (Ctrl+B)</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            formatText('*');
                                        }}
                                        className="h-8 w-8 p-0"
                                        type="button"
                                    >
                                        <Italic className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>斜体 (Ctrl+I)</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            formatText('~~');
                                        }}
                                        className="h-8 w-8 p-0"
                                        type="button"
                                    >
                                        <Strikethrough className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>删除线</p>
                                </TooltipContent>
                            </Tooltip>

                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            insertText('\n---\n');
                                        }}
                                        className="h-8 w-8 p-0"
                                        type="button"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>分割线</p>
                                </TooltipContent>
                            </Tooltip>



                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const selectedText = value.substring(
                                                textareaRef.current?.selectionStart || 0,
                                                textareaRef.current?.selectionEnd || 0
                                            );

                                            let newText: string;
                                            if (selectedText.trim()) {
                                                // 如果有选中的文本，将其转换为列表
                                                const lines = selectedText.split('\n');
                                                const formattedLines = lines.map(line => line.trim() ? `- ${line}` : line);
                                                newText = formattedLines.join('\n');
                                            } else {
                                                // 如果没有选中文本，插入一个新的列表项
                                                newText = '- ';
                                            }

                                            const newValue = value.substring(0, textareaRef.current?.selectionStart || 0) +
                                                newText +
                                                value.substring(textareaRef.current?.selectionEnd || 0);
                                            onChange(newValue);

                                            // 设置光标位置
                                            setTimeout(() => {
                                                if (textareaRef.current) {
                                                    const newCursorPos = (textareaRef.current?.selectionStart || 0) + newText.length;
                                                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                                                    textareaRef.current.focus();
                                                }
                                            }, 0);
                                        }}
                                        className="h-8 w-8 p-0"
                                        type="button"
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>无序列表</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const selectedText = value.substring(
                                                textareaRef.current?.selectionStart || 0,
                                                textareaRef.current?.selectionEnd || 0
                                            );

                                            let newText: string;
                                            if (selectedText.trim()) {
                                                // 如果有选中的文本，将其转换为有序列表
                                                const lines = selectedText.split('\n');
                                                const formattedLines = lines.map((line, index) =>
                                                    line.trim() ? `${index + 1}. ${line}` : line
                                                );
                                                newText = formattedLines.join('\n');
                                            } else {
                                                // 如果没有选中文本，插入一个新的有序列表项
                                                newText = '1. ';
                                            }

                                            const newValue = value.substring(0, textareaRef.current?.selectionStart || 0) +
                                                newText +
                                                value.substring(textareaRef.current?.selectionEnd || 0);
                                            onChange(newValue);

                                            // 设置光标位置
                                            setTimeout(() => {
                                                if (textareaRef.current) {
                                                    const newCursorPos = (textareaRef.current?.selectionStart || 0) + newText.length;
                                                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                                                    textareaRef.current.focus();
                                                }
                                            }, 0);
                                        }}
                                        className="h-8 w-8 p-0"
                                        type="button"
                                    >
                                        <ListOrdered className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>有序列表</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const selectedText = value.substring(
                                                textareaRef.current?.selectionStart || 0,
                                                textareaRef.current?.selectionEnd || 0
                                            );
                                            insertText(`[${selectedText || '链接文本'}](URL)`);
                                        }}
                                        className="h-8 w-8 p-0"
                                        type="button"
                                    >
                                        <Link className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>链接</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            togglePreview();
                                        }}
                                        className="h-8 w-8 p-0"
                                        type="button"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>预览</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleFullscreen();
                                        }}
                                        className="h-8 w-8 p-0"
                                        type="button"
                                    >
                                        {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isFullscreen ? '退出全屏' : '全屏'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* 内容区域 */}
                    {isPreview ? (
                        <div className="flex" style={{ height: `${height}px` }}>
                            {/* 左侧编辑区域 */}
                            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
                                <textarea
                                    ref={textareaRef}
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    placeholder={placeholder}
                                    style={{ height: `${height}px` }}
                                    className="w-full p-3 resize-none outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            {/* 右侧预览区域 */}
                            <div className="w-1/2 p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-auto">
                                <MarkdownRenderer content={value || placeholder} />
                            </div>
                        </div>
                    ) : (
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            style={{ height: `${height}px` }}
                            className="w-full p-3 resize-none outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
};
