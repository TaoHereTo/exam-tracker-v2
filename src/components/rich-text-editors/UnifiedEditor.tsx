'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-with-animation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Palette,
    Paintbrush,
    Link as LinkIcon,
    Sigma,
    Fullscreen,
    Minimize2,
    Heading,
    Columns2,
    Eraser
} from 'lucide-react';
import { getZIndex } from '@/lib/zIndexConfig';
import { LatexFormulaSelector } from '@/components/ui/LatexFormulaSelector';
import { HtmlRenderer } from '@/components/ui/HtmlRenderer';

interface UnifiedEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    customMinHeight?: string;
    customMaxHeight?: string;
    isInDialog?: boolean;
    externalIsFullscreen?: boolean;
}

const TOOLBAR_BUTTON_CLASSES = "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive select-none gap-1.5 has-[>svg]:px-2.5 h-8 w-8 p-0 rounded-lg shadow-none hover:bg-gray-100 dark:hover:bg-[#303030] hover:shadow-none active:bg-gray-200 dark:active:bg-gray-700 active:shadow-none focus:bg-transparent focus:shadow-none";

const colorOptions = [
    { name: '黑色', value: '#000000' },
    { name: '红色', value: '#ef4444' },
    { name: '绿色', value: '#22c55e' },
    { name: '蓝色', value: '#3b82f6' },
    { name: '黄色', value: '#eab308' },
    { name: '紫色', value: '#a855f7' },
    { name: '橙色', value: '#f97316' },
    { name: '粉色', value: '#ec4899' },
    { name: '灰色', value: '#6b7280' },
    { name: '棕色', value: '#8b5cf6' },
    { name: '青色', value: '#06b6d4' },
    { name: '白色', value: '#ffffff' }
];

