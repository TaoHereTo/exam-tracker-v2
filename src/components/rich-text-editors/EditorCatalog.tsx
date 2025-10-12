'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { IDomEditor } from '@wangeditor/editor';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';

interface CatalogItem {
    id: string;
    type: string;
    text: string;
    level: number;
}

interface EditorCatalogProps {
    editor: IDomEditor | null;
    className?: string;
    isVisible: boolean;
    onToggle: () => void;
}

export const EditorCatalog: React.FC<EditorCatalogProps> = ({ editor, className, isVisible, onToggle }) => {
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    // 更新目录
    const updateCatalog = useCallback(() => {
        if (!editor) return;

        try {
            // 使用 wangEditor API 获取所有标题元素
            const headers = editor.getElemsByTypePrefix('header');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const catalogItems: CatalogItem[] = headers.map((header: any) => {
                const text = header.children?.[0]?.text || '';
                const type = header.type || '';
                const level = parseInt(type.replace('header', '')) || 1;

                return {
                    id: header.id || '',
                    type,
                    text: text.substring(0, 50), // 限制长度
                    level
                };
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
        const handleChange = () => {
            updateCatalog();
        };

        editor.on('change', handleChange);

        return () => {
            editor.off('change', handleChange);
        };
    }, [editor, updateCatalog]);

    // 点击目录项，滚动到对应位置
    const handleItemClick = useCallback((id: string) => {
        if (!editor) return;

        try {
            editor.scrollToElem(id);
            setActiveId(id);
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
            "editor-catalog bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden",
            className
        )}>
            {/* 目录标题栏 */}
            <div className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700">
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
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <span>目录</span>
                </div>
            </div>

            {/* 目录列表 */}
            <div className="p-3 space-y-1 overflow-y-auto max-h-[500px]">
                {catalog.map((item, index) => (
                    <div
                        key={item.id || index}
                        className={cn(
                            "cursor-pointer text-sm py-1.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                            activeId === item.id && "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                            !activeId && "text-gray-600 dark:text-gray-400"
                        )}
                        style={{
                            paddingLeft: `${(item.level - 1) * 12 + 8}px`
                        }}
                        onClick={() => handleItemClick(item.id)}
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

export default EditorCatalog;

