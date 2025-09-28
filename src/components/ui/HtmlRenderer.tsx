'use client';

import React, { useEffect, useRef } from 'react';
import { useThemeMode } from '@/hooks/useThemeMode';
import 'katex/dist/katex.min.css';

interface HtmlRendererProps {
    content: string;
    className?: string;
}

export const HtmlRenderer: React.FC<HtmlRendererProps> = ({
    content,
    className = ''
}) => {
    const { isDarkMode } = useThemeMode();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !content) return;

        // 渲染LaTeX公式
        const renderLatex = async () => {
            const container = containerRef.current;
            if (!container) return;

            // 先设置原始HTML内容
            container.innerHTML = content;

            // 检查是否有LaTeX公式需要渲染
            const hasLatex = content.includes('$');

            if (hasLatex) {
                // 动态导入katex
                try {
                    const katex = await import('katex');

                    // 先清空容器，避免重复渲染
                    container.innerHTML = '';

                    // 直接处理HTML内容中的LaTeX公式，保持换行
                    let html = content;

                    // 处理块级公式 $$...$$
                    const blockLatexRegex = /\$\$([^$]+)\$\$/g;
                    html = html.replace(blockLatexRegex, (match, latex) => {
                        try {
                            const rendered = katex.renderToString(latex, {
                                throwOnError: false,
                                displayMode: true
                            });
                            return `<div class="latex-block" style="text-align: center; margin: 8px 0;">${rendered}</div>`;
                        } catch (error) {
                            return `<div class="latex-block" style="text-align: center; margin: 8px 0; color: red;">$${latex}$$</div>`;
                        }
                    });

                    // 处理行内公式 $...$
                    const inlineLatexRegex = /\$([^$]+)\$/g;
                    html = html.replace(inlineLatexRegex, (match, latex) => {
                        try {
                            const rendered = katex.renderToString(latex, {
                                throwOnError: false,
                                displayMode: false
                            });
                            return `<span class="latex-inline">${rendered}</span>`;
                        } catch (error) {
                            return `<span class="latex-inline" style="color: red;">$${latex}$</span>`;
                        }
                    });

                    // 更新HTML内容
                    container.innerHTML = html;
                } catch (error) {
                    console.error('Failed to load katex:', error);
                    // 如果渲染失败，至少显示原始内容
                    container.innerHTML = content;
                }
            }
        };

        // 延迟渲染，确保DOM已更新
        setTimeout(() => renderLatex(), 0);
    }, [content]);

    if (!content) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className={`html-content ${className}`}
            data-color-mode={isDarkMode ? 'dark' : 'light'}
            style={{
                fontSize: '14px',
                lineHeight: '1.5',
                fontFamily: 'inherit'
            }}
        />
    );
};

export default HtmlRenderer;