export const UnifiedEditor: React.FC<UnifiedEditorProps> = ({
    content,
    onChange,
    placeholder = '开始输入...',
    className,
    customMinHeight = '300px',
    customMaxHeight = '800px',
    isInDialog = false,
    externalIsFullscreen = false
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // 计算实际的全屏状态
    const actualIsFullscreen = isFullscreen || externalIsFullscreen;

    // 调试信息（简化）
    if (actualIsFullscreen) {
        console.log('UnifiedEditor: Fullscreen mode active, tooltip z-index set to 50000');
    } else if (isInDialog) {
        console.log('UnifiedEditor: Dialog mode active, tooltip z-index set to 1000');
    }

    // 修复 tooltip 显示问题 - 优化性能版本
    useEffect(() => {
        const processedTooltips = new WeakSet();

        const fixTooltip = (tooltip: Element) => {
            // 避免重复处理同一个 tooltip
            if (processedTooltips.has(tooltip)) return;

            const tooltipElement = tooltip as HTMLElement;
            const parentElement = tooltip.parentElement as HTMLElement;

            if (actualIsFullscreen) {
                // 全屏模式：确保 tooltip 有足够高的 z-index
                tooltipElement.style.setProperty('z-index', '50000', 'important');
                if (parentElement) {
                    parentElement.style.setProperty('z-index', '50001', 'important');
                }
            } else if (isInDialog) {
                // 非全屏 Dialog 模式：确保 tooltip 有足够高的 z-index
                tooltipElement.style.setProperty('z-index', '1000', 'important');
                if (parentElement) {
                    parentElement.style.setProperty('z-index', '1001', 'important');
                }
            }

            processedTooltips.add(tooltip);
        };

        const fixTooltips = () => {
            const tooltips = document.querySelectorAll('[data-slot="tooltip-content"]');
            tooltips.forEach(fixTooltip);
        };

        // 立即执行一次
        fixTooltips();

        // 使用 MutationObserver 监听 DOM 变化，只在 tooltip 出现时修复
        const observer = new MutationObserver((mutations) => {
            let hasNewTooltips = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            if (element.hasAttribute('data-slot') && element.getAttribute('data-slot') === 'tooltip-content') {
                                hasNewTooltips = true;
                                fixTooltip(element);
                            }
                            // 检查子元素
                            const childTooltips = element.querySelectorAll('[data-slot="tooltip-content"]');
                            if (childTooltips.length > 0) {
                                hasNewTooltips = true;
                                childTooltips.forEach(fixTooltip);
                            }
                        }
                    });
                }
            });
        });

        // 开始观察
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            observer.disconnect();
        };
    }, [actualIsFullscreen, isInDialog]);
    const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
    const [hasSelectedText, setHasSelectedText] = useState(false);
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    const [showLatexSelector, setShowLatexSelector] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [isSplitPreview, setIsSplitPreview] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);



    // 检查当前选中的格式
    const checkActiveFormats = useCallback(() => {
        if (!editorRef.current) return;

        const formats = {
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough')
        };

        setActiveFormats(formats);
    }, []);

    // 检查是否有选中文本
    const checkSelectedText = useCallback(() => {
        const selection = window.getSelection();
        const hasText = selection && selection.toString().length > 0;
        setHasSelectedText(!!hasText);
    }, []);

    // 计算字数统计
    const calculateWordCount = useCallback((html: string) => {
        // 创建一个临时div来解析HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // 获取纯文本内容
        const textContent = tempDiv.textContent || tempDiv.innerText || '';

        // 计算字符数（包括空格）
        const charCount = textContent.length;

        // 计算字数（中文字符、英文单词、标点符号都算作字数）
        const chineseChars = textContent.match(/[\u4e00-\u9fff]/g) || [];
        const punctuationMarks = textContent.match(/[^\u4e00-\u9fff\s\w]/g) || [];
        const englishWords = textContent.replace(/[\u4e00-\u9fff]/g, '').replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(word => word.length > 0);

        const wordCount = chineseChars.length + englishWords.length + punctuationMarks.length;

        return { wordCount, charCount };
    }, []);

    // 处理输入事件
    const handleInput = useCallback(() => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        onChange(html);
        checkActiveFormats();
        checkSelectedText();

        // 更新字数统计
        const counts = calculateWordCount(html);
        setWordCount(counts.wordCount);
        setCharCount(counts.charCount);
    }, [onChange, checkActiveFormats, checkSelectedText, calculateWordCount]);

    // 处理列表命令
    const handleListCommand = useCallback((command: string) => {
        if (!editorRef.current) return;

        const listType = command === 'insertUnorderedList' ? 'ul' : 'ol';
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            const list = document.createElement(listType);
            const li = document.createElement('li');
            li.textContent = '列表项';
            list.appendChild(li);
            editorRef.current.appendChild(list);
        } else {
            const range = selection.getRangeAt(0);
            const list = document.createElement(listType);
            const li = document.createElement('li');

            try {
                li.appendChild(range.extractContents());
                list.appendChild(li);
                range.insertNode(list);
            } catch (error) {
                console.error('Error creating list:', error);
            }
        }

        const html = editorRef.current.innerHTML;
        onChange(html);
        checkActiveFormats();
    }, [onChange, checkActiveFormats]);

    // 处理格式化命令
    const handleFormatCommand = useCallback((command: string, value?: string) => {
        if (!editorRef.current) return;

        editorRef.current.focus();

        if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
            handleListCommand(command);
            return;
        }

        const success = document.execCommand(command, false, value);
        if (success) {
            const html = editorRef.current.innerHTML;
            onChange(html);
        }

        checkActiveFormats();
    }, [onChange, checkActiveFormats, handleListCommand]);

    // 处理键盘事件
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    handleFormatCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    handleFormatCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    handleFormatCommand('underline');
                    break;
            }
        }
    }, [handleFormatCommand]);

    // 处理点击事件
    const handleEditorClick = useCallback(() => {
        checkActiveFormats();
        checkSelectedText();
    }, [checkActiveFormats, checkSelectedText]);

    // 处理颜色变化
    const handleColorChange = useCallback((color: string, type: 'text' | 'background') => {
        if (!editorRef.current) return;

        const command = type === 'text' ? 'foreColor' : 'backColor';
        document.execCommand(command, false, color);

        const html = editorRef.current.innerHTML;
        onChange(html);
        checkActiveFormats();
    }, [onChange, checkActiveFormats]);

    // 处理菜单状态变化
    const handleMenuChange = useCallback((menu: string, open: boolean) => {
        setOpenMenus(prev => ({ ...prev, [menu]: open }));
    }, []);


    // 处理分屏预览切换
    const handleSplitPreviewToggle = useCallback(() => {
        const newSplitPreview = !isSplitPreview;
        setIsSplitPreview(newSplitPreview);
    }, [isSplitPreview]);

    // 处理全屏切换
    const handleFullscreenToggle = useCallback(() => {
        setIsFullscreen(!actualIsFullscreen);
    }, [actualIsFullscreen]);

    // 处理链接插入
    const handleLinkInsert = useCallback(() => {
        if (!linkUrl) return;

        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const link = document.createElement('a');
            link.href = linkUrl;
            link.textContent = linkText || linkUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            try {
                range.deleteContents();
                range.insertNode(link);
                selection.removeAllRanges();
            } catch (error) {
                console.error('链接插入失败:', error);
            }
        }

        const html = editorRef.current.innerHTML;
        onChange(html);
        setShowLinkDialog(false);
        setLinkUrl('');
        setLinkText('');
    }, [linkUrl, linkText, onChange]);

    // 处理LaTeX插入
    const handleLatexInsert = useCallback((latex: string, displayMode: boolean) => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.className = displayMode ? 'latex-display' : 'latex-inline';
            span.textContent = displayMode ? `$$${latex}$$` : `$${latex}$`;

            try {
                range.deleteContents();
                range.insertNode(span);
                selection.removeAllRanges();
            } catch (error) {
                console.error('LaTeX插入失败:', error);
            }
        }

        const html = editorRef.current.innerHTML;
        onChange(html);
        setShowLatexSelector(false);
    }, [onChange]);

    // 清除所有格式
    const handleClearFormat = useCallback(() => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            // 如果选中了文本，只清除选中文本的格式
            if (!selection.isCollapsed) {
                try {
                    // 获取选中内容的纯文本
                    const textContent = selection.toString();

                    // 删除选中的内容
                    range.deleteContents();

                    // 插入纯文本（无格式）
                    const textNode = document.createTextNode(textContent);
                    range.insertNode(textNode);

                    // 清除选择
                    selection.removeAllRanges();
                } catch (error) {
                    console.error('清除格式失败:', error);
                }
            } else {
                // 如果没有选中文本，清除整个编辑器的格式
                const textContent = editorRef.current.textContent || '';
                editorRef.current.innerHTML = textContent;
            }
        } else {
            // 如果没有选择，清除整个编辑器的格式
            const textContent = editorRef.current.textContent || '';
            editorRef.current.innerHTML = textContent;
        }

        // 更新内容并刷新格式状态
        const html = editorRef.current.innerHTML;
        onChange(html);
        checkActiveFormats();
    }, [onChange, checkActiveFormats]);




    // 监听选择变化
    useEffect(() => {
        const handleSelectionChange = () => {
            checkActiveFormats();
            checkSelectedText();
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [checkActiveFormats, checkSelectedText]);

    // 处理ESC键关闭全屏
    useEffect(() => {
        if (actualIsFullscreen) {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsFullscreen(false);
                }
            };

            document.addEventListener('keydown', handleKeyDown, { capture: true });
            return () => {
                document.removeEventListener('keydown', handleKeyDown, { capture: true });
            };
        }
    }, [actualIsFullscreen]);

    // 更新编辑器内容
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
            // 更新字数统计
            const counts = calculateWordCount(content);
            setWordCount(counts.wordCount);
            setCharCount(counts.charCount);
        }
    }, [content, calculateWordCount]);

    // 计算z-index
    const getMenuZIndex = () => {
        if (actualIsFullscreen) {
            return getZIndex('URGENT') + 1;
        }
        if (isInDialog) {
            return getZIndex('FULLSCREEN_EDITOR_MENU');
        }
        return undefined;
    };

    return (
        <div className={cn(
            "unified-editor-wrapper",
            actualIsFullscreen && "fixed inset-0 bg-background",
            className
        )}
            style={actualIsFullscreen ? { zIndex: getZIndex('URGENT') + 1 } : undefined}>
            {/* 工具栏 */}
            <div className="flex flex-wrap items-center justify-between gap-1 p-2 border-b bg-gray-50 dark:bg-black sticky top-0 z-10">
                <div className="flex items-center gap-1">
                    {/* 基础格式化按钮 */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className={TOOLBAR_BUTTON_CLASSES}
                                onClick={() => {
                                    console.log('Bold button clicked, actualIsFullscreen:', actualIsFullscreen);
                                    handleFormatCommand('bold');
                                }}
                                disabled={!hasSelectedText}
                            >
                                <Bold className={`w-4 h-4 ${activeFormats.bold ? 'text-blue-600' : ''}`} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent
                            className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                            style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}
                            onMouseEnter={() => console.log('Tooltip mouse enter, className:', actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[400]" : undefined)}
                        >
                            <p>加粗</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className={TOOLBAR_BUTTON_CLASSES}
                                onClick={() => handleFormatCommand('italic')}
                                disabled={!hasSelectedText}
                            >
                                <Italic className={`w-4 h-4 ${activeFormats.italic ? 'text-blue-600' : ''}`} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                            style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                            <p>斜体</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className={TOOLBAR_BUTTON_CLASSES}
                                onClick={() => handleFormatCommand('underline')}
                                disabled={!hasSelectedText}
                            >
                                <Underline className={`w-4 h-4 ${activeFormats.underline ? 'text-blue-600' : ''}`} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                            style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                            <p>下划线</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className={TOOLBAR_BUTTON_CLASSES}
                                onClick={() => handleFormatCommand('strikeThrough')}
                                disabled={!hasSelectedText}
                            >
                                <Strikethrough className={`w-4 h-4 ${activeFormats.strikeThrough ? 'text-blue-600' : ''}`} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                            style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                            <p>删除线</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* 清除格式按钮 */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className={TOOLBAR_BUTTON_CLASSES}
                                onClick={handleClearFormat}
                                disabled={!hasSelectedText && !editorRef.current?.textContent}
                            >
                                <Eraser className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                            style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                            <p>清除格式</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* 分隔线 */}
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    {/* 标题级别选择器 */}
                    <DropdownMenu open={openMenus.heading} onOpenChange={(open) => handleMenuChange('heading', open)}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="ghost" className={TOOLBAR_BUTTON_CLASSES}>
                                        <Heading className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                                style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                                <p>标题级别</p>
                            </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent
                            className="w-auto min-w-[80px]"
                            style={{
                                zIndex: getMenuZIndex(),
                            }}
                        >
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('formatBlock', 'div'); handleMenuChange('heading', false); }}>
                                正文
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('formatBlock', 'h1'); handleMenuChange('heading', false); }}>
                                标题 1
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('formatBlock', 'h2'); handleMenuChange('heading', false); }}>
                                标题 2
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('formatBlock', 'h3'); handleMenuChange('heading', false); }}>
                                标题 3
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('formatBlock', 'h4'); handleMenuChange('heading', false); }}>
                                标题 4
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('formatBlock', 'h5'); handleMenuChange('heading', false); }}>
                                标题 5
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('formatBlock', 'h6'); handleMenuChange('heading', false); }}>
                                标题 6
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 列表选择器 */}
                    <DropdownMenu open={openMenus.list} onOpenChange={(open) => handleMenuChange('list', open)}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="ghost" className={TOOLBAR_BUTTON_CLASSES}>
                                        <List className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                                style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                                <p>列表</p>
                            </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent
                            className="w-auto min-w-[100px]"
                            style={{
                                zIndex: getMenuZIndex(),
                            }}
                        >
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('insertUnorderedList'); handleMenuChange('list', false); }}>
                                <List className="w-3 h-3 mr-2" />
                                无序列表
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('insertOrderedList'); handleMenuChange('list', false); }}>
                                <ListOrdered className="w-3 h-3 mr-2" />
                                有序列表
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 对齐方式选择器 */}
                    <DropdownMenu open={openMenus.align} onOpenChange={(open) => handleMenuChange('align', open)}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="ghost" className={TOOLBAR_BUTTON_CLASSES}>
                                        <AlignLeft className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                                style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                                <p>对齐方式</p>
                            </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent
                            className="w-auto min-w-[100px]"
                            style={{
                                zIndex: getMenuZIndex(),
                            }}
                        >
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('justifyLeft'); handleMenuChange('align', false); }}>
                                <AlignLeft className="w-3 h-3 mr-2" />
                                左对齐
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('justifyCenter'); handleMenuChange('align', false); }}>
                                <AlignCenter className="w-3 h-3 mr-2" />
                                居中对齐
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('justifyRight'); handleMenuChange('align', false); }}>
                                <AlignRight className="w-3 h-3 mr-2" />
                                右对齐
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFormatCommand('justifyFull'); handleMenuChange('align', false); }}>
                                <AlignJustify className="w-3 h-3 mr-2" />
                                两端对齐
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 分隔线 */}
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    {/* 文字颜色选择器 */}
                    <Popover open={openMenus.textColor} onOpenChange={(open) => handleMenuChange('textColor', open)}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="ghost" className={TOOLBAR_BUTTON_CLASSES}>
                                        <Palette className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                                style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                                <p>文字颜色</p>
                            </TooltipContent>
                        </Tooltip>
                        <PopoverContent
                            className="w-48 p-3"
                            align="start"
                            side="bottom"
                            sideOffset={5}
                            style={{
                                zIndex: getMenuZIndex(),
                            }}
                        >
                            <div className="space-y-2">
                                <div className="text-sm font-medium">文字颜色</div>
                                <div className="grid grid-cols-6 gap-2">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color.value}
                                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color.value }}
                                            onClick={() => {
                                                handleColorChange(color.value, 'text');
                                                handleMenuChange('textColor', false);
                                            }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* 背景颜色选择器 */}
                    <Popover open={openMenus.backgroundColor} onOpenChange={(open) => handleMenuChange('backgroundColor', open)}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="ghost" className={TOOLBAR_BUTTON_CLASSES}>
                                        <Paintbrush className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                                style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                                <p>背景颜色</p>
                            </TooltipContent>
                        </Tooltip>
                        <PopoverContent
                            className="w-48 p-3"
                            align="start"
                            side="bottom"
                            sideOffset={5}
                            style={{
                                zIndex: getMenuZIndex(),
                            }}
                        >
                            <div className="space-y-2">
                                <div className="text-sm font-medium">背景颜色</div>
                                <div className="grid grid-cols-6 gap-2">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color.value}
                                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color.value }}
                                            onClick={() => {
                                                handleColorChange(color.value, 'background');
                                                handleMenuChange('backgroundColor', false);
                                            }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* 分隔线 */}
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    {/* 其他功能按钮 */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className={TOOLBAR_BUTTON_CLASSES}
                                onClick={() => setShowLinkDialog(true)}
                            >
                                <LinkIcon className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                            style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                            <p>插入链接</p>
                        </TooltipContent>
                    </Tooltip>


                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className={TOOLBAR_BUTTON_CLASSES}
                                onClick={() => setShowLatexSelector(true)}
                            >
                                <Sigma className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                            style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                            <p>插入公式</p>
                        </TooltipContent>
                    </Tooltip>


                </div>

                {/* 右侧按钮组 */}
                <div className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className={cn(
                                    TOOLBAR_BUTTON_CLASSES,
                                    isSplitPreview && "bg-gray-200 dark:bg-gray-700"
                                )}
                                onClick={handleSplitPreviewToggle}
                            >
                                <Columns2 className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                            style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                            <p>分屏预览</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* 全屏按钮 */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className={TOOLBAR_BUTTON_CLASSES}
                                onClick={handleFullscreenToggle}
                            >
                                {actualIsFullscreen ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Fullscreen className="w-4 h-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                            style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                            <p>{actualIsFullscreen ? '退出全屏' : '全屏输入'}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* 编辑器内容区域 */}
            <div className="flex flex-col" style={{
                minHeight: actualIsFullscreen ? 'calc(100vh - 80px)' : customMinHeight,
                maxHeight: actualIsFullscreen ? 'calc(100vh - 80px)' : customMaxHeight
            }}>
                {isSplitPreview ? (
                    <div className="flex flex-row flex-1">
                        {/* 左侧编辑器 */}
                        <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
                            <div className="flex-1 flex flex-col">
                                <div
                                    ref={editorRef}
                                    className="flex-1 p-4 overflow-y-auto focus:outline-none relative bg-white dark:bg-[#303030]"
                                    contentEditable
                                    suppressContentEditableWarning
                                    data-placeholder={placeholder}
                                    onInput={handleInput}
                                    onKeyDown={handleKeyDown}
                                    onClick={handleEditorClick}
                                />
                            </div>
                        </div>
                        {/* 右侧预览 */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-[#303030]">
                                <HtmlRenderer content={content} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        ref={editorRef}
                        className="flex-1 p-4 overflow-y-auto focus:outline-none relative bg-white dark:bg-[#303030]"
                        contentEditable
                        suppressContentEditableWarning
                        data-placeholder={placeholder}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        onClick={handleEditorClick}
                    />
                )}

                {/* 字数统计显示区域 */}
                <div className="flex items-center justify-end px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <span>字数: {wordCount}</span>
                        <span>字符: {charCount}</span>
                    </div>
                </div>
            </div>

            {/* LaTeX公式选择器 */}
            <LatexFormulaSelector
                open={showLatexSelector}
                onOpenChange={(open) => setShowLatexSelector(open)}
                onInsert={handleLatexInsert}
                isInFullscreen={actualIsFullscreen}
            />


            {/* 链接输入对话框 */}
            <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>插入链接</DialogTitle>
                        <DialogDescription>
                            请输入链接地址和显示文本
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="linkUrl" className="text-right">
                                链接地址
                            </Label>
                            <Input
                                id="linkUrl"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="col-span-3"
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="linkText" className="text-right">
                                显示文本
                            </Label>
                            <Input
                                id="linkText"
                                value={linkText}
                                onChange={(e) => setLinkText(e.target.value)}
                                className="col-span-3"
                                placeholder="链接文本"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                            取消
                        </Button>
                        <Button onClick={handleLinkInsert} disabled={!linkUrl}>
                            插入链接
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* 样式 */}
            <style jsx>{`
                    .unified-editor-wrapper [contenteditable]:empty::before {
                        content: attr(data-placeholder);
                        color: #9CA3AF;
                        pointer-events: none;
                        position: absolute;
                        top: 16px;
                        left: 16px;
                        line-height: 1.6;
                        font-size: 16px;
                    }
                    
                    .unified-editor-wrapper [contenteditable]:focus::before {
                        display: none;
                    }
                    
                    .unified-editor-wrapper [contenteditable]:focus {
                        outline: none;
                    }
                    
                    /* LaTeX样式 */
                    .latex-inline, .latex-display {
                        background-color: #f3f4f6;
                        padding: 2px 4px;
                        border-radius: 4px;
                        font-family: 'Times New Roman', serif;
                    }
                    
                    .dark .latex-inline, .dark .latex-display {
                        background-color: #374151;
                    }
                `}</style>
        </div>
    );
};

export default UnifiedEditor;
