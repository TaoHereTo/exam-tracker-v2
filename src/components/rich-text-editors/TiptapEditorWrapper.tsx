'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Highlight from '@tiptap/extension-highlight';
import { Mathematics } from '@tiptap/extension-mathematics';
import 'katex/dist/katex.min.css';
import katex from 'katex';

// 数学公式样式
const mathStyles = `
.tiptap-mathematics-render {
    display: inline-block;
    margin: 0 2px;
    padding: 2px 4px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s ease;
}

.tiptap-mathematics-render:hover {
    background-color: rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 0, 0, 0.2);
}

.tiptap-mathematics-render--editable {
    background-color: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
}

.tiptap-mathematics-render[data-type="block-math"] {
    display: block;
    margin: 16px 0;
    padding: 12px;
    text-align: center;
    background-color: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
}

.tiptap-mathematics-render[data-type="inline-math"] {
    display: inline-block;
    margin: 0 2px;
    padding: 2px 6px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
}

/* KaTeX 样式优化 */
.katex {
    font-size: 1em;
}

.katex-display {
    margin: 1em 0;
}
`;

// 注入样式
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = mathStyles;
    document.head.appendChild(styleElement);
}
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { ColorTextPopoverComponent } from '@/components/tiptap-ui/color-text-popover';

import { cn } from '@/lib/utils';
import TiptapEditorCatalog from './TiptapEditorCatalog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from '@/components/animate-ui/components/animate/tooltip';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    Quote,
    Code2,
    Minus,
    Undo,
    Redo,
    Type,
    Palette,
    Highlighter,
    MoreHorizontal,
    Eraser,
    RotateCcw,
    Heading,
    Hash,
    ALargeSmall,
    SeparatorHorizontal,
    TypeOutline,
    Calculator,
    Sigma,
    AArrowUp
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-with-animation';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/animate-ui/components/radix/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/animate-ui/components/radix/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorSelector } from './ColorSelector';
import { MathDrawer } from './MathDrawer';
import { WordCountConfig } from './WordCountConfig';
import { Toolbar } from './Toolbar';

interface TiptapEditorWrapperProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    customMinHeight?: string;
    customMaxHeight?: string;
    showCatalog?: boolean;
}

