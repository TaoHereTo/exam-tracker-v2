'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Highlight from '@tiptap/extension-highlight';
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
    MoreHorizontal
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-with-animation';

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
            Underline,
            Strike,
            Highlight.configure({
                multicolor: true,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
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
        if (!editor) return 0;
        const text = editor.getText();
        const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
        const englishWords = text.replace(/[\u4e00-\u9fff]/g, '').replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(w => w.length > 0);
        return chineseChars.length + englishWords.length;
    }, [editor]);

    const charCount = useMemo(() => {
        if (!editor) return 0;
        return editor.getText().length;
    }, [editor]);

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
            { name: '微软雅黑', value: 'Microsoft YaHei, sans-serif' },
            { name: '宋体', value: 'SimSun, serif' },
            { name: '黑体', value: 'SimHei, sans-serif' },
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
                {fonts.find(f => f.value === currentFont)?.name || '字体'}
            </DropdownMenuTrigger>
        );

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {triggerElement}
                    </TooltipTrigger>
                    <TooltipContent>
                        选择字体
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-48">
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
                {headings.find(h => h.value === currentHeading.toString())?.name || '正文'}
            </DropdownMenuTrigger>
        );

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {triggerElement}
                    </TooltipTrigger>
                    <TooltipContent>
                        选择标题级别
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-32">
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

        if (!isVisible || !editor) return null;

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

                <Separator orientation="vertical" className="h-6" />

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

    // 工具栏组件
    const Toolbar: React.FC = () => {
        if (!editor) return null;

        return (
            <div className="flex flex-wrap items-center gap-1 p-3 border-b border-border bg-background/95 backdrop-blur-sm">
                {/* 第一行：标题和字体 */}
                <div className="flex items-center gap-1">
                    <HeadingSelector />
                    <Separator orientation="vertical" className="h-6" />
                    <FontFamilySelector />
                </div>

                <Separator orientation="vertical" className="h-6" />

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
                            safeEditorCommand(() => {
                                editor.commands.focus();
                                editor.commands.toggleCode();
                            });
                        }}
                        isActive={editor.isActive('code')}
                        title="行内代码"
                    >
                        <Code className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* 颜色 */}
                <div className="flex items-center gap-1">
                    <div className="relative">
                        <input
                            type="color"
                            value={editor.getAttributes('textStyle').color || '#000000'}
                            onChange={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                editor.chain().focus().setColor(e.target.value).run();
                            }}
                            className="w-8 h-8 border border-border rounded cursor-pointer opacity-0 absolute pointer-events-none"
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
                                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
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
                            className="w-8 h-8 border border-border rounded cursor-pointer opacity-0 absolute pointer-events-none"
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
                                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
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

                <Separator orientation="vertical" className="h-6" />

                {/* 对齐 */}
                <div className="flex items-center gap-1">
                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().setTextAlign('left').run();
                        }}
                        isActive={editor.isActive({ textAlign: 'left' })}
                        title="左对齐"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().setTextAlign('center').run();
                        }}
                        isActive={editor.isActive({ textAlign: 'center' })}
                        title="居中对齐"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().setTextAlign('right').run();
                        }}
                        isActive={editor.isActive({ textAlign: 'right' })}
                        title="右对齐"
                    >
                        <AlignRight className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().setTextAlign('justify').run();
                        }}
                        isActive={editor.isActive({ textAlign: 'justify' })}
                        title="两端对齐"
                    >
                        <AlignJustify className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* 列表和其他 */}
                <div className="flex items-center gap-1">
                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().toggleBulletList().run();
                        }}
                        isActive={editor.isActive('bulletList')}
                        title="无序列表"
                    >
                        <List className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().toggleOrderedList().run();
                        }}
                        isActive={editor.isActive('orderedList')}
                        title="有序列表"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().toggleBlockquote().run();
                        }}
                        isActive={editor.isActive('blockquote')}
                        title="引用"
                    >
                        <Quote className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().toggleCodeBlock().run();
                        }}
                        isActive={editor.isActive('codeBlock')}
                        title="代码块"
                    >
                        <Code2 className="h-4 w-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => {
                            editor.chain().focus().setHorizontalRule().run();
                        }}
                        title="分割线"
                    >
                        <Minus className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* 撤销重做 */}
                <div className="flex items-center gap-1">
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

                    {/* 字数统计 */}
                    <div className="flex items-center justify-end px-4 py-2 text-sm text-muted-foreground border-t border-border bg-muted/50">
                        <div className="flex items-center gap-2">
                            <span>字数: {wordCount}</span>
                            <span>字符: {charCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default TiptapEditorWrapper;
