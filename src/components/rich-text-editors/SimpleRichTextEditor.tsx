'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Palette,
    Type,
    Image as ImageIcon,
    Upload,
    Maximize2,
    Minimize2,
    Heading
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
import { supabaseImageManager } from '@/lib/supabaseImageManager';
import { useNotification } from '@/components/magicui/NotificationProvider';

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
    clearPreviewImages = false
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const savedSelectionRef = useRef<{ startContainer: Node; startOffset: number; endContainer: Node; endOffset: number } | null>(null);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [pendingImages, setPendingImages] = useState<{ localUrl: string; file: File | null; imageId: string | null }[]>([]);
    const pendingImagesRef = useRef<{ localUrl: string; file: File | null; imageId: string | null }[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const { notify } = useNotification();

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            if (content === '') {
                editorRef.current.innerHTML = '';
            } else {
                editorRef.current.innerHTML = content;
            }
        }
    }, [content]);

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
        const html = e.currentTarget.innerHTML;

        // 暂时禁用自动清理，避免干扰正常输入
        // 只在用户明确需要时手动清理
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

    // 强制显示光标的函数
    const forceShowCursor = () => {
        if (!editorRef.current) return;

        editorRef.current.focus();

        const selection = window.getSelection();
        if (selection) {
            // 如果没有选区，创建一个
            if (selection.rangeCount === 0) {
                const range = document.createRange();
                range.selectNodeContents(editorRef.current);
                range.collapse(false);
                selection.addRange(range);
            }

            // 强制触发光标显示
            const range = selection.getRangeAt(0);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    };


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
        if (!editorRef.current) return;

        // 确保编辑器有焦点
        editorRef.current.focus();

        // 执行命令
        const success = document.execCommand(command, false, value);

        if (success) {
            // 使用更简单的方法：直接确保光标在末尾
            const ensureCursorAtEnd = () => {
                if (!editorRef.current) return;

                editorRef.current.focus();

                const selection = window.getSelection();
                if (selection) {
                    const range = document.createRange();

                    // 总是将光标放在编辑器末尾
                    if (editorRef.current.lastChild) {
                        const lastChild = editorRef.current.lastChild;
                        if (lastChild.nodeType === Node.TEXT_NODE) {
                            const textLength = lastChild.textContent?.length || 0;
                            range.setStart(lastChild, textLength);
                            range.setEnd(lastChild, textLength);
                        } else {
                            range.setStartAfter(lastChild);
                            range.setEndAfter(lastChild);
                        }
                    } else {
                        range.selectNodeContents(editorRef.current);
                        range.collapse(false);
                    }

                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            };

            // 立即执行
            ensureCursorAtEnd();

            // 延迟执行确保DOM更新
            setTimeout(ensureCursorAtEnd, 0);
            setTimeout(ensureCursorAtEnd, 10);

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
    const handleFormatCommand = (command: string, value?: string) => {
        if (!editorRef.current) return;

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

    // 在编辑器中插入图片
    const insertImageToEditor = useCallback((imageUrl: string, isResizable: boolean = true) => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            // 创建图片容器
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container inline-block relative group';
            imageContainer.style.display = 'inline-block';
            imageContainer.style.position = 'relative';
            imageContainer.style.margin = '8px 0';
            imageContainer.style.userSelect = 'none';
            (imageContainer.style as unknown as Record<string, string>).webkitUserSelect = 'none';
            (imageContainer.style as unknown as Record<string, string>).mozUserSelect = 'none';
            (imageContainer.style as unknown as Record<string, string>).msUserSelect = 'none';

            // 创建图片元素
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.borderRadius = '4px';
            img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            img.alt = '插入的图片';
            img.draggable = false; // 防止图片被拖拽移动

            // 如果启用可调整大小，添加调整大小的功能
            if (isResizable) {
                // 添加调整大小的控制点
                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'resize-handle';
                resizeHandle.style.position = 'absolute';
                resizeHandle.style.bottom = '0';
                resizeHandle.style.right = '0';
                resizeHandle.style.width = '12px';
                resizeHandle.style.height = '12px';
                resizeHandle.style.backgroundColor = '#3b82f6';
                resizeHandle.style.border = '2px solid white';
                resizeHandle.style.borderRadius = '50%';
                resizeHandle.style.cursor = 'nw-resize';
                resizeHandle.style.opacity = '0';
                resizeHandle.style.transition = 'opacity 0.2s';
                resizeHandle.style.zIndex = '10';
                resizeHandle.style.userSelect = 'none';

                // 鼠标悬停时显示调整大小控制点
                imageContainer.addEventListener('mouseenter', () => {
                    resizeHandle.style.opacity = '1';
                });
                imageContainer.addEventListener('mouseleave', () => {
                    resizeHandle.style.opacity = '0';
                });

                // 拖拽调整大小功能 - 简化版本
                let isResizing = false;
                let startX = 0;
                let startY = 0;
                let startWidth = 0;
                let startHeight = 0;

                const startResize = (e: MouseEvent) => {
                    console.log('开始调整大小');
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    isResizing = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    startWidth = img.offsetWidth;
                    startHeight = img.offsetHeight;

                    console.log('初始尺寸:', startWidth, startHeight);

                    // 添加全局事件监听器
                    document.addEventListener('mousemove', doResize, { passive: false });
                    document.addEventListener('mouseup', stopResize, { passive: false });

                    // 防止文本选择
                    document.body.style.userSelect = 'none';
                    document.body.style.cursor = 'nw-resize';

                    return false;
                };

                const doResize = (e: MouseEvent) => {
                    if (!isResizing) return;

                    e.preventDefault();
                    e.stopPropagation();

                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;

                    // 计算原始纵横比
                    const aspectRatio = startWidth / startHeight;

                    // 使用较大的变化量来保持纵横比
                    const delta = Math.max(deltaX, deltaY);

                    // 计算新尺寸，保持纵横比
                    let newWidth = Math.max(50, startWidth + delta);
                    let newHeight = Math.max(50, newWidth / aspectRatio);

                    // 如果高度太小，重新计算
                    if (newHeight < 50) {
                        newHeight = 50;
                        newWidth = newHeight * aspectRatio;
                    }

                    console.log('调整尺寸:', newWidth, newHeight, '纵横比:', aspectRatio);

                    // 直接设置图片尺寸
                    img.style.width = newWidth + 'px';
                    img.style.height = newHeight + 'px';
                    img.style.maxWidth = 'none';
                    img.style.minWidth = '50px';
                    img.style.minHeight = '50px';

                    return false;
                };

                const stopResize = (e: MouseEvent) => {
                    if (!isResizing) return;

                    console.log('结束调整大小');
                    isResizing = false;
                    document.removeEventListener('mousemove', doResize);
                    document.removeEventListener('mouseup', stopResize);

                    // 恢复文本选择
                    document.body.style.userSelect = '';
                    document.body.style.cursor = '';

                    // 更新内容
                    if (editorRef.current) {
                        const html = editorRef.current.innerHTML;
                        onChange(html);
                    }

                    return false;
                };

                // 绑定事件 - 使用更直接的方法
                resizeHandle.onmousedown = startResize;
                imageContainer.appendChild(resizeHandle);
            }

            imageContainer.appendChild(img);

            // 插入图片容器
            range.deleteContents();
            range.insertNode(imageContainer);

            // 将光标移到图片后面
            range.setStartAfter(imageContainer);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);

            // 更新内容
            const html = editorRef.current.innerHTML;
            onChange(html);
        }
    }, [onChange]);

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

        // 如果启用了延迟上传，先插入到编辑器，同时添加到待上传列表
        if (deferImageUpload) {
            // 使用 FileReader 创建更持久的预览 URL
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                console.log('FileReader 创建 Data URL:', dataUrl.substring(0, 50) + '...');

                // 直接插入图片到编辑器
                insertImageToEditor(dataUrl, true);

                // 同时添加到待上传列表（用于后续上传到服务器）
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
            };
            reader.readAsDataURL(file);
            return;
        }

        // 立即上传模式
        setIsUploading(true);
        try {
            const imageInfo = await supabaseImageManager.uploadImage(file);
            const imageUrl = imageInfo.url;

            // 直接插入图片到编辑器（支持调整大小）
            insertImageToEditor(imageUrl, true);

            // 通知父组件图片已上传
            if (onImageChange) {
                onImageChange([imageInfo.id]);
            }

            notify({
                type: "success",
                message: "图片上传成功",
                description: "图片已插入到编辑器中"
            });
        } catch (error) {
            console.error('上传失败:', error);
            const errorMessage = error instanceof Error ? error.message : "图片上传失败";
            notify({
                type: "error",
                message: "上传失败",
                description: errorMessage
            });
        } finally {
            setIsUploading(false);
        }
    }, [deferImageUpload, onImageChange, pendingImages, notify, insertImageToEditor, handlePendingImagesChange]);

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


    // 保存当前选区
    const saveCurrentSelection = () => {
        console.log('=== 保存选区 ===');
        const selection = window.getSelection();
        console.log('当前选区对象:', selection);
        console.log('选区数量:', selection?.rangeCount);

        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();

            console.log('选中的文字:', `"${selectedText}"`);
            console.log('选中文字长度:', selectedText.length);
            console.log('开始容器:', range.startContainer);
            console.log('结束容器:', range.endContainer);
            console.log('开始偏移:', range.startOffset);
            console.log('结束偏移:', range.endOffset);

            // 只有在真正选中文字时才保存选区
            if (selectedText.length > 0) {
                savedSelectionRef.current = {
                    startContainer: range.startContainer,
                    startOffset: range.startOffset,
                    endContainer: range.endContainer,
                    endOffset: range.endOffset
                };
                console.log('✅ 选区已保存（有选中文字）');
            } else {
                console.log('❌ 没有选中文字，不保存选区');
            }
        } else {
            console.log('❌ 没有选区可保存');
        }
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

    return (
        <TooltipProvider>
            {isFullscreen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsFullscreen(false)}
                />
            )}
            <div
                className={cn('rich-text-editor border rounded-lg overflow-hidden flex flex-col', isFullscreen ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60vw] max-w-4xl h-[80vh] z-50 bg-white dark:bg-gray-900 shadow-2xl' : '', isDragOver ? 'ring-2 ring-blue-500' : '', className)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="border-b bg-gray-50 dark:bg-[#161618] p-1 flex flex-wrap gap-0.5">
                    {/* 撤销/重做 */}
                    <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => execCommand('undo')}
                                >
                                    <Undo className="w-3 h-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>撤销</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => execCommand('redo')}
                                >
                                    <Redo className="w-3 h-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>重做</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* 文本格式 */}
                    <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('bold') ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleFormatCommand('bold')}
                                    className={`h-6 w-6 p-0 ${activeFormats.has('bold') ? "bg-[#1e40af] dark:bg-[#d97706] text-white hover:bg-[#1e3a8a] dark:hover:bg-[#b45309]" : ""}`}
                                >
                                    <Bold className="w-3 h-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>加粗</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('italic') ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleFormatCommand('italic')}
                                    className={`h-6 w-6 p-0 ${activeFormats.has('italic') ? "bg-[#1e40af] dark:bg-[#d97706] text-white hover:bg-[#1e3a8a] dark:hover:bg-[#b45309]" : ""}`}
                                >
                                    <Italic className="w-3 h-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>斜体</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('underline') ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleFormatCommand('underline')}
                                    className={`h-6 w-6 p-0 ${activeFormats.has('underline') ? "bg-[#1e40af] dark:bg-[#d97706] text-white hover:bg-[#1e3a8a] dark:hover:bg-[#b45309]" : ""}`}
                                >
                                    <Underline className="w-3 h-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>下划线</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('strikeThrough') ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleFormatCommand('strikeThrough')}
                                    className={`h-6 w-6 p-0 ${activeFormats.has('strikeThrough') ? "bg-[#1e40af] dark:bg-[#d97706] text-white hover:bg-[#1e3a8a] dark:hover:bg-[#b45309]" : ""}`}
                                >
                                    <Strikethrough className="w-3 h-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>删除线</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* 标题选择器 */}
                    <div className="flex items-center gap-0.5 pr-1 mr-1">
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <Heading className="w-3 h-3" />
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
                    </div>

                    {/* 列表下拉菜单 */}
                    <div className="flex items-center gap-0.5 pr-1 mr-1">
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <List className="w-3 h-3" />
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
                    </div>

                    {/* 对齐方式下拉菜单 */}
                    <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <AlignLeft className="w-3 h-3" />
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

                    {/* 文字颜色 */}
                    <Popover>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onMouseDown={() => {
                                            // 在鼠标按下时检查并保存选区
                                            console.log('文字颜色按钮被按下，检查选区');
                                            const selection = window.getSelection();
                                            if (selection && selection.rangeCount > 0) {
                                                const range = selection.getRangeAt(0);
                                                const selectedText = range.toString();
                                                if (selectedText.length > 0) {
                                                    console.log('有选中文字，保存选区');
                                                    saveCurrentSelection();
                                                } else {
                                                    console.log('没有选中文字，不保存选区');
                                                }
                                            }
                                        }}
                                    >
                                        <Type className="w-3 h-3" />
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
                                        className="h-6 w-6 p-0"
                                        onMouseDown={() => {
                                            // 在鼠标按下时检查并保存选区
                                            console.log('背景颜色按钮被按下，检查选区');
                                            const selection = window.getSelection();
                                            if (selection && selection.rangeCount > 0) {
                                                const range = selection.getRangeAt(0);
                                                const selectedText = range.toString();
                                                if (selectedText.length > 0) {
                                                    console.log('有选中文字，保存选区');
                                                    saveCurrentSelection();
                                                } else {
                                                    console.log('没有选中文字，不保存选区');
                                                }
                                            }
                                        }}
                                    >
                                        <Palette className="w-3 h-3" />
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

                    {/* 插入链接和图片 */}
                    <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={insertLink}>
                                    <LinkIcon className="w-3 h-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>插入链接</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <Upload className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-3 h-3" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>插入图片</p>
                            </TooltipContent>
                        </Tooltip>

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
                    <div className="flex items-center gap-0.5 ml-auto">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                >
                                    {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isFullscreen ? '退出全屏' : '全屏输入'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onFocus={(e) => {
                        e.currentTarget.focus();
                    }}
                    onBlur={() => {
                        // 在失去焦点时进行清理，避免在编辑过程中干扰
                        if (editorRef.current) {
                            const html = editorRef.current.innerHTML;
                            const textContent = editorRef.current.textContent || '';

                            // 只有在有内容时才进行清理
                            if (textContent.trim() !== '') {
                                const cleanedHtml = cleanEmptyContent(html);
                                if (cleanedHtml !== html) {
                                    editorRef.current.innerHTML = cleanedHtml;
                                    onChange(cleanedHtml);
                                }
                            }
                        }
                    }}
                    onClick={(e) => {
                        const target = e.currentTarget;
                        target.focus();

                        // 确保点击后光标可见
                        const ensureCursor = () => {
                            if (!target) return;
                            const selection = window.getSelection();
                            if (selection) {
                                // 如果没有选区，创建一个
                                if (selection.rangeCount === 0) {
                                    const range = document.createRange();
                                    range.selectNodeContents(target);
                                    range.collapse(false);
                                    selection.addRange(range);
                                }
                                // 强制显示光标
                                target.focus();
                            }
                        };

                        // 立即执行
                        ensureCursor();

                        // 使用 requestAnimationFrame 确保在下一个渲染周期执行
                        requestAnimationFrame(() => {
                            ensureCursor();
                        });
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.focus();
                    }}
                    onMouseUp={() => {
                        // 在鼠标释放时保存选区（只在有选中文字时）
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const selectedText = range.toString();
                            if (selectedText.length > 0) {
                                saveCurrentSelection();
                            }
                        }
                        // 更新按钮状态
                        updateButtonStates();
                    }}
                    onKeyUp={() => {
                        // 在键盘释放时保存选区（只在有选中文字时）
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const selectedText = range.toString();
                            if (selectedText.length > 0) {
                                saveCurrentSelection();
                            }
                        }
                        // 更新按钮状态
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
                    className={cn(
                        "bg-white dark:bg-[#303030] focus:outline-none prose prose-sm max-w-none cursor-text relative overflow-auto",
                        isFullscreen ? "flex-1 min-h-0" :
                            customMinHeight && customMaxHeight ? `min-h-[${customMinHeight}] max-h-[${customMaxHeight}]` : "min-h-[200px] max-h-[400px]"
                    )}
                    style={{
                        fontSize: '14px',
                        lineHeight: '1.5',
                        caretColor: 'currentColor',
                    }}
                    data-placeholder={placeholder}
                    suppressContentEditableWarning={true}
                    tabIndex={0}
                />

                <style jsx global>{`
          .rich-text-editor [contenteditable] {
            caret-color: currentColor !important;
            outline: none !important;
            cursor: text !important;
            padding: 16px !important;
            margin: 0 !important;
            overflow-y: auto !important;
            max-height: 100% !important;
          }
          
          .rich-text-editor [contenteditable]:focus {
            caret-color: currentColor !important;
            outline: none !important;
          }
          
          .rich-text-editor [contenteditable]:focus-visible {
            outline: none !important;
          }
          
          /* 确保光标在标签内也能显示 */
          .rich-text-editor [contenteditable] * {
            caret-color: inherit !important;
          }
          
          .rich-text-editor [contenteditable] b,
          .rich-text-editor [contenteditable] strong,
          .rich-text-editor [contenteditable] i,
          .rich-text-editor [contenteditable] em,
          .rich-text-editor [contenteditable] u,
          .rich-text-editor [contenteditable] s,
          .rich-text-editor [contenteditable] strike {
            caret-color: currentColor !important;
          }
          
          /* 强制显示光标的关键样式 - 浅色模式 */
          .rich-text-editor [contenteditable]:focus {
            caret-color: #000 !important;
          }
          
          .rich-text-editor [contenteditable]:focus * {
            caret-color: #000 !important;
          }
          
          /* 深色模式下的光标颜色 */
          .dark .rich-text-editor [contenteditable]:focus {
            caret-color: #ffffff !important;
          }
          
          .dark .rich-text-editor [contenteditable]:focus * {
            caret-color: #ffffff !important;
          }
          
          .rich-text-editor [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9CA3AF;
            pointer-events: none;
            position: absolute;
            top: 16px;
            left: 16px;
            line-height: 1.5;
            font-size: 14px;
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
        `}</style>
            </div>

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
                        <Button onClick={handleInsertLink}>
                            插入链接
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </TooltipProvider>
    );
};

export default SimpleRichTextEditor;
