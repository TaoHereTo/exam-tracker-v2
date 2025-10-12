'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';

interface CatalogItem {
    id: string;
    type: string;
    text: string;
    level: number;
    node: { pos: number };
}

interface TiptapEditorCatalogProps {
    editor: Editor | null;
    className?: string;
    isVisible: boolean;
    onToggle: () => void;
}

export const TiptapEditorCatalog: React.FC<TiptapEditorCatalogProps> = ({ editor, className, isVisible, onToggle }) => {
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    // 更新目录
    const updateCatalog = useCallback(() => {
        if (!editor) return;

        try {
            const catalogItems: CatalogItem[] = [];
            let idCounter = 0;

            // 遍历编辑器内容，查找所有标题
            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'heading') {
                    const level = node.attrs.level;
                    const text = node.textContent;

                    if (text.trim()) {
                        catalogItems.push({
                            id: `heading-${idCounter++}`,
                            type: `heading${level}`,
                            text: text.substring(0, 50), // 限制长度
                            level,
                            node: { pos }
                        });
                    }
                }
            });

            setCatalog(catalogItems);
        } catch (error) {
            console.error('更新目录失败:', error);
        }
    }, [editor]);

    // 监听编辑器变化
    useEffect(() => {
        if (!editor) return;

        // 初始化时更新一次
        updateCatalog();

        // 监听编辑器内容变化
        const handleUpdate = () => {
            updateCatalog();
        };

        editor.on('update', handleUpdate);

        return () => {
            editor.off('update', handleUpdate);
        };
    }, [editor, updateCatalog]);

    // 点击目录项，滚动到对应位置
    const handleItemClick = useCallback((item: CatalogItem) => {
        if (!editor) return;

        try {
            // 使用 Tiptap 的 scrollIntoView 方法
            editor.commands.scrollIntoView();
            editor.commands.setTextSelection(item.node.pos);
            editor.commands.focus();
            setActiveId(item.id);
        } catch (error) {
            console.error('滚动到元素失败:', error);
        }
    }, [editor]);

    if (!editor || catalog.length === 0) {
        return null;
    }

    // 收起状态 - 只显示一个竖向的按钮
    if (!isVisible) {
        return (
            <div className={cn("editor-catalog-collapsed", className)}>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-32 w-10 p-0 rounded-r-lg rounded-l-none border-l-0 flex flex-col items-center justify-center gap-2"
                    onClick={onToggle}
                >
                    <div className="text-xs whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                        目录
                    </div>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    // 展开状态 - 显示完整的目录面板
    return (
        <div className={cn(
            "editor-catalog bg-background border border-border rounded-lg overflow-hidden",
            className
        )}>
            {/* 目录标题栏 */}
            <div className="flex items-center p-3 border-b border-border">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 mr-2"
                            onClick={onToggle}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>收起目录</p>
                    </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span>目录</span>
                </div>
            </div>

            {/* 目录列表 */}
            <div className="p-3 space-y-1 overflow-y-auto max-h-[500px]">
                {catalog.map((item, index) => (
                    <div
                        key={item.id || index}
                        className={cn(
                            "cursor-pointer text-sm py-1.5 px-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors",
                            activeId === item.id && "bg-primary/10 text-primary",
                            !activeId && "text-muted-foreground"
                        )}
                        style={{
                            paddingLeft: `${(item.level - 1) * 12 + 8}px`
                        }}
                        onClick={() => handleItemClick(item)}
                    >
                        <span className="line-clamp-2">
                            {item.text || '(空标题)'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TiptapEditorCatalog;
