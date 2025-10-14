'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useEditor, EditorContent, EditorContext, type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import { Mathematics, migrateMathStrings } from '@tiptap/extension-mathematics';
import { TaskList } from '@tiptap/extension-list';
import { TaskItem } from '@tiptap/extension-task-item';
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
    position: relative;
}

.tiptap-mathematics-render:hover {
    background-color: rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 0, 0, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tiptap-mathematics-render--editable {
    background-color: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.tiptap-mathematics-render[data-type="block-math"] {
    display: block;
    margin: 16px 0;
    padding: 16px;
    text-align: center;
    background-color: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    position: relative;
}

.tiptap-mathematics-render[data-type="block-math"]:hover {
    background-color: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.tiptap-mathematics-render[data-type="inline-math"] {
    display: inline-block;
    margin: 0 2px;
    padding: 2px 6px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    vertical-align: baseline;
}

.tiptap-mathematics-render[data-type="inline-math"]:hover {
    background-color: rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 0, 0, 0.2);
}

/* 暗色主题下的数学公式样式 */
.dark .tiptap-mathematics-render {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
}

.dark .tiptap-mathematics-render:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
}

.dark .tiptap-mathematics-render--editable {
    background-color: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
}

.dark .tiptap-mathematics-render[data-type="block-math"] {
    background-color: rgba(255, 255, 255, 0.02);
    border-color: rgba(255, 255, 255, 0.1);
}

.dark .tiptap-mathematics-render[data-type="block-math"]:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
}

/* KaTeX 样式优化 */
.katex {
    font-size: 1em;
    line-height: 1.2;
}

.katex-display {
    margin: 1em 0;
    text-align: center;
}

/* 确保数学符号正确显示 */
.katex {
    font-family: KaTeX_Main, KaTeX_Math, "Times New Roman", serif !important;
}

/* 确保不等于符号正确显示 */
.katex .mrel {
    font-family: KaTeX_Main, KaTeX_Math, "Times New Roman", serif !important;
}

.katex .mord {
    font-family: KaTeX_Main, KaTeX_Math, "Times New Roman", serif !important;
}

/* 简化不等于符号的显示 - 让 KaTeX 使用默认渲染 */
.katex .mrel {
    font-family: KaTeX_Main, KaTeX_Math, "Times New Roman", serif !important;
}

/* 数学公式错误样式 */
.tiptap-mathematics-render .katex-error {
    color: #dc2626;
    background-color: rgba(220, 38, 38, 0.1);
    border: 1px dashed #dc2626;
    padding: 2px 4px;
    border-radius: 2px;
    font-family: monospace;
    font-size: 0.9em;
}

.dark .tiptap-mathematics-render .katex-error {
    color: #fca5a5;
    background-color: rgba(220, 38, 38, 0.2);
    border-color: #fca5a5;
}

/* 分割线样式 */
.my-horizontal-rule {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 1.5em 0;
    width: 100%;
}

