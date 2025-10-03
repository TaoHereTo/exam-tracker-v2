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
    Palette
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabaseImageManager } from '@/lib/supabaseImageManager';
import { useNotification } from '@/components/magicui/NotificationProvider';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/animate-ui/components/radix/hover-card';
import { LatexFormulaSelector } from '@/components/ui/LatexFormulaSelector';
import { HtmlRenderer } from '@/components/ui/HtmlRenderer';
import { CloudImageViewer } from '@/components/ui/CloudImageViewer';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import Image from 'next/image';

// 简单的LaTeX Hover Card组件
const LatexHoverCard: React.FC<{ latex: string; children: React.ReactNode }> = ({ latex, children }) => {
    const [renderedLatex, setRenderedLatex] = useState<string>('');

    useEffect(() => {
        try {
            const rendered = katex.renderToString(latex, {
                throwOnError: false,
                displayMode: false
            });
            setRenderedLatex(rendered);
        } catch (error) {
            setRenderedLatex(`$${latex}$`);
        }
    }, [latex]);

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent className="w-auto p-3">
                <div
                    className="text-center"
                    dangerouslySetInnerHTML={{ __html: renderedLatex }}
                />
            </HoverCardContent>
        </HoverCard>
    );
};

interface SimpleRichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    onImageChange?: (imageIds: string[]) => void;
    deferImageUpload?: boolean;
    onPendingImagesChange?: (pendingImages: { localUrl: string; file: File | null; imageId: string | null }[]) => void;
    customMinHeight?: string; // 新增：自定义最小高度
    customMaxHeight?: string; // 新增：自定义最大高度
    clearPreviewImages?: boolean; // 新增：用于清理预览图片
    onUploadImages?: (uploadFn: () => Promise<string[]>) => void; // 新增：暴露上传函数
    stickyToolbar?: boolean; // 新增：工具栏是否相对视口固定
    showFullscreenButton?: boolean; // 新增：是否显示全屏按钮
    onFullscreenToggle?: () => void; // 新增：全屏按钮点击回调
}