export const TiptapEditorWrapper: React.FC<TiptapEditorWrapperProps> = ({
    content,
    onChange,
    placeholder = '开始输入...',
    className,
    customMinHeight = '300px',
    customMaxHeight = '800px',
    showCatalog = false
}) => {
    const [catalogVisible, setCatalogVisible] = useState<boolean>(true);
    const [showMathDrawer, setShowMathDrawer] = useState<boolean>(false);
    const [mathType, setMathType] = useState<'inline' | 'block'>('inline');
    const [mathLatex, setMathLatex] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [includePunctuation, setIncludePunctuation] = useState<boolean>(true);
    const [showWordCountOptions, setShowWordCountOptions] = useState<boolean>(false);
    const [editorContent, setEditorContent] = useState<string>('');


    // 防抖机制 - 官方推荐的方式
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const debouncedOnChange = useCallback((html: string) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            onChange(html);
        }, 300); // 300ms 防抖延迟
    }, [onChange]);

    // 创建编辑器实例 - 遵循官方最佳实践，修复SSR问题
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // 官方推荐：只禁用真正不需要的扩展
                link: false, // 使用自定义 Link 扩展
            }),
            Placeholder.configure({
                placeholder,
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 hover:text-blue-700 underline',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color.configure({
                types: ['textStyle'],
            }),
            FontFamily.configure({
                types: ['textStyle'],
            }),
            FontSize.configure({
                types: ['textStyle'],
            }),
            Underline,
            Strike,
            Highlight.configure({
                multicolor: true,
            }),
            Mathematics.configure({
                inlineOptions: {
                    onClick: (node, pos) => {
                        // 点击内联数学公式时编辑
                        setMathType('inline');
                        setMathLatex(node.attrs.latex);
                        setShowMathDrawer(true);
                    },
                },
                blockOptions: {
                    onClick: (node, pos) => {
                        // 点击块级数学公式时编辑
                        setMathType('block');
                        setMathLatex(node.attrs.latex);
                        setShowMathDrawer(true);
                    },
                },
                katexOptions: {
                    throwOnError: false, // 不抛出错误，显示错误信息
                    macros: {
                        '\\R': '\\mathbb{R}', // 实数集
                        '\\N': '\\mathbb{N}', // 自然数集
                        '\\Z': '\\mathbb{Z}', // 整数集
                        '\\Q': '\\mathbb{Q}', // 有理数集
                        '\\C': '\\mathbb{C}', // 复数集
                    },
                },
            }),
            BubbleMenuExtension.configure({
                pluginKey: 'bubbleMenu',
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const text = editor.getText();
            setEditorContent(text);
            debouncedOnChange(html);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
                'aria-label': '富文本编辑器',
                role: 'textbox',
                'aria-multiline': 'true',
            },
        },
        immediatelyRender: false, // 修复SSR问题
    });

    // 当 content prop 变化时更新编辑器 - 官方推荐的方式
    useEffect(() => {
        if (editor && editor.getHTML() !== content) {
            // 使用 setContent 的第二个参数来避免触发 onUpdate
            editor.commands.setContent(content, { emitUpdate: false });
            // 同时更新内容状态
            setEditorContent(editor.getText());
        }
    }, [content, editor]);

    // 清理防抖定时器 - 避免内存泄漏
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);


    // 安全执行编辑器命令的辅助函数
    const safeEditorCommand = useCallback((command: () => void) => {
        if (editor && editor.view) {
            try {
                command();
            } catch (error) {
                console.warn('Editor command failed:', error);
            }
        }
    }, [editor]);


    // 确保编辑器在组件挂载后获得焦点
    useEffect(() => {
        if (editor && editor.view) {
            // 延迟一帧确保 DOM 已渲染
            requestAnimationFrame(() => {
                safeEditorCommand(() => {
                    editor.commands.focus();
                });
            });
        }
    }, [editor, safeEditorCommand]);







    // 计算字数
    const wordCount = useMemo(() => {
        if (!editorContent) return 0;
        const chineseChars = editorContent.match(/[\u4e00-\u9fff]/g) || [];
        const englishWords = editorContent.replace(/[\u4e00-\u9fff]/g, '').replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(w => w.length > 0);
        return chineseChars.length + englishWords.length;
    }, [editorContent]);

    const charCount = useMemo(() => {
        if (!editorContent) return 0;
        if (includePunctuation) {
            return editorContent.length;
        } else {
            // 排除标点符号和空格
            return editorContent.replace(/[^\w\u4e00-\u9fff]/g, '').length;
        }
    }, [editorContent, includePunctuation]);

    // 工具栏按钮组件 - 使用更直接的事件处理，集成animate ui tooltip
    const ToolbarButton: React.FC<{
        onClick: () => void;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        title?: string;
        size?: 'sm' | 'default';
        preventHide?: boolean; // 新增：是否阻止BubbleMenu隐藏
    }> = ({ onClick, isActive, disabled, children, title, size = 'default', preventHide = false }) => {
        const handleMouseDown = useCallback((e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // 如果设置了preventHide，阻止事件冒泡
            if (preventHide) {
                e.stopPropagation();
            }

            // 使用 mousedown 而不是 click 来避免双击问题
            onClick();
        }, [onClick, preventHide]);

        const buttonElement = (
            <button
                type="button"
                onMouseDown={handleMouseDown}
                disabled={disabled}
                className={cn(
                    "h-8 w-8 p-0 transition-colors border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none bg-transparent rounded-sm flex items-center justify-center",
                    isActive && "bg-accent text-accent-foreground",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                style={{
                    border: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!disabled && !isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }
                }}
            >
                {children}
            </button>
        );

        // 如果有title，则包装tooltip
        if (title) {
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        {buttonElement}
                    </TooltipTrigger>
                    <TooltipContent>
                        {title}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return buttonElement;
    };


    // 字体大小选择器组件
    const FontSizeSelector: React.FC = () => {
        const fontSizes = [
            { name: '默认', value: '' },
            { name: '8px', value: '8px' },
            { name: '9px', value: '9px' },
            { name: '10px', value: '10px' },
            { name: '11px', value: '11px' },
            { name: '12px', value: '12px' },
            { name: '14px', value: '14px' },
            { name: '16px', value: '16px' },
            { name: '18px', value: '18px' },
            { name: '20px', value: '20px' },
            { name: '24px', value: '24px' },
            { name: '28px', value: '28px' },
        ];

        const currentFontSize = editor?.getAttributes('textStyle').fontSize || '';

        const triggerElement = (
            <DropdownMenuTrigger
                className="h-8 px-2 text-xs border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none bg-transparent rounded-sm flex items-center justify-center gap-1 transition-colors"
                style={{
                    border: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <AArrowUp className="h-4 w-4" />
            </DropdownMenuTrigger>
        );

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {triggerElement}
                    </TooltipTrigger>
                    <TooltipContent>
                        大小
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-32 z-[60]">
                    {fontSizes.map((size) => (
                        <DropdownMenuItem
                            key={size.value}
                            onClick={() => {
                                safeEditorCommand(() => {
                                    if (editor) {
                                        editor.commands.focus();
                                        if (size.value) {
                                            editor.commands.setFontSize(size.value);
                                        } else {
                                            editor.commands.unsetFontSize();
                                        }
                                    }
                                });
                            }}
                            className={cn(
                                "cursor-pointer",
                                currentFontSize === size.value && "bg-accent"
                            )}
                        >
                            <span>
                                {size.name}
                            </span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    // 文本对齐选择器组件
    const TextAlignSelector: React.FC = () => {
        const alignments = [
            { name: '左对齐', value: 'left', icon: AlignLeft },
            { name: '居中对齐', value: 'center', icon: AlignCenter },
            { name: '右对齐', value: 'right', icon: AlignRight },
            { name: '两端对齐', value: 'justify', icon: AlignJustify },
        ];

        const currentAlignment = alignments.find(align =>
            editor?.isActive({ textAlign: align.value })
        ) || alignments[0];

        const triggerElement = (
            <DropdownMenuTrigger
                className="h-8 px-2 text-xs border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none bg-transparent rounded-sm flex items-center justify-center gap-1 transition-colors"
                style={{
                    border: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <currentAlignment.icon className="h-4 w-4" />
            </DropdownMenuTrigger>
        );

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {triggerElement}
                    </TooltipTrigger>
                    <TooltipContent>
                        对齐方式
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-32 z-[60]">
                    {alignments.map((alignment) => {
                        const IconComponent = alignment.icon;
                        return (
                            <DropdownMenuItem
                                key={alignment.value}
                                onClick={() => {
                                    safeEditorCommand(() => {
                                        if (editor) {
                                            editor.commands.focus();
                                            editor.commands.setTextAlign(alignment.value as 'left' | 'center' | 'right' | 'justify');
                                        }
                                    });
                                }}
                                className={cn(
                                    "cursor-pointer flex items-center gap-2",
                                    editor?.isActive({ textAlign: alignment.value }) && "bg-accent"
                                )}
                            >
                                <IconComponent className="h-4 w-4" />
                                {alignment.name}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    // 列表选择器组件
    const ListSelector: React.FC = () => {
        const listTypes = [
            { name: '无序列表', value: 'bulletList', icon: List },
            { name: '有序列表', value: 'orderedList', icon: ListOrdered },
        ];

        const currentListType = listTypes.find(list =>
            editor?.isActive(list.value)
        );

        const triggerElement = (
            <DropdownMenuTrigger
                className="h-8 px-2 text-xs border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none bg-transparent rounded-sm flex items-center justify-center gap-1 transition-colors"
                style={{
                    border: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                {currentListType ? (
                    <currentListType.icon className="h-4 w-4" />
                ) : (
                    <List className="h-4 w-4" />
                )}
            </DropdownMenuTrigger>
        );

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {triggerElement}
                    </TooltipTrigger>
                    <TooltipContent>
                        列表类型
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-32 z-[60]">
                    {listTypes.map((listType) => {
                        const IconComponent = listType.icon;
                        return (
                            <DropdownMenuItem
                                key={listType.value}
                                onClick={() => {
                                    safeEditorCommand(() => {
                                        if (editor) {
                                            editor.commands.focus();
                                            if (listType.value === 'bulletList') {
                                                editor.commands.toggleBulletList();
                                            } else if (listType.value === 'orderedList') {
                                                editor.commands.toggleOrderedList();
                                            }
                                        }
                                    });
                                }}
                                className={cn(
                                    "cursor-pointer flex items-center gap-2",
                                    editor?.isActive(listType.value) && "bg-accent"
                                )}
                            >
                                <IconComponent className="h-4 w-4" />
                                {listType.name}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    // 数学公式选择器组件
    const MathSelector: React.FC = () => {
        const handleOpenMathDrawer = () => {
            setMathLatex('');
            setSelectedCategory('all');
            setShowMathDrawer(true);
        };

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <ToolbarButton
                        onClick={handleOpenMathDrawer}
                        title="数学公式"
                    >
                        <Calculator className="h-4 w-4" />
                    </ToolbarButton>
                </TooltipTrigger>
                <TooltipContent>
                    数学公式
                </TooltipContent>
            </Tooltip>
        );
    };

    // 标题选择器组件
    const HeadingSelector: React.FC = () => {
        const headings = [
            { name: '正文', value: 'paragraph' },
            { name: '标题 1', value: '1' },
            { name: '标题 2', value: '2' },
            { name: '标题 3', value: '3' },
            { name: '标题 4', value: '4' },
            { name: '标题 5', value: '5' },
            { name: '标题 6', value: '6' },
        ];

        const currentHeading = editor?.getAttributes('heading').level || 'paragraph';

        const triggerElement = (
            <DropdownMenuTrigger
                className="h-8 px-2 text-xs border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none bg-transparent rounded-sm flex items-center justify-center transition-colors"
                style={{
                    border: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <Heading className="h-4 w-4" />
            </DropdownMenuTrigger>
        );

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {triggerElement}
                    </TooltipTrigger>
                    <TooltipContent>
                        标题级别
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-32 z-[60]">
                    {headings.map((heading) => (
                        <DropdownMenuItem
                            key={heading.value}
                            onClick={() => {
                                safeEditorCommand(() => {
                                    if (editor) {
                                        editor.commands.focus();
                                        if (heading.value === 'paragraph') {
                                            editor.commands.setParagraph();
                                        } else {
                                            editor.commands.toggleHeading({ level: parseInt(heading.value) as 1 | 2 | 3 | 4 | 5 | 6 });
                                        }
                                    }
                                });
                            }}
                            className={cn(
                                "cursor-pointer",
                                currentHeading.toString() === heading.value && "bg-accent"
                            )}
                        >
                            {heading.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    return (
        <TooltipProvider>
            <div className={cn("tiptap-editor-with-catalog flex gap-4 flex-row-reverse", className)}>
                {/* 目录 - 显示在左侧，可收起 */}
                {showCatalog && (
                    <TiptapEditorCatalog
                        editor={editor}
                        className={cn(
                            "sticky top-4 order-first transition-all duration-300",
                            catalogVisible ? "w-64 min-w-[256px]" : "w-10 min-w-[40px]"
                        )}
                        isVisible={catalogVisible}
                        onToggle={() => setCatalogVisible(!catalogVisible)}
                    />
                )}

                <div
                    className={cn(
                        "tiptap-editor-wrapper border border-border rounded-lg bg-background",
                        showCatalog ? "flex-1" : "w-full"
                    )}
                >
                    <Toolbar
                        editor={editor}
                        onOpenMathDrawer={() => {
                            setMathLatex('');
                            setSelectedCategory('all');
                            setShowMathDrawer(true);
                        }}
                    />

                    <div
                        className="tiptap-editor-content p-4 overflow-y-auto relative"
                        style={{
                            minHeight: customMinHeight,
                            maxHeight: customMaxHeight,
                            position: 'relative', // 确保BubbleMenu可以正确定位
                        }}
                    >
                        <EditorContent editor={editor} />
                    </div>

                    {/* React版本的BubbleMenu */}
                    {editor && (
                        <BubbleMenu
                            editor={editor}
                            pluginKey="bubbleMenu"
                            shouldShow={({ state, from, to }) => {
                                const text = state.doc.textBetween(from, to, ' ');
                                const shouldShow = from !== to && text.trim().length > 0;
                                console.log('BubbleMenu shouldShow:', shouldShow, 'text:', text);
                                return shouldShow;
                            }}
                            options={{ placement: 'top' }}
                            updateDelay={250}
                            className="bubble-menu flex items-center gap-1 p-2 bg-background border border-border rounded-lg shadow-lg"
                        >
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    editor.chain().focus().toggleBold().run();
                                }}
                                className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:bg-accent rounded-sm flex items-center justify-center transition-colors ${editor.isActive('bold') ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-accent'}`}
                                title="加粗"
                            >
                                <Bold className="h-4 w-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    editor.chain().focus().toggleItalic().run();
                                }}
                                className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:bg-accent rounded-sm flex items-center justify-center transition-colors ${editor.isActive('italic') ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-accent'}`}
                                title="斜体"
                            >
                                <Italic className="h-4 w-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    editor.chain().focus().toggleUnderline().run();
                                }}
                                className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:bg-accent rounded-sm flex items-center justify-center transition-colors ${editor.isActive('underline') ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-accent'}`}
                                title="下划线"
                            >
                                <UnderlineIcon className="h-4 w-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    editor.chain().focus().toggleStrike().run();
                                }}
                                className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:bg-accent rounded-sm flex items-center justify-center transition-colors ${editor.isActive('strike') ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-accent'}`}
                                title="删除线"
                            >
                                <Strikethrough className="h-4 w-4" />
                            </button>
                            <ColorTextPopoverComponent
                                editor={editor}
                                hideWhenUnavailable={false}
                            />
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    editor.chain().focus().clearNodes().unsetAllMarks().run();
                                }}
                                className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:bg-accent rounded-sm flex items-center justify-center transition-colors bg-transparent hover:bg-accent"
                                title="清除格式"
                            >
                                <Eraser className="h-4 w-4" />
                            </button>
                        </BubbleMenu>
                    )}

                    {/* 数学公式抽屉 */}
                    <MathDrawer
                        editor={editor}
                        showMathDrawer={showMathDrawer}
                        setShowMathDrawer={setShowMathDrawer}
                        mathType={mathType}
                        setMathType={setMathType}
                        mathLatex={mathLatex}
                        setMathLatex={setMathLatex}
                    />

                    {/* 字数统计 */}
                    <div className="flex items-center justify-end px-4 py-2 text-sm text-muted-foreground border-t border-border bg-muted/50">
                        <WordCountConfig
                            wordCount={wordCount}
                            charCount={charCount}
                            includePunctuation={includePunctuation}
                            setIncludePunctuation={setIncludePunctuation}
                            showWordCountOptions={showWordCountOptions}
                            setShowWordCountOptions={setShowWordCountOptions}
                        />
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default TiptapEditorWrapper;
