'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
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
// import { BubbleMenu } from '@tiptap/extension-bubble-menu'; // 在Tiptap v3中需要不同的使用方式
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
    const [showBubbleMenu, setShowBubbleMenu] = useState<boolean>(true);
    const [editorContent, setEditorContent] = useState<string>('');
    const [showColorPalette, setShowColorPalette] = useState<boolean>(false);
    const [showHighlightPalette, setShowHighlightPalette] = useState<boolean>(false);

    // 常用颜色
    const commonColors = [
        { name: '红色', value: '#FF0000' },
        { name: '绿色', value: '#00FF00' },
        { name: '蓝色', value: '#0000FF' },
        { name: '黄色', value: '#FFFF00' },
        { name: '橙色', value: '#FFA500' },
        { name: '紫色', value: '#800080' },
        { name: '粉色', value: '#FFC0CB' },
        { name: '青色', value: '#00FFFF' },
        { name: '棕色', value: '#A52A2A' },
    ];

    const commonHighlightColors = [
        { name: '黄色高亮', value: '#FFFF00' },
        { name: '绿色高亮', value: '#90EE90' },
        { name: '蓝色高亮', value: '#87CEEB' },
        { name: '粉色高亮', value: '#FFB6C1' },
        { name: '橙色高亮', value: '#FFE4B5' },
        { name: '紫色高亮', value: '#DDA0DD' },
        { name: '青色高亮', value: '#E0FFFF' },
        { name: '红色高亮', value: '#FFA07A' },
    ];

    // 数学公式分类
    const mathCategories = [
        { id: 'all', name: '全部', icon: '📚' },
        { id: 'basic', name: '基础数学', icon: '🔢' },
        { id: 'symbols', name: '符号', icon: '🔣' },
        { id: 'greek', name: '希腊字母', icon: 'Α' },
        { id: 'sets', name: '集合', icon: '📊' },
        { id: 'calculus', name: '微积分', icon: '∫' },
    ];

    // 常用数学公式模板（按分类组织）
    const mathTemplates = [
        // 基础数学
        { name: '分数', latex: '\\frac{a}{b}', description: '分数 a/b', category: 'basic' },
        { name: '根号', latex: '\\sqrt{x}', description: '平方根', category: 'basic' },
        { name: 'n次根号', latex: '\\sqrt[n]{x}', description: 'n次方根', category: 'basic' },
        { name: '上标', latex: 'x^2', description: 'x的平方', category: 'basic' },
        { name: '下标', latex: 'x_1', description: 'x下标1', category: 'basic' },
        { name: '上下标', latex: 'x_1^2', description: 'x下标1上标2', category: 'basic' },

        // 符号
        { name: '不等于', latex: '\\neq', description: '不等于', category: 'symbols' },
        { name: '小于等于', latex: '\\leq', description: '小于等于', category: 'symbols' },
        { name: '大于等于', latex: '\\geq', description: '大于等于', category: 'symbols' },
        { name: '约等于', latex: '\\approx', description: '约等于', category: 'symbols' },
        { name: '正负号', latex: '\\pm', description: '正负号', category: 'symbols' },
        { name: '无穷大', latex: '\\infty', description: '无穷大符号', category: 'symbols' },

        // 希腊字母
        { name: '阿尔法', latex: '\\alpha', description: '希腊字母α', category: 'greek' },
        { name: '贝塔', latex: '\\beta', description: '希腊字母β', category: 'greek' },
        { name: '伽马', latex: '\\gamma', description: '希腊字母γ', category: 'greek' },
        { name: '德尔塔', latex: '\\delta', description: '希腊字母δ', category: 'greek' },
        { name: '西塔', latex: '\\theta', description: '希腊字母θ', category: 'greek' },
        { name: '拉姆达', latex: '\\lambda', description: '希腊字母λ', category: 'greek' },
        { name: '派', latex: '\\pi', description: '希腊字母π', category: 'greek' },
        { name: '西格玛', latex: '\\sigma', description: '希腊字母σ', category: 'greek' },

        // 集合
        { name: '实数集', latex: '\\R', description: '实数集合', category: 'sets' },
        { name: '自然数集', latex: '\\N', description: '自然数集合', category: 'sets' },
        { name: '整数集', latex: '\\Z', description: '整数集合', category: 'sets' },
        { name: '有理数集', latex: '\\Q', description: '有理数集合', category: 'sets' },
        { name: '复数集', latex: '\\C', description: '复数集合', category: 'sets' },
        { name: '属于', latex: '\\in', description: '属于符号', category: 'sets' },
        { name: '不属于', latex: '\\notin', description: '不属于符号', category: 'sets' },
        { name: '子集', latex: '\\subset', description: '子集符号', category: 'sets' },

        // 微积分
        { name: '积分', latex: '\\int_{a}^{b} f(x) dx', description: '定积分', category: 'calculus' },
        { name: '不定积分', latex: '\\int f(x) dx', description: '不定积分', category: 'calculus' },
        { name: '求和', latex: '\\sum_{i=1}^{n} x_i', description: '求和符号', category: 'calculus' },
        { name: '极限', latex: '\\lim_{x \\to \\infty} f(x)', description: '极限', category: 'calculus' },
        { name: '导数', latex: '\\frac{d}{dx}f(x)', description: '导数', category: 'calculus' },
        { name: '偏导数', latex: '\\frac{\\partial}{\\partial x}f(x,y)', description: '偏导数', category: 'calculus' },
    ];

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

    // 点击外部关闭颜色面板
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.color-selector-container')) {
                setShowColorPalette(false);
                setShowHighlightPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
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

    // 字体选择器组件
    const FontFamilySelector: React.FC = () => {
        const fonts = [
            { name: '默认', value: '' },
            { name: 'Arial', value: 'Arial, sans-serif' },
            { name: 'Helvetica', value: 'Helvetica, sans-serif' },
            { name: 'Times New Roman', value: 'Times New Roman, serif' },
            { name: 'Georgia', value: 'Georgia, serif' },
            { name: 'Verdana', value: 'Verdana, sans-serif' },
            { name: 'Courier New', value: 'Courier New, monospace' },
            { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
            { name: 'Impact', value: 'Impact, sans-serif' },
            { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
            { name: '微软雅黑', value: 'Microsoft YaHei, sans-serif' },
            { name: '宋体', value: 'SimSun, serif' },
            { name: '黑体', value: 'SimHei, sans-serif' },
            { name: '楷体', value: 'KaiTi, serif' },
            { name: '仿宋', value: 'FangSong, serif' },
            { name: '华文细黑', value: 'STXihei, sans-serif' },
            { name: '华文楷体', value: 'STKaiti, serif' },
        ];

        const currentFont = editor?.getAttributes('textStyle').fontFamily || '';

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
                <Type className="h-4 w-4" />
            </DropdownMenuTrigger>
        );

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {triggerElement}
                    </TooltipTrigger>
                    <TooltipContent>
                        字体
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-48 z-[60]">
                    {fonts.map((font) => (
                        <DropdownMenuItem
                            key={font.value}
                            onClick={() => {
                                safeEditorCommand(() => {
                                    if (editor) {
                                        if (font.value) {
                                            editor.commands.focus();
                                            editor.commands.setFontFamily(font.value);
                                        } else {
                                            editor.commands.focus();
                                            editor.commands.unsetFontFamily();
                                        }
                                    }
                                });
                            }}
                            className={cn(
                                "cursor-pointer",
                                currentFont === font.value && "bg-accent"
                            )}
                        >
                            <span style={{ fontFamily: font.value || 'inherit' }}>
                                {font.name}
                            </span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
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

    // 自定义BubbleMenu组件 - 适配Tiptap v3
    const CustomBubbleMenu: React.FC<{ editor: Editor | null }> = ({ editor }) => {
        const [isVisible, setIsVisible] = useState(false);
        const [position, setPosition] = useState({ x: 0, y: 0 });
        const menuRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (!editor) return;

            const updateBubbleMenu = () => {
                const { state } = editor;
                const { selection } = state;
                const { $from, $to } = selection;

                // 检查是否有文本选择
                if (selection.empty || $from.pos === $to.pos) {
                    setIsVisible(false);
                    return;
                }

                // 获取选择范围的位置
                const start = editor.view.coordsAtPos($from.pos);
                const end = editor.view.coordsAtPos($to.pos);

                // 计算菜单位置 - 显示在选中文字下方
                const left = Math.min(start.left, end.left);
                const top = Math.max(start.bottom, end.bottom) + 10;

                // 获取编辑器容器的位置，确保菜单相对于编辑器定位
                const editorElement = editor.view.dom.closest('.tiptap-editor-content');
                if (editorElement) {
                    const editorRect = editorElement.getBoundingClientRect();
                    const relativeLeft = left - editorRect.left;
                    const relativeTop = top - editorRect.top;

                    // 确保菜单不会超出编辑器右边界
                    const menuWidth = 300;
                    const adjustedLeft = Math.min(relativeLeft, editorRect.width - menuWidth);

                    setPosition({ x: Math.max(0, adjustedLeft), y: relativeTop });
                } else {
                    setPosition({ x: left, y: top });
                }

                setIsVisible(true);
            };

            // 监听选择变化
            editor.on('selectionUpdate', updateBubbleMenu);

            return () => {
                editor.off('selectionUpdate', updateBubbleMenu);
            };
        }, [editor]);

        // 处理点击外部隐藏菜单
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                    setIsVisible(false);
                }
            };

            if (isVisible) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [isVisible]);

        if (!isVisible || !editor || !showBubbleMenu) return null;

        return (
            <div
                ref={menuRef}
                className="bubble-menu absolute z-50 flex items-center gap-1 p-2 bg-background border border-border rounded-lg shadow-lg"
                style={{
                    left: position.x,
                    top: position.y,
                }}
            >
                <ToolbarButton
                    onClick={() => {
                        safeEditorCommand(() => {
                            editor.commands.focus();
                            editor.commands.toggleBold();
                        });
                    }}
                    isActive={editor.isActive('bold')}
                    title="加粗 (Ctrl+B)"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => {
                        safeEditorCommand(() => {
                            editor.commands.focus();
                            editor.commands.toggleItalic();
                        });
                    }}
                    isActive={editor.isActive('italic')}
                    title="斜体 (Ctrl+I)"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => {
                        safeEditorCommand(() => {
                            editor.commands.focus();
                            editor.commands.toggleUnderline();
                        });
                    }}
                    isActive={editor.isActive('underline')}
                    title="下划线 (Ctrl+U)"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => {
                        safeEditorCommand(() => {
                            editor.commands.focus();
                            editor.commands.toggleStrike();
                        });
                    }}
                    isActive={editor.isActive('strike')}
                    title="删除线"
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={() => {
                        safeEditorCommand(() => {
                            editor.commands.focus();
                            // 使用Tiptap官方的清除格式命令
                            editor.chain().focus().clearNodes().unsetAllMarks().run();
                        });
                    }}
                    title="清除格式"
                >
                    <Eraser className="h-4 w-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <div className="relative">
                    <input
                        type="color"
                        value={editor.getAttributes('textStyle').color || '#000000'}
                        onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            editor.chain().focus().setColor(e.target.value).run();
                        }}
                        className="w-8 h-8 border border-border rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                        title="文字颜色"
                    />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none bg-transparent rounded-sm flex items-center justify-center"
                                style={{
                                    border: 'none',
                                    boxShadow: 'none',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'hsl(var(--accent) / 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <Palette className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            文字颜色
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className="relative">
                    <input
                        type="color"
                        value={editor.getAttributes('highlight').color || '#ffff00'}
                        onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            editor.chain().focus().setHighlight({ color: e.target.value }).run();
                        }}
                        className="w-8 h-8 border border-border rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                        title="背景高亮"
                    />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none bg-transparent rounded-sm flex items-center justify-center"
                                style={{
                                    border: 'none',
                                    boxShadow: 'none',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'hsl(var(--accent) / 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <Highlighter className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            背景高亮
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        );
    };

    // 数学公式抽屉组件
    const MathDrawer: React.FC = () => {
        const [previewHtml, setPreviewHtml] = useState<string>('');

        // 渲染LaTeX预览
        const renderPreview = useCallback((latex: string) => {
            if (!latex.trim()) {
                setPreviewHtml('');
                return;
            }

            try {
                const html = katex.renderToString(latex, {
                    throwOnError: false,
                    displayMode: mathType === 'block',
                    macros: {
                        '\\R': '\\mathbb{R}',
                        '\\N': '\\mathbb{N}',
                        '\\Z': '\\mathbb{Z}',
                        '\\Q': '\\mathbb{Q}',
                        '\\C': '\\mathbb{C}',
                    },
                });
                setPreviewHtml(html);
            } catch (error) {
                setPreviewHtml('<span style="color: red;">公式语法错误</span>');
            }
        }, [mathType]);

        // 当LaTeX代码变化时更新预览
        useEffect(() => {
            renderPreview(mathLatex);
        }, [mathLatex, renderPreview]);

        // 筛选模板
        const filteredTemplates = mathTemplates.filter(template =>
            selectedCategory === 'all' || template.category === selectedCategory
        );

        const handleInsertMath = () => {
            if (mathLatex.trim() && editor) {
                safeEditorCommand(() => {
                    editor.commands.focus();
                    if (mathType === 'inline') {
                        editor.commands.insertInlineMath({ latex: mathLatex.trim() });
                    } else {
                        editor.commands.insertBlockMath({ latex: mathLatex.trim() });
                    }
                });
                setShowMathDrawer(false);
                setMathLatex('');
            }
        };

        const handleTemplateClick = (template: string) => {
            setMathLatex(template);
        };

        return (
            <Drawer open={showMathDrawer} onOpenChange={setShowMathDrawer}>
                <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader>
                        <DrawerTitle>
                            插入{mathType === 'inline' ? '内联' : '块级'}数学公式
                        </DrawerTitle>
                        <DrawerDescription>
                            输入LaTeX公式代码，或从下方选择常用公式模板
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="px-4 space-y-4 flex-1 overflow-y-auto">
                        <div className="space-y-2">
                            <Label>公式类型</Label>
                            <RadioGroup
                                value={mathType}
                                onValueChange={(value) => setMathType(value as 'inline' | 'block')}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="inline" id="inline" />
                                    <Label htmlFor="inline" className="text-sm font-normal cursor-pointer">
                                        内联公式
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="block" id="block" />
                                    <Label htmlFor="block" className="text-sm font-normal cursor-pointer">
                                        块级公式
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="math-input">LaTeX公式代码</Label>
                            <Input
                                id="math-input"
                                value={mathLatex}
                                onChange={(e) => setMathLatex(e.target.value)}
                                placeholder="例如: \\frac{a}{b} 或 x^2 + y^2 = z^2"
                                className="font-mono"
                            />
                        </div>

                        {/* 分类筛选 */}
                        <div className="space-y-2">
                            <Label>公式分类</Label>
                            <div className="flex flex-wrap gap-2">
                                {mathCategories.map((category) => (
                                    <Badge
                                        key={category.id}
                                        variant={selectedCategory === category.id ? "default" : "outline"}
                                        className="cursor-pointer hover:bg-accent transition-colors"
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        <span className="mr-1">{category.icon}</span>
                                        {category.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>常用公式模板</Label>
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                                {filteredTemplates.map((template, index) => {
                                    // 为每个模板渲染预览
                                    let templatePreview = '';
                                    try {
                                        templatePreview = katex.renderToString(template.latex, {
                                            throwOnError: false,
                                            displayMode: false,
                                            macros: {
                                                '\\R': '\\mathbb{R}',
                                                '\\N': '\\mathbb{N}',
                                                '\\Z': '\\mathbb{Z}',
                                                '\\Q': '\\mathbb{Q}',
                                                '\\C': '\\mathbb{C}',
                                            },
                                        });
                                    } catch (error) {
                                        templatePreview = '<span style="color: red;">渲染错误</span>';
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleTemplateClick(template.latex)}
                                            className="text-left p-3 rounded hover:bg-accent transition-colors border flex items-center justify-between"
                                            title={template.description}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="font-semibold text-sm">{template.name}</div>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {mathCategories.find(cat => cat.id === template.category)?.name}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono mb-2">
                                                    {template.latex}
                                                </div>
                                                <div
                                                    className="text-sm"
                                                    dangerouslySetInnerHTML={{ __html: templatePreview }}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {mathLatex && (
                            <div className="space-y-2">
                                <Label>当前公式预览</Label>
                                <div className="space-y-2">
                                    <div className="border rounded-md p-3 bg-muted/50 font-mono text-sm">
                                        {mathLatex}
                                    </div>
                                    {previewHtml && (
                                        <div className="border rounded-md p-3 bg-background">
                                            <div
                                                className="text-center"
                                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DrawerFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowMathDrawer(false)}
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleInsertMath}
                            disabled={!mathLatex.trim()}
                        >
                            插入公式
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    };

    // 颜色选择器组件
    const ColorSelector: React.FC<{
        type: 'text' | 'highlight';
        showPalette: boolean;
        onTogglePalette: () => void;
    }> = ({ type, showPalette, onTogglePalette }) => {
        const colors = type === 'text' ? commonColors : commonHighlightColors;
        const currentColor = type === 'text'
            ? editor?.getAttributes('textStyle').color || '#000000'
            : editor?.getAttributes('highlight').color || '#ffff00';

        const handleColorSelect = (color: string) => {
            if (!editor) return;
            if (type === 'text') {
                editor.chain().focus().setColor(color).run();
            } else {
                editor.chain().focus().setHighlight({ color }).run();
            }
            onTogglePalette();
        };

        return (
            <div className="relative color-selector-container">
                <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleColorSelect(e.target.value);
                    }}
                    className="w-8 h-8 border border-border rounded cursor-pointer opacity-0 absolute inset-0 z-5"
                    title={type === 'text' ? '文字颜色' : '背景高亮'}
                />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none bg-transparent rounded-sm flex items-center justify-center relative z-10"
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
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onTogglePalette();
                            }}
                        >
                            {type === 'text' ? <Palette className="h-4 w-4" /> : <Highlighter className="h-4 w-4" />}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {type === 'text' ? '文字颜色' : '背景高亮'}
                    </TooltipContent>
                </Tooltip>

                {/* 颜色选择面板 */}
                {showPalette && (
                    <div className="absolute top-10 left-0 z-50 bg-background border border-border rounded-lg shadow-lg p-3 min-w-[240px]">
                        <Tabs defaultValue="common" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-3">
                                <TabsTrigger value="common" className="text-xs">常用</TabsTrigger>
                                <TabsTrigger value="custom" className="text-xs">自定义</TabsTrigger>
                            </TabsList>

                            <TabsContent value="common" className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                    {type === 'text' ? '常用文字颜色' : '常用高亮颜色'}
                                </div>
                                <div className="grid grid-cols-6 gap-1">
                                    {colors.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => handleColorSelect(color.value)}
                                            className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                                <div className="text-xs text-muted-foreground text-center">
                                    点击颜色块快速选择
                                </div>
                            </TabsContent>

                            <TabsContent value="custom" className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                    自定义颜色
                                </div>
                                <div className="flex items-center justify-center">
                                    <input
                                        type="color"
                                        value={currentColor}
                                        onChange={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleColorSelect(e.target.value);
                                        }}
                                        className="w-16 h-16 border border-border rounded cursor-pointer"
                                        title={type === 'text' ? '文字颜色' : '背景高亮'}
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground text-center">
                                    选择任意颜色
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        );
    };

    // 字数统计配置组件
    const WordCountConfig: React.FC = () => {
        return (
            <Popover open={showWordCountOptions} onOpenChange={setShowWordCountOptions}>
                <PopoverTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1 transition-colors">
                        <span>字数: {wordCount}</span>
                        <span>字符: {charCount}</span>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="end">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="include-punctuation"
                                checked={includePunctuation}
                                onCheckedChange={(checked) => setIncludePunctuation(checked as boolean)}
                            />
                            <Label
                                htmlFor="include-punctuation"
                                className="text-sm font-normal cursor-pointer"
                            >
                                包含标点符号
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="show-bubble-menu"
                                checked={showBubbleMenu}
                                onCheckedChange={(checked) => setShowBubbleMenu(checked as boolean)}
                            />
                            <Label
                                htmlFor="show-bubble-menu"
                                className="text-sm font-normal cursor-pointer"
                            >
                                显示浮动工具栏
                            </Label>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        );
    };

    // 工具栏组件
    const Toolbar: React.FC = () => {
        if (!editor) return null;

        return (
            <div className="flex flex-wrap items-center gap-1 p-3 border-b border-border bg-transparent">
                {/* 第一组：标题、字体和字号 */}
                <div className="flex items-center gap-1">
                    <HeadingSelector />
                    <FontFamilySelector />
                    <FontSizeSelector />
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* 数学公式 */}
                <div className="flex items-center gap-1">
                    <MathSelector />
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* 文本格式 */}
                <div className="flex items-center gap-1">
                    <ToolbarButton
                        onClick={() => {
                            safeEditorCommand(() => {
                                editor.commands.focus();
                                editor.commands.toggleBold();
                            });
                        }}
                        isActive={editor.isActive('bold')}
                        title="加粗 (Ctrl+B)"
                    >
                        <Bold className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            safeEditorCommand(() => {
                                editor.commands.focus();
                                editor.commands.toggleItalic();
                            });
                        }}
                        isActive={editor.isActive('italic')}
                        title="斜体 (Ctrl+I)"
                    >
                        <Italic className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            safeEditorCommand(() => {
                                editor.commands.focus();
                                editor.commands.toggleUnderline();
                            });
                        }}
                        isActive={editor.isActive('underline')}
                        title="下划线 (Ctrl+U)"
                    >
                        <UnderlineIcon className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            safeEditorCommand(() => {
                                editor.commands.focus();
                                editor.commands.toggleStrike();
                            });
                        }}
                        isActive={editor.isActive('strike')}
                        title="删除线"
                    >
                        <Strikethrough className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().setHorizontalRule().run();
                        }}
                        title="分割线"
                    >
                        <SeparatorHorizontal className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* 颜色 */}
                <div className="flex items-center gap-1">
                    <ColorSelector
                        type="text"
                        showPalette={showColorPalette}
                        onTogglePalette={() => setShowColorPalette(!showColorPalette)}
                    />
                    <ColorSelector
                        type="highlight"
                        showPalette={showHighlightPalette}
                        onTogglePalette={() => setShowHighlightPalette(!showHighlightPalette)}
                    />
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* 列表和对齐方式 */}
                <div className="flex items-center gap-1">
                    <ListSelector />
                    <TextAlignSelector />
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* 最后一组：清除格式、撤销、重做 */}
                <div className="flex items-center gap-1">
                    <ToolbarButton
                        onClick={() => {
                            safeEditorCommand(() => {
                                editor.commands.focus();
                                // 使用Tiptap官方的清除格式命令
                                editor.chain().focus().clearNodes().unsetAllMarks().run();
                            });
                        }}
                        title="清除格式"
                    >
                        <Eraser className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().undo().run();
                        }}
                        disabled={!editor.can().undo()}
                        title="撤销 (Ctrl+Z)"
                    >
                        <Undo className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().redo().run();
                        }}
                        disabled={!editor.can().redo()}
                        title="重做 (Ctrl+Y)"
                    >
                        <Redo className="h-4 w-4" />
                    </ToolbarButton>
                </div>
            </div>
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
                    <Toolbar />

                    <div
                        className="tiptap-editor-content p-4 overflow-y-auto relative"
                        style={{
                            minHeight: customMinHeight,
                            maxHeight: customMaxHeight,
                        }}
                    >
                        <EditorContent editor={editor} />

                        {/* 自定义BubbleMenu - 适配Tiptap v3 */}
                        <CustomBubbleMenu editor={editor} />
                    </div>

                    {/* 数学公式抽屉 */}
                    <MathDrawer />

                    {/* 字数统计 */}
                    <div className="flex items-center justify-end px-4 py-2 text-sm text-muted-foreground border-t border-border bg-muted/50">
                        <WordCountConfig />
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default TiptapEditorWrapper;