const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
    content,
    onChange,
    placeholder = '开始输入...',
    className,
    onImageChange,
    deferImageUpload = false,
    onPendingImagesChange,
    customMinHeight,
    customMaxHeight,
    clearPreviewImages = false,
    onUploadImages,
    stickyToolbar = false,
    showFullscreenButton = true,
    onFullscreenToggle
}) => {
    // 统一的按钮样式常量
    const TOOLBAR_BUTTON_CLASSES = "h-8 w-8 p-0 rounded-lg hover:bg-transparent hover:shadow-none active:bg-transparent active:shadow-none focus:bg-transparent focus:shadow-none";

    const editorRef = useRef<HTMLDivElement>(null);
    const savedSelectionRef = useRef<{ startContainer: Node; startOffset: number; endContainer: Node; endOffset: number } | null>(null);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [pendingImages, setPendingImages] = useState<{ localUrl: string; file: File | null; imageId: string | null }[]>([]);
    const pendingImagesRef = useRef<{ localUrl: string; file: File | null; imageId: string | null }[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [showLatexSelector, setShowLatexSelector] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [images, setImages] = useState<{ id: string; url: string; name: string; file?: File }[]>([]);
    const [showCloudImageDialog, setShowCloudImageDialog] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { notify } = useNotification();






    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            if (content === '') {
                editorRef.current.innerHTML = '';
                // 确保占位文字显示
                editorRef.current.setAttribute('data-empty', 'true');
            } else {
                editorRef.current.innerHTML = processLatexContent(content);
                editorRef.current.removeAttribute('data-empty');
            }
        }
    }, [content]);

    // 清理定时器
    useEffect(() => {
        return () => {
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }
        };
    }, []);

    // 初始化占位文字状态
    useEffect(() => {
        if (editorRef.current) {
            const textContent = editorRef.current.textContent || '';
            if (textContent.trim() === '') {
                editorRef.current.setAttribute('data-empty', 'true');
            } else {
                editorRef.current.removeAttribute('data-empty');
            }
        }
    }, []);

    // 确保图片状态在组件重新渲染时保持
    useEffect(() => {
        if (pendingImagesRef.current.length > 0 && pendingImages.length === 0) {
            console.log('SimpleRichTextEditor 恢复图片状态:', pendingImagesRef.current);
            setPendingImages(pendingImagesRef.current);
        }
    }, [pendingImages.length]);

    // 强制保持图片状态，防止意外丢失 - 优化版本
    useEffect(() => {
        const interval = setInterval(() => {
            if (pendingImagesRef.current.length > 0 && pendingImages.length === 0) {
                console.log('SimpleRichTextEditor 定时检查：恢复图片状态', pendingImagesRef.current);
                setPendingImages(pendingImagesRef.current);
            }
        }, 5000); // 减少频率，从1秒改为5秒

        return () => clearInterval(interval);
    }, [pendingImages.length]); // 添加依赖，避免不必要的重新创建

    // 处理待上传图片变化 - 简化版本，只用于通知父组件
    const handlePendingImagesChange = useCallback((images: { localUrl: string; file: File | null; imageId: string | null }[]) => {
        pendingImagesRef.current = images;
        setPendingImages(images);

        // 保存到 localStorage
        try {
            localStorage.setItem('pendingImages', JSON.stringify(images));
        } catch (e) {
            console.log('无法保存到 localStorage:', e);
        }
        onPendingImagesChange?.(images);
    }, [onPendingImagesChange]);

    // 监听清理预览图片的请求
    useEffect(() => {
        if (clearPreviewImages) {
            setPendingImages([]);
            pendingImagesRef.current = [];
            // 清理 localStorage
            try {
                localStorage.removeItem('pendingImages');
            } catch (e) {
                console.log('无法清理 localStorage:', e);
            }
        }
    }, [clearPreviewImages]);


    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        // console.log('handleInput 触发');
        const html = e.currentTarget.innerHTML;
        const textContent = e.currentTarget.textContent || '';

        // 管理占位文字状态
        if (textContent.trim() === '') {
            e.currentTarget.setAttribute('data-empty', 'true');
        } else {
            e.currentTarget.removeAttribute('data-empty');
        }

        onChange(html);
    };

    // 清理空内容的函数 - 智能清理HTML标签和空行
    const cleanEmptyContent = (html: string): string => {
        // 如果内容为空或者只包含空白字符，返回空字符串
        if (!html || html.trim() === '') {
            return '';
        }

        // 智能清理逻辑
        let cleaned = html;

        // 1. 清理空的格式化标签（这些是用户删除文字后残留的）
        const emptyFormatTags = [
            '<b></b>', '<strong></strong>', '<i></i>', '<em></em>',
            '<u></u>', '<s></s>', '<strike></strike>', '<del></del>',
            '<span[^>]*></span>', '<font[^>]*></font>'
        ];

        emptyFormatTags.forEach(tag => {
            const regex = new RegExp(tag, 'gi');
            cleaned = cleaned.replace(regex, '');
        });

        // 2. 清理只包含空白字符的格式化标签
        cleaned = cleaned
            .replace(/<b[^>]*>\s*<\/b>/gi, '')
            .replace(/<strong[^>]*>\s*<\/strong>/gi, '')
            .replace(/<i[^>]*>\s*<\/i>/gi, '')
            .replace(/<em[^>]*>\s*<\/em>/gi, '')
            .replace(/<u[^>]*>\s*<\/u>/gi, '')
            .replace(/<s[^>]*>\s*<\/s>/gi, '')
            .replace(/<strike[^>]*>\s*<\/strike>/gi, '')
            .replace(/<del[^>]*>\s*<\/del>/gi, '')
            .replace(/<span[^>]*>\s*<\/span>/gi, '')
            .replace(/<font[^>]*>\s*<\/font>/gi, '');

        // 3. 清理空的容器标签
        cleaned = cleaned
            .replace(/<div[^>]*><\/div>/gi, '')
            .replace(/<div[^>]*>\s*<\/div>/gi, '')
            .replace(/<p[^>]*><\/p>/gi, '')
            .replace(/<p[^>]*>\s*<\/p>/gi, '');

        // 4. 清理嵌套的空标签
        let prevCleaned = '';
        while (prevCleaned !== cleaned) {
            prevCleaned = cleaned;
            cleaned = cleaned
                .replace(/<([^>]+)>\s*<\/\1>/gi, '')
                .replace(/<([^>]+)>\s*<\/\1>/gi, '');
        }

        // 5. 清理多余的连续br标签，但保留必要的换行
        cleaned = cleaned
            .replace(/(<br\s*\/?>){3,}/gi, '<br><br>')
            .trim();

        // 如果清理后只包含br标签或空白字符，返回空字符串
        if (!cleaned || cleaned === '' || cleaned.replace(/<br\s*\/?>/gi, '').trim() === '') {
            return '';
        }

        return cleaned;
    };

    // 移除强制光标控制，让浏览器自然处理光标


    // 保存和恢复选区的辅助函数
    const saveSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            return {
                range: selection.getRangeAt(0).cloneRange(),
                startOffset: selection.getRangeAt(0).startOffset,
                endOffset: selection.getRangeAt(0).endOffset,
                startContainer: selection.getRangeAt(0).startContainer,
                endContainer: selection.getRangeAt(0).endContainer
            };
        }
        return null;
    };

    const restoreSelection = (savedSelection: { startContainer: Node; startOffset: number; endContainer: Node; endOffset: number } | null) => {
        if (!savedSelection || !editorRef.current) return false;

        try {
            const selection = window.getSelection();
            if (selection) {
                // 检查容器是否仍然存在
                if (editorRef.current.contains(savedSelection.startContainer) &&
                    editorRef.current.contains(savedSelection.endContainer)) {
                    const range = document.createRange();
                    range.setStart(savedSelection.startContainer, savedSelection.startOffset);
                    range.setEnd(savedSelection.endContainer, savedSelection.endOffset);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    return true;
                }
            }
        } catch (e) {
            // 恢复失败
        }
        return false;
    };

    const execCommand = (command: string, value?: string) => {
        if (!editorRef.current) {
            return;
        }

        // 确保编辑器有焦点
        editorRef.current.focus();

        // 执行命令
        const success = document.execCommand(command, false, value);

        if (success) {
            // 移除强制光标控制，让浏览器自然处理光标位置

            // 清理空内容
            setTimeout(() => {
                if (editorRef.current) {
                    const html = editorRef.current.innerHTML;
                    const cleanedHtml = cleanEmptyContent(html);

                    if (cleanedHtml !== html) {
                        editorRef.current.innerHTML = cleanedHtml;
                        onChange(cleanedHtml);
                    }
                }
            }, 20);
        }
    };

    // 处理格式化命令，保持选区
    // 清除所有格式的函数
    const clearAllFormatting = () => {
        if (!editorRef.current) return;

        editorRef.current.focus();

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);

        // 如果没有选中文本，选中所有内容
        if (range.collapsed) {
            const newRange = document.createRange();
            newRange.selectNodeContents(editorRef.current);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }

        // 获取选中的内容
        const selectedContent = selection.toString();

        if (selectedContent) {
            // 使用 removeFormat 命令清除格式
            document.execCommand('removeFormat', false);

            // 额外清除一些可能残留的格式
            document.execCommand('unlink', false);
            document.execCommand('outdent', false);

            // 触发内容更新
            setTimeout(() => {
                if (editorRef.current) {
                    const html = editorRef.current.innerHTML;
                    const cleanedHtml = cleanEmptyContent(html);

                    if (cleanedHtml !== html) {
                        editorRef.current.innerHTML = cleanedHtml;
                    }
                    onChange(cleanedHtml || html);
                }
            }, 20);
        }
    };

    const handleFormatCommand = (command: string, value?: string) => {
        if (!editorRef.current) {
            return;
        }

        editorRef.current.focus();

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            // 如果没有选区，创建一个在末尾的选区
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            if (selection) {
                selection.addRange(range);
            }
        }

        const range = selection?.getRangeAt(0);
        if (!range) return;

        const selectedText = range.toString();
        console.log('格式化前选中文字:', selectedText);

        // 保存更精确的位置信息
        let positionInfo = null;
        if (selectedText) {
            // 使用TreeWalker计算选中文字在整个编辑器中的精确位置
            const walker = document.createTreeWalker(
                editorRef.current,
                NodeFilter.SHOW_TEXT,
                null
            );

            let currentOffset = 0;
            let startIndex = -1;
            let endIndex = -1;

            while (walker.nextNode()) {
                const textNode = walker.currentNode;
                const text = textNode.textContent || '';
                const textLength = text.length;

                // 检查选区是否在这个文本节点中
                if (textNode === range.startContainer) {
                    startIndex = currentOffset + range.startOffset;
                }
                if (textNode === range.endContainer) {
                    endIndex = currentOffset + range.endOffset;
                    break;
                }

                currentOffset += textLength;
            }

            positionInfo = {
                text: selectedText,
                startIndex: startIndex,
                endIndex: endIndex,
                startContainer: range.startContainer,
                startOffset: range.startOffset,
                endContainer: range.endContainer,
                endOffset: range.endOffset
            };
            console.log('格式化命令:', command);
            console.log('保存的位置信息:', positionInfo);
        }

        // 执行命令
        const success = document.execCommand(command, false, value);

        if (success) {
            // 如果原来有选中文字，尝试重新选中相同位置的文字
            if (selectedText && positionInfo) {
                // 延迟执行，确保DOM更新完成
                setTimeout(() => {
                    if (editorRef.current) {
                        // 重新计算整个编辑器的文本内容
                        const newEditorText = editorRef.current.textContent || '';
                        console.log('格式化后编辑器文本:', newEditorText);

                        // 使用保存的精确位置来恢复选区
                        if (positionInfo.startIndex >= 0 && positionInfo.endIndex >= 0) {
                            // 使用TreeWalker找到对应的文本节点
                            const walker = document.createTreeWalker(
                                editorRef.current,
                                NodeFilter.SHOW_TEXT,
                                null
                            );

                            let currentOffset = 0;
                            let startNode = null;
                            let startOffset = 0;
                            let endNode = null;
                            let endOffset = 0;

                            while (walker.nextNode()) {
                                const textNode = walker.currentNode;
                                const text = textNode.textContent || '';
                                const textLength = text.length;

                                // 检查开始位置是否在这个文本节点中
                                if (currentOffset <= positionInfo.startIndex &&
                                    currentOffset + textLength > positionInfo.startIndex &&
                                    !startNode) {
                                    startNode = textNode;
                                    startOffset = positionInfo.startIndex - currentOffset;
                                }

                                // 检查结束位置是否在这个文本节点中
                                if (currentOffset <= positionInfo.endIndex &&
                                    currentOffset + textLength >= positionInfo.endIndex &&
                                    !endNode) {
                                    endNode = textNode;
                                    endOffset = positionInfo.endIndex - currentOffset;
                                    break;
                                }

                                currentOffset += textLength;
                            }

                            if (startNode && endNode) {
                                // 创建新的选区
                                const newRange = document.createRange();
                                newRange.setStart(startNode, startOffset);
                                newRange.setEnd(endNode, endOffset);

                                const newSelection = window.getSelection();
                                if (newSelection) {
                                    newSelection.removeAllRanges();
                                    newSelection.addRange(newRange);
                                    console.log('选区已恢复到正确位置:', {
                                        startIndex: positionInfo.startIndex,
                                        endIndex: positionInfo.endIndex,
                                        selectedText: newRange.toString()
                                    });
                                }
                            }
                        }
                    }
                }, 0);
            }

            // 更新内容
            const html = editorRef.current.innerHTML;
            onChange(html);

            // 延迟更新按钮状态，确保DOM更新完成
            setTimeout(() => {
                updateButtonStates();
            }, 10);
        }
    };

    const insertLink = () => {
        // 获取当前选中的文字作为链接文本
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            setLinkText(selectedText);
        } else {
            setLinkText('');
        }
        setLinkUrl('');
        setShowLinkDialog(true);
    };

    const handleInsertLink = () => {
        if (!linkUrl.trim()) {
            notify({
                type: "error",
                message: "请输入链接地址"
            });
            return;
        }

        // 验证URL格式
        try {
            new URL(linkUrl);
        } catch {
            // 如果不是完整URL，尝试添加http://前缀
            if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
                setLinkUrl('https://' + linkUrl);
                return; // 重新验证
            } else {
                notify({
                    type: "error",
                    message: "请输入有效的链接地址"
                });
                return;
            }
        }

        if (linkText.trim()) {
            // 如果有链接文本，创建带文本的链接
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();

                const linkElement = document.createElement('a');
                linkElement.href = linkUrl;
                linkElement.textContent = linkText;
                linkElement.target = '_blank';
                linkElement.rel = 'noopener noreferrer';

                range.insertNode(linkElement);

                // 将光标移到链接后面
                range.setStartAfter(linkElement);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else {
            // 如果没有链接文本，使用execCommand
            execCommand('createLink', linkUrl);
        }

        // 更新内容
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            onChange(html);
        }

        // 关闭对话框并重置状态
        setShowLinkDialog(false);
        setLinkUrl('');
        setLinkText('');

        notify({
            type: "success",
            message: "链接插入成功"
        });
    };

    // 处理LaTeX公式插入
    const handleInsertLatex = (latex: string, displayMode: boolean) => {
        if (!editorRef.current) return;

        // 确保编辑器有焦点
        editorRef.current.focus();

        // 创建LaTeX文本（带美元符号标记）
        const latexText = displayMode ? `$$${latex}$$` : `$${latex}$`;

        // 使用execCommand插入文本
        const success = document.execCommand('insertText', false, latexText);

        if (!success) {
            // 如果execCommand失败，使用innerHTML方式
            const currentContent = editorRef.current.innerHTML;
            const newContent = currentContent + latexText;
            editorRef.current.innerHTML = newContent;
        }

        // 更新内容并处理LaTeX hover card
        const html = editorRef.current.innerHTML;
        const processedHtml = processLatexContent(html);
        editorRef.current.innerHTML = processedHtml;
        onChange(processedHtml);
    };

    // 简化的LaTeX处理 - 不再包装span，直接返回原始HTML
    const processLatexContent = (html: string) => {
        // 直接返回原始HTML，LaTeX渲染由HtmlRenderer处理
        return html;
    };



    // 处理文件上传
    const handleFileUpload = useCallback(async (file: File) => {
        // 文件类型验证
        const isImageByMime = file.type.startsWith('image/');
        const isImageByExtension = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);

        if (!isImageByMime && !isImageByExtension) {
            notify({
                type: "error",
                message: "文件类型错误",
                description: "请选择图片文件"
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            notify({
                type: "error",
                message: "文件过大",
                description: "图片大小不能超过5MB"
            });
            return;
        }


        // 显示 loading 状态
        setIsUploading(true);

        // 使用 FileReader 创建本地预览，不立即上传到服务器
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            console.log('FileReader 创建 Data URL:', dataUrl.substring(0, 50) + '...');

            // 生成临时ID用于本地预览
            const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 添加到图片列表（本地预览）
            const newImage = {
                id: tempId,
                url: dataUrl,
                name: file.name,
                file: file // 保存原始文件用于后续上传
            };
            setImages(prev => [...prev, newImage]);

            // 添加到待上传列表（用于后续上传到服务器）
            const newPendingImage = { localUrl: dataUrl, file, imageId: null };
            const newPendingImages = [...pendingImages, newPendingImage];
            pendingImagesRef.current = newPendingImages;
            setPendingImages(newPendingImages);

            // 保存到 localStorage
            try {
                localStorage.setItem('pendingImages', JSON.stringify(newPendingImages));
            } catch (e) {
                console.log('无法保存到 localStorage:', e);
            }

            // 通知父组件有待上传的图片
            handlePendingImagesChange(newPendingImages);

            // 隐藏 loading 状态
            setIsUploading(false);

            notify({
                type: "success",
                message: "图片已添加",
                description: "图片已添加到预览区域，保存时将上传到服务器"
            });
        };

        reader.onerror = () => {
            setIsUploading(false);
            notify({
                type: "error",
                message: "图片读取失败",
                description: "无法读取图片文件"
            });
        };

        reader.readAsDataURL(file);
    }, [pendingImages, notify, handlePendingImagesChange]);

    // 删除图片
    const handleRemoveImage = useCallback((imageId: string) => {
        setImages(prev => prev.filter(img => img.id !== imageId));

        // 通知父组件图片已删除
        if (onImageChange) {
            const remainingImageIds = images.filter(img => img.id !== imageId).map(img => img.id);
            onImageChange(remainingImageIds);
        }

        notify({
            type: "success",
            message: "图片已删除",
            description: "图片已从预览区域移除"
        });
    }, [images, onImageChange, notify]);

    // 上传所有待上传的图片到服务器
    const uploadPendingImages = useCallback(async () => {
        const uploadedImageIds: string[] = [];

        for (const image of images) {
            if (image.file && image.id.startsWith('temp_')) {
                try {
                    const imageInfo = await supabaseImageManager.uploadImage(image.file);
                    uploadedImageIds.push(imageInfo.id);

                    // 更新图片信息
                    setImages(prev => prev.map(img =>
                        img.id === image.id
                            ? { ...img, id: imageInfo.id, url: imageInfo.url }
                            : img
                    ));
                } catch (error) {
                    console.error('上传图片失败:', error);
                    notify({
                        type: "error",
                        message: "图片上传失败",
                        description: `图片 ${image.name} 上传失败`
                    });
                }
            } else if (!image.id.startsWith('temp_')) {
                // 已经是上传过的图片
                uploadedImageIds.push(image.id);
            }
        }

        return uploadedImageIds;
    }, [images, notify]);

    // 暴露上传函数给父组件
    useEffect(() => {
        if (onUploadImages) {
            onUploadImages(uploadPendingImages);
        }
    }, [onUploadImages, uploadPendingImages]);

    // 处理文件选择
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    // 处理云端图片选择
    const handleCloudImageSelect = useCallback(async (imageId: string) => {
        try {
            const imageInfo = await supabaseImageManager.getImageInfo(imageId);
            if (imageInfo) {
                // 生成临时ID用于本地预览
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // 添加到图片列表（本地预览）
                const newImage = {
                    id: tempId,
                    url: imageInfo.url,
                    name: imageInfo.originalName || 'cloud-image',
                    file: undefined // 云端图片没有文件对象
                };
                setImages(prev => [...prev, newImage]);

                // 添加到待上传列表（云端图片不需要上传，但需要记录）
                const newPendingImage = { localUrl: imageInfo.url, file: null, imageId: imageId };
                const newPendingImages = [...pendingImages, newPendingImage];
                pendingImagesRef.current = newPendingImages;
                setPendingImages(newPendingImages);

                // 保存到 localStorage
                try {
                    localStorage.setItem('pendingImages', JSON.stringify(newPendingImages));
                } catch (e) {
                    console.log('无法保存到 localStorage:', e);
                }

                // 通知父组件有待上传的图片
                handlePendingImagesChange(newPendingImages);

                notify({
                    type: "success",
                    message: "图片已添加",
                    description: "云端图片已添加到预览区域"
                });
            }
        } catch (error) {
            console.error('选择云端图片失败:', error);
            notify({
                type: "error",
                message: "选择失败",
                description: "无法选择云端图片"
            });
        }
    }, [pendingImages, notify, handlePendingImagesChange]);

    // 处理粘贴图片
    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    e.preventDefault();
                    await handleFileUpload(file);
                    break;
                }
            }
        }
    }, [handleFileUpload]);

    // 处理拖拽事件
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                await handleFileUpload(file);
            }
        }
    }, [handleFileUpload]);

    // 添加粘贴事件监听器
    useEffect(() => {
        const editor = editorRef.current;
        if (editor) {
            editor.addEventListener('paste', handlePaste);
            return () => {
                editor.removeEventListener('paste', handlePaste);
            };
        }
    }, [handlePaste]);

    // 移除复杂的hover card逻辑，使用简单的预览模式


    // 保存当前选区
    const saveCurrentSelection = () => {
        // 清除之前的定时器
        if (selectionTimeoutRef.current) {
            clearTimeout(selectionTimeoutRef.current);
        }

        // 设置新的定时器，防抖处理
        selectionTimeoutRef.current = setTimeout(() => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const selectedText = range.toString();

                // 只有在真正选中文字时才保存选区
                if (selectedText.length > 0) {
                    savedSelectionRef.current = {
                        startContainer: range.startContainer,
                        startOffset: range.startOffset,
                        endContainer: range.endContainer,
                        endOffset: range.endOffset
                    };
                }
            }
        }, 100);
    };

    // 检测当前选区是否包含特定格式
    const isFormatActive = (format: string): boolean => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return false; // 如果没有选中文字，返回false

        // 检查选区是否在对应的格式化标签内
        let currentNode: Node | null = range.startContainer;
        while (currentNode && currentNode !== editorRef.current) {
            if (currentNode.nodeType === Node.ELEMENT_NODE) {
                const element = currentNode as Element;
                const tagName = element.tagName.toLowerCase();

                switch (format) {
                    case 'bold':
                        if (tagName === 'b' || tagName === 'strong') return true;
                        break;
                    case 'italic':
                        if (tagName === 'i' || tagName === 'em') return true;
                        break;
                    case 'underline':
                        if (tagName === 'u') return true;
                        break;
                    case 'strikeThrough':
                        if (tagName === 's' || tagName === 'strike' || tagName === 'del') return true;
                        break;
                }
            }
            currentNode = currentNode.parentNode;
        }

        return false;
    };

    // 更新按钮激活状态
    const updateButtonStates = () => {
        const formats = ['bold', 'italic', 'underline', 'strikeThrough'];
        const newActiveFormats = new Set<string>();

        formats.forEach(format => {
            if (isFormatActive(format)) {
                newActiveFormats.add(format);
            }
        });

        setActiveFormats(newActiveFormats);
    };

    // 恢复保存的选区
    const restoreSavedSelection = () => {
        console.log('=== 尝试恢复选区 ===');
        console.log('保存的选区:', savedSelectionRef.current);
        console.log('编辑器引用:', editorRef.current);

        if (!savedSelectionRef.current) {
            console.log('❌ 没有保存的选区');
            return false;
        }

        if (!editorRef.current) {
            console.log('❌ 编辑器引用为空');
            return false;
        }

        try {
            const selection = window.getSelection();
            if (!selection) {
                console.log('❌ 无法获取选区对象');
                return false;
            }

            // 检查容器是否仍然存在
            const startContainerExists = editorRef.current.contains(savedSelectionRef.current.startContainer);
            const endContainerExists = editorRef.current.contains(savedSelectionRef.current.endContainer);

            console.log('开始容器存在:', startContainerExists);
            console.log('结束容器存在:', endContainerExists);
            console.log('开始容器:', savedSelectionRef.current.startContainer);
            console.log('结束容器:', savedSelectionRef.current.endContainer);

            if (startContainerExists && endContainerExists) {
                const range = document.createRange();
                range.setStart(savedSelectionRef.current.startContainer, savedSelectionRef.current.startOffset);
                range.setEnd(savedSelectionRef.current.endContainer, savedSelectionRef.current.endOffset);
                selection.removeAllRanges();
                selection.addRange(range);

                const restoredText = range.toString();
                console.log('✅ 选区已恢复，恢复的文字:', `"${restoredText}"`);
                console.log('恢复的文字长度:', restoredText.length);
                return true;
            } else {
                console.log('❌ 选区容器已不存在，无法恢复');
                return false;
            }
        } catch (e) {
            console.log('❌ 恢复选区失败:', e);
        }
        return false;
    };

    const setTextColor = (color: string) => {
        console.log('=== setTextColor 开始 ===');
        console.log('颜色:', color);
        console.log('编辑器引用:', editorRef.current);

        if (!editorRef.current) {
            console.log('❌ editorRef.current 为空');
            return;
        }

        editorRef.current.focus();
        console.log('✅ 编辑器已获得焦点');

        // 获取当前选择
        const selection = window.getSelection();
        console.log('当前选区:', selection);
        console.log('选区数量:', selection?.rangeCount);

        let range: Range | null = null;

        // 尝试恢复保存的选区
        if (restoreSavedSelection()) {
            console.log('✅ 成功恢复保存的选区');
            const newSelection = window.getSelection();
            if (newSelection && newSelection.rangeCount > 0) {
                range = newSelection.getRangeAt(0);
                console.log('恢复的选区范围:', range);
            }
        } else {
            console.log('❌ 无法恢复保存的选区');
        }

        // 如果没有选区，尝试获取当前选区
        if (!range && selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
            console.log('✅ 使用当前选区:', range);
        }

        // 如果还是没有选区，创建一个在编辑器末尾的选区
        if (!range) {
            console.log('❌ 没有选区，尝试创建选区');
            const newRange = document.createRange();
            newRange.selectNodeContents(editorRef.current);
            newRange.collapse(false);
            if (selection) {
                selection.addRange(newRange);
                range = newRange;
                console.log('✅ 创建了新的选区:', range);
            }
        }

        if (!range) {
            console.log('❌ 无法创建选区，退出');
            return;
        }

        const selectedText = range.toString();
        console.log('选中的文字:', `"${selectedText}"`);
        console.log('选中文字长度:', selectedText.length);

        if (!selectedText) {
            console.log('❌ 没有选中文字，无法设置颜色');
            return;
        }

        console.log('✅ 开始应用颜色');

        // 使用更可靠的方法：创建span并替换选中内容，保留原有格式
        const span = document.createElement('span');
        span.style.color = color;

        // 获取选中内容的HTML，保留原有格式
        const contents = range.extractContents();
        span.appendChild(contents);

        console.log('创建的span元素:', span);
        console.log('span样式:', span.style.color);

        // 插入新的span
        range.insertNode(span);
        console.log('✅ span已插入到DOM');

        // 将光标移到span后面，但不要强制设置选区
        // 让浏览器自然处理光标位置
        if (selection) {
            selection.removeAllRanges();
            // 创建一个简单的光标位置
            const newRange = document.createRange();
            newRange.setStartAfter(span);
            newRange.collapse(true);
            selection.addRange(newRange);
        }

        console.log('✅ 颜色设置完成');

        // 更新内容
        const html = editorRef.current.innerHTML;
        console.log('更新后的HTML:', html);
        onChange(html);

        console.log('=== setTextColor 结束 ===');
    };

    const setBackgroundColor = (color: string) => {
        console.log('=== setBackgroundColor 开始 ===');
        console.log('背景颜色:', color);
        console.log('编辑器引用:', editorRef.current);

        if (!editorRef.current) {
            console.log('❌ editorRef.current 为空');
            return;
        }

        editorRef.current.focus();
        console.log('✅ 编辑器已获得焦点');

        // 获取当前选择
        const selection = window.getSelection();
        console.log('当前选区:', selection);
        console.log('选区数量:', selection?.rangeCount);

        let range: Range | null = null;

        // 尝试恢复保存的选区
        if (restoreSavedSelection()) {
            console.log('✅ 成功恢复保存的选区');
            const newSelection = window.getSelection();
            if (newSelection && newSelection.rangeCount > 0) {
                range = newSelection.getRangeAt(0);
                console.log('恢复的选区范围:', range);
            }
        } else {
            console.log('❌ 无法恢复保存的选区');
        }

        // 如果没有选区，尝试获取当前选区
        if (!range && selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
            console.log('✅ 使用当前选区:', range);
        }

        // 如果还是没有选区，创建一个在编辑器末尾的选区
        if (!range) {
            console.log('❌ 没有选区，尝试创建选区');
            const newRange = document.createRange();
            newRange.selectNodeContents(editorRef.current);
            newRange.collapse(false);
            if (selection) {
                selection.addRange(newRange);
                range = newRange;
                console.log('✅ 创建了新的选区:', range);
            }
        }

        if (!range) {
            console.log('❌ 无法创建选区，退出');
            return;
        }

        const selectedText = range.toString();
        console.log('选中的文字:', `"${selectedText}"`);
        console.log('选中文字长度:', selectedText.length);

        if (!selectedText) {
            console.log('❌ 没有选中文字，无法设置背景颜色');
            return;
        }

        console.log('✅ 开始应用背景颜色');

        // 使用更可靠的方法：创建span并替换选中内容，保留原有格式
        const span = document.createElement('span');
        span.style.backgroundColor = color;

        // 获取选中内容的HTML，保留原有格式
        const contents = range.extractContents();
        span.appendChild(contents);

        console.log('创建的span元素:', span);
        console.log('span背景色样式:', span.style.backgroundColor);

        // 插入新的span
        range.insertNode(span);
        console.log('✅ span已插入到DOM');

        // 将光标移到span后面，但不要强制设置选区
        // 让浏览器自然处理光标位置
        if (selection) {
            selection.removeAllRanges();
            // 创建一个简单的光标位置
            const newRange = document.createRange();
            newRange.setStartAfter(span);
            newRange.collapse(true);
            selection.addRange(newRange);
        }

        console.log('✅ 背景颜色设置完成');

        // 更新内容
        const html = editorRef.current.innerHTML;
        console.log('更新后的HTML:', html);
        onChange(html);

        console.log('=== setBackgroundColor 结束 ===');
    };

    const colors = [
        '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB',
        '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
        '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
        '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
        '#EC4899', '#F43F5E'
    ];

    // 编辑器主体内容
    const editorContent = (
        <TooltipProvider openDelay={300}>
            {/* 融合的编辑器容器 - 工具栏和编辑区域作为一个整体 */}
            <div
                ref={containerRef}
                className={cn(
                    'rich-text-editor-unified border flex flex-col rounded-lg overflow-visible',
                    isDragOver ? 'ring-2 ring-blue-500' : '',
                    stickyToolbar ? 'rich-text-editor-sticky-container' : '',
                    className
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* 工具栏 - 作为编辑器容器的顶部 */}
                <div
                    ref={toolbarRef}
                    className={cn(
                        "rich-text-editor-toolbar px-4 py-1 flex flex-wrap items-center gap-1 border-b bg-background/80 backdrop-blur-md",
                        stickyToolbar ? "rich-text-editor-toolbar-sticky" : ""
                    )}
                    style={stickyToolbar ? {
                        position: 'sticky',
                        top: '10px',
                        zIndex: 1000,
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        backdropFilter: 'blur(8px)'
                    } : undefined}
                >

                    {/* 清除格式 - 移到最左侧 */}
                    <div className="flex items-center gap-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={TOOLBAR_BUTTON_CLASSES}
                                    onClick={clearAllFormatting}
                                >
                                    <Eraser className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>清除所有格式</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-6 w-px bg-border/60 mx-1"></div>

                    {/* 文本格式 */}
                    <div className="flex items-center gap-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('bold') ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleFormatCommand('bold')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('bold')
                                            ? "bg-blue-500/20 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400 hover:bg-blue-500/30"
                                            : ""
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
                                    onClick={() => handleFormatCommand('italic')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('italic')
                                            ? "bg-purple-500/20 text-purple-600 dark:bg-purple-400/20 dark:text-purple-400 hover:bg-purple-500/30"
                                            : ""
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
                                    onClick={() => handleFormatCommand('underline')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('underline')
                                            ? "bg-green-500/20 text-green-600 dark:bg-green-400/20 dark:text-green-400 hover:bg-green-500/30"
                                            : ""
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
                                    onClick={() => handleFormatCommand('strikeThrough')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('strikeThrough')
                                            ? "bg-red-500/20 text-red-600 dark:bg-red-400/20 dark:text-red-400 hover:bg-red-500/30"
                                            : ""
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

                    {/* 布局和结构工具组 - 标题、列表、对齐方式 */}
                    <div className="flex items-center gap-0.5">
                        {/* 标题选择器 */}
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES}>
                                            <Heading className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>选择标题级别</p>
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent className="w-auto min-w-[80px]">
                                <DropdownMenuItem onClick={() => execCommand('formatBlock', 'div')}>
                                    正文
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h1')}>
                                    标题 1
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h2')}>
                                    标题 2
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h3')}>
                                    标题 3
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h4')}>
                                    标题 4
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h5')}>
                                    标题 5
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h6')}>
                                    标题 6
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 列表下拉菜单 */}
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES}>
                                            <List className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>列表</p>
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent className="w-auto min-w-[100px]">
                                <DropdownMenuItem onClick={() => execCommand('insertUnorderedList')}>
                                    <List className="w-3 h-3 mr-2" />
                                    无序列表
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand('insertOrderedList')}>
                                    <ListOrdered className="w-3 h-3 mr-2" />
                                    有序列表
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 对齐方式下拉菜单 */}
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES}>
                                            <AlignLeft className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>对齐方式</p>
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent className="w-auto min-w-[100px]">
                                <DropdownMenuItem onClick={() => execCommand('justifyLeft')}>
                                    <AlignLeft className="w-3 h-3 mr-2" />
                                    左对齐
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand('justifyCenter')}>
                                    <AlignCenter className="w-3 h-3 mr-2" />
                                    居中
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand('justifyRight')}>
                                    <AlignRight className="w-3 h-3 mr-2" />
                                    右对齐
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand('justifyFull')}>
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
                        <Popover>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className={TOOLBAR_BUTTON_CLASSES}
                                            onMouseDown={(e) => {
                                                // 阻止事件冒泡
                                                e.stopPropagation();
                                                // 临时禁用选区保存
                                                // console.log('文字颜色按钮被按下，检查选区');
                                                // const selection = window.getSelection();
                                                // if (selection && selection.rangeCount > 0) {
                                                //     const range = selection.getRangeAt(0);
                                                //     const selectedText = range.toString();
                                                //     if (selectedText.length > 0) {
                                                //         console.log('有选中文字，保存选区');
                                                //         saveCurrentSelection();
                                                //     } else {
                                                //         console.log('没有选中文字，不保存选区');
                                                //     }
                                                // }
                                            }}
                                        >
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
                                                    console.log('文字颜色被选择，颜色:', color);
                                                    setTextColor(color);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* 背景颜色 */}
                        <Popover>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className={TOOLBAR_BUTTON_CLASSES}
                                            onMouseDown={(e) => {
                                                // 阻止事件冒泡
                                                e.stopPropagation();
                                                // 临时禁用选区保存
                                                // console.log('背景颜色按钮被按下，检查选区');
                                                // const selection = window.getSelection();
                                                // if (selection && selection.rangeCount > 0) {
                                                //     const range = selection.getRangeAt(0);
                                                //     const selectedText = range.toString();
                                                //     if (selectedText.length > 0) {
                                                //         console.log('有选中文字，保存选区');
                                                //         saveCurrentSelection();
                                                //     } else {
                                                //         console.log('没有选中文字，不保存选区');
                                                //     }
                                                // }
                                            }}
                                        >
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
                                                    console.log('背景颜色被选择，颜色:', color);
                                                    setBackgroundColor(color);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 插入链接和图片 */}
                    {/* 分隔线 */}
                    <div className="h-6 w-px bg-border/60 mx-1"></div>

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

                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className={TOOLBAR_BUTTON_CLASSES}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>插入图片</p>
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2"
                                >
                                    <FileImage className="w-4 h-4" />
                                    <span>从本地选择</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setShowCloudImageDialog(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Cloud className="w-4 h-4" />
                                    <span>从云端选择</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 隐藏的文件输入 */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* 全屏按钮 */}
                    <div className={cn(
                        "flex items-center gap-0.5 ml-auto"
                    )}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        previewMode
                                            ? "bg-amber-500/20 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400 hover:bg-amber-500/30"
                                            : ""
                                    )}
                                    onClick={() => setPreviewMode(!previewMode)}
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{previewMode ? "关闭预览" : "开启预览"}</p>
                            </TooltipContent>
                        </Tooltip>

                        {showFullscreenButton && (
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
                        )}
                    </div>
                </div>


                {/* 编辑器内容区域 - 支持预览模式 */}
                <div className="flex">
                    {/* 编辑器区域 */}
                    <div className={cn(
                        "flex-1", // 移除 flex flex-col
                        previewMode ? "w-1/2 border-r" : "w-full",
                        "overflow-auto" // 只有这里有滚动条
                    )}
                        style={{
                            minHeight: customMinHeight || '300px',
                            maxHeight: customMaxHeight || '600px',
                            backgroundColor: 'var(--editor-background)'
                        }}>
                        <div
                            ref={editorRef}
                            contentEditable={true}
                            onInput={handleInput}
                            onFocus={(e) => {
                                e.stopPropagation();
                                e.currentTarget.focus();
                            }}
                            onMouseDown={(e) => {
                                // 不阻止事件，让编辑器正常工作
                            }}
                            onClick={(e) => {
                                // 不阻止事件，让编辑器正常工作
                            }}
                            onBlur={() => {
                                // 在失去焦点时进行清理和LaTeX处理，避免在编辑过程中干扰
                                if (editorRef.current) {
                                    const html = editorRef.current.innerHTML;
                                    const textContent = editorRef.current.textContent || '';

                                    // 只有在有内容时才进行处理
                                    if (textContent.trim() !== '') {
                                        // 先处理LaTeX内容
                                        const processedHtml = processLatexContent(html);

                                        // 再清理空内容
                                        const cleanedHtml = cleanEmptyContent(processedHtml);

                                        if (cleanedHtml !== html) {
                                            editorRef.current.innerHTML = cleanedHtml;
                                            onChange(cleanedHtml);
                                        }
                                    }
                                }
                            }}
                            onMouseUp={(e) => {
                                // 使用防抖的选区保存
                                saveCurrentSelection();
                                updateButtonStates();
                            }}
                            onKeyUp={() => {
                                // 使用防抖的选区保存
                                saveCurrentSelection();
                                updateButtonStates();
                            }}
                            onKeyDown={(e) => {
                                // 智能处理删除键
                                if (e.key === 'Backspace' || e.key === 'Delete') {
                                    // 延迟执行，让浏览器先处理删除操作
                                    setTimeout(() => {
                                        if (editorRef.current) {
                                            const html = editorRef.current.innerHTML;
                                            const textContent = editorRef.current.textContent || '';

                                            // 检查是否有空的HTML标签需要清理
                                            const hasEmptyTags = /<[^>]+><\/[^>]+>/.test(html) ||
                                                /<[^>]+>\s*<\/[^>]+>/.test(html);

                                            // 如果内容为空或者有空的HTML标签，进行清理
                                            if (textContent.trim() === '' || hasEmptyTags) {
                                                const cleanedHtml = cleanEmptyContent(html);
                                                if (cleanedHtml !== html) {
                                                    editorRef.current.innerHTML = cleanedHtml;
                                                    onChange(cleanedHtml);

                                                    // 确保光标在正确位置
                                                    const selection = window.getSelection();
                                                    if (selection) {
                                                        const range = document.createRange();
                                                        range.selectNodeContents(editorRef.current);
                                                        range.collapse(false);
                                                        selection.removeAllRanges();
                                                        selection.addRange(range);
                                                    }
                                                }
                                            }
                                        }
                                    }, 0);
                                }
                            }}
                            className="bg-[color:var(--editor-background)] focus:outline-none prose prose-sm max-w-none cursor-text relative flex-1 w-full"
                            style={{
                                fontSize: '16px',
                                lineHeight: '1.6',
                                minHeight: customMinHeight || '300px',
                                padding: '16px',
                                boxSizing: 'border-box',
                                backgroundColor: 'var(--editor-background)',
                                position: 'relative'
                            }}
                            data-placeholder={placeholder}
                            suppressContentEditableWarning={true}
                            tabIndex={0}
                        />
                    </div>

                    {/* 预览区域 */}
                    {previewMode && (
                        <div className="w-1/2 overflow-auto" style={{
                            minHeight: customMinHeight && customMaxHeight ? `${customMinHeight}` : '200px',
                            maxHeight: customMinHeight && customMaxHeight ? `${customMaxHeight}` : '400px',
                            backgroundColor: 'var(--editor-background)'
                        }}>
                            <div className="p-4">
                                <div className="prose prose-sm max-w-none" style={{
                                    fontSize: '16px',
                                    lineHeight: '1.6'
                                }}>
                                    <HtmlRenderer content={content} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 图片预览区域 - 使用 Accordion */}
                {images.length > 0 && (
                    <div className="border-t bg-gray-50 dark:bg-gray-900/50">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="images" className="border-none">
                                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            图片预览 ({images.length})
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                    <PhotoProvider>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {images.map((image) => (
                                                <div key={image.id} className="relative group">
                                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                                                        <Image
                                                            src={image.url}
                                                            alt={image.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                        />
                                                        {/* 透明按钮，无背景遮罩 */}
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <PhotoView src={image.url}>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                type="button"
                                                                                className="h-8 w-8 p-0 bg-transparent hover:bg-transparent text-white hover:text-white shadow-lg"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                }}
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                            </Button>
                                                                        </PhotoView>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>预览图片</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                handleRemoveImage(image.id);
                                                                            }}
                                                                            className="h-8 w-8 p-0 bg-transparent hover:bg-transparent text-white hover:text-white shadow-lg"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>删除图片</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                                                        {image.name}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </PhotoProvider>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                )}

                <style jsx global>{`
          .rich-text-editor [contenteditable] {
            outline: none;
            cursor: text;
            padding: 16px;
            margin: 0;
            overflow: visible; /* 不要内部滚动条 */
            width: 100%;
            min-height: calc(300px - 32px); /* 减去padding */
            box-sizing: border-box;
            display: block;
            background-color: var(--editor-background) !important;
            background: var(--editor-background) !important;
            /* 移除height限制，让内容自然扩展 */
          }
          
          .rich-text-editor [contenteditable]:focus {
            outline: none;
          }
          
          .rich-text-editor [contenteditable]:focus-visible {
            outline: none;
          }
          
          /* 占位文字样式 - 使用更强的选择器 */
          [contenteditable]:empty::before,
          [contenteditable][data-empty="true"]::before {
            content: attr(data-placeholder) !important;
            color: #9CA3AF !important;
            pointer-events: none !important;
            position: absolute !important;
            top: 16px !important;
            left: 16px !important;
            line-height: 1.6 !important;
            font-size: 16px !important; /* 与正文字体大小一致 */
            opacity: 0.7 !important;
            z-index: 1 !important;
            display: block !important;
          }
          
          [contenteditable]:not(:empty)::before,
          [contenteditable]:not([data-empty="true"])::before {
            display: none !important;
          }
          
          .rich-text-editor [contenteditable] img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
          }
          
          /* 图片容器样式 */
          .rich-text-editor .image-container {
            display: inline-block !important;
            position: relative !important;
            margin: 8px 0 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
          }
          
          .rich-text-editor .image-container img {
            display: block !important;
            border-radius: 4px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          }

          .latex-inline-hover, .latex-block-hover {
            background-color: rgba(59, 130, 246, 0.1);
            border-radius: 4px;
            padding: 2px 4px;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .latex-inline-hover:hover, .latex-block-hover:hover {
            background-color: rgba(59, 130, 246, 0.2);
          }
          
          /* 调整大小控制点样式 */
          .rich-text-editor .resize-handle {
            position: absolute !important;
            bottom: 0 !important;
            right: 0 !important;
            width: 12px !important;
            height: 12px !important;
            background-color: #3b82f6 !important;
            border: 2px solid white !important;
            border-radius: 50% !important;
            cursor: nw-resize !important;
            opacity: 0 !important;
            transition: opacity 0.2s ease !important;
            z-index: 10 !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
            user-select: none !important;
            pointer-events: auto !important;
          }
          
          .rich-text-editor .image-container:hover .resize-handle {
            opacity: 1 !important;
          }
          
          .rich-text-editor .resize-handle:hover {
            background-color: #2563eb !important;
            transform: scale(1.1) !important;
          }
          
          .rich-text-editor .resize-handle:active {
            background-color: #1d4ed8 !important;
            transform: scale(0.95) !important;
          }
          
          /* 深色模式下的调整大小控制点 */
          .dark .rich-text-editor .resize-handle {
            background-color: #60a5fa !important;
            border-color: #1f2937 !important;
          }
          
          .dark .rich-text-editor .resize-handle:hover {
            background-color: #3b82f6 !important;
          }
          
          .dark .rich-text-editor .resize-handle:active {
            background-color: #1d4ed8 !important;
          }
          
          .rich-text-editor [contenteditable] a {
            color: #3B82F6;
            text-decoration: underline;
          }
          
          .rich-text-editor [contenteditable] blockquote {
            border-left: 4px solid #E5E7EB;
            padding-left: 16px;
            margin: 16px 0;
            font-style: italic;
            color: #6B7280;
          }
          
          /* 强制列表样式 */
          .rich-text-editor [contenteditable] ul {
            list-style-type: disc !important;
            padding-left: 24px !important;
            margin: 8px 0 !important;
            display: block !important;
          }
          
          .rich-text-editor [contenteditable] ol {
            list-style-type: decimal !important;
            padding-left: 24px !important;
            margin: 8px 0 !important;
            display: block !important;
          }
          
          .rich-text-editor [contenteditable] li {
            margin: 4px 0 !important;
            display: list-item !important;
          }
          
          /* 强制标题样式 */
          .rich-text-editor [contenteditable] h1, 
          .rich-text-editor [contenteditable] h2, 
          .rich-text-editor [contenteditable] h3,
          .rich-text-editor [contenteditable] h4, 
          .rich-text-editor [contenteditable] h5, 
          .rich-text-editor [contenteditable] h6 {
            margin: 16px 0 8px 0 !important;
            font-weight: bold !important;
            line-height: 1.2 !important;
            display: block !important;
          }
          
          .rich-text-editor [contenteditable] h1 { 
            font-size: 2em !important; 
            font-weight: 700 !important;
          }
          .rich-text-editor [contenteditable] h2 { 
            font-size: 1.5em !important; 
            font-weight: 600 !important;
          }
          .rich-text-editor [contenteditable] h3 { 
            font-size: 1.25em !important; 
            font-weight: 600 !important;
          }
          .rich-text-editor [contenteditable] h4 { 
            font-size: 1.1em !important; 
            font-weight: 600 !important;
          }
          .rich-text-editor [contenteditable] h5 { 
            font-size: 1em !important; 
            font-weight: 600 !important;
          }
          .rich-text-editor [contenteditable] h6 { 
            font-size: 0.9em !important; 
            font-weight: 600 !important;
          }
          
          .rich-text-editor [contenteditable] p {
            margin: 8px 0 !important;
            line-height: 1.5 !important;
            display: block !important;
          }
          
          .rich-text-editor [contenteditable] div {
            margin: 4px 0 !important;
          }
          
          /* 融合模式下的工具栏样式 - 作为编辑器容器的顶部 */
          .rich-text-editor-unified .rich-text-editor-toolbar {
            position: relative !important;
            top: auto !important;
            z-index: 10 !important;
            background: var(--muted/30) !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background-opacity: 1 !important;
            border: none !important;
            border-bottom: 1px solid var(--border) !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin-bottom: 0 !important;
          }

          /* 粘性工具栏样式 - 只在需要时应用固定定位 */
          .rich-text-editor-toolbar-sticky {
            /* 默认保持相对定位，通过内联样式控制固定定位 */
            position: relative !important;
            z-index: 10 !important;
            background: var(--muted/30) !important;
            border: none !important;
            border-bottom: 1px solid var(--border) !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }

          /* 当工具栏真正固定时的样式（通过内联样式应用） */
          .rich-text-editor-toolbar-sticky[style*="position: fixed"] {
            border: 1px solid var(--border) !important;
            border-radius: 0.5rem !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
          }

          /* 粘性容器样式 */
          .rich-text-editor-sticky-container {
            position: relative !important;
          }

          
          /* 非融合模式下保持原有样式（向后兼容） */
          .rich-text-editor-toolbar:not(.rich-text-editor-unified .rich-text-editor-toolbar):not(.fixed) {
            position: sticky !important;
            top: 0 !important;
            z-index: 50 !important;
            background: var(--muted) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            border: 1px solid var(--border) !important;
            border-radius: 0.5rem 0.5rem 0 0 !important;
            border-bottom: none !important;
            margin-bottom: -1px !important;
          }
          
          /* 全屏模式下的工具栏样式 - 胶囊形状，按钮居中 */
          .rich-text-editor-toolbar.fixed {
            position: fixed !important;
            top: 0 !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 80vw !important;
            max-width: 6xl !important;
            height: 3rem !important;
            z-index: 50 !important; /* 降低z-index，让tooltip在更上层 */
            background: var(--modal-background) !important;
            border-radius: 0.5rem 0.5rem 0 0 !important;
            margin-bottom: 0 !important;
            border-bottom: none !important;
            border-left: 1px solid var(--border) !important;
            border-right: 1px solid var(--border) !important;
            border-top: 1px solid var(--border) !important;
            justify-content: center !important; /* 按钮水平居中 */
            flex-wrap: nowrap !important; /* 防止换行 */
            overflow: visible !important; /* 允许tooltip溢出显示 */
            clip-path: none !important; /* 移除裁剪，允许tooltip完全显示 */
            contain: none !important; /* 不限制子元素 */
            isolation: auto !important; /* 不创建新的层叠上下文 */
          }
          
          /* 全屏模式下的tooltip和popover设置 - 统一管理 */
          .rich-text-editor-toolbar.fixed [data-radix-tooltip-content],
          .rich-text-editor-toolbar.fixed [data-radix-popover-content] {
            z-index: 9999 !important;
            position: fixed !important;
          }
          
          /* 全局tooltip设置 - 确保所有tooltip都有最高层级 */
          [data-radix-tooltip-content] {
            z-index: 9999 !important;
          }
          
          [data-radix-popover-content] {
            z-index: 9999 !important;
          }
          
          /* Portal中的tooltip设置 */
          [data-radix-portal] [data-radix-tooltip-content],
          [data-radix-portal] [data-radix-popover-content] {
            z-index: 9999 !important;
          }
          
          /* 全屏模式下的body级别设置 */
          body:has(.rich-text-editor-toolbar.fixed) [data-radix-tooltip-content],
          body:has(.rich-text-editor-toolbar.fixed) [data-radix-popover-content] {
            z-index: 9999 !important;
            position: fixed !important;
          }
          
          /* 确保工具栏不拦截tooltip */
          .rich-text-editor-toolbar.fixed {
            pointer-events: none !important;
            overflow: visible !important;
          }
          
          .rich-text-editor-toolbar.fixed > * {
            pointer-events: auto !important;
          }
          
          /* 强制所有tooltip相关元素使用最高层级 */
          .rich-text-editor-toolbar.fixed * [data-radix-tooltip-content],
          .rich-text-editor-toolbar.fixed * [data-radix-popover-content] {
            z-index: 9999 !important;
            position: fixed !important;
          }
          
          /* 最强制性的tooltip设置 - 覆盖所有可能的样式 */
          .rich-text-editor-toolbar.fixed [data-radix-tooltip-content] {
            z-index: 99999 !important;
            position: fixed !important;
            background: var(--popover) !important;
            border: 1px solid var(--border) !important;
            border-radius: 6px !important;
            padding: 8px 12px !important;
            font-size: 12px !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          }
          
          /* 最强制性的popover设置 */
          .rich-text-editor-toolbar.fixed [data-radix-popover-content] {
            z-index: 99999 !important;
            position: fixed !important;
            background: var(--popover) !important;
            border: 1px solid var(--border) !important;
            border-radius: 6px !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          }
          
          /* 确保tooltip在body级别也有最高优先级 */
          body [data-radix-tooltip-content] {
            z-index: 99999 !important;
          }
          
          body [data-radix-popover-content] {
            z-index: 99999 !important;
          }
          
          /* 终极解决方案 - 确保tooltip完全可见 */
          .rich-text-editor-toolbar.fixed [data-radix-tooltip-content] {
            z-index: 999999 !important;
            position: fixed !important;
            transform: none !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
            background: var(--popover) !important;
            color: var(--popover-foreground) !important;
            border: 1px solid var(--border) !important;
            border-radius: 6px !important;
            padding: 8px 12px !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            line-height: 1.4 !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            max-width: 200px !important;
            word-wrap: break-word !important;
            top: 3.5rem !important; /* 强制显示在工具栏下方 */
            left: 50% !important;
            transform: translateX(-50%) !important;
          }
          
          /* 确保tooltip箭头也正确显示 */
          .rich-text-editor-toolbar.fixed [data-radix-tooltip-content]::before {
            content: '' !important;
            position: absolute !important;
            top: -4px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 0 !important;
            height: 0 !important;
            border-left: 4px solid transparent !important;
            border-right: 4px solid transparent !important;
            border-bottom: 4px solid var(--popover) !important;
          }
          
          /* 强制tooltip显示在工具栏下方，不被遮挡 */
          .rich-text-editor-toolbar.fixed [data-radix-tooltip-content] {
            z-index: 999999 !important; /* 确保tooltip在工具栏之上 */
            position: fixed !important;
            background: var(--popover) !important;
            color: var(--popover-foreground) !important;
            border: 1px solid var(--border) !important;
            border-radius: 6px !important;
            padding: 8px 12px !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            line-height: 1.4 !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            max-width: 200px !important;
            word-wrap: break-word !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
            clip-path: none !important; /* 确保tooltip不被裁剪 */
            overflow: visible !important; /* 确保tooltip完全可见 */
          }
          
          /* 终极解决方案 - 使用更高层级的容器 */
          .rich-text-editor-toolbar.fixed {
            isolation: auto !important; /* 不创建新的层叠上下文，避免限制tooltip */
          }
          
          
          /* 全屏模式下工具栏内的所有按钮组居中 */
          .rich-text-editor-toolbar.fixed > div {
            justify-content: center !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          /* 全屏模式下移除右侧按钮组的自动边距 */
          .rich-text-editor-toolbar.fixed .ml-auto {
            margin-left: 0 !important;
          }
          
          /* 全屏模式下隐藏主题切换按钮 */
          .rich-text-editor-toolbar.fixed ~ * .theme-toggle-button {
            display: none !important;
          }
          
          /* 当全屏模式激活时隐藏主题切换按钮 */
          body:has(.rich-text-editor-toolbar.fixed) .theme-toggle-button {
            display: none !important;
          }
          
          /* 主编辑器容器样式 - 独立输入框 */
          .rich-text-editor-main {
            border-top: 1px solid var(--border) !important;
            border-radius: 0 0 0.5rem 0.5rem !important;
            border-left: 1px solid var(--border) !important;
            border-right: 1px solid var(--border) !important;
            border-bottom: 1px solid var(--border) !important;
          }
          
          /* 全屏模式下的主编辑器容器样式 - 完整圆角 */
          .rich-text-editor-main.fixed {
            border-radius: 0 0 0.5rem 0.5rem !important;
            border-top: 1px solid var(--border) !important;
            border-left: 1px solid var(--border) !important;
            border-right: 1px solid var(--border) !important;
            border-bottom: 1px solid var(--border) !important;
            width: 80vw !important;
            max-width: 6xl !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
          
          /* 全屏模式下的高度限制 */
          .rich-text-editor-main.fixed {
            height: 100% !important;
            max-height: 100% !important;
            overflow: hidden !important;
          }
          
          /* 全屏模式下编辑器内容区域高度限制 */
          .rich-text-editor-main.fixed > .flex {
            height: 100% !important;
            max-height: 100% !important;
            overflow: hidden !important;
          }
          
          /* 全屏模式下编辑器区域高度限制 */
          .rich-text-editor-main.fixed [contenteditable] {
            height: 100% !important;
            min-height: 100% !important;
            max-height: 100% !important;
            overflow-y: auto !important;
            padding: 1rem !important;
          }

          /* 强制全屏编辑器定位 - 覆盖任何父容器影响 */
          .rich-text-editor-fullscreen {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
          }

          /* 全屏模式下tooltip显示修复 */
          body:has(.rich-text-editor-fullscreen) [data-slot="tooltip-overlay"] {
            z-index: 99999 !important;
          }

          /* 全屏模式下确保所有交互元素都能正常工作 */
          [data-fullscreen-container="true"] * {
            pointer-events: auto !important;
          }

          [data-fullscreen-container="true"] button,
          [data-fullscreen-container="true"] input,
          [data-fullscreen-container="true"] textarea,
          [data-fullscreen-container="true"] select,
          [data-fullscreen-container="true"] [contenteditable],
          [data-fullscreen-container="true"] [tabindex],
          [data-fullscreen-container="true"] [role="button"] {
            pointer-events: auto !important;
            user-select: auto !important;
            z-index: auto !important;
          }

          /* 确保工具栏在全屏模式下正常工作 */
          [data-fullscreen-container="true"] .rich-text-editor-toolbar {
            pointer-events: auto !important;
            z-index: 1000 !important;
          }

          [data-fullscreen-container="true"] .rich-text-editor-toolbar button {
            pointer-events: auto !important;
            cursor: pointer !important;
          }

          /* 美化工具栏样式 */
          .rich-text-editor-toolbar {
            border-bottom: 1px solid hsl(var(--border));
            background: hsl(var(--background)/0.8);
            backdrop-filter: blur(12px);
          }

          /* 按钮样式优化 */
          .rich-text-editor-toolbar button {
            border-radius: 0.5rem;
            transition: all 0.15s ease;
          }

          .rich-text-editor-toolbar button:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .rich-text-editor-toolbar button:active {
            transform: translateY(0);
          }
          
          /* 图片加载状态样式 */
          .rich-text-editor .image-loading-indicator {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: rgba(0, 0, 0, 0.7) !important;
            color: white !important;
            padding: 8px 16px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            z-index: 10 !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            pointer-events: none !important;
          }
          
          .rich-text-editor .image-container img {
            transition: opacity 0.3s ease-in-out !important;
          }
        `}</style>

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
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="link-text" className="text-right">
                                    链接文本
                                </Label>
                                <Input
                                    id="link-text"
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    className="col-span-3"
                                    placeholder="输入链接显示文本"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="link-url" className="text-right">
                                    链接地址
                                </Label>
                                <Input
                                    id="link-url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="col-span-3"
                                    placeholder="https://example.com"
                                    type="url"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                                取消
                            </Button>
                            <Button onClick={handleInsertLink} className="bg-[#253985] hover:bg-[#253985]/90 text-white">
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

            </div>

            {/* LaTeX公式选择器 */}
            <LatexFormulaSelector
                open={showLatexSelector}
                onOpenChange={setShowLatexSelector}
                onInsert={handleInsertLatex}
            />

        </TooltipProvider>
    );



    return editorContent;
};

export default SimpleRichTextEditor;
