'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    Undo,
    Redo,
    Type,
    ALargeSmall,
    Calculator,
    Heading,
    TypeOutline,
    Palette,
    Eraser
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-with-animation';
import { ColorTextPopoverComponent } from '@/components/tiptap-ui/color-text-popover';

interface ToolbarProps {
    editor: Editor | null;
    onOpenMathDrawer: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    editor,
    onOpenMathDrawer
}) => {
    if (!editor) return null;

    // 工具栏按钮组件
    const ToolbarButton: React.FC<{
        onClick: () => void;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        title: string;
    }> = ({ onClick, isActive = false, disabled = false, children, title }) => {
        return (
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none rounded-sm flex items-center justify-center transition-colors ${isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-transparent hover:bg-accent'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                    border: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box'
                }}
                title={title}
            >
                {children}
            </button>
        );
    };

    // 字体选择器组件
    const FontFamilySelector: React.FC = () => {
        const fontFamilies = [
            { name: '默认', value: '' },
            { name: '宋体', value: 'SimSun, serif' },
            { name: '黑体', value: 'SimHei, sans-serif' },
            { name: '微软雅黑', value: 'Microsoft YaHei, sans-serif' },
            { name: 'Arial', value: 'Arial, sans-serif' },
            { name: 'Times New Roman', value: 'Times New Roman, serif' },
            { name: 'Courier New', value: 'Courier New, monospace' },
        ];

        const currentFont = editor.getAttributes('textStyle').fontFamily || '';

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none rounded-sm flex items-center justify-center transition-colors bg-transparent hover:bg-accent cursor-pointer"
                                style={{
                                    border: 'none',
                                    boxShadow: 'none',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <Type className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        字体
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-48 z-[60]">
                    {fontFamilies.map((font) => (
                        <DropdownMenuItem
                            key={font.value}
                            onClick={() => {
                                if (font.value) {
                                    editor.chain().focus().setFontFamily(font.value).run();
                                } else {
                                    editor.chain().focus().unsetFontFamily().run();
                                }
                            }}
                            className={currentFont === font.value ? 'bg-accent' : ''}
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
            { name: '12px', value: '12px' },
            { name: '14px', value: '14px' },
            { name: '16px', value: '16px' },
            { name: '18px', value: '18px' },
            { name: '20px', value: '20px' },
            { name: '24px', value: '24px' },
            { name: '28px', value: '28px' },
            { name: '32px', value: '32px' },
            { name: '36px', value: '36px' },
        ];

        const currentSize = editor.getAttributes('textStyle').fontSize || '';

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none rounded-sm flex items-center justify-center transition-colors bg-transparent hover:bg-accent cursor-pointer"
                                style={{
                                    border: 'none',
                                    boxShadow: 'none',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <TypeOutline className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
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
                                if (size.value) {
                                    editor.chain().focus().setFontSize(size.value).run();
                                } else {
                                    editor.chain().focus().unsetFontSize().run();
                                }
                            }}
                            className={currentSize === size.value ? 'bg-accent' : ''}
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
            { name: '居中', value: 'center', icon: AlignCenter },
            { name: '右对齐', value: 'right', icon: AlignRight },
            { name: '两端对齐', value: 'justify', icon: AlignJustify },
        ];

        const currentAlign = editor.getAttributes('textAlign')?.textAlign || 'left';

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none rounded-sm flex items-center justify-center transition-colors bg-transparent hover:bg-accent cursor-pointer"
                                style={{
                                    border: 'none',
                                    boxShadow: 'none',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {alignments.find(align => align.value === currentAlign)?.icon &&
                                    React.createElement(alignments.find(align => align.value === currentAlign)!.icon, { className: "h-4 w-4" })
                                }
                            </button>
                        </DropdownMenuTrigger>
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
                                    editor.chain().focus().setTextAlign(alignment.value as 'left' | 'center' | 'right' | 'justify').run();
                                }}
                                className={currentAlign === alignment.value ? 'bg-accent' : ''}
                            >
                                <IconComponent className="h-4 w-4 mr-2" />
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

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none rounded-sm flex items-center justify-center transition-colors bg-transparent hover:bg-accent cursor-pointer"
                                style={{
                                    border: 'none',
                                    boxShadow: 'none',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
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
                                    if (listType.value === 'bulletList') {
                                        editor.chain().focus().toggleBulletList().run();
                                    } else if (listType.value === 'orderedList') {
                                        editor.chain().focus().toggleOrderedList().run();
                                    }
                                }}
                            >
                                <IconComponent className="h-4 w-4 mr-2" />
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
            onOpenMathDrawer();
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
            { name: '标题 1', value: 'heading', level: 1 },
            { name: '标题 2', value: 'heading', level: 2 },
            { name: '标题 3', value: 'heading', level: 3 },
            { name: '标题 4', value: 'heading', level: 4 },
            { name: '标题 5', value: 'heading', level: 5 },
            { name: '标题 6', value: 'heading', level: 6 },
        ];

        const currentHeading = editor.getAttributes('heading');
        const currentLevel = currentHeading?.level || 0;

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none rounded-sm flex items-center justify-center transition-colors bg-transparent hover:bg-accent cursor-pointer"
                                style={{
                                    border: 'none',
                                    boxShadow: 'none',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <Heading className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        标题级别
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-32 z-[60]">
                    {headings.map((heading) => (
                        <DropdownMenuItem
                            key={`${heading.value}-${heading.level || 0}`}
                            onClick={() => {
                                if (heading.value === 'paragraph') {
                                    editor.chain().focus().setParagraph().run();
                                } else if (heading.value === 'heading' && heading.level) {
                                    editor.chain().focus().toggleHeading({ level: heading.level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
                                }
                            }}
                            className={
                                (heading.value === 'paragraph' && currentLevel === 0) ||
                                    (heading.value === 'heading' && heading.level === currentLevel)
                                    ? 'bg-accent' : ''
                            }
                        >
                            {heading.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    return (
        <div className="flex flex-wrap items-center gap-1 p-3 border-b border-border bg-transparent">
            {/* 第一组：标题、字体和字号 */}
            <div className="flex items-center gap-1">
                <HeadingSelector />
                <FontFamilySelector />
                <FontSizeSelector />
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* 第二组：文本格式 */}
            <div className="flex items-center gap-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="加粗"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="斜体"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="下划线"
                >
                    <Underline className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="删除线"
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>

                <ColorTextPopoverComponent
                    editor={editor}
                    hideWhenUnavailable={false}
                    onColorChanged={({ type, label, value }) => {
                        console.log(`Applied ${type} color: ${label} (${value})`);
                    }}
                />

                <ToolbarButton
                    onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                    title="清除格式"
                >
                    <Eraser className="h-4 w-4" />
                </ToolbarButton>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* 列表和对齐方式 */}
            <div className="flex items-center gap-1">
                <ListSelector />
                <TextAlignSelector />
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* 数学公式 */}
            <div className="flex items-center gap-1">
                <MathSelector />
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* 撤销重做 */}
            <div className="flex items-center gap-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="撤销"
                >
                    <Undo className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="重做"
                >
                    <Redo className="h-4 w-4" />
                </ToolbarButton>
            </div>
        </div>
    );
};
