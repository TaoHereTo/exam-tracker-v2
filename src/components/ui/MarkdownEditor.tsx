'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useThemeMode } from '@/hooks/useThemeMode';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Strikethrough, Minus, List, ListOrdered, Link, Maximize2, Eye, X, Cloud, Upload, Image as ImageIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SupabaseImageSelectorDialog } from '@/components/ui/SupabaseImageSelectorDialog';
import { supabaseImageManager } from '@/lib/supabaseImageManager';
import { usePasteContext } from '@/contexts/PasteContext';
import { useNotification } from '@/components/magicui/NotificationProvider';
import Image from 'next/image';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string | undefined) => void;
    placeholder?: string;
    className?: string;
    height?: number;
    disabled?: boolean;
}

const MarkdownEditorComponent: React.FC<MarkdownEditorProps> = React.memo(({
    value,
    onChange,
    placeholder = '请输入内容...',
    className = '',
    height = 200,
    disabled = false
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const previewTextareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cloudSelectorRef = useRef<HTMLButtonElement>(null);
    const componentId = useRef(`markdown-editor-${Math.random().toString(36).substr(2, 9)}`);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const [activeFormats, setActiveFormats] = useState<string[]>([]);
    const [textValue, setTextValue] = useState(value);
    const [previewText, setPreviewText] = useState(value);
    const [editorHeight, setEditorHeight] = useState(`${height}px`);

    // 图片相关状态
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [accordionValue, setAccordionValue] = useState<string>("");

    // 添加主题切换检测
    const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);

    // 通知和粘贴上下文
    const { notify } = useNotification();
    const { registerPasteHandler, unregisterPasteHandler, setActiveHandler } = usePasteContext();
    
    useEffect(() => {
        const handleTransitionStart = () => setIsThemeTransitioning(true);
        const handleTransitionEnd = () => setIsThemeTransitioning(false);
        
        document.addEventListener('startViewTransition', handleTransitionStart);
        document.addEventListener('endViewTransition', handleTransitionEnd);
        
        return () => {
            document.removeEventListener('startViewTransition', handleTransitionStart);
            document.removeEventListener('endViewTransition', handleTransitionEnd);
        };
    }, []);

    // 检测当前选中文本的格式状态
    const checkActiveFormats = useCallback(() => {
        if (!textareaRef.current) return [];

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        
        if (!selectedText) return [];

        const formats = [];
        
        // 检查加粗
        if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
            formats.push('bold');
        }
        
        // 检查斜体（确保不是加粗）
        if (selectedText.startsWith('*') && selectedText.endsWith('*') && 
            !selectedText.startsWith('**') && selectedText.length > 2) {
            formats.push('italic');
        }
        
        // 检查删除线
        if (selectedText.startsWith('~~') && selectedText.endsWith('~~') && selectedText.length > 4) {
            formats.push('strikethrough');
        }

        return formats;
    }, [value]);

    // 格式化函数
    const formatText = (prefix: string, suffix?: string) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);

        if (!selectedText) {
            alert('请先选中要格式化的文字');
            return;
        }

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

        // 设置光标位置并更新格式状态
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.setSelectionRange(newCursorStart, newCursorEnd);
                textareaRef.current.focus();
                setActiveFormats(checkActiveFormats());
            }
        }, 0);
    };

    // 监听文本选择变化
    const handleSelectionChange = () => {
        setActiveFormats(checkActiveFormats());
    };

    // 添加 useEffect 来监听初始状态 - 优化版本
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            // 初始化格式状态
            setActiveFormats(checkActiveFormats());
            
            // 使用防抖的事件处理器来减少频繁更新
            let debounceTimer: NodeJS.Timeout;
            const debouncedFormatCheck = () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    setActiveFormats(checkActiveFormats());
                }, 100); // 100ms防抖
            };
            
            const handleClick = debouncedFormatCheck;
            const handleKeyUp = debouncedFormatCheck;
            
            textarea.addEventListener('click', handleClick);
            textarea.addEventListener('keyup', handleKeyUp);
            
            return () => {
                clearTimeout(debounceTimer);
                textarea.removeEventListener('click', handleClick);
                textarea.removeEventListener('keyup', handleKeyUp);
            };
        }
    }, [checkActiveFormats]); // 移除value依赖，减少重新绑定

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

    // 智能换行处理
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // 处理快捷键
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    formatText('**');
                    return;
                case 'i':
                    e.preventDefault();
                    formatText('*');
                    return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const lines = value.substring(0, start).split('\n');
            const currentLine = lines[lines.length - 1];

            // 检查当前行是否是列表项
            const unorderedListMatch = currentLine.match(/^(\s*)- (.*)$/);
            const orderedListMatch = currentLine.match(/^(\s*)(\d+)\. (.*)$/);

            if (unorderedListMatch) {
                e.preventDefault();
                const [, indent, content] = unorderedListMatch;
                
                if (content.trim() === '') {
                    // 如果列表项为空，则退出列表
                    const newValue = value.substring(0, start - currentLine.length) + 
                                   indent + 
                                   value.substring(start);
                    onChange(newValue);
                    setTimeout(() => {
                        if (textareaRef.current) {
                            const newPos = start - currentLine.length + indent.length;
                            textareaRef.current.setSelectionRange(newPos, newPos);
                        }
                    }, 0);
                } else {
                    // 继续无序列表
                    const newText = `\n${indent}- `;
                    const newValue = value.substring(0, start) + newText + value.substring(start);
                    onChange(newValue);
                    setTimeout(() => {
                        if (textareaRef.current) {
                            const newPos = start + newText.length;
                            textareaRef.current.setSelectionRange(newPos, newPos);
                        }
                    }, 0);
                }
                return;
            }

            if (orderedListMatch) {
                e.preventDefault();
                const [, indent, number, content] = orderedListMatch;
                
                if (content.trim() === '') {
                    // 如果列表项为空，则退出列表
                    const newValue = value.substring(0, start - currentLine.length) + 
                                   indent + 
                                   value.substring(start);
                    onChange(newValue);
                    setTimeout(() => {
                        if (textareaRef.current) {
                            const newPos = start - currentLine.length + indent.length;
                            textareaRef.current.setSelectionRange(newPos, newPos);
                        }
                    }, 0);
                } else {
                    // 继续有序列表，递增数字
                    const nextNumber = parseInt(number) + 1;
                    const newText = `\n${indent}${nextNumber}. `;
                    const newValue = value.substring(0, start) + newText + value.substring(start);
                    onChange(newValue);
                    setTimeout(() => {
                        if (textareaRef.current) {
                            const newPos = start + newText.length;
                            textareaRef.current.setSelectionRange(newPos, newPos);
                        }
                    }, 0);
                }
                return;
            }
        }
    };

    // 全屏切换
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        // 不要在全屏模式下自动关闭预览
    };

    // 预览切换
    const togglePreview = () => {
        setIsPreview(!isPreview);
        // 不要在预览模式下自动退出全屏
    };

    // 全屏样式 - 使用CSS变量避免JS计算
    const fullscreenStyle = isFullscreen ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'var(--background)', // 使用CSS变量
        padding: '20px',
    } : {};

    // 动态计算高度
    const dynamicHeight = isFullscreen ? 'calc(100vh - 120px)' : `${height}px`;

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setTextValue(newValue);
        setPreviewText(newValue);
        onChange(newValue);
    };

    // 图片处理函数
    const handleFileUpload = useCallback(async (file: File) => {
        const isImageByMime = file.type.startsWith('image/');
        const isImageByExtension = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);

        if (!isImageByMime && !isImageByExtension) {
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            return;
        }

        setIsUploading(true);
        setAccordionValue("preview"); // 展开accordion
        try {
            const imageInfo = await supabaseImageManager.uploadImage(file);
            const imageUrl = imageInfo.url;
            setPreviewImages(prev => [...prev, imageUrl]);
        } catch (error) {
            console.error('上传失败:', error);
        } finally {
            setIsUploading(false);
        }
    }, []);

    // 处理文件选择
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    // 处理粘贴图片
    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    await handleFileUpload(file);
                    break;
                }
            }
        }
    }, [handleFileUpload]);

    // 处理拖拽
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (isUploading) return;

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => {
            const isImageByMime = file.type.startsWith('image/');
            const isImageByExtension = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);
            return isImageByMime || isImageByExtension;
        });

        if (imageFile) {
            handleFileUpload(imageFile);
        }
    };

  // 处理图片选择
  const handleImageSelected = (imageId: string) => {
    const cloudUrl = supabaseImageManager.getImageUrl(imageId);
    if (cloudUrl) {
      setPreviewImages(prev => [...prev, cloudUrl]);
      // 自动展开预览区域
      setAccordionValue("preview");
    }
  };

    // 移除图片
    const removeImage = (index: number) => {
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
    };

    // 注册粘贴处理器
    useEffect(() => {
        const currentComponentId = componentId.current;
        registerPasteHandler(currentComponentId, handlePaste);

        return () => {
            unregisterPasteHandler(currentComponentId);
        };
    }, [registerPasteHandler, unregisterPasteHandler, handlePaste]);

    return (
        <TooltipProvider>
            <div className={`w-full markdown-editor-container ${className}`} style={fullscreenStyle}>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                    {/* 工具栏 */}
                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0A0A0A]">
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
                                        className={`md-toolbar-button-base toolbar-button-bold ${activeFormats.includes('bold') ? 'active' : ''}`}
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
                                        className={`md-toolbar-button-base toolbar-button-italic ${activeFormats.includes('italic') ? 'active' : ''}`}
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
                                        className={`md-toolbar-button-base md-toolbar-button-strikethrough ${activeFormats.includes('strikethrough') ? 'active' : ''}`}
                                        type="button"
                                    >
                                        <Strikethrough className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>删除线</p>
                                </TooltipContent>
                            </Tooltip>

                            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

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
                                        className="md-toolbar-button-base md-toolbar-button-divider"
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
                                        className="md-toolbar-button-base md-toolbar-button-list"
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
                                        className="md-toolbar-button-base md-toolbar-button-list"
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
                                        className="md-toolbar-button-base md-toolbar-button-link"
                                        type="button"
                                    >
                                        <Link className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>链接</p>
                                </TooltipContent>
                            </Tooltip>

                            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="md-toolbar-button-base md-toolbar-button-upload"
                                        type="button"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <Upload className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>从本地上传图片</p>
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
                                            if (cloudSelectorRef.current) {
                                                cloudSelectorRef.current.click();
                                            }
                                        }}
                                        className="md-toolbar-button-base md-toolbar-button-cloud"
                                        type="button"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <Cloud className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>从云端选择图片</p>
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
                                        className={`md-toolbar-button-base md-toolbar-button-preview ${isPreview ? 'active' : ''}`}
                                        type="button"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isPreview ? '关闭预览' : '预览'}</p>
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
                                        className="md-toolbar-button-base md-toolbar-button-fullscreen"
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
                        <div className="flex" style={{ height: dynamicHeight }}>
                            {/* 左侧编辑区域 */}
                            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
                                <textarea
                                    ref={textareaRef}
                                    value={textValue}
                                    onChange={handleTextChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={placeholder}
                                    className="w-full p-3 resize-none outline-none border-0 leading-relaxed text-sm markdown-editor-textarea bg-white dark:bg-[#242628] text-gray-900 dark:text-gray-100"
                                    style={{
                                        height: editorHeight,
                                        fontFamily: 'inherit',
                                        fontSize: 'inherit',
                                        lineHeight: 'inherit'
                                    }}
                                    disabled={disabled}
                                />
                            </div>
                            {/* 右侧预览区域 */}
                            <div className="w-1/2 overflow-auto">
                                <textarea
                                    ref={previewTextareaRef}
                                    value={previewText}
                                    readOnly
                                    className="w-full p-3 resize-none outline-none border-0 leading-relaxed text-sm markdown-editor-textarea bg-white dark:bg-[#242628] text-gray-900 dark:text-gray-100"
                                    style={{
                                        height: editorHeight,
                                        fontFamily: 'inherit',
                                        fontSize: 'inherit',
                                        lineHeight: 'inherit'
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: dynamicHeight }}>
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onSelect={handleSelectionChange}
                                onMouseUp={handleSelectionChange}
                                onKeyUp={handleSelectionChange}
                                onKeyDown={handleKeyDown}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onPaste={async (e) => {
                                    e.preventDefault(); // 阻止默认粘贴行为
                                    const items = e.clipboardData?.items;
                                    if (!items) return;

                                    for (let i = 0; i < items.length; i++) {
                                        const item = items[i];
                                        if (item.type.startsWith('image/')) {
                                            const file = item.getAsFile();
                                            if (file) {
                                                await handleFileUpload(file);
                                                break;
                                            }
                                        }
                                    }
                                }}
                                placeholder={placeholder}
                                style={{ height: dynamicHeight }}
                                className={`w-full p-3 resize-none outline-none bg-white dark:bg-[#242628] text-gray-900 dark:text-gray-100 border-0 leading-relaxed text-sm markdown-editor-textarea ${isDragOver ? 'ring-2 ring-blue-500' : ''}`}
                            />
                        </div>
                    )}
                </div>

                {/* 图片预览区域 */}
                <div className="mt-4">
                    <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue}>
                        <AccordionItem value="preview">
                            <AccordionTrigger className="text-sm font-medium">
                                图片预览 ({previewImages.length})
                            </AccordionTrigger>
                            <AccordionContent>
                                {isUploading ? (
                                    <div className="p-8 text-center">
                                        <LoadingSpinner size="sm" text="正在上传图片..." />
                                    </div>
                                ) : previewImages.length > 0 ? (
                                    <PhotoProvider>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                                            {previewImages.map((imageUrl, index) => (
                                                <div key={index} className="relative group">
                                                    <div className="aspect-square relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                                                        <PhotoView src={imageUrl}>
                                                            <Image
                                                                src={imageUrl}
                                                                alt={`预览图片 ${index + 1}`}
                                                                fill
                                                                className="object-cover hover:scale-105 transition-transform duration-200"
                                                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                            />
                                                        </PhotoView>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeImage(index)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </PhotoProvider>
                                ) : (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-sm">暂无图片</p>
                                        <p className="text-xs mt-1">使用工具栏按钮上传或选择图片</p>
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* 隐藏的文件输入 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                />

                {/* 云端选择对话框 */}
                <div className="hidden">
                    <SupabaseImageSelectorDialog
                        onImageSelected={handleImageSelected}
                        trigger={
                            <Button
                                ref={cloudSelectorRef}
                                variant="outline"
                                size="sm"
                            >
                                <Cloud className="h-4 w-4 mr-2" />
                                从云端选择
                            </Button>
                        }
                    />
                </div>
            </div>
        </TooltipProvider>
    );
});

MarkdownEditorComponent.displayName = 'MarkdownEditor';

export { MarkdownEditorComponent as MarkdownEditor };
