'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';
import { motion } from 'framer-motion';
import './TableOfContents.css';

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

interface TableOfContentsProps {
    editor: Editor | null;
    anchors: Anchor[];
    className?: string;
    isVisible: boolean;
    onToggle: () => void;
    onProgrammaticScroll?: (durationMs: number) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
    editor,
    anchors,
    className,
    isVisible,
    onToggle,
    onProgrammaticScroll
}) => {
    // 所有 Hooks 必须在任何条件返回之前调用
    const animationFrameRef = useRef<number | null>(null);

    // 独立的滚动高亮状态，不依赖ToC扩展的状态更新
    const [scrolledOverIds, setScrolledOverIds] = useState<Set<string>>(new Set());

    // 使用超轻量级的滚动监听，每500ms更新一次，避免频繁计算
    useEffect(() => {
        if (!editor) return;

        const editorContainer = editor.view.dom.closest('.tiptap-editor-content') as HTMLElement;
        if (!editorContainer) return;

        let timeoutId: number | null = null;

        const updateScrollState = () => {
            const newScrolledOverIds = new Set<string>();
            const containerRect = editorContainer.getBoundingClientRect();

            anchors.forEach(anchor => {
                if (anchor.dom) {
                    const anchorRect = (anchor.dom as HTMLElement).getBoundingClientRect();
                    const isScrolledOver = anchorRect.top <= containerRect.top + 50; // 50px阈值

                    if (isScrolledOver) {
                        newScrolledOverIds.add(anchor.id);
                    }
                }
            });

            setScrolledOverIds(prev => {
                // 只在真正变化时更新
                if (prev.size !== newScrolledOverIds.size ||
                    [...prev].some(id => !newScrolledOverIds.has(id))) {
                    return newScrolledOverIds;
                }
                return prev;
            });
        };

        const handleScroll = () => {
            if (timeoutId) return;

            timeoutId = window.setTimeout(() => {
                timeoutId = null;
                updateScrollState();
            }, 200); // 200ms节流，进一步减少更新频率
        };

        editorContainer.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            editorContainer.removeEventListener('scroll', handleScroll);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [editor, anchors]);

    // 平滑滚动到指定位置（仅滚动容器，不影响页面）
    const smoothScrollTo = (container: HTMLElement, to: number, duration = 200) => {
        if (!container) return;

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        const start = container.scrollTop;
        const change = to - start;
        if (Math.abs(change) < 1) {
            container.scrollTop = Math.round(to);
            return;
        }

        const startTime = performance.now();
        const easeInOutCubic = (t: number) => (t < 0.5)
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = easeInOutCubic(progress);
            container.scrollTop = Math.round(start + change * eased);
            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(step);
            } else {
                animationFrameRef.current = null;
            }
        };

        animationFrameRef.current = requestAnimationFrame(step);
    };

    // 点击锚点滚动到对应位置 - 使用最直接的方法
    const handleAnchorClick = (e: React.MouseEvent, anchor: Anchor) => {
        e.preventDefault();

        if (!editor) return;

        try {
            if (anchor.dom) {
                // 仅滚动编辑区域：不要更改 selection 或 focus，以避免 ProseMirror 触发窗口滚动
                const editorContainer = editor.view.dom.closest('.tiptap-editor-content') as HTMLElement;
                if (editorContainer) {
                    // 通知外部：开始程序化滚动（暂停 ToC 更新）
                    onProgrammaticScroll?.(200);
                    // 使用 getBoundingClientRect 差值 + 当前 scrollTop，稳定计算到容器顶部
                    const targetRect = (anchor.dom as HTMLElement).getBoundingClientRect();
                    const containerRect = editorContainer.getBoundingClientRect();
                    const targetScrollTop = editorContainer.scrollTop + (targetRect.top - containerRect.top);

                    // 平滑滚动到精确的顶部位置
                    requestAnimationFrame(() => {
                        smoothScrollTo(editorContainer, Math.max(0, Math.round(targetScrollTop)), 200);
                    });
                } else {
                    console.warn('Editor scroll container not found.');
                }
            } else {
                console.error('No DOM element found for anchor:', anchor.textContent);
            }
        } catch (error) {
            console.error('滚动到锚点失败:', error);
        }
    };

    // 生成层级缩进样式
    const getIndentStyle = (level: number) => {
        return {
            paddingLeft: `${(level - 1) * 16}px`,
        };
    };

    // 如果没有编辑器或锚点，不显示组件
    if (!editor || anchors.length === 0) {
        return null;
    }

    // 收起状态 - 完全隐藏，不显示任何内容
    if (!isVisible) {
        return null;
    }

    // 展开状态 - 显示完整的目录面板
    return (
        <motion.div
            className={cn("table-of-contents-expanded h-full flex flex-col", className)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        >
            {/* 标题栏 */}
            <div className="flex items-center gap-2 p-3 border-b border-border flex-shrink-0">
                <List className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">目录</span>
                <span className="text-xs text-muted-foreground">({anchors.length})</span>
            </div>

            {/* 目录内容 - 使用 flex-1 和 min-h-0 确保能正确滚动 */}
            <div
                className="flex-1 min-h-0 p-2 overflow-y-auto"
                style={{
                    willChange: 'transform',
                    contain: 'layout style paint'
                }}
            >
                <div className="space-y-1">
                    {anchors.map((anchor, index) => {
                        // 使用独立的滚动高亮状态，避免ToC扩展状态更新卡顿
                        const isScrolledOver = scrolledOverIds.has(anchor.id);

                        return (
                            <motion.div
                                key={anchor.id}
                                className={cn(
                                    "group cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors duration-300 ease-in-out",
                                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                                    isScrolledOver ? "text-gray-400 dark:text-gray-500" : "text-black dark:text-white"
                                )}
                                style={{
                                    ...getIndentStyle(anchor.level)
                                }}
                                onClick={(e) => handleAnchorClick(e, anchor)}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.05,
                                    ease: "easeOut"
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            "text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 transition-all duration-300 ease-in-out",
                                            isScrolledOver
                                                ? "bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500"
                                                : "bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
                                        )}
                                    >
                                        H{anchor.originalLevel}
                                    </span>
                                    <span className="truncate flex-1">
                                        {anchor.textContent}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};