.dark .my-horizontal-rule {
    border-top-color: #374151;
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
import { TableOfContents } from './TableOfContents';
import { TableOfContents as TableOfContentsExtension, getLinearIndexes, getHierarchicalIndexes } from '@tiptap/extension-table-of-contents';

// 定义Anchor类型
interface Anchor {
    dom: HTMLElement;
    editor: Editor;
    id: string;
    isActive: boolean;
    isScrolledOver: boolean;
    itemIndex: number;
    level: number;
    node: unknown;
    originalLevel: number;
    pos: number;
    textContent: string;
}
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '@/components/tiptap-ui-primitive/tooltip';
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
    const [selectedText, setSelectedText] = useState<string>('');

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

    // 按照官方React最佳实践，在组件内部管理锚点状态
    const [anchors, setAnchors] = useState<Anchor[]>([]);

    // 创建编辑器实例 - 遵循官方最佳实践，修复SSR问题
    const editor: Editor | null = useEditor({
        extensions: [
            StarterKit.configure({
                // 官方推荐：只禁用真正不需要的扩展
                link: false, // 使用自定义 Link 扩展
                heading: {
                    levels: [1, 2, 3, 4, 5, 6], // 确保所有标题级别都启用
                },
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
            Highlight.configure({
                multicolor: true,
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
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
                    throwOnError: false, // 不抛出错误，显示渲染结果
                    strict: false, // 允许更宽松的解析
                    trust: true, // 信任输入内容
                    macros: {
                        '\\R': '\\mathbb{R}', // 实数集
                        '\\N': '\\mathbb{N}', // 自然数集
                        '\\Z': '\\mathbb{Z}', // 整数集
                        '\\Q': '\\mathbb{Q}', // 有理数集
                        '\\C': '\\mathbb{C}', // 复数集
                        '\\P': '\\mathbb{P}', // 素数集
                        '\\E': '\\mathbb{E}', // 期望值
                        '\\Var': '\\text{Var}', // 方差
                        '\\Cov': '\\text{Cov}', // 协方差
                    },
                },
            }),
            // 按照官方React最佳实践，在 useEditor 内部配置 TableOfContents
            TableOfContentsExtension.configure({
                anchorTypes: ['heading'],
                getIndex: getHierarchicalIndexes,
                getId: (content) => {
                    // 生成基于内容的ID，用于锚点定位
                    const slug = content
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/[\s_-]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                    const id = slug || `heading-${Date.now()}`;
                    console.log('Generated ID for content:', content, '-> ID:', id);
                    return id;
                },
                scrollParent: () => {
                    // 使用编辑器内容容器作为滚动父元素，确保只影响编辑区
                    if (typeof document !== 'undefined') {
                        const container = document.querySelector('.tiptap-editor-content');
                        if (container instanceof HTMLElement) return container;
                    }
                    return window;
                },
                onUpdate: (anchors) => {
                    // 按照官方React示例：setAnchors(anchors)
                    setAnchors(anchors);
                },
            }),
            BubbleMenuExtension.configure({
                pluginKey: 'bubbleMenu',
                shouldShow: ({ editor, view, state, oldState, from, to }) => {
                    const text = state.doc.textBetween(from, to, ' ');
                    return from !== to && text.trim().length > 0;
                },
            }),
        ],
        content,
        onCreate: ({ editor: currentEditor }) => {
            // 迁移现有的数学字符串到数学节点
            try {
                migrateMathStrings(currentEditor);
            } catch (error) {
                console.warn('Math migration failed:', error);
            }

            // 移除调试信息，避免控制台刷屏
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const text = editor.getText();
            setEditorContent(text);
            debouncedOnChange(html);
        },
        onSelectionUpdate: ({ editor }) => {
            const { from, to } = editor.state.selection;
            if (from !== to) {
                const selectedText = editor.state.doc.textBetween(from, to, ' ');
                setSelectedText(selectedText);
            } else {
                setSelectedText('');
            }
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

    // 数学公式命令辅助函数
    const insertInlineMath = useCallback((latex: string) => {
        safeEditorCommand(() => {
            if (editor) {
                editor.commands.insertInlineMath({ latex });
            }
        });
    }, [editor, safeEditorCommand]);

    const insertBlockMath = useCallback((latex: string) => {
        safeEditorCommand(() => {
            if (editor) {
                editor.commands.insertBlockMath({ latex });
            }
        });
    }, [editor, safeEditorCommand]);

    const updateMathAtPosition = useCallback((latex: string, type: 'inline' | 'block') => {
        safeEditorCommand(() => {
            if (editor) {
                if (type === 'inline') {
                    editor.commands.updateInlineMath({ latex });
                } else {
                    editor.commands.updateBlockMath({ latex });
                }
            }
        });
    }, [editor, safeEditorCommand]);

    const deleteMathAtPosition = useCallback((type: 'inline' | 'block') => {
        safeEditorCommand(() => {
            if (editor) {
                if (type === 'inline') {
                    editor.commands.deleteInlineMath();
                } else {
                    editor.commands.deleteBlockMath();
                }
            }
        });
    }, [editor, safeEditorCommand]);


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

    // 计算选中文字的字数
    const selectedWordCount = useMemo(() => {
        if (!selectedText) return 0;
        const chineseChars = selectedText.match(/[\u4e00-\u9fff]/g) || [];
        const englishWords = selectedText.replace(/[\u4e00-\u9fff]/g, '').replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(w => w.length > 0);
        return chineseChars.length + englishWords.length;
    }, [selectedText]);

    // 计算选中文字的字符数
    const selectedCharCount = useMemo(() => {
        if (!selectedText) return 0;
        if (includePunctuation) {
            return selectedText.length;
        } else {
            // 排除标点符号和空格
            return selectedText.replace(/[^\w\u4e00-\u9fff]/g, '').length;
        }
    }, [selectedText, includePunctuation]);

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
                        <Sigma className="h-4 w-4" />
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
        <EditorContext.Provider value={{ editor }}>
            <div className={cn("tiptap-editor-with-catalog", className)}>
                {/* 胶囊型工具栏 - 粘性固定在顶部 */}
                <div className="sticky top-4 flex justify-center mb-4" style={{ zIndex: 'var(--z-sticky)' }}>
                    <div className="inline-flex items-center gap-1 p-2 bg-white dark:bg-background border border-border rounded-full shadow-sm backdrop-blur-sm">
                        <Toolbar
                            editor={editor}
                            onOpenMathDrawer={() => {
                                setMathLatex('');
                                setSelectedCategory('all');
                                setShowMathDrawer(true);
                            }}
                            onToggleTableOfContents={() => setCatalogVisible(!catalogVisible)}
                            isTableOfContentsVisible={catalogVisible}
                        />
                    </div>
                </div>

                {/* 编辑器内容区域 - 内部左右分栏 */}
                <div
                    className="tiptap-editor-wrapper border border-border rounded-lg bg-background shadow-sm overflow-hidden"
                    style={{
                        height: customMaxHeight === 'none' ? '70vh' : customMaxHeight,
                        minHeight: customMinHeight,
                    }}
                >
                    <div className="flex h-full">
                        {/* 左侧目录区域 - 添加动效 */}
                        {showCatalog && (
                            <div className={cn(
                                "border-r border-border bg-white dark:bg-muted/20 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
                                catalogVisible ? "w-64 opacity-100" : "w-0 opacity-0"
                            )}>
                                {catalogVisible && (
                                    <TableOfContents
                                        editor={editor}
                                        anchors={anchors}
                                        className="flex-1"
                                        isVisible={catalogVisible}
                                        onToggle={() => setCatalogVisible(!catalogVisible)}
                                    />
                                )}
                            </div>
                        )}

                        {/* 右侧编辑器内容区域 */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div
                                className="tiptap tiptap-editor-content p-4 overflow-y-auto relative flex-1 min-h-0"
                                style={{
                                    position: 'relative', // 确保BubbleMenu可以正确定位
                                    scrollBehavior: 'smooth', // 添加平滑滚动
                                    overscrollBehavior: 'contain', // 阻止滚动链传递到页面
                                    WebkitOverflowScrolling: 'touch'
                                }}
                            >
                                <EditorContent editor={editor} />
                            </div>

                            {/* 字数统计 - 合并到文本输入区域内 */}
                            <div className="flex items-center justify-end px-4 py-2 text-sm text-muted-foreground border-t border-border bg-muted/30 flex-shrink-0">
                                <WordCountConfig
                                    wordCount={wordCount}
                                    charCount={charCount}
                                    selectedWordCount={selectedWordCount}
                                    selectedCharCount={selectedCharCount}
                                    includePunctuation={includePunctuation}
                                    setIncludePunctuation={setIncludePunctuation}
                                    showWordCountOptions={showWordCountOptions}
                                    setShowWordCountOptions={setShowWordCountOptions}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* React版本的BubbleMenu */}
                {editor && (
                    <BubbleMenu
                        editor={editor}
                        pluginKey="bubbleMenu"
                        className="bubble-menu flex items-center gap-1 p-2 bg-white dark:bg-background border border-border rounded-lg shadow-lg transition-opacity duration-200"
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        editor.chain().focus().toggleBold().run();
                                    }}
                                    className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none rounded-lg flex items-center justify-center transition-colors cursor-pointer ${editor.isActive('bold') ? 'bg-[#F3F3F4] dark:bg-accent' : 'bg-transparent hover:bg-[#F3F3F4] dark:hover:bg-accent active:bg-[#F3F3F4] dark:active:bg-accent'}`}
                                >
                                    <Bold className={`h-4 w-4 ${editor.isActive('bold') ? 'toolbar-button-icon active' : 'toolbar-button-icon'}`} strokeWidth={2.5} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>加粗</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        editor.chain().focus().toggleItalic().run();
                                    }}
                                    className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none rounded-lg flex items-center justify-center transition-colors cursor-pointer ${editor.isActive('italic') ? 'bg-[#F3F3F4] dark:bg-accent' : 'bg-transparent hover:bg-[#F3F3F4] dark:hover:bg-accent active:bg-[#F3F3F4] dark:active:bg-accent'}`}
                                >
                                    <Italic className={`h-4 w-4 ${editor.isActive('italic') ? 'toolbar-button-icon active' : 'toolbar-button-icon'}`} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>斜体</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        editor.chain().focus().toggleUnderline().run();
                                    }}
                                    className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none rounded-lg flex items-center justify-center transition-colors cursor-pointer ${editor.isActive('underline') ? 'bg-[#F3F3F4] dark:bg-accent' : 'bg-transparent hover:bg-[#F3F3F4] dark:hover:bg-accent active:bg-[#F3F3F4] dark:active:bg-accent'}`}
                                >
                                    <UnderlineIcon className={`h-4 w-4 ${editor.isActive('underline') ? 'toolbar-button-icon active' : 'toolbar-button-icon'}`} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>下划线</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        editor.chain().focus().toggleStrike().run();
                                    }}
                                    className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none rounded-lg flex items-center justify-center transition-colors cursor-pointer ${editor.isActive('strike') ? 'bg-[#F3F3F4] dark:bg-accent' : 'bg-transparent hover:bg-[#F3F3F4] dark:hover:bg-accent active:bg-[#F3F3F4] dark:active:bg-accent'}`}
                                >
                                    <Strikethrough className={`h-4 w-4 ${editor.isActive('strike') ? 'toolbar-button-icon active' : 'toolbar-button-icon'}`} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>删除线</p>
                            </TooltipContent>
                        </Tooltip>
                        <ColorTextPopoverComponent
                            editor={editor}
                            hideWhenUnavailable={false}
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        editor.chain().focus().clearNodes().unsetAllMarks().run();
                                    }}
                                    className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none rounded-lg flex items-center justify-center transition-colors cursor-pointer bg-transparent hover:bg-[#F3F3F4] dark:hover:bg-accent active:bg-[#F3F3F4] dark:active:bg-accent"
                                >
                                    <Eraser className="h-4 w-4 toolbar-button-icon" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>清除格式</p>
                            </TooltipContent>
                        </Tooltip>
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
                    insertInlineMath={insertInlineMath}
                    insertBlockMath={insertBlockMath}
                    updateMathAtPosition={updateMathAtPosition}
                    deleteMathAtPosition={deleteMathAtPosition}
                />

            </div>
        </EditorContext.Provider>
    );
};

export default TiptapEditorWrapper;
