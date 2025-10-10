'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/animate-ui/components/radix/checkbox';
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
    Eraser,
    Code,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    RefreshCw
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
    { name: '红色', value: '#ef4444' },
    { name: '蓝色', value: '#3b82f6' },
    { name: '黄色', value: '#eab308' },
    { name: '紫色', value: '#a855f7' },
    { name: '橙色', value: '#f97316' },
    { name: '粉色', value: '#ec4899' },
    { name: '青色', value: '#06b6d4' },
    { name: '深红', value: '#dc2626' },
    { name: '深绿', value: '#16a34a' },
    { name: '深蓝', value: '#1d4ed8' },
    { name: '深紫', value: '#7c3aed' },
    { name: '深粉', value: '#db2777' },
    { name: '浅红', value: '#f87171' },
    { name: '浅绿', value: '#4ade80' },
    { name: '浅蓝', value: '#60a5fa' },
    { name: '浅黄', value: '#fde047' },
    { name: '浅紫', value: '#c084fc' },
    { name: '浅橙', value: '#fb923c' }
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
    const [selectedWordCount, setSelectedWordCount] = useState(0);
    const [selectedCharCount, setSelectedCharCount] = useState(0);
    const [isInsertingLink, setIsInsertingLink] = useState(false);
    const [savedCursorRange, setSavedCursorRange] = useState<Range | null>(null);
    const [includePunctuation, setIncludePunctuation] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('editor-include-punctuation');
            return saved ? JSON.parse(saved) : true; // 默认包含标点符号
        }
        return true;
    });
    const [showCountSettings, setShowCountSettings] = useState(false);
    const [showHtmlDebug, setShowHtmlDebug] = useState(false);
    const [htmlDebugContent, setHtmlDebugContent] = useState('');
    const [isHtmlCopied, setIsHtmlCopied] = useState(false);
    const [isHtmlCleaned, setIsHtmlCleaned] = useState(false);

    // 计算字数统计
    const calculateWordCount = useCallback((html: string) => {
        // 创建一个临时div来解析HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // 获取纯文本内容
        const textContent = tempDiv.textContent || tempDiv.innerText || '';

        // 计算字符数（包括空格）
        const charCount = textContent.length;

        // 计算字数
        const chineseChars = textContent.match(/[\u4e00-\u9fff]/g) || [];
        const punctuationMarks = textContent.match(/[^\u4e00-\u9fff\s\w]/g) || [];
        const englishWords = textContent.replace(/[\u4e00-\u9fff]/g, '').replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(word => word.length > 0);

        // 根据设置决定是否包含标点符号
        const wordCount = chineseChars.length + englishWords.length + (includePunctuation ? punctuationMarks.length : 0);

        return { wordCount, charCount };
    }, [includePunctuation]);

    // 处理标点符号设置变更
    const handlePunctuationSettingChange = useCallback((include: boolean) => {
        setIncludePunctuation(include);
        localStorage.setItem('editor-include-punctuation', JSON.stringify(include));
        // 重新计算字数统计
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            const counts = calculateWordCount(html);
            setWordCount(counts.wordCount);
            setCharCount(counts.charCount);
        }
    }, [calculateWordCount]);

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

    // 检查是否有选中文本并计算选中文本的字数
    const checkSelectedText = useCallback(() => {
        const selection = window.getSelection();
        const selectedText = selection ? selection.toString() : '';
        const hasText = selectedText.length > 0;
        setHasSelectedText(!!hasText);

        if (hasText) {
            // 计算选中文本的字数统计
            const charCount = selectedText.length;

            // 计算字数（中文字符、英文单词、标点符号都算作字数）
            const chineseChars = selectedText.match(/[\u4e00-\u9fff]/g) || [];
            const punctuationMarks = selectedText.match(/[^\u4e00-\u9fff\s\w]/g) || [];
            const englishWords = selectedText.replace(/[\u4e00-\u9fff]/g, '').replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(word => word.length > 0);

            const wordCount = chineseChars.length + englishWords.length + punctuationMarks.length;

            setSelectedWordCount(wordCount);
            setSelectedCharCount(charCount);
        } else {
            setSelectedWordCount(0);
            setSelectedCharCount(0);
        }
    }, []);

    // 自动清理HTML结构
    const autoCleanHtml = useCallback((html: string) => {
        if (!html || html.trim() === '') return html;

        // 快速检查是否包含需要清理的结构
        const needsCleaning = html.includes('<h1><div') ||
            html.includes('<h2><div') ||
            html.includes('<h3><div') ||
            html.includes('<h4><div') ||
            html.includes('<h5><div') ||
            html.includes('<h6><div') ||
            html.includes('border-color: rgb(224, 224, 224)');

        if (!needsCleaning) {
            return html; // 如果不需要清理，直接返回原HTML
        }

        console.log('开始清理HTML:', html);

        // 创建一个临时容器来解析和清理HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // 第一轮：清理嵌套的标题标签
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            // 检查标题内部是否包含其他标题标签或div
            const nestedElements = heading.querySelectorAll('h1, h2, h3, h4, h5, h6, div');
            if (nestedElements.length > 0) {
                console.log('发现嵌套标题，清理中...', heading.outerHTML);
                // 如果包含嵌套元素，将内容提取出来并重新组织
                const textContent = heading.textContent || '';
                const newDiv = document.createElement('div');
                newDiv.textContent = textContent;
                heading.parentNode?.replaceChild(newDiv, heading);
            }
        });

        // 第二轮：清理空的标签
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(element => {
            if (element.textContent?.trim() === '' && element.children.length === 0) {
                element.remove();
            }
        });

        // 第三轮：清理无效的嵌套结构（更全面的选择器）
        const invalidNested = tempDiv.querySelectorAll('h1 h1, h1 h2, h1 h3, h1 h4, h1 h5, h1 h6, h1 div, h2 h1, h2 h2, h2 h3, h2 h4, h2 h5, h2 h6, h2 div, h3 h1, h3 h2, h3 h3, h3 h4, h3 h5, h3 h6, h3 div, h4 h1, h4 h2, h4 h3, h4 h4, h4 h5, h4 h6, h4 div, h5 h1, h5 h2, h5 h3, h5 h4, h5 h5, h5 h6, h5 div, h6 h1, h6 h2, h6 h3, h6 h4, h6 h5, h6 h6, h6 div');
        invalidNested.forEach(element => {
            console.log('发现无效嵌套，清理中...', element.outerHTML);
            const textContent = element.textContent || '';
            const newDiv = document.createElement('div');
            newDiv.textContent = textContent;
            element.parentNode?.replaceChild(newDiv, element);
        });

        // 第四轮：清理重复的样式属性
        const elementsWithStyle = tempDiv.querySelectorAll('[style]');
        elementsWithStyle.forEach(element => {
            const style = element.getAttribute('style');
            if (style && style.includes('border-color') && style.includes('outline-color')) {
                // 移除这些浏览器自动添加的样式
                element.removeAttribute('style');
            }
        });

        const cleanedHtml = tempDiv.innerHTML;
        console.log('清理后的HTML:', cleanedHtml);

        return cleanedHtml;
    }, []);

    // 处理输入事件
    const handleInput = useCallback(() => {
        if (!editorRef.current) return;
        let html = editorRef.current.innerHTML;

        // 检查是否需要清理HTML结构
        const cleanedHtml = autoCleanHtml(html);

        // 只有在HTML结构确实有问题时才进行清理
        if (cleanedHtml !== html && cleanedHtml.length > 0) {
            console.log('输入事件中自动清理HTML结构');
            console.log('清理前:', html);
            console.log('清理后:', cleanedHtml);

            // 保存当前光标位置
            const selection = window.getSelection();
            let cursorPosition = null;
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                // 检查光标是否在编辑器内
                if (editorRef.current.contains(range.startContainer)) {
                    cursorPosition = range.cloneRange();
                }
            }

            // 使用setTimeout来延迟清理，避免干扰正常的输入操作
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.innerHTML = cleanedHtml;

                    // 恢复光标位置
                    if (cursorPosition && selection) {
                        try {
                            selection.removeAllRanges();
                            selection.addRange(cursorPosition);
                        } catch (error) {
                            console.log('无法恢复光标位置:', error);
                        }
                    }
                }
            }, 0);

            html = cleanedHtml;
        }

        onChange(html);
        checkActiveFormats();
        checkSelectedText();

        // 更新字数统计
        const counts = calculateWordCount(html);
        setWordCount(counts.wordCount);
        setCharCount(counts.charCount);

        // 更新HTML调试内容
        setHtmlDebugContent(html);
    }, [onChange, checkActiveFormats, checkSelectedText, calculateWordCount, autoCleanHtml]);

    // 处理列表命令
    const handleListCommand = useCallback((command: string) => {
        if (!editorRef.current) return;

        // 确保编辑器获得焦点
        editorRef.current.focus();

        // 使用浏览器的原生 execCommand 来处理列表
        const success = document.execCommand(command, false, undefined);

        if (success) {
            let html = editorRef.current.innerHTML;

            // 自动清理HTML结构
            const cleanedHtml = autoCleanHtml(html);

            // 如果HTML被清理了，更新编辑器内容
            if (cleanedHtml !== html) {
                editorRef.current.innerHTML = cleanedHtml;
                html = cleanedHtml;
                console.log('列表操作后自动清理HTML结构');
            }

            onChange(html);
            checkActiveFormats();
        } else {
            // 如果 execCommand 失败，使用备用方案
            const listType = command === 'insertUnorderedList' ? 'ul' : 'ol';
            const selection = window.getSelection();

            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const list = document.createElement(listType);
                const li = document.createElement('li');

                // 获取选中的内容或当前行的内容
                const selectedContent = range.extractContents();
                if (selectedContent.textContent?.trim() === '') {
                    li.textContent = '列表项';
                } else {
                    li.appendChild(selectedContent);
                }

                list.appendChild(li);
                range.insertNode(list);

                // 将光标移到列表项内
                const newRange = document.createRange();
                newRange.selectNodeContents(li);
                newRange.collapse(false);
                selection.removeAllRanges();
                selection.addRange(newRange);

                let html = editorRef.current.innerHTML;

                // 自动清理HTML结构
                const cleanedHtml = autoCleanHtml(html);

                // 如果HTML被清理了，更新编辑器内容
                if (cleanedHtml !== html) {
                    editorRef.current.innerHTML = cleanedHtml;
                    html = cleanedHtml;
                    console.log('列表备用方案后自动清理HTML结构');
                }

                onChange(html);
                checkActiveFormats();
            }
        }
    }, [onChange, checkActiveFormats, autoCleanHtml]);

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
            let html = editorRef.current.innerHTML;

            // 自动清理HTML结构
            const cleanedHtml = autoCleanHtml(html);

            // 如果HTML被清理了，更新编辑器内容
            if (cleanedHtml !== html) {
                editorRef.current.innerHTML = cleanedHtml;
                html = cleanedHtml;
                console.log('格式化后自动清理HTML结构');
            }

            onChange(html);
        }

        checkActiveFormats();
    }, [onChange, checkActiveFormats, handleListCommand, autoCleanHtml]);

    // 处理键盘事件
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // 处理回车键
        if (e.key === 'Enter') {
            console.log('回车键被按下，允许默认行为');
            // 让浏览器正常处理回车键，不阻止默认行为
            // 回车键会创建新的段落或换行
            return;
        }

        // 处理Ctrl/Cmd组合键
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
        console.log('分屏预览切换:', newSplitPreview);
    }, [isSplitPreview]);

    // 处理全屏切换
    const handleFullscreenToggle = useCallback(() => {
        setIsFullscreen(!actualIsFullscreen);
    }, [actualIsFullscreen]);

    // 处理HTML调试区域切换
    const handleHtmlDebugToggle = useCallback(() => {
        setShowHtmlDebug(!showHtmlDebug);
    }, [showHtmlDebug]);

    // 复制HTML代码到剪贴板
    const handleCopyHtml = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(htmlDebugContent);
            setIsHtmlCopied(true);
            setTimeout(() => setIsHtmlCopied(false), 2000);
            console.log('HTML代码已复制到剪贴板');
        } catch (error) {
            console.error('复制失败:', error);
            // 备用方案：使用传统的复制方法
            const textArea = document.createElement('textarea');
            textArea.value = htmlDebugContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setIsHtmlCopied(true);
            setTimeout(() => setIsHtmlCopied(false), 2000);
            console.log('HTML代码已复制到剪贴板（备用方案）');
        }
    }, [htmlDebugContent]);

    // 清理HTML结构
    const handleCleanHtml = useCallback(() => {
        if (!editorRef.current) return;

        try {
            // 获取当前内容
            const currentHtml = editorRef.current.innerHTML;
            console.log('手动清理前的HTML:', currentHtml);

            // 使用自动清理函数
            const cleanedHtml = autoCleanHtml(currentHtml);

            if (cleanedHtml !== currentHtml) {
                console.log('手动清理后的HTML:', cleanedHtml);

                // 更新编辑器内容
                editorRef.current.innerHTML = cleanedHtml;
                onChange(cleanedHtml);
                setHtmlDebugContent(cleanedHtml);

                // 重新计算字数统计
                const counts = calculateWordCount(cleanedHtml);
                setWordCount(counts.wordCount);
                setCharCount(counts.charCount);

                // 显示清理成功动效
                setIsHtmlCleaned(true);
                setTimeout(() => setIsHtmlCleaned(false), 2000);

                console.log('HTML结构已手动清理完成');
            } else {
                console.log('HTML结构已经是干净的，无需清理');
            }
        } catch (error) {
            console.error('清理HTML失败:', error);
        }
    }, [onChange, calculateWordCount, autoCleanHtml]);

    // 保存光标位置
    const saveCursorPosition = useCallback(() => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (editorRef.current.contains(range.startContainer)) {
                setSavedCursorRange(range.cloneRange());
                console.log('保存了光标位置');
            }
        }
    }, []);

    // 处理链接插入
    const handleLinkInsert = useCallback(() => {
        if (!linkUrl) return;
        if (!editorRef.current) return;

        console.log('开始插入链接，当前选择:', window.getSelection());
        console.log('保存的光标位置:', savedCursorRange);

        // 确保编辑器获得焦点
        editorRef.current.focus();

        // 等待焦点稳定
        requestAnimationFrame(() => {
            const selection = window.getSelection();

            try {
                // 设置标志，防止useEffect覆盖内容
                setIsInsertingLink(true);

                console.log('开始插入链接，当前选择:', selection);
                console.log('选择范围数量:', selection?.rangeCount);
                console.log('选择是否折叠:', selection?.isCollapsed);

                // 检查是否有选中的文本
                let selectedText = '';
                if (selection && selection.rangeCount > 0) {
                    selectedText = selection.toString().trim();
                    console.log('选中的文本:', selectedText);
                }

                // 创建链接元素
                const link = document.createElement('a');
                link.href = linkUrl;
                // 如果有选中的文本，使用选中的文本作为链接文本
                link.textContent = selectedText || linkText || linkUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'text-blue-600 underline hover:text-blue-800';

                console.log('创建的链接元素:', link);
                console.log('链接href:', link.href);
                console.log('链接文本:', link.textContent);

                // 尝试获取有效的选择范围
                let workingRange: Range | null = null;

                // 首先尝试使用保存的光标位置
                if (savedCursorRange && editorRef.current && editorRef.current.contains(savedCursorRange.startContainer)) {
                    workingRange = savedCursorRange;
                    console.log('使用保存的光标位置');
                } else if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    console.log('当前范围:', range);
                    console.log('范围容器:', range.startContainer);
                    console.log('范围是否在编辑器内:', editorRef.current?.contains(range.startContainer));

                    // 检查范围是否在编辑器内
                    if (editorRef.current && editorRef.current.contains(range.startContainer)) {
                        workingRange = range;
                        console.log('使用当前范围');
                    } else {
                        console.log('当前范围不在编辑器内，尝试重新获取');
                        // 尝试在编辑器内容中找到一个合适的位置
                        const textNodes = [];
                        if (editorRef.current) {
                            const walker = document.createTreeWalker(
                                editorRef.current,
                                NodeFilter.SHOW_TEXT
                            );

                            let node;
                            while (node = walker.nextNode()) {
                                if (node.textContent && node.textContent.trim()) {
                                    textNodes.push(node);
                                }
                            }

                            if (textNodes.length > 0) {
                                // 如果有选中的文本，尝试找到包含该文本的节点
                                if (selectedText) {
                                    const matchingNode = textNodes.find(node =>
                                        node.textContent?.includes(selectedText)
                                    );
                                    if (matchingNode) {
                                        const textContent = matchingNode.textContent || '';
                                        const startIndex = textContent.indexOf(selectedText);
                                        const endIndex = startIndex + selectedText.length;

                                        const newRange = document.createRange();
                                        newRange.setStart(matchingNode, startIndex);
                                        newRange.setEnd(matchingNode, endIndex);
                                        workingRange = newRange;
                                        console.log('找到包含选中文本的节点');
                                    }
                                }

                                // 如果没有找到匹配的节点，尝试找到更合适的位置
                                if (!workingRange) {
                                    // 尝试找到编辑器中最接近光标位置的文本节点
                                    // 这里我们使用一个更智能的方法：找到最中间的文本节点
                                    const middleIndex = Math.floor(textNodes.length / 2);
                                    const targetNode = textNodes[middleIndex];

                                    if (targetNode) {
                                        const newRange = document.createRange();
                                        // 尝试在文本节点的中间位置插入
                                        const textLength = targetNode.textContent?.length || 0;
                                        const insertPosition = Math.floor(textLength / 2);
                                        newRange.setStart(targetNode, insertPosition);
                                        newRange.setEnd(targetNode, insertPosition);
                                        workingRange = newRange;
                                        console.log('使用中间文本节点的中间位置');
                                    } else {
                                        // 如果还是没有找到，使用最后一个文本节点的末尾
                                        const lastTextNode = textNodes[textNodes.length - 1];
                                        const newRange = document.createRange();
                                        newRange.setStart(lastTextNode, lastTextNode.textContent?.length || 0);
                                        newRange.setEnd(lastTextNode, lastTextNode.textContent?.length || 0);
                                        workingRange = newRange;
                                        console.log('使用最后一个文本节点的末尾');
                                    }
                                }
                            } else {
                                // 如果没有文本节点，在编辑器末尾插入
                                if (editorRef.current) {
                                    const newRange = document.createRange();
                                    newRange.selectNodeContents(editorRef.current);
                                    newRange.collapse(false);
                                    workingRange = newRange;
                                    console.log('没有文本节点，在编辑器末尾插入');
                                }
                            }
                        }
                    }
                } else {
                    console.log('没有选择，使用备用方案');
                    // 使用备用方案：在编辑器末尾插入
                    if (editorRef.current) {
                        const newRange = document.createRange();
                        newRange.selectNodeContents(editorRef.current);
                        newRange.collapse(false);
                        workingRange = newRange;
                    }
                }

                // 执行链接插入
                if (workingRange) {
                    if (selectedText && workingRange.toString().trim() === selectedText) {
                        // 有选中文本，替换选中文本
                        console.log('替换选中文本为链接');
                        workingRange.deleteContents();
                        workingRange.insertNode(link);
                    } else {
                        // 没有选中文本或选中文本不匹配，在光标位置插入
                        console.log('在光标位置插入链接');
                        workingRange.insertNode(link);
                    }

                    // 将光标移到链接后面
                    const newRange = document.createRange();
                    newRange.setStartAfter(link);
                    newRange.setEndAfter(link);
                    selection?.removeAllRanges();
                    selection?.addRange(newRange);

                    // 确保链接可以点击
                    link.style.pointerEvents = 'auto';
                    link.style.cursor = 'pointer';

                    // 添加点击事件处理
                    link.addEventListener('click', (e) => {
                        console.log('链接被点击:', link.href);
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(link.href, '_blank', 'noopener,noreferrer');
                    });

                    console.log('链接插入成功');
                }

                // 更新内容并刷新状态
                let html = editorRef.current?.innerHTML || '';

                // 自动清理HTML结构
                const cleanedHtml = autoCleanHtml(html);

                // 如果HTML被清理了，更新编辑器内容
                if (cleanedHtml !== html && editorRef.current) {
                    editorRef.current.innerHTML = cleanedHtml;
                    html = cleanedHtml;
                    console.log('链接插入后自动清理HTML结构');
                }

                console.log('插入链接后的HTML:', html);
                onChange(html);
                checkActiveFormats();
                checkSelectedText();

            } catch (error) {
                console.error('链接插入失败:', error);
            } finally {
                // 重置标志
                setTimeout(() => {
                    setIsInsertingLink(false);
                }, 100);
            }

            // 关闭对话框并重置状态
            setShowLinkDialog(false);
            setLinkUrl('');
            setLinkText('');
            setSavedCursorRange(null);
        });
    }, [linkUrl, linkText, onChange, checkActiveFormats, checkSelectedText, savedCursorRange, autoCleanHtml]);

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

        let html = editorRef.current.innerHTML;

        // 自动清理HTML结构
        const cleanedHtml = autoCleanHtml(html);

        // 如果HTML被清理了，更新编辑器内容
        if (cleanedHtml !== html) {
            editorRef.current.innerHTML = cleanedHtml;
            html = cleanedHtml;
            console.log('LaTeX插入后自动清理HTML结构');
        }

        onChange(html);
        setShowLatexSelector(false);
    }, [onChange, autoCleanHtml]);

    // 清除所有格式
    const handleClearFormat = useCallback(() => {
        if (!editorRef.current) return;

        // 确保编辑器获得焦点
        editorRef.current.focus();

        const selection = window.getSelection();

        // 如果选中了文本，清除选中文本的格式
        if (selection && !selection.isCollapsed) {
            try {
                // 首先尝试使用原生命令清除内联格式
                document.execCommand('removeFormat', false);

                // 然后手动处理标题级别等块级格式
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;

                // 查找并处理包含选中文本的标题元素
                let element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;

                // 向上查找标题元素
                while (element && element !== editorRef.current) {
                    if (element.tagName && element.tagName.match(/^H[1-6]$/)) {
                        // 找到标题元素，将其转换为普通段落
                        const textContent = element.textContent || '';
                        const newDiv = document.createElement('div');
                        newDiv.textContent = textContent;
                        element.parentNode?.replaceChild(newDiv, element);
                        break;
                    }
                    element = element.parentElement;
                }

                // 更新内容
                let html = editorRef.current.innerHTML;

                // 自动清理HTML结构
                const cleanedHtml = autoCleanHtml(html);

                // 如果HTML被清理了，更新编辑器内容
                if (cleanedHtml !== html) {
                    editorRef.current.innerHTML = cleanedHtml;
                    html = cleanedHtml;
                    console.log('清除格式后自动清理HTML结构');
                }

                onChange(html);
                checkActiveFormats();
                checkSelectedText();
            } catch (error) {
                console.error('清除格式失败:', error);
            }
        } else {
            // 如果没有选中文本，清除整个编辑器的格式
            try {
                // 选中整个编辑器内容
                const range = document.createRange();
                range.selectNodeContents(editorRef.current);
                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(range);
                }

                // 使用removeFormat命令清除内联格式
                document.execCommand('removeFormat', false);

                // 手动处理所有标题元素
                const headings = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
                headings.forEach(heading => {
                    const textContent = heading.textContent || '';
                    const newDiv = document.createElement('div');
                    newDiv.textContent = textContent;
                    heading.parentNode?.replaceChild(newDiv, heading);
                });

                // 清除选择
                if (selection) {
                    selection.removeAllRanges();
                }

                let html = editorRef.current.innerHTML;

                // 自动清理HTML结构
                const cleanedHtml = autoCleanHtml(html);

                // 如果HTML被清理了，更新编辑器内容
                if (cleanedHtml !== html) {
                    editorRef.current.innerHTML = cleanedHtml;
                    html = cleanedHtml;
                    console.log('清除全部格式后自动清理HTML结构');
                }

                onChange(html);
                checkActiveFormats();
                checkSelectedText();
            } catch (error) {
                console.error('清除格式失败:', error);
            }
        }
    }, [onChange, checkActiveFormats, checkSelectedText, autoCleanHtml]);




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
        if (editorRef.current && editorRef.current.innerHTML !== content && !isInsertingLink) {
            console.log('useEffect更新编辑器内容:', content);

            // 自动清理外部传入的内容
            const cleanedContent = autoCleanHtml(content);
            editorRef.current.innerHTML = cleanedContent;

            // 更新字数统计
            const counts = calculateWordCount(cleanedContent);
            setWordCount(counts.wordCount);
            setCharCount(counts.charCount);
            // 更新HTML调试内容
            setHtmlDebugContent(cleanedContent);
        }
    }, [content, calculateWordCount, isInsertingLink, autoCleanHtml]);

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
            "unified-editor-wrapper border border-gray-200 dark:border-gray-700 rounded-lg",
            actualIsFullscreen && "fixed inset-0 bg-background",
            className
        )}
            style={actualIsFullscreen ? { zIndex: getZIndex('URGENT') + 1 } : undefined}>
            {/* 工具栏 */}
            <div className="flex flex-wrap items-center justify-between gap-1 p-2 border-b bg-gray-50 dark:bg-black sticky top-0 z-10 rounded-t-lg">
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
                                disabled={!hasSelectedText && !editorRef.current?.innerHTML?.trim()}
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
                                onClick={() => {
                                    saveCursorPosition();
                                    // 获取选中的文字并设置到显示文字输入框
                                    const selection = window.getSelection();
                                    const selectedText = selection ? selection.toString().trim() : '';
                                    if (selectedText) {
                                        setLinkText(selectedText);
                                    }
                                    setShowLinkDialog(true);
                                }}
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

                    {/* HTML调试按钮 */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className={cn(
                                    TOOLBAR_BUTTON_CLASSES,
                                    showHtmlDebug && "bg-gray-200 dark:bg-gray-700"
                                )}
                                onClick={handleHtmlDebugToggle}
                            >
                                <Code className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className={actualIsFullscreen ? "z-[50000]" : isInDialog ? "z-[1000]" : undefined}
                            style={actualIsFullscreen ? { zIndex: 50000 } : isInDialog ? { zIndex: 1000 } : undefined}>
                            <p>HTML调试</p>
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
                <div className="flex items-center justify-end px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                    <div className="flex items-center gap-4">
                        {hasSelectedText ? (
                            <>
                                <span className="text-blue-600 dark:text-blue-400">
                                    选中: {selectedWordCount}字 / {selectedCharCount}字符
                                </span>
                                <span className="text-gray-400">|</span>
                                <Popover open={showCountSettings} onOpenChange={setShowCountSettings}>
                                    <PopoverTrigger asChild>
                                        <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                                            <span>字数: {wordCount}</span>
                                            <span>字符: {charCount}</span>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-3" align="end">
                                        <div className="space-y-2">
                                            <div className="font-medium text-sm leading-none">字数统计设置</div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-punctuation"
                                                    checked={includePunctuation}
                                                    onCheckedChange={(checked: boolean) =>
                                                        handlePunctuationSettingChange(checked)
                                                    }
                                                />
                                                <Label
                                                    htmlFor="include-punctuation"
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    将标点符号算作字数
                                                </Label>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {includePunctuation
                                                    ? "当前设置：标点符号计入字数统计"
                                                    : "当前设置：标点符号不计入字数统计"
                                                }
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </>
                        ) : (
                            <Popover open={showCountSettings} onOpenChange={setShowCountSettings}>
                                <PopoverTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                                        <span>字数: {wordCount}</span>
                                        <span>字符: {charCount}</span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-3" align="end">
                                    <div className="space-y-2">
                                        <div className="font-medium text-sm leading-none">字数统计设置</div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="include-punctuation"
                                                checked={includePunctuation}
                                                onCheckedChange={(checked: boolean) =>
                                                    handlePunctuationSettingChange(checked)
                                                }
                                            />
                                            <Label
                                                htmlFor="include-punctuation"
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                将标点符号算作字数
                                            </Label>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {includePunctuation
                                                ? "当前设置：标点符号计入字数统计"
                                                : "当前设置：标点符号不计入字数统计"
                                            }
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>

                {/* HTML调试区域 */}
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
                                            className="h-7 w-7 p-0 transition-all duration-300 ease-in-out"
                                            onClick={handleCleanHtml}
                                        >
                                            <div className="relative">
                                                <RefreshCw className={`w-3 h-3 transition-all duration-300 ${isHtmlCleaned ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'}`} />
                                                <Check className={`w-3 h-3 text-green-500 absolute top-0 left-0 transition-all duration-300 ${isHtmlCleaned ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'}`} />
                                            </div>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isHtmlCleaned ? '已清理' : '清理结构'}</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 transition-all duration-300 ease-in-out"
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
                                        <p>关闭HTML调试</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                        <div className="p-4">
                            <pre className="text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                {htmlDebugContent || '<div>暂无内容</div>'}
                            </pre>
                        </div>
                    </div>
                )}
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
                        <Button
                            variant="outline"
                            onClick={() => setShowLinkDialog(false)}
                            className="h-9 px-6 rounded-full font-medium"
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleLinkInsert}
                            disabled={!linkUrl}
                            className="h-9 px-6 rounded-full font-medium bg-[#ea580c] hover:bg-[#ea580c]/90 text-white"
                        >
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
                    
                    /* 链接样式 */
                    .unified-editor-wrapper a {
                        color: #2563eb !important;
                        text-decoration: underline !important;
                        cursor: pointer;
                    }
                    
                    .unified-editor-wrapper a:hover {
                        color: #1d4ed8 !important;
                    }
                    
                    .dark .unified-editor-wrapper a {
                        color: #60a5fa !important;
                    }
                    
                    .dark .unified-editor-wrapper a:hover {
                        color: #93c5fd !important;
                    }
                `}</style>
        </div>
    );
};

export default UnifiedEditor;
