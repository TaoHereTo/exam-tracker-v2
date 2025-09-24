'use client';

import React, { useRef, useEffect, useState } from 'react';
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
    Image as ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Palette,
    Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';

interface SimpleRichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
}

const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
    content,
    onChange,
    placeholder = '开始输入...',
    className
}) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            if (content === '') {
                editorRef.current.innerHTML = '';
            } else {
                editorRef.current.innerHTML = content;
            }
        }

    }, [content]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const html = e.currentTarget.innerHTML;

        // 清理空的div和br标签
        const cleanedHtml = cleanEmptyContent(html);

        // 如果清理后的内容与当前内容不同，更新DOM
        if (cleanedHtml !== html) {
            e.currentTarget.innerHTML = cleanedHtml;
        }

        onChange(cleanedHtml);
    };

    // 清理空内容的函数
    const cleanEmptyContent = (html: string): string => {
        // 如果内容为空或者只包含空白字符，返回空字符串
        if (!html || html.trim() === '') {
            return '';
        }

        // 移除空的div标签和br标签
        const cleaned = html
            .replace(/<div><br><\/div>/gi, '') // 移除 <div><br></div>
            .replace(/<div><\/div>/gi, '') // 移除 <div></div>
            .replace(/<br>/gi, '') // 移除单独的 <br>
            .replace(/<p><br><\/p>/gi, '') // 移除 <p><br></p>
            .replace(/<p><\/p>/gi, '') // 移除 <p></p>
            .trim();

        // 如果清理后内容为空，返回空字符串
        if (!cleaned || cleaned === '') {
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

    // 处理格式化命令，专门解决标签内光标问题
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

        // 检查光标是否在格式化标签内
        let currentNode: Node | null = range.startContainer;
        let isInsideFormatTag = false;

        while (currentNode && currentNode !== editorRef.current) {
            if (currentNode.nodeType === Node.ELEMENT_NODE) {
                const element = currentNode as Element;
                if (['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE'].includes(element.tagName)) {
                    isInsideFormatTag = true;
                    break;
                }
            }
            currentNode = currentNode.parentNode;
        }

        if (isInsideFormatTag) {
            // 如果在格式化标签内，先退出标签
            const newRange = document.createRange();

            // 在编辑器末尾创建一个新的文本节点
            const textNode = document.createTextNode('');
            editorRef.current.appendChild(textNode);

            // 将光标移到新文本节点
            newRange.setStart(textNode, 0);
            newRange.setEnd(textNode, 0);
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        }

        // 执行命令
        execCommand(command, value);
    };

    const insertLink = () => {
        const url = window.prompt('请输入链接地址:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const insertImage = () => {
        const url = window.prompt('请输入图片地址:');
        if (url) {
            execCommand('insertImage', url);
        }
    };

    const setTextColor = (color: string) => {
        console.log('setTextColor 被调用，颜色:', color);

        if (!editorRef.current) {
            console.log('editorRef.current 为空');
            return;
        }

        editorRef.current.focus();

        // 获取当前选择
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            console.log('没有选择，无法设置颜色');
            return;
        }

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (!selectedText) {
            console.log('没有选中文字，无法设置颜色');
            return;
        }

        console.log('选中的文字:', selectedText);

        // 简单直接的方法：删除选中内容，插入带颜色的span
        range.deleteContents();

        const span = document.createElement('span');
        span.style.color = color;
        span.textContent = selectedText;

        range.insertNode(span);

        // 清除选择
        selection.removeAllRanges();

        console.log('颜色设置成功');

        // 更新内容
        const html = editorRef.current.innerHTML;
        onChange(html);
    };

    const setBackgroundColor = (color: string) => {
        console.log('setBackgroundColor 被调用，颜色:', color);

        if (!editorRef.current) {
            console.log('editorRef.current 为空');
            return;
        }

        editorRef.current.focus();

        // 获取当前选择
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            console.log('没有选择，无法设置背景颜色');
            return;
        }

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (!selectedText) {
            console.log('没有选中文字，无法设置背景颜色');
            return;
        }

        console.log('选中的文字:', selectedText);

        // 简单直接的方法：删除选中内容，插入带背景颜色的span
        range.deleteContents();

        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.textContent = selectedText;

        range.insertNode(span);

        // 清除选择
        selection.removeAllRanges();

        console.log('背景颜色设置成功');

        // 更新内容
        const html = editorRef.current.innerHTML;
        onChange(html);
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
            {/* 调试信息 */}
            <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'yellow', padding: '10px', zIndex: 10000 }}>
            </div>
            <div className={cn('rich-text-editor border rounded-lg', className)}>
                <div className="border-b bg-gray-50 dark:bg-gray-800 p-2 flex flex-wrap gap-1">
                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFormatCommand('bold')}
                                >
                                    <Bold className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>加粗</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFormatCommand('italic')}
                                >
                                    <Italic className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>斜体</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFormatCommand('underline')}
                                >
                                    <Underline className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>下划线</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFormatCommand('strikeThrough')}
                                >
                                    <Strikethrough className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>删除线</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <select
                                    className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700"
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === 'paragraph') {
                                            execCommand('formatBlock', 'div');
                                        } else {
                                            execCommand('formatBlock', value);
                                        }
                                    }}
                                >
                                    <option value="paragraph">段落</option>
                                    <option value="h1">标题 1</option>
                                    <option value="h2">标题 2</option>
                                    <option value="h3">标题 3</option>
                                    <option value="h4">标题 4</option>
                                    <option value="h5">标题 5</option>
                                    <option value="h6">标题 6</option>
                                </select>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>选择标题级别</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => execCommand('insertUnorderedList')}
                                >
                                    <List className="w-4 h-4" />
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
                                    onClick={() => execCommand('insertOrderedList')}
                                >
                                    <ListOrdered className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>有序列表</p>
                            </TooltipContent>
                        </Tooltip>

                    </div>

                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => execCommand('justifyLeft')}
                                >
                                    <AlignLeft className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>左对齐</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => execCommand('justifyCenter')}
                                >
                                    <AlignCenter className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>居中</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => execCommand('justifyRight')}
                                >
                                    <AlignRight className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>右对齐</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => execCommand('justifyFull')}
                                >
                                    <AlignJustify className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>两端对齐</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <Popover>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <Type className="w-4 h-4" />
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

                    <Popover>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <Palette className="w-4 h-4" />
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

                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={insertLink}>
                                    <LinkIcon className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>插入链接</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* 测试按钮 */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                console.log('测试按钮被点击');
                                setTextColor('#FF0000');
                            }}
                        >
                            测试红色
                        </Button>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={insertImage}>
                                    <ImageIcon className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>插入图片</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => execCommand('undo')}
                                >
                                    <Undo className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>撤销</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => execCommand('redo')}
                                >
                                    <Redo className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>重做</p>
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
                    onKeyDown={(e) => {
                        // 处理删除键，确保删除后内容真正为空
                        if (e.key === 'Backspace' || e.key === 'Delete') {
                            setTimeout(() => {
                                if (editorRef.current) {
                                    const html = editorRef.current.innerHTML;
                                    const cleanedHtml = cleanEmptyContent(html);

                                    if (cleanedHtml !== html) {
                                        editorRef.current.innerHTML = cleanedHtml;
                                        onChange(cleanedHtml);
                                    }
                                }
                            }, 0);
                        }
                    }}
                    className="min-h-[200px] bg-white dark:bg-gray-900 focus:outline-none prose prose-sm max-w-none cursor-text relative"
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
          
          /* 强制显示光标的关键样式 */
          .rich-text-editor [contenteditable]:focus {
            caret-color: #000 !important;
          }
          
          .rich-text-editor [contenteditable]:focus * {
            caret-color: #000 !important;
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
        </TooltipProvider>
    );
};

export default SimpleRichTextEditor;
