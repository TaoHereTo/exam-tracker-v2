'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Undo,
    Redo,
    ALargeSmall,
    Sigma,
    Palette,
    Eraser
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-with-animation';
import { ColorTextPopoverComponent } from '@/components/tiptap-ui/color-text-popover';
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu';
import { HeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu';
import { FontSizeDropdownMenu } from '@/components/tiptap-ui/font-size-dropdown-menu';
import { FontFamilyDropdownMenu } from '@/components/tiptap-ui/font-family-dropdown-menu';
import { TextAlignDropdownMenu } from '@/components/tiptap-ui/text-align-dropdown-menu';
import { BlockQuoteButton } from '@/components/tiptap-ui/blockquote-button';
import { Separator } from '@/components/tiptap-ui-primitive/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '@/components/tiptap-ui-primitive/tooltip';

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
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={onClick}
                        disabled={disabled}
                        className={`h-8 w-8 p-0 border-0 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none hover:shadow-none active:shadow-none rounded-lg flex items-center justify-center transition-colors ${isActive
                            ? 'bg-[#F3F3F4] dark:bg-accent text-purple-600 dark:text-purple-400'
                            : 'bg-transparent hover:bg-[#F3F3F4] dark:hover:bg-accent active:bg-[#F3F3F4] dark:active:bg-accent text-foreground'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        style={{
                            border: 'none',
                            boxShadow: 'none',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    >
                        {children}
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{title}</p>
                </TooltipContent>
            </Tooltip>
        );
    };





    // 数学公式选择器组件
    const MathSelector: React.FC = () => {
        const handleOpenMathDrawer = () => {
            onOpenMathDrawer();
        };

        return (
            <ToolbarButton
                onClick={handleOpenMathDrawer}
                title="数学公式"
            >
                <Sigma className="h-4 w-4" />
            </ToolbarButton>
        );
    };


    return (
        <div className="flex flex-wrap items-center gap-1 relative overflow-visible">
            {/* 第一组：撤销重做 */}
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

            <Separator orientation="vertical" />

            {/* 第二组：标题、字体和字号 */}
            <div className="flex items-center gap-1">
                <HeadingDropdownMenu
                    editor={editor}
                    levels={[1, 2, 3, 4, 5, 6]}
                    hideWhenUnavailable={false}
                    portal={true}
                    onOpenChange={(isOpen) => console.log('Heading dropdown opened:', isOpen)}
                />
                <FontFamilyDropdownMenu
                    editor={editor}
                    families={[
                        'SimSun, serif', 'SimHei, sans-serif', 'Microsoft YaHei, sans-serif',
                        'NSimSun, serif', 'KaiTi, serif', 'PingFang SC, sans-serif',
                        'FangSong, serif', 'Arial, sans-serif', 'Helvetica, sans-serif',
                        'Verdana, sans-serif', 'Tahoma, sans-serif', 'Trebuchet MS, sans-serif',
                        'Times New Roman, serif', 'Georgia, serif', 'Palatino, serif',
                        'Courier New, monospace', 'Monaco, monospace', 'Consolas, monospace'
                    ]}
                    hideWhenUnavailable={false}
                    portal={true}
                    onOpenChange={(isOpen) => console.log('Font family dropdown opened:', isOpen)}
                />
                <FontSizeDropdownMenu
                    editor={editor}
                    sizes={['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']}
                    hideWhenUnavailable={false}
                    portal={true}
                    onOpenChange={(isOpen) => console.log('Font size dropdown opened:', isOpen)}
                />
            </div>

            <Separator orientation="vertical" />

            {/* 第三组：文本格式 */}
            <div className="flex items-center gap-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="加粗"
                >
                    <Bold className="h-4 w-4" strokeWidth={2.5} />
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

            <Separator orientation="vertical" />

            {/* 第四组：引用、数学公式、列表和对齐方式 */}
            <div className="flex items-center gap-1">
                <ToolbarButton
                    onClick={() => {
                        if (editor.isActive('blockquote')) {
                            editor.commands.unsetBlockquote();
                        } else {
                            editor.commands.setBlockquote();
                        }
                    }}
                    isActive={editor.isActive('blockquote')}
                    title="引用"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 6C8 5.44772 8.44772 5 9 5H16C16.5523 5 17 5.44772 17 6C17 6.55228 16.5523 7 16 7H9C8.44772 7 8 6.55228 8 6Z" fill="currentColor" />
                        <path d="M4 3C4.55228 3 5 3.44772 5 4L5 20C5 20.5523 4.55229 21 4 21C3.44772 21 3 20.5523 3 20L3 4C3 3.44772 3.44772 3 4 3Z" fill="currentColor" />
                        <path d="M8 12C8 11.4477 8.44772 11 9 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H9C8.44772 13 8 12.5523 8 12Z" fill="currentColor" />
                        <path d="M8 18C8 17.4477 8.44772 17 9 17H16C16.5523 17 17 17.4477 17 18C17 18.5523 16.5523 19 16 19H9C8.44772 19 8 18.5523 8 18Z" fill="currentColor" />
                    </svg>
                </ToolbarButton>
                <MathSelector />
                <ListDropdownMenu
                    editor={editor}
                    types={['bulletList', 'orderedList', 'taskList']}
                    hideWhenUnavailable={false}
                    portal={true}
                    onOpenChange={(isOpen) => console.log('List dropdown opened:', isOpen)}
                />
                <TextAlignDropdownMenu
                    editor={editor}
                    alignments={['left', 'center', 'right', 'justify']}
                    hideWhenUnavailable={false}
                    portal={true}
                    onOpenChange={(isOpen) => console.log('Text align dropdown opened:', isOpen)}
                />
            </div>
        </div>
    );
};
