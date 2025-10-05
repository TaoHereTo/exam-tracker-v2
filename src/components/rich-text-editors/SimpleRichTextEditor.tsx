'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Paintbrush,
    Type,
    Image as ImageIcon,
    Upload,
    Maximize2,
    Minimize2,
    Heading,
    Sigma,
    Eye,
    Loader2,
    X,
    RemoveFormatting,
    Eraser,
    Palette,
    Indent,
    Outdent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-with-animation';
import { SupabaseImageSelectorDrawer } from '@/components/ui/SupabaseImageSelectorDrawer';
import { Cloud, FileImage } from 'lucide-react';
import { supabaseImageManager } from '@/lib/supabaseImageManager';
import { useNotification } from '@/components/magicui/NotificationProvider';
import { LatexFormulaSelector } from '@/components/ui/LatexFormulaSelector';
import { HtmlRenderer } from '@/components/ui/HtmlRenderer';
import { CloudImageViewer } from '@/components/ui/CloudImageViewer';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import Image from 'next/image';

interface SimpleRichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    onImageChange?: (imageIds: string[]) => void;
    deferImageUpload?: boolean;
    onPendingImagesChange?: (pendingImages: { localUrl: string; file: File | null; imageId: string | null }[]) => void;
    customMinHeight?: string;
    customMaxHeight?: string;
    clearPreviewImages?: boolean;
    onUploadImages?: (uploadFn: () => Promise<string[]>) => void;
    stickyToolbar?: boolean;
    showFullscreenButton?: boolean;
    onFullscreenToggle?: () => void;
}

