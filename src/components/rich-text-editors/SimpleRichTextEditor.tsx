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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
    // 新增：预览相关属性
    previewContent?: string;
    isPreviewMode?: boolean;
    onPreviewModeChange?: (isPreviewMode: boolean) => void;
    // 新增：标识是否在全屏模式中
    isInFullscreen?: boolean;
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
    onFullscreenToggle,
    // 新增：预览相关属性
    previewContent: externalPreviewContent,
    isPreviewMode: externalIsPreviewMode,
    onPreviewModeChange,
    // 新增：标识是否在全屏模式中
    isInFullscreen = false
}) => {
    // 预览内容状态 - 优先使用外部传入的预览内容
    const [internalPreviewContent, setInternalPreviewContent] = useState(content);
    const previewContent = externalPreviewContent !== undefined ? externalPreviewContent : internalPreviewContent;

    const editorRef = useRef<HTMLDivElement>(null);
    const splitEditorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const savedSelectionRef = useRef<{ startContainer: Node; startOffset: number; endContainer: Node; endOffset: number } | null>(null);

    // 合并状态管理 - 减少重渲染
    const [editorState, setEditorState] = useState({
        activeFormats: new Set<string>(),
        hasSelectedText: false,
        isUploading: false,
        pendingImages: [] as { localUrl: string; file: File | null; imageId: string | null }[],
        showLinkDialog: false,
        linkUrl: '',
        linkText: '',
        showLatexSelector: false,
        showCloudImageDialog: false,
        // 图片列表状态
        imageList: [] as { id: string; url: string; name: string }[],
        // 预览模式状态 - 优先使用外部传入的预览模式状态
        isPreviewMode: externalIsPreviewMode !== undefined ? externalIsPreviewMode : false,
        // 合并所有菜单状态
        openMenus: {
            textColor: false,
            backgroundColor: false,
            heading: false,
            list: false,
            align: false,
            image: false
        }
    });

    // 解构状态以便使用
    const { activeFormats, hasSelectedText, isUploading, pendingImages, showLinkDialog, linkUrl, linkText, showLatexSelector, showCloudImageDialog, imageList, openMenus } = editorState;

    // 预览模式状态 - 优先使用外部传入的状态
    const isPreviewMode = externalIsPreviewMode !== undefined ? externalIsPreviewMode : editorState.isPreviewMode;

    // 定义哪些操作需要选中文字
    const requiresSelection = (operation: string): boolean => {
        const operationsRequiringSelection = [
            'bold', 'italic', 'underline', 'strikeThrough',
            'foreColor', 'backColor', 'removeFormat'
        ];
        return operationsRequiringSelection.includes(operation);
    };

    // 检查按钮是否应该被禁用
    const isButtonDisabled = (operation: string): boolean => {
        return requiresSelection(operation) && !hasSelectedText;
    };

    // 关闭所有其他菜单的函数
    const closeAllMenus = useCallback(() => {
        setEditorState(prev => ({
            ...prev,
            openMenus: {
                textColor: false,
                backgroundColor: false,
                heading: false,
                list: false,
                align: false,
                image: false
            }
        }));
    }, []);

    // 统一的菜单处理函数
    const handleMenuChange = useCallback((menuType: keyof typeof openMenus, open: boolean) => {
        setEditorState(prev => ({
            ...prev,
            openMenus: {
                textColor: false,
                backgroundColor: false,
                heading: false,
                list: false,
                align: false,
                image: false,
                [menuType]: open
            }
        }));
    }, []);

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
            // 检查选区是否在编辑器内
            if (editorRef.current && editorRef.current.contains(range.startContainer) && editorRef.current.contains(range.endContainer)) {
                savedSelectionRef.current = {
                    startContainer: range.startContainer,
                    startOffset: range.startOffset,
                    endContainer: range.endContainer,
                    endOffset: range.endOffset
                };
                console.log('选区已保存:', range.toString());
            } else {
                console.log('选区不在编辑器内，无法保存');
                savedSelectionRef.current = null;
            }
        } else {
            console.log('没有选区可保存');
            savedSelectionRef.current = null;
        }
    };

    // 恢复选区
    const restoreSelection = () => {
        if (!savedSelectionRef.current || !editorRef.current) {
            console.log('无法恢复选区：没有保存的选区或编辑器引用');
            return false;
        }

        try {
            const selection = window.getSelection();
            if (!selection) {
                console.log('无法恢复选区：无法获取selection对象');
                return false;
            }

            // 检查保存的选区是否仍然有效
            const { startContainer, startOffset, endContainer, endOffset } = savedSelectionRef.current;

            // 验证节点是否仍然在DOM中
            if (!editorRef.current.contains(startContainer) || !editorRef.current.contains(endContainer)) {
                console.log('无法恢复选区：节点不在编辑器内');
                return false;
            }

            // 验证偏移量是否仍然有效
            if (startOffset > (startContainer.textContent?.length || 0) ||
                endOffset > (endContainer.textContent?.length || 0)) {
                console.log('无法恢复选区：偏移量无效');
                return false;
            }

            const range = document.createRange();
            range.setStart(startContainer, startOffset);
            range.setEnd(endContainer, endOffset);

            selection.removeAllRanges();
            selection.addRange(range);

            console.log('选区恢复成功:', range.toString());
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

        editorRef.current.focus();

        // 检查是否需要选中文字
        if (requiresSelection(command)) {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const selectedText = selection.toString().trim();
            if (!selectedText) {
                // 如果没有选中文本，不执行需要选中的格式化操作
                return;
            }
        }

        // 特殊处理列表命令
        if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
            handleListCommand(command);
            return;
        }

        const success = document.execCommand(command, false, value);

        if (success) {
            const html = editorRef.current.innerHTML;
            onChange(html);
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

        // 确保编辑器获得焦点
        editorRef.current.focus();

        // 立即执行，不使用延迟
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();

        // 只有当选中有文字时才执行颜色设置
        if (!selectedText) {
            return;
        }

        try {
            // 使用 surroundContents 方法
            const span = document.createElement('span');
            span.style.color = color;

            // 使用 surroundContents 包装选中的内容
            range.surroundContents(span);

            // 批量更新内容，减少DOM操作
            const html = editorRef.current!.innerHTML;
            onChange(html);

            // 清除选区
            selection.removeAllRanges();

        } catch (error) {
            // 备用方法：手动创建和插入
            try {
                const span = document.createElement('span');
                span.style.color = color;
                span.textContent = selectedText;

                // 删除选中的内容
                range.deleteContents();

                // 插入新的span
                range.insertNode(span);

                // 批量更新内容
                const html = editorRef.current!.innerHTML;
                onChange(html);

                // 清除选区
                selection.removeAllRanges();

            } catch (backupError) {
                console.error('颜色设置失败:', backupError);
            }
        }
    };

    // 设置背景颜色
    const setBackgroundColor = (color: string) => {
        if (!editorRef.current) return;

        // 确保编辑器获得焦点
        editorRef.current.focus();

        // 立即执行，不使用延迟
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();

        // 只有当选中有文字时才执行颜色设置
        if (!selectedText) {
            return;
        }

        try {
            // 使用 surroundContents 方法
            const span = document.createElement('span');
            span.style.backgroundColor = color;

            // 使用 surroundContents 包装选中的内容
            range.surroundContents(span);

            // 批量更新内容，减少DOM操作
            const html = editorRef.current!.innerHTML;
            onChange(html);

            // 清除选区
            selection.removeAllRanges();

        } catch (error) {
            // 备用方法：手动创建和插入
            try {
                const span = document.createElement('span');
                span.style.backgroundColor = color;
                span.textContent = selectedText;

                // 删除选中的内容
                range.deleteContents();

                // 插入新的span
                range.insertNode(span);

                // 批量更新内容
                const html = editorRef.current!.innerHTML;
                onChange(html);

                // 清除选区
                selection.removeAllRanges();

            } catch (backupError) {
                console.error('背景颜色设置失败:', backupError);
            }
        }
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
            setEditorState(prev => ({ ...prev, linkText: selectedText }));
        }

        setEditorState(prev => ({ ...prev, showLinkDialog: true }));
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

        setEditorState(prev => ({ ...prev, showLinkDialog: false, linkUrl: '', linkText: '' }));
    };

    // 插入LaTeX公式
    const handleInsertLatex = (latex: string) => {
        if (!editorRef.current) return;

        console.log('插入LaTeX公式:', latex);

        // 确保编辑器获得焦点
        editorRef.current.focus();

        // 获取当前选区
        const selection = window.getSelection();
        let range: Range;

        if (!selection || selection.rangeCount === 0) {
            // 如果没有选区，创建一个在编辑器末尾的选区
            range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false); // 折叠到末尾
            selection?.removeAllRanges();
            selection?.addRange(range);
        } else {
            range = selection.getRangeAt(0);

            // 检查选区是否在编辑器内部
            if (!editorRef.current.contains(range.commonAncestorContainer)) {
                // 如果选区不在编辑器内部，将选区移到编辑器末尾
                range = document.createRange();
                range.selectNodeContents(editorRef.current);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }

        // 创建LaTeX元素
        const latexElement = document.createElement('span');
        latexElement.className = 'latex-formula';
        latexElement.setAttribute('data-latex', latex);
        latexElement.textContent = `$${latex}$`;

        console.log('创建的LaTeX元素:', latexElement.outerHTML);

        // 插入元素
        range.insertNode(latexElement);

        // 将光标移到插入的元素后面
        range.setStartAfter(latexElement);
        range.setEndAfter(latexElement);
        selection?.removeAllRanges();
        selection?.addRange(range);

        // 更新内容
        const html = editorRef.current.innerHTML;
        console.log('更新后的编辑器HTML:', html);
        onChange(html);

        setEditorState(prev => ({ ...prev, showLatexSelector: false }));
    };

    // 处理图片上传
    const handleImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setEditorState(prev => ({ ...prev, isUploading: true }));

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const imageInfo = await supabaseImageManager.uploadImage(file);
                return { id: imageInfo.id, url: imageInfo.url, name: file.name };
            });

            const uploadedImages = await Promise.all(uploadPromises);

            // 将图片添加到列表中，而不是插入到编辑器
            setEditorState(prev => ({
                ...prev,
                imageList: [...prev.imageList, ...uploadedImages]
            }));

            // 通知父组件图片变化
            if (onImageChange) {
                const imageIds = [...imageList.map(img => img.id), ...uploadedImages.map(img => img.id)];
                onImageChange(imageIds);
            }

            notify({ message: '图片上传成功', type: 'success' });
        } catch (error) {
            console.error('图片上传失败:', error);
            notify({ message: '图片上传失败', type: 'error' });
        } finally {
            setEditorState(prev => ({ ...prev, isUploading: false }));
        }
    };

    // 处理云端图片选择
    const handleCloudImageSelect = (imageId: string) => {
        const imageUrl = supabaseImageManager.getImageUrl(imageId) || '';
        const imageName = `Cloud Image ${imageId}`;

        // 将图片添加到列表中，而不是插入到编辑器
        setEditorState(prev => ({
            ...prev,
            imageList: [...prev.imageList, { id: imageId, url: imageUrl, name: imageName }]
        }));

        // 通知父组件图片变化
        if (onImageChange) {
            const imageIds = [...imageList.map(img => img.id), imageId];
            onImageChange(imageIds);
        }

        setEditorState(prev => ({ ...prev, showCloudImageDialog: false }));
    };

    // 渲染LaTeX公式 - 简化版本
    const renderLatexInContent = (html: string): string => {
        if (!html || html.trim() === '') return '';

        // 创建临时DOM元素来解析HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // 查找所有LaTeX公式元素
        const latexElements = tempDiv.querySelectorAll('.latex-formula');

        // 如果没有任何LaTeX元素，直接返回原始HTML
        if (latexElements.length === 0) {
            return html;
        }

        latexElements.forEach((element) => {
            const latex = element.getAttribute('data-latex');

            if (latex) {
                try {
                    // 使用katex渲染公式
                    const rendered = katex.renderToString(latex, {
                        throwOnError: false,
                        displayMode: false
                    });

                    // 创建新的div元素来替换原元素
                    const newElement = document.createElement('div');
                    newElement.innerHTML = rendered;
                    newElement.className = 'latex-rendered inline-block';

                    // 替换原元素
                    element.parentNode?.replaceChild(newElement, element);
                } catch (error) {
                    console.error('LaTeX渲染错误:', error);
                    // 如果渲染失败，保持原始文本
                }
            }
        });

        return tempDiv.innerHTML;
    };

    // 处理缩进命令
    const handleIndentCommand = (command: 'indent') => {
        if (!editorRef.current) return;

        editorRef.current.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);

        // 检查是否在列表项中
        const listItem = range.startContainer.parentElement?.closest('li');
        if (listItem) {
            // 在列表项中，使用标准的缩进命令
            const success = document.execCommand('indent', false, undefined);
            if (success) {
                const html = editorRef.current!.innerHTML;
                onChange(html);
            }
        } else {
            // 不在列表项中，为当前段落添加缩进
            const indentAmount = 40;

            // 找到包含光标的段落元素
            let paragraph = range.startContainer;

            // 向上查找段落元素
            while (paragraph && paragraph !== editorRef.current) {
                if (paragraph.nodeType === Node.ELEMENT_NODE) {
                    const element = paragraph as HTMLElement;
                    if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'].includes(element.tagName)) {
                        break;
                    }
                }
                paragraph = paragraph.parentNode!;
            }

            // 如果没有找到段落，需要创建一个
            if (!paragraph || paragraph === editorRef.current) {
                // 检查编辑器是否为空
                const editorContent = editorRef.current.innerHTML.trim();

                if (!editorContent || editorContent === '<br>' || editorContent === '') {
                    // 编辑器为空，创建一个带缩进的段落
                    const p = document.createElement('p');
                    p.innerHTML = '&nbsp;';
                    p.style.marginLeft = `${indentAmount}px`;
                    editorRef.current.innerHTML = '';
                    editorRef.current.appendChild(p);

                    // 将光标移到段落中
                    const newRange = document.createRange();
                    newRange.setStart(p, 0);
                    newRange.setEnd(p, 0);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } else {
                    // 编辑器有内容，将内容包装在段落中
                    const allContent = editorRef.current.innerHTML;
                    const p = document.createElement('p');
                    p.innerHTML = allContent;
                    p.style.marginLeft = `${indentAmount}px`;
                    editorRef.current.innerHTML = '';
                    editorRef.current.appendChild(p);

                    // 将光标移到段落末尾
                    const newRange = document.createRange();
                    newRange.setStart(p, p.childNodes.length);
                    newRange.setEnd(p, p.childNodes.length);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }

                const html = editorRef.current.innerHTML;
                onChange(html);
                return;
            }

            // 为现有段落添加缩进
            const element = paragraph as HTMLElement;
            const currentMarginLeft = parseInt(element.style.marginLeft || '0');
            const newMarginLeft = currentMarginLeft + indentAmount;
            element.style.marginLeft = `${newMarginLeft}px`;

            const html = editorRef.current.innerHTML;
            onChange(html);
        }
    };

    // 清除所有格式
    const handleClearFormat = () => {
        if (!editorRef.current) return;

        editorRef.current.focus();

        // 延迟执行，确保焦点设置完成
        setTimeout(() => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const selectedText = range.toString();

            // 只有在选中文本时才执行清除格式操作
            if (!selectedText || selectedText.trim() === '') {
                // 如果没有选中文本，不执行任何操作
                return;
            }

            // 使用 document.execCommand 来清除格式，这样更可靠
            const success = document.execCommand('removeFormat', false, undefined);

            if (success) {
                const html = editorRef.current?.innerHTML;
                if (html) onChange(html);
            } else {
                // 如果 execCommand 失败，使用手动方式
                const textNode = document.createTextNode(selectedText);
                range.deleteContents();
                range.insertNode(textNode);

                // 将光标移到文本后面
                const newRange = document.createRange();
                newRange.setStartAfter(textNode);
                newRange.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(newRange);

                const html = editorRef.current?.innerHTML;
                if (html) onChange(html);
            }
        }, 10);
    };

    // 防抖的按钮状态更新函数
    const updateButtonStates = useCallback(() => {
        const formats = ['bold', 'italic', 'underline', 'strikeThrough'];
        const newActiveFormats = new Set<string>();

        formats.forEach(format => {
            if (document.queryCommandState(format)) {
                newActiveFormats.add(format);
            }
        });

        // 检查是否有选中的文本
        const selection = window.getSelection();
        const hasSelection = !!(selection && selection.rangeCount > 0 && selection.toString().trim() !== '');

        // 批量更新状态，减少重渲染
        setEditorState(prev => {
            // 只有当状态真正改变时才更新
            if (prev.activeFormats.size === newActiveFormats.size &&
                [...prev.activeFormats].every(format => newActiveFormats.has(format)) &&
                prev.hasSelectedText === hasSelection) {
                return prev; // 状态没有变化，不触发重渲染
            }

            return {
                ...prev,
                activeFormats: newActiveFormats,
                hasSelectedText: hasSelection
            };
        });
    }, []);

    // 监听content变化
    useEffect(() => {
        if (externalPreviewContent === undefined) {
            setInternalPreviewContent(content);
        }
    }, [content, externalPreviewContent]);

    // 初始化编辑器内容
    useEffect(() => {
        if (editorRef.current && content) {
            editorRef.current.innerHTML = content;
        }
    }, [content]);

    // 监听外部预览模式状态变化
    useEffect(() => {
        if (externalIsPreviewMode !== undefined) {
            // 当外部状态变化时，同步内部状态
            setEditorState(prev => ({ ...prev, isPreviewMode: externalIsPreviewMode }));
        }
    }, [externalIsPreviewMode]);

    // 保存和恢复光标位置的辅助函数
    const saveCursorPosition = (element: HTMLElement) => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            return {
                startContainer: range.startContainer,
                startOffset: range.startOffset,
                endContainer: range.endContainer,
                endOffset: range.endOffset
            };
        }
        return null;
    };

    const restoreCursorPosition = (element: HTMLElement, position: {
        startContainer: Node;
        startOffset: number;
        endContainer: Node;
        endOffset: number;
    } | null) => {
        if (!position) return;

        try {
            const range = document.createRange();
            range.setStart(position.startContainer, position.startOffset);
            range.setEnd(position.endContainer, position.endOffset);

            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } catch (error) {
            // 如果恢复失败，将光标放到末尾
            const range = document.createRange();
            range.selectNodeContents(element);
            range.collapse(false);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    };

    // 切换预览模式时同步内容
    useEffect(() => {
        if (isPreviewMode && editorRef.current && splitEditorRef.current) {
            // 切换到分屏模式时，保存主编辑器光标位置
            const cursorPosition = saveCursorPosition(editorRef.current);
            // 将主编辑器内容同步到分屏编辑器
            splitEditorRef.current.innerHTML = editorRef.current.innerHTML;
            // 恢复光标位置
            if (cursorPosition) {
                setTimeout(() => restoreCursorPosition(splitEditorRef.current!, cursorPosition), 0);
            }
        } else if (!isPreviewMode && editorRef.current && splitEditorRef.current) {
            // 切换到单屏模式时，保存分屏编辑器光标位置
            const cursorPosition = saveCursorPosition(splitEditorRef.current);
            // 将分屏编辑器内容同步到主编辑器
            editorRef.current.innerHTML = splitEditorRef.current.innerHTML;
            // 恢复光标位置
            if (cursorPosition) {
                setTimeout(() => restoreCursorPosition(editorRef.current!, cursorPosition), 0);
            }
        }
    }, [isPreviewMode]);

    // 初始化分屏编辑器内容
    useEffect(() => {
        if (isPreviewMode && splitEditorRef.current && !splitEditorRef.current.innerHTML) {
            splitEditorRef.current.innerHTML = content;
        }
    }, [isPreviewMode, content]);

    // 监听选区变化
    useEffect(() => {
        const handleSelectionChange = () => {
            updateButtonStates();
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [updateButtonStates]);

    // 清理空的HTML标签
    const cleanEmptyTags = (html: string): string => {
        // 移除空的标签
        const cleaned = html
            .replace(/<(\w+)[^>]*>\s*<\/\1>/g, '') // 移除空的标签如 <strong></strong>
            .replace(/<(\w+)[^>]*>\s*&nbsp;\s*<\/\1>/g, '&nbsp;') // 移除只包含&nbsp;的标签
            .replace(/<(\w+)[^>]*>\s*<br\s*\/?>\s*<\/\1>/g, '<br>') // 移除只包含<br>的标签
            .replace(/<span[^>]*>\s*<\/span>/g, '') // 移除空的span标签
            .replace(/<span[^>]*>\s*&nbsp;\s*<\/span>/g, '&nbsp;') // 移除只包含&nbsp;的span标签
            .replace(/<span[^>]*>\s*<br\s*\/?>\s*<\/span>/g, '<br>') // 移除只包含<br>的span标签
            .replace(/<strong[^>]*>\s*<\/strong>/g, '') // 移除空的strong标签
            .replace(/<em[^>]*>\s*<\/em>/g, '') // 移除空的em标签
            .replace(/<u[^>]*>\s*<\/u>/g, '') // 移除空的u标签
            .replace(/<s[^>]*>\s*<\/s>/g, '') // 移除空的s标签
            .replace(/<b[^>]*>\s*<\/b>/g, '') // 移除空的b标签
            .replace(/<i[^>]*>\s*<\/i>/g, '') // 移除空的i标签
            .replace(/<(\w+)[^>]*>\s*<(\w+)[^>]*>\s*<\/\2>\s*<\/\1>/g, '') // 移除嵌套的空标签
            .replace(/<div[^>]*>\s*<\/div>/g, '') // 移除空的div标签
            .replace(/<p[^>]*>\s*<\/p>/g, '') // 移除空的p标签
            .replace(/<h[1-6][^>]*>\s*<\/h[1-6]>/g, '') // 移除空的标题标签
            .replace(/<font[^>]*>\s*<\/font>/g, '') // 移除空的font标签
            .replace(/<mark[^>]*>\s*<\/mark>/g, '') // 移除空的mark标签
            .replace(/<del[^>]*>\s*<\/del>/g, '') // 移除空的del标签
            .replace(/<ins[^>]*>\s*<\/ins>/g, '') // 移除空的ins标签
            .replace(/<sub[^>]*>\s*<\/sub>/g, '') // 移除空的sub标签
            .replace(/<sup[^>]*>\s*<\/sup>/g, '') // 移除空的sup标签
            .replace(/<code[^>]*>\s*<\/code>/g, '') // 移除空的code标签
            .replace(/<kbd[^>]*>\s*<\/kbd>/g, '') // 移除空的kbd标签
            .replace(/<samp[^>]*>\s*<\/samp>/g, '') // 移除空的samp标签
            .replace(/<var[^>]*>\s*<\/var>/g, '') // 移除空的var标签
            .replace(/<cite[^>]*>\s*<\/cite>/g, '') // 移除空的cite标签
            .replace(/<q[^>]*>\s*<\/q>/g, '') // 移除空的q标签
            .replace(/<dfn[^>]*>\s*<\/dfn>/g, '') // 移除空的dfn标签
            .replace(/<abbr[^>]*>\s*<\/abbr>/g, '') // 移除空的abbr标签
            .replace(/<time[^>]*>\s*<\/time>/g, '') // 移除空的time标签
            .replace(/<data[^>]*>\s*<\/data>/g, '') // 移除空的data标签
            .replace(/<output[^>]*>\s*<\/output>/g, '') // 移除空的output标签
            .replace(/<meter[^>]*>\s*<\/meter>/g, '') // 移除空的meter标签
            .replace(/<progress[^>]*>\s*<\/progress>/g, '') // 移除空的progress标签
            .replace(/<ruby[^>]*>\s*<\/ruby>/g, '') // 移除空的ruby标签
            .replace(/<rt[^>]*>\s*<\/rt>/g, '') // 移除空的rt标签
            .replace(/<rp[^>]*>\s*<\/rp>/g, '') // 移除空的rp标签
            .replace(/<bdi[^>]*>\s*<\/bdi>/g, '') // 移除空的bdi标签
            .replace(/<bdo[^>]*>\s*<\/bdo>/g, '') // 移除空的bdo标签
            .replace(/<wbr[^>]*>\s*<\/wbr>/g, '') // 移除空的wbr标签
            .replace(/<details[^>]*>\s*<\/details>/g, '') // 移除空的details标签
            .replace(/<summary[^>]*>\s*<\/summary>/g, '') // 移除空的summary标签
            .replace(/<dialog[^>]*>\s*<\/dialog>/g, '') // 移除空的dialog标签
            .replace(/<menu[^>]*>\s*<\/menu>/g, '') // 移除空的menu标签
            .replace(/<menuitem[^>]*>\s*<\/menuitem>/g, '') // 移除空的menuitem标签
            .replace(/<command[^>]*>\s*<\/command>/g, '') // 移除空的command标签
            .replace(/<keygen[^>]*>\s*<\/keygen>/g, '') // 移除空的keygen标签
            .replace(/<source[^>]*>\s*<\/source>/g, '') // 移除空的source标签
            .replace(/<track[^>]*>\s*<\/track>/g, '') // 移除空的track标签
            .replace(/<embed[^>]*>\s*<\/embed>/g, '') // 移除空的embed标签
            .replace(/<object[^>]*>\s*<\/object>/g, '') // 移除空的object标签
            .replace(/<param[^>]*>\s*<\/param>/g, '') // 移除空的param标签
            .replace(/<area[^>]*>\s*<\/area>/g, '') // 移除空的area标签
            .replace(/<base[^>]*>\s*<\/base>/g, '') // 移除空的base标签
            .replace(/<br[^>]*>\s*<br[^>]*>/g, '<br>') // 合并连续的br标签
            .replace(/<br[^>]*>\s*$/g, '') // 移除末尾的br标签
            .replace(/^\s*<br[^>]*>/g, '') // 移除开头的br标签
            .replace(/<br[^>]*>\s*<br[^>]*>\s*<br[^>]*>/g, '<br><br>'); // 限制连续br标签数量

        // 递归清理，直到没有更多空标签
        if (cleaned !== html) {
            return cleanEmptyTags(cleaned);
        }

        return cleaned;
    };

    // 防抖的输入处理函数
    const debouncedOnChange = useRef<NodeJS.Timeout | null>(null);

    const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
        const html = (e.target as HTMLDivElement).innerHTML;

        // 清除之前的防抖定时器
        if (debouncedOnChange.current) {
            clearTimeout(debouncedOnChange.current);
        }

        // 设置新的防抖定时器
        debouncedOnChange.current = setTimeout(() => {
            // 直接传递HTML，不进行清理
            onChange(html);

            // 更新预览内容
            if (externalPreviewContent === undefined) {
                setInternalPreviewContent(html);
            }

            // 同步两个编辑器的内容 - 只在非全屏模式下同步
            // 全屏模式下不进行内容同步，避免光标位置丢失
            if (!isInFullscreen) {
                if (isPreviewMode) {
                    // 如果在分屏模式，同步到主编辑器
                    if (editorRef.current && splitEditorRef.current) {
                        editorRef.current.innerHTML = html;
                    }
                } else {
                    // 如果在单屏模式，同步到分屏编辑器
                    if (splitEditorRef.current) {
                        splitEditorRef.current.innerHTML = html;
                    }
                }
            }
        }, 100); // 100ms防抖
    }, [onChange, isPreviewMode, externalPreviewContent, isInFullscreen]);

    // 完全移除键盘事件处理，让浏览器使用默认行为
    // const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    //     // 不做任何处理
    // };

    // 处理编辑器点击，确保光标在正确位置
    const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const currentEditor = e.target as HTMLDivElement;
        currentEditor.focus();
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
                                    disabled={isButtonDisabled('bold')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('bold') ? "bg-blue-500/20 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400 hover:bg-blue-500/20 hover:text-blue-600 dark:hover:bg-blue-400/20 dark:hover:text-blue-400" : "",
                                        isButtonDisabled('bold') ? "opacity-50 cursor-not-allowed" : ""
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
                                    disabled={isButtonDisabled('italic')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('italic') ? "bg-purple-500/20 text-purple-600 dark:bg-purple-400/20 dark:text-purple-400 hover:bg-purple-500/20 hover:text-purple-600 dark:hover:bg-purple-400/20 dark:hover:text-purple-400" : "",
                                        isButtonDisabled('italic') ? "opacity-50 cursor-not-allowed" : ""
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
                                    disabled={isButtonDisabled('underline')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('underline') ? "bg-green-500/20 text-green-600 dark:bg-green-400/20 dark:text-green-400 hover:bg-green-500/20 hover:text-green-600 dark:hover:bg-green-400/20 dark:hover:text-green-400" : "",
                                        isButtonDisabled('underline') ? "opacity-50 cursor-not-allowed" : ""
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
                                    disabled={isButtonDisabled('strikeThrough')}
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        activeFormats.has('strikeThrough') ? "bg-red-500/20 text-red-600 dark:bg-red-400/20 dark:text-red-400 hover:bg-red-500/20 hover:text-red-600 dark:hover:bg-red-400/20 dark:hover:text-red-400" : "",
                                        isButtonDisabled('strikeThrough') ? "opacity-50 cursor-not-allowed" : ""
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
                        <DropdownMenu open={openMenus.heading} onOpenChange={(open) => handleMenuChange('heading', open)}>
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
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'div'); closeAllMenus(); }}>
                                    正文
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h1'); closeAllMenus(); }}>
                                    标题 1
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h2'); closeAllMenus(); }}>
                                    标题 2
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h3'); closeAllMenus(); }}>
                                    标题 3
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h4'); closeAllMenus(); }}>
                                    标题 4
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h5'); closeAllMenus(); }}>
                                    标题 5
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('formatBlock', 'h6'); closeAllMenus(); }}>
                                    标题 6
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 列表下拉菜单 */}
                        <DropdownMenu open={openMenus.list} onOpenChange={(open) => handleMenuChange('list', open)}>
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
                                <DropdownMenuItem onClick={() => { handleFormatCommand('insertUnorderedList'); closeAllMenus(); }}>
                                    <List className="w-3 h-3 mr-2" />
                                    无序列表
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('insertOrderedList'); closeAllMenus(); }}>
                                    <ListOrdered className="w-3 h-3 mr-2" />
                                    有序列表
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 对齐方式下拉菜单 */}
                        <DropdownMenu open={openMenus.align} onOpenChange={(open) => handleMenuChange('align', open)}>
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
                                <DropdownMenuItem onClick={() => { handleFormatCommand('justifyLeft'); closeAllMenus(); }}>
                                    <AlignLeft className="w-3 h-3 mr-2" />
                                    左对齐
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('justifyCenter'); closeAllMenus(); }}>
                                    <AlignCenter className="w-3 h-3 mr-2" />
                                    居中
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('justifyRight'); closeAllMenus(); }}>
                                    <AlignRight className="w-3 h-3 mr-2" />
                                    右对齐
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleFormatCommand('justifyFull'); closeAllMenus(); }}>
                                    <AlignJustify className="w-3 h-3 mr-2" />
                                    两端对齐
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 增加缩进 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={TOOLBAR_BUTTON_CLASSES}
                                    onMouseDown={() => saveCurrentSelection()}
                                    onClick={() => handleIndentCommand('indent')}
                                >
                                    <Indent className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>增加缩进</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-6 w-px bg-border/60 mx-1"></div>

                    {/* 颜色工具组 */}
                    <div className="flex items-center gap-0.5">
                        {/* 文字颜色 */}
                        <Popover open={openMenus.textColor} onOpenChange={(open) => handleMenuChange('textColor', open)}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className={cn(TOOLBAR_BUTTON_CLASSES, !hasSelectedText ? "opacity-50 cursor-not-allowed" : "")}
                                            onMouseDown={() => {
                                                // 在鼠标按下时立即保存选区
                                                saveCurrentSelection();
                                            }}
                                            disabled={isButtonDisabled('foreColor')}
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
                                                onMouseDown={(e) => {
                                                    // 阻止默认行为，防止失去焦点
                                                    e.preventDefault();
                                                    // 保存选区
                                                    saveCurrentSelection();
                                                }}
                                                onClick={() => {
                                                    setTextColor(color);
                                                    closeAllMenus();
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* 背景颜色 */}
                        <Popover open={openMenus.backgroundColor} onOpenChange={(open) => handleMenuChange('backgroundColor', open)}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className={cn(TOOLBAR_BUTTON_CLASSES, isButtonDisabled('backColor') ? "opacity-50 cursor-not-allowed" : "")}
                                            onMouseDown={() => {
                                                // 在鼠标按下时立即保存选区
                                                saveCurrentSelection();
                                            }}
                                            disabled={isButtonDisabled('backColor')}
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
                                                onMouseDown={(e) => {
                                                    // 阻止默认行为，防止失去焦点
                                                    e.preventDefault();
                                                    // 保存选区
                                                    saveCurrentSelection();
                                                }}
                                                onClick={() => {
                                                    setBackgroundColor(color);
                                                    closeAllMenus();
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* 清除格式 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={cn(TOOLBAR_BUTTON_CLASSES, isButtonDisabled('removeFormat') ? "opacity-50 cursor-not-allowed" : "")}
                                    onClick={handleClearFormat}
                                    disabled={isButtonDisabled('removeFormat')}
                                >
                                    <Eraser className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>清除格式</p>
                            </TooltipContent>
                        </Tooltip>
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
                                <Button type="button" variant="ghost" size="sm" className={TOOLBAR_BUTTON_CLASSES} onClick={() => setEditorState(prev => ({ ...prev, showLatexSelector: true }))}>
                                    <Sigma className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>公式</p>
                            </TooltipContent>
                        </Tooltip>

                        <DropdownMenu open={openMenus.image} onOpenChange={(open) => handleMenuChange('image', open)}>
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
                                <DropdownMenuItem onClick={() => { fileInputRef.current?.click(); closeAllMenus(); }} className="flex items-center gap-2">
                                    <FileImage className="w-4 h-4" />
                                    <span>从本地选择</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditorState(prev => ({ ...prev, showCloudImageDialog: true })); closeAllMenus(); }} className="flex items-center gap-2">
                                    <Cloud className="w-4 h-4" />
                                    <span>从云端选择</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </div>

                    {/* 预览模式切换按钮 */}
                    <div className="flex items-center gap-0.5 ml-auto">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant={isPreviewMode ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        TOOLBAR_BUTTON_CLASSES,
                                        isPreviewMode ? "bg-green-500/20 text-green-600 dark:bg-green-400/20 dark:text-green-400 hover:bg-green-500/20 hover:text-green-600 dark:hover:bg-green-400/20 dark:hover:text-green-400" : ""
                                    )}
                                    onClick={() => {
                                        const newPreviewMode = !isPreviewMode;
                                        if (onPreviewModeChange) {
                                            onPreviewModeChange(newPreviewMode);
                                        } else {
                                            setEditorState(prev => ({ ...prev, isPreviewMode: newPreviewMode }));
                                        }
                                    }}
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isPreviewMode ? '退出分屏预览' : '分屏预览'}</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* 全屏按钮 */}
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

                {/* 编辑器内容区域 */}
                <div
                    ref={editorRef}
                    className={cn(
                        "rich-text-editor-main p-4 min-h-[200px] max-h-[600px] overflow-y-auto focus:outline-none relative bg-white dark:bg-[#303030]",
                        isPreviewMode ? "hidden" : ""
                    )}
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

                {/* 分屏模式 - 使用同一个编辑器，只是改变布局 */}
                {isPreviewMode && (
                    <div className="flex h-full" style={{ minHeight: customMinHeight, maxHeight: customMaxHeight }}>
                        {/* 左侧编辑器 - 显示隐藏的编辑器 */}
                        <div className="flex-1 border-r rich-text-editor-split-border">
                            <div className="h-full flex flex-col">
                                <div className="px-3 py-2 text-xs font-medium rich-text-editor-split-header border-b">
                                    编辑
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto focus:outline-none relative bg-white dark:bg-[#303030]">
                                    {/* 分屏模式下的编辑器 */}
                                    <div
                                        ref={splitEditorRef}
                                        className="rich-text-editor-main h-full w-full focus:outline-none"
                                        contentEditable
                                        suppressContentEditableWarning
                                        data-placeholder={placeholder}
                                        onInput={handleInput}
                                        onClick={handleEditorClick}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 右侧预览 */}
                        <div className="flex-1">
                            <div className="h-full flex flex-col">
                                <div className="px-3 py-2 text-xs font-medium rich-text-editor-split-header border-b">
                                    预览
                                </div>
                                <div
                                    className="rich-text-editor-preview flex-1 p-4 overflow-y-auto relative preview-mode"
                                >
                                    {previewContent && previewContent.trim() !== '' ? (
                                        <HtmlRenderer content={previewContent} className="prose max-w-none" />
                                    ) : (
                                        <div className="text-muted-foreground text-sm italic">
                                            预览内容将在这里显示
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                <Dialog open={showLinkDialog} onOpenChange={(open) => setEditorState(prev => ({ ...prev, showLinkDialog: open }))}>
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
                                    onChange={(e) => setEditorState(prev => ({ ...prev, linkUrl: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="link-text">显示文本</Label>
                                <Input
                                    id="link-text"
                                    placeholder="链接文本"
                                    value={linkText}
                                    onChange={(e) => setEditorState(prev => ({ ...prev, linkText: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditorState(prev => ({ ...prev, showLinkDialog: false }))}>
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
                    onOpenChange={(open) => setEditorState(prev => ({ ...prev, showCloudImageDialog: open }))}
                    onImageSelected={(imageId) => {
                        handleCloudImageSelect(imageId);
                        setEditorState(prev => ({ ...prev, showCloudImageDialog: false }));
                    }}
                    trigger={<div />}
                />

                {/* 图片 Accordion */}
                {imageList.length > 0 && (
                    <div className="mt-2">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="images" className="border-none">
                                <AccordionTrigger className="text-sm font-medium py-1 px-0 hover:no-underline">
                                    图片 ({imageList.length})
                                </AccordionTrigger>
                                <AccordionContent className="pt-0 pb-2">
                                    <PhotoProvider>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
                                            {imageList.map((image, index) => (
                                                <div key={image.id} className="relative group">
                                                    <PhotoView src={image.url}>
                                                        <div className="aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary transition-colors">
                                                            <Image
                                                                src={image.url}
                                                                alt={image.name}
                                                                width={200}
                                                                height={200}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    </PhotoView>
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => {
                                                                setEditorState(prev => ({
                                                                    ...prev,
                                                                    imageList: prev.imageList.filter((_, i) => i !== index)
                                                                }));
                                                                if (onImageChange) {
                                                                    const newImageIds = imageList.filter((_, i) => i !== index).map(img => img.id);
                                                                    onImageChange(newImageIds);
                                                                }
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                    <div className="mt-2 text-xs text-muted-foreground truncate">
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

                {/* LaTeX公式选择器 */}
                <LatexFormulaSelector
                    open={showLatexSelector}
                    onOpenChange={(open) => setEditorState(prev => ({ ...prev, showLatexSelector: open }))}
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
                    
                    /* 确保预览模式下不显示placeholder */
                    .preview-mode .rich-text-editor-main:empty::before {
                        display: none !important;
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
                    
                    /* LaTeX公式样式 */
                    .latex-formula {
                        display: inline-block;
                        background-color: #f8f9fa;
                        border: 1px solid #e9ecef;
                        border-radius: 4px;
                        padding: 2px 6px;
                        margin: 0 2px;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        color: #495057;
                    }
                    
                    .latex-rendered {
                        display: inline-block;
                        margin: 0 2px;
                        vertical-align: middle;
                    }
                    
                    /* 预览模式下的LaTeX样式 */
                    .prose .latex-rendered {
                        display: inline-block;
                        margin: 0 2px;
                        vertical-align: middle;
                    }
                    
                    /* 分屏模式样式 */
                    .rich-text-editor-preview {
                        background-color: #ffffff;
                        color: #111827;
                    }
                    
                    .dark .rich-text-editor-preview {
                        background-color: #1f2937;
                        color: #f9fafb;
                    }
                    
                    /* 分屏模式下的分隔线 */
                    .rich-text-editor-split-border {
                        border-color: #e5e7eb;
                    }
                    
                    .dark .rich-text-editor-split-border {
                        border-color: #374151;
                    }
                    
                    /* 分屏模式下的标签栏 */
                    .rich-text-editor-split-header {
                        background-color: #f8f9fa;
                        border-color: #e5e7eb;
                        color: #6b7280;
                    }
                    
                    .dark .rich-text-editor-split-header {
                        background-color: #374151;
                        border-color: #4b5563;
                        color: #9ca3af;
                    }
                    
                    /* 预览模式下的内容样式 */
                    .rich-text-editor-preview .prose {
                        color: inherit;
                    }
                    
                    .rich-text-editor-preview .prose h1,
                    .rich-text-editor-preview .prose h2,
                    .rich-text-editor-preview .prose h3,
                    .rich-text-editor-preview .prose h4,
                    .rich-text-editor-preview .prose h5,
                    .rich-text-editor-preview .prose h6 {
                        color: inherit;
                        font-weight: 600;
                        margin-top: 1.5em;
                        margin-bottom: 0.5em;
                    }
                    
                    .rich-text-editor-preview .prose h1 {
                        font-size: 2em;
                    }
                    
                    .rich-text-editor-preview .prose h2 {
                        font-size: 1.5em;
                    }
                    
                    .rich-text-editor-preview .prose h3 {
                        font-size: 1.25em;
                    }
                    
                    .rich-text-editor-preview .prose p {
                        margin-bottom: 1em;
                        line-height: 1.6;
                    }
                    
                    .rich-text-editor-preview .prose ul,
                    .rich-text-editor-preview .prose ol {
                        margin: 1em 0;
                        padding-left: 1.5em;
                    }
                    
                    .rich-text-editor-preview .prose li {
                        margin: 0.25em 0;
                    }
                    
                    .rich-text-editor-preview .prose blockquote {
                        border-left: 4px solid #e5e7eb;
                        padding-left: 1em;
                        margin: 1em 0;
                        font-style: italic;
                        color: #6b7280;
                    }
                    
                    .dark .rich-text-editor-preview .prose blockquote {
                        border-left-color: #4b5563;
                        color: #9ca3af;
                    }
                    
                    .rich-text-editor-preview .prose a {
                        color: #3b82f6;
                        text-decoration: underline;
                    }
                    
                    .dark .rich-text-editor-preview .prose a {
                        color: #60a5fa;
                    }
                    
                    .rich-text-editor-preview .prose strong {
                        font-weight: 600;
                    }
                    
                    .rich-text-editor-preview .prose em {
                        font-style: italic;
                    }
                    
                    .rich-text-editor-preview .prose u {
                        text-decoration: underline;
                    }
                    
                    .rich-text-editor-preview .prose s {
                        text-decoration: line-through;
                    }
                    
                    /* LaTeX公式在预览模式下的样式 */
                    .rich-text-editor-preview .latex-block {
                        text-align: center;
                        margin: 1em 0;
                        padding: 0.5em;
                        background-color: #f8f9fa;
                        border-radius: 0.25rem;
                    }
                    
                    .dark .rich-text-editor-preview .latex-block {
                        background-color: #374151;
                    }
                    
                    .rich-text-editor-preview .latex-inline {
                        background-color: #f8f9fa;
                        padding: 0.125em 0.25em;
                        border-radius: 0.125rem;
                        font-size: 0.9em;
                    }
                    
                    .dark .rich-text-editor-preview .latex-inline {
                        background-color: #374151;
                    }
                    
                    /* 移除分屏模式下的焦点边框 */
                    .rich-text-editor-main:focus {
                        outline: none !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    
                    .rich-text-editor-main[contenteditable]:focus {
                        outline: none !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    
                    /* 移除所有可能的焦点样式 */
                    .rich-text-editor-main:focus-visible {
                        outline: none !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                `}</style>
            </div>
        </TooltipProvider>
    );
};

export default SimpleRichTextEditor;