const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
    content,
    onChange,
    placeholder = '开始输入...',
    className = '',
    onImageChange,
    deferImageUpload = false,
    onPendingImagesChange,
    customMinHeight = '300px',
    customMaxHeight = '600px',
    clearPreviewImages = false,
    onUploadImages,
    stickyToolbar = false,
    showFullscreenButton = true,
    onFullscreenToggle
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const savedSelectionRef = useRef<{ startContainer: Node; startOffset: number; endContainer: Node; endOffset: number } | null>(null);

    // 状态管理
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const [isUploading, setIsUploading] = useState(false);
    const [pendingImages, setPendingImages] = useState<{ localUrl: string; file: File | null; imageId: string | null }[]>([]);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [showLatexSelector, setShowLatexSelector] = useState(false);
    const [showCloudImageDialog, setShowCloudImageDialog] = useState(false);

    // Popover和DropdownMenu状态管理
    const [textColorPopoverOpen, setTextColorPopoverOpen] = useState(false);
    const [backgroundColorPopoverOpen, setBackgroundColorPopoverOpen] = useState(false);
    const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);
    const [listDropdownOpen, setListDropdownOpen] = useState(false);
    const [alignDropdownOpen, setAlignDropdownOpen] = useState(false);
    const [imageDropdownOpen, setImageDropdownOpen] = useState(false);

    const { notify } = useNotification();

    // 颜色选项
    const colors = [
        '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB',
        '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
        '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
        '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
        '#EC4899', '#F43F5E'
    ];

    // 工具栏按钮样式
    const TOOLBAR_BUTTON_CLASSES = "h-8 w-8 p-0 rounded-lg hover:bg-transparent hover:shadow-none active:bg-transparent active:shadow-none focus:bg-transparent focus:shadow-none";

    // 保存当前选区
    const saveCurrentSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            savedSelectionRef.current = {
                startContainer: range.startContainer,
                startOffset: range.startOffset,
                endContainer: range.endContainer,
                endOffset: range.endOffset
            };
        }
    };

    // 恢复选区
    const restoreSelection = () => {
        if (!savedSelectionRef.current || !editorRef.current) return false;

        try {
            const selection = window.getSelection();
            if (!selection) return false;

            const range = document.createRange();
            range.setStart(savedSelectionRef.current.startContainer, savedSelectionRef.current.startOffset);
            range.setEnd(savedSelectionRef.current.endContainer, savedSelectionRef.current.endOffset);

            selection.removeAllRanges();
            selection.addRange(range);
            return true;
        } catch (error) {
            console.log('恢复选区失败:', error);
            return false;
        }
    };

    // 执行命令
    const execCommand = (command: string, value?: string) => {
        if (!editorRef.current) return;

        editorRef.current.focus();
        const success = document.execCommand(command, false, value);

        if (success) {
            const html = editorRef.current.innerHTML;
            onChange(html);
        }
    };

    // 格式化命令
    const handleFormatCommand = (command: string, value?: string) => {
        if (!editorRef.current) return;

        // 保存当前选区
        saveCurrentSelection();

        editorRef.current.focus();

        // 特殊处理列表命令
        if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
            handleListCommand(command);
            return;
        }

        const success = document.execCommand(command, false, value);

        if (success) {
            const html = editorRef.current.innerHTML;
            onChange(html);

            // 延迟恢复选区
            setTimeout(() => {
                restoreSelection();
            }, 10);
        }
    };

    // 处理列表命令
    const handleListCommand = (command: string) => {
        if (!editorRef.current) return;

        editorRef.current.focus();

        // 使用简单的 document.execCommand
        const success = document.execCommand(command, false, undefined);

        if (success) {
            const html = editorRef.current.innerHTML;

            // 确保列表样式正确显示
            const lists = editorRef.current.querySelectorAll('ul, ol');
            lists.forEach(list => {
                const htmlList = list as HTMLElement;
                htmlList.style.listStyleType = htmlList.tagName === 'UL' ? 'disc' : 'decimal';
                htmlList.style.marginLeft = '20px';
                htmlList.style.paddingLeft = '0';
            });

            onChange(html);
        } else {
            // 如果 execCommand 失败，使用手动方法
            const listType = command === 'insertUnorderedList' ? 'ul' : 'ol';

            // 获取当前编辑器的所有文本
            const allText = editorRef.current.textContent || '';

            // 清空编辑器并插入列表
            editorRef.current.innerHTML = '';
            const list = document.createElement(listType);
            const listItem = document.createElement('li');
            listItem.textContent = allText.trim() || '列表项';
            list.appendChild(listItem);
            editorRef.current.appendChild(list);

            // 设置光标位置
            const selection = window.getSelection();
            if (selection) {
                const newRange = document.createRange();
                newRange.setStart(listItem, 0);
                newRange.setEnd(listItem, 0);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }

            const html = editorRef.current.innerHTML;
            onChange(html);
        }
    };

    // 设置文字颜色
    const setTextColor = (color: string) => {
        if (!editorRef.current) return;

        // 保存当前选区
        saveCurrentSelection();

        editorRef.current.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (!selectedText) return;

        const span = document.createElement('span');
        span.style.color = color;
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);

        const html = editorRef.current.innerHTML;
        onChange(html);

        // 延迟恢复选区
        setTimeout(() => {
            restoreSelection();
        }, 10);
    };

    // 设置背景颜色
    const setBackgroundColor = (color: string) => {
        if (!editorRef.current) return;

        // 保存当前选区
        saveCurrentSelection();

        editorRef.current.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (!selectedText) return;

        const span = document.createElement('span');
        span.style.backgroundColor = color;
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);

        const html = editorRef.current.innerHTML;
        onChange(html);

        // 延迟恢复选区
        setTimeout(() => {
            restoreSelection();
        }, 10);
    };

    // 插入链接
    const insertLink = () => {
        if (!editorRef.current) return;

        editorRef.current.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (selectedText) {
            setLinkText(selectedText);
        }

        setShowLinkDialog(true);
    };

    // 确认插入链接
    const confirmInsertLink = () => {
        if (!linkUrl) return;

        if (!editorRef.current) return;

        editorRef.current.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        const finalLinkText = selectedText || linkText || linkUrl;

        const link = document.createElement('a');
        link.href = linkUrl;
        link.textContent = finalLinkText;

        if (selectedText) {
            range.deleteContents();
        }

        range.insertNode(link);

        const html = editorRef.current.innerHTML;
        onChange(html);

        setShowLinkDialog(false);
        setLinkUrl('');
        setLinkText('');
    };

    // 插入LaTeX公式
    const handleInsertLatex = (latex: string) => {
        if (!editorRef.current) return;

        editorRef.current.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const latexElement = document.createElement('span');
        latexElement.className = 'latex-formula';
        latexElement.setAttribute('data-latex', latex);
        latexElement.textContent = `$${latex}$`;

        range.insertNode(latexElement);

        const html = editorRef.current.innerHTML;
        onChange(html);

        setShowLatexSelector(false);
    };

    // 处理图片上传
    const handleImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const imageInfo = await supabaseImageManager.uploadImage(file);
                return { id: imageInfo.id, url: imageInfo.url, name: file.name };
            });

            const uploadedImages = await Promise.all(uploadPromises);

            // 插入图片到编辑器
            uploadedImages.forEach((image) => {
                if (!editorRef.current) return;

                editorRef.current.focus();
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;

                const range = selection.getRangeAt(0);
                const img = document.createElement('img');
                img.src = image.url;
                img.alt = image.name;
                img.className = 'max-w-full h-auto rounded-lg';

                range.insertNode(img);
            });

            if (editorRef.current) {
                const html = editorRef.current.innerHTML;
                onChange(html);
            }

            notify({ message: '图片上传成功', type: 'success' });
        } catch (error) {
            console.error('图片上传失败:', error);
            notify({ message: '图片上传失败', type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    // 处理云端图片选择
    const handleCloudImageSelect = (imageId: string) => {
        if (!editorRef.current) return;

        editorRef.current.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const img = document.createElement('img');
        img.src = supabaseImageManager.getImageUrl(imageId) || '';
        img.alt = 'Cloud Image';
        img.className = 'max-w-full h-auto rounded-lg';

        range.insertNode(img);

        const html = editorRef.current.innerHTML;
        onChange(html);

        setShowCloudImageDialog(false);
    };

    // 更新按钮状态
    const updateButtonStates = () => {
        const formats = ['bold', 'italic', 'underline', 'strikeThrough'];
        const newActiveFormats = new Set<string>();

        formats.forEach(format => {
            if (document.queryCommandState(format)) {
                newActiveFormats.add(format);
            }
        });

        setActiveFormats(newActiveFormats);
    };

    // 监听编辑器变化
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;

            // 如果内容包含列表，重新应用样式
            const lists = editorRef.current.querySelectorAll('ul, ol');
            if (lists.length > 0) {
                lists.forEach(list => {
                    const htmlList = list as HTMLElement;
                    htmlList.style.listStyleType = htmlList.tagName === 'UL' ? 'disc' : 'decimal';
                    htmlList.style.marginLeft = '20px';
                    htmlList.style.paddingLeft = '0';
                });
            }
        }
    }, [content]);

    // 监听选区变化
    useEffect(() => {
        const handleSelectionChange = () => {
            updateButtonStates();
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, []);

    // 处理编辑器输入
    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const html = (e.target as HTMLDivElement).innerHTML;
        onChange(html);
    };

    // 处理编辑器点击，确保光标在正确位置
    const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!editorRef.current) return;

        // 确保编辑器获得焦点
        editorRef.current.focus();

        // 如果点击的是空白区域，将光标移到末尾
        const selection = window.getSelection();
        if (selection && selection.rangeCount === 0) {
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    };

    return (
        <TooltipProvider>
            <div className={cn("rich-text-editor w-full border border-border rounded-lg overflow-hidden", className)}>
                {/* 工具栏 */}
                <div
                    ref={toolbarRef}
                    className={cn(
                        "rich-text-editor-toolbar px-4 py-1 flex flex-wrap items-center gap-1 border-b bg-background/80 backdrop-blur-md",
                        stickyToolbar ? "sticky top-0 z-50" : ""
                    )}
                >
                    {/* 文本格式 */}
                    <div className="flex items-center gap-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('bold') ? "default" : "ghost"}
                                    size="sm"
                                    onMouseDown={() => saveCurrentSelection()}
                                    onClick={() => handleFormatCommand('bold')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('bold') ? "bg-blue-500/20 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400" : ""
                                    )}
                                >
                                    <Bold className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>加粗 (Ctrl+B)</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('italic') ? "default" : "ghost"}
                                    size="sm"
                                    onMouseDown={() => saveCurrentSelection()}
                                    onClick={() => handleFormatCommand('italic')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('italic') ? "bg-purple-500/20 text-purple-600 dark:bg-purple-400/20 dark:text-purple-400" : ""
                                    )}
                                >
                                    <Italic className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>斜体 (Ctrl+I)</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('underline') ? "default" : "ghost"}
                                    size="sm"
                                    onMouseDown={() => saveCurrentSelection()}
                                    onClick={() => handleFormatCommand('underline')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('underline') ? "bg-green-500/20 text-green-600 dark:bg-green-400/20 dark:text-green-400" : ""
                                    )}
                                >
                                    <Underline className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>下划线 (Ctrl+U)</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('strikeThrough') ? "default" : "ghost"}
                                    size="sm"
                                    onMouseDown={() => saveCurrentSelection()}
                                    onClick={() => handleFormatCommand('strikeThrough')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('strikeThrough') ? "bg-red-500/20 text-red-600 dark:bg-red-400/20 dark:text-red-400" : ""
                                    )}
                                >
                                    <Strikethrough className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>删除线</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-6 w-px bg-border/60 mx-1"></div>

                    {/* 布局和结构工具组 */}
                    <div className="flex items-center gap-0.5">
                        {/* 标题选择器 */}
                        <DropdownMenu open={headingDropdownOpen} onOpenChange={setHeadingDropdownOpen}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES} onMouseDown={() => saveCurrentSelection()}>
                                            <Heading className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>选择标题级别</p>
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent className="w-auto min-w-[80px]">
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'div'); setHeadingDropdownOpen(false); }}>
                                    正文
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h1'); setHeadingDropdownOpen(false); }}>
                                    标题 1
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h2'); setHeadingDropdownOpen(false); }}>
                                    标题 2
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h3'); setHeadingDropdownOpen(false); }}>
                                    标题 3
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h4'); setHeadingDropdownOpen(false); }}>
                                    标题 4
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h5'); setHeadingDropdownOpen(false); }}>
                                    标题 5
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h6'); setHeadingDropdownOpen(false); }}>
                                    标题 6
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 列表下拉菜单 */}
                        <DropdownMenu open={listDropdownOpen} onOpenChange={setListDropdownOpen}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES} onMouseDown={() => saveCurrentSelection()}>
                                            <List className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>列表</p>
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent className="w-auto min-w-[100px]">
                                <DropdownMenuItem onClick={() => { handleFormatCommand('insertUnorderedList'); setListDropdownOpen(false); }}>
                                    <List className="w-3 h-3 mr-2" />
                                    无序列表
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('insertOrderedList'); setListDropdownOpen(false); }}>
                                    <ListOrdered className="w-3 h-3 mr-2" />
                                    有序列表
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 对齐方式下拉菜单 */}
                        <DropdownMenu open={alignDropdownOpen} onOpenChange={setAlignDropdownOpen}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES} onMouseDown={() => saveCurrentSelection()}>
                                            <AlignLeft className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>对齐方式</p>
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent className="w-auto min-w-[100px]">
                                <DropdownMenuItem onClick={() => { handleFormatCommand('justifyLeft'); setAlignDropdownOpen(false); }}>
                                    <AlignLeft className="w-3 h-3 mr-2" />
                                    左对齐
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('justifyCenter'); setAlignDropdownOpen(false); }}>
                                    <AlignCenter className="w-3 h-3 mr-2" />
                                    居中
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('justifyRight'); setAlignDropdownOpen(false); }}>
                                    <AlignRight className="w-3 h-3 mr-2" />
                                    右对齐
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('justifyFull'); setAlignDropdownOpen(false); }}>
                                    <AlignJustify className="w-3 h-3 mr-2" />
                                    两端对齐
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-6 w-px bg-border/60 mx-1"></div>

                    {/* 颜色工具组 */}
                    <div className="flex items-center gap-0.5">
                        {/* 文字颜色 */}
                        <Popover open={textColorPopoverOpen} onOpenChange={setTextColorPopoverOpen}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES} onMouseDown={() => saveCurrentSelection()}>
                                            <Palette className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>文字颜色</p>
                                </TooltipContent>
                            </Tooltip>
                            <PopoverContent className="w-48 p-3" align="start" side="bottom" sideOffset={5}>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">文字颜色</div>
                                    <div className="grid grid-cols-6 gap-2">
                                        {colors.map((color) => (
                                            <div
                                                key={color}
                                                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform cursor-pointer"
                                                style={{ backgroundColor: color }}
                                                onClick={() => {
                                                    setTextColor(color);
                                                    setTextColorPopoverOpen(false);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* 背景颜色 */}
                        <Popover open={backgroundColorPopoverOpen} onOpenChange={setBackgroundColorPopoverOpen}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES} onMouseDown={() => saveCurrentSelection()}>
                                            <Paintbrush className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>背景颜色</p>
                                </TooltipContent>
                            </Tooltip>
                            <PopoverContent className="w-48 p-3" align="start" side="bottom" sideOffset={5}>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">背景颜色</div>
                                    <div className="grid grid-cols-6 gap-2">
                                        {colors.map((color) => (
                                            <div
                                                key={color}
                                                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform cursor-pointer"
                                                style={{ backgroundColor: color }}
                                                onClick={() => {
                                                    setBackgroundColor(color);
                                                    setBackgroundColorPopoverOpen(false);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-6 w-px bg-border/60 mx-1"></div>

                    {/* 其他工具 */}
                    <div className="flex items-center gap-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES} onClick={insertLink}>
                                    <LinkIcon className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>插入链接</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES} onClick={() => setShowLatexSelector(true)}>
                                    <Sigma className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>公式</p>
                            </TooltipContent>
                        </Tooltip>

                        <DropdownMenu open={imageDropdownOpen} onOpenChange={setImageDropdownOpen}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES} disabled={isUploading}>
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>插入图片</p>
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => { fileInputRef.current?.click(); setImageDropdownOpen(false); }} className="flex items-center gap-2">
                                    <FileImage className="w-4 h-4" />
                                    <span>从本地选择</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setShowCloudImageDialog(true); setImageDropdownOpen(false); }} className="flex items-center gap-2">
                                    <Cloud className="w-4 h-4" />
                                    <span>从云端选择</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* 全屏按钮 */}
                    {showFullscreenButton && (
                        <div className="flex items-center gap-0.5 ml-auto">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={TOOLBAR_BUTTON_CLASSES}
                                        onClick={onFullscreenToggle}
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>全屏输入</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    )}
                </div>

                {/* 编辑器内容区域 */}
                <div
                    ref={editorRef}
                    className="rich-text-editor-main p-4 min-h-[200px] max-h-[600px] overflow-y-auto focus:outline-none relative"
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder={placeholder}
                    style={{
                        minHeight: customMinHeight,
                        maxHeight: customMaxHeight
                    }}
                    onInput={handleInput}
                    onClick={handleEditorClick}
                />

                {/* 隐藏的文件输入 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                />

                {/* 链接输入对话框 */}
                <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>插入链接</DialogTitle>
                            <DialogDescription>
                                输入链接地址和显示文本。如果选中了文字，将自动作为链接文本。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="link-url">链接地址</Label>
                                <Input
                                    id="link-url"
                                    placeholder="https://example.com"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="link-text">显示文本</Label>
                                <Input
                                    id="link-text"
                                    placeholder="链接文本"
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                                取消
                            </Button>
                            <Button onClick={confirmInsertLink} disabled={!linkUrl}>
                                插入链接
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 云端图片选择抽屉 */}
                <SupabaseImageSelectorDrawer
                    open={showCloudImageDialog}
                    onOpenChange={setShowCloudImageDialog}
                    onImageSelected={(imageId) => {
                        handleCloudImageSelect(imageId);
                        setShowCloudImageDialog(false);
                    }}
                    trigger={<div />}
                />

                {/* LaTeX公式选择器 */}
                <LatexFormulaSelector
                    open={showLatexSelector}
                    onOpenChange={setShowLatexSelector}
                    onInsert={handleInsertLatex}
                />

                {/* 样式 */}
                <style jsx>{`
                    .rich-text-editor-main:empty::before {
                        content: attr(data-placeholder);
                        color: #9CA3AF;
                        pointer-events: none;
                        position: absolute;
                        top: 16px;
                        left: 16px;
                        line-height: 1.6;
                        font-size: 16px;
                    }
                    
                    .rich-text-editor-main:focus::before {
                        display: none;
                    }
                    
                    /* 强制列表样式显示 */
                    .rich-text-editor-main ul,
                    .rich-text-editor-main ol {
                        list-style-type: disc !important;
                        margin-left: 20px !important;
                        padding-left: 0 !important;
                        display: block !important;
                    }
                    
                    .rich-text-editor-main ol {
                        list-style-type: decimal !important;
                    }
                    
                    .rich-text-editor-main li {
                        display: list-item !important;
                        margin: 4px 0 !important;
                    }
                    
                    /* 确保全屏模式下的二级菜单能够正常工作 */
                    [data-fullscreen-container="true"] [data-radix-popover-content],
                    [data-fullscreen-container="true"] [data-radix-dropdown-menu-content] {
                        z-index: 100002 !important;
                        position: fixed !important;
                        pointer-events: auto !important;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    
                    /* 确保全屏模式下的工具栏能够正常工作 */
                    [data-fullscreen-container="true"] .rich-text-editor-toolbar {
                        pointer-events: auto !important;
                        z-index: 100000 !important;
                        position: relative !important;
                    }
                    
                    /* 确保全屏模式下的工具栏按钮能够正常点击 */
                    [data-fullscreen-container="true"] .rich-text-editor-toolbar button {
                        pointer-events: auto !important;
                        cursor: pointer !important;
                        z-index: 100000 !important;
                        position: relative !important;
                    }
                    
                    /* 确保全屏模式下的工具栏内所有元素都能点击 */
                    [data-fullscreen-container="true"] .rich-text-editor-toolbar * {
                        pointer-events: auto !important;
                        z-index: 100000 !important;
                    }
                    
                    /* 确保全屏模式下的Popover和DropdownMenu触发器能够正常工作 */
                    [data-fullscreen-container="true"] [data-radix-popover-trigger],
                    [data-fullscreen-container="true"] [data-radix-dropdown-menu-trigger] {
                        pointer-events: auto !important;
                        cursor: pointer !important;
                        z-index: 100000 !important;
                    }
                    
                    /* 确保全屏模式下的所有Radix UI组件都能正常工作 */
                    [data-fullscreen-container="true"] [data-radix-portal] {
                        z-index: 100002 !important;
                    }
                    
                    /* 确保全屏模式下的Popover和DropdownMenu内容能够显示 */
                    [data-fullscreen-container="true"] [data-radix-popover-content],
                    [data-fullscreen-container="true"] [data-radix-dropdown-menu-content],
                    [data-fullscreen-container="true"] [data-radix-tooltip-content] {
                        z-index: 100002 !important;
                        position: fixed !important;
                        pointer-events: auto !important;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    
                    /* 确保Dialog中的二级菜单能够正常工作 */
                    [data-radix-dialog-content] [data-radix-popover-content],
                    [data-radix-dialog-content] [data-radix-dropdown-menu-content] {
                        z-index: 10003 !important;
                        position: fixed !important;
                        pointer-events: auto !important;
                    }
                    
                    /* 确保工具栏按钮能够正常点击 */
                    .rich-text-editor-toolbar button {
                        pointer-events: auto !important;
                        cursor: pointer !important;
                    }
                    
                    /* 强制确保全屏模式下的所有交互元素都能正常工作 */
                    [data-fullscreen-container="true"] * {
                        pointer-events: auto !important;
                    }
                    
                    /* 特别确保全屏模式下的工具栏区域能够交互 */
                    [data-fullscreen-container="true"] .rich-text-editor-toolbar,
                    [data-fullscreen-container="true"] .rich-text-editor-toolbar *,
                    [data-fullscreen-container="true"] .rich-text-editor-toolbar button,
                    [data-fullscreen-container="true"] .rich-text-editor-toolbar [role="button"],
                    [data-fullscreen-container="true"] .rich-text-editor-toolbar [data-radix-popover-trigger],
                    [data-fullscreen-container="true"] .rich-text-editor-toolbar [data-radix-dropdown-menu-trigger] {
                        pointer-events: auto !important;
                        cursor: pointer !important;
                        z-index: 100000 !important;
                        position: relative !important;
                    }
                    
                    /* 强制确保全屏模式下的二级菜单能够显示 */
                    [data-fullscreen-container="true"] [data-radix-popover-content],
                    [data-fullscreen-container="true"] [data-radix-dropdown-menu-content],
                    [data-fullscreen-container="true"] [data-radix-tooltip-content],
                    [data-fullscreen-container="true"] [data-radix-portal] {
                        z-index: 100002 !important;
                        position: fixed !important;
                        pointer-events: auto !important;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        transform: none !important;
                    }
                    
                    /* 确保全屏模式下的二级菜单不会被隐藏 */
                    [data-fullscreen-container="true"] [data-radix-popover-content][data-state="open"],
                    [data-fullscreen-container="true"] [data-radix-dropdown-menu-content][data-state="open"] {
                        z-index: 100002 !important;
                        position: fixed !important;
                        pointer-events: auto !important;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                `}</style>
            </div>
        </TooltipProvider>
    );
};

export default SimpleRichTextEditor;