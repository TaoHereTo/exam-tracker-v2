'use client';

import React from 'react';
import { useThemeMode } from '@/hooks/useThemeMode';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

// 简单的 Markdown 解析函数
function parseMarkdown(content: string): React.ReactNode[] {
    if (!content) return [];

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let isInList = false;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            // 空行，结束当前列表
            if (isInList && currentList.length > 0) {
                elements.push(
                    <ul key={`list-${index}`} className="list-disc list-inside mb-3 space-y-1">
                        {currentList.map((item, i) => (
                            <li key={i} className="ml-2">{item}</li>
                        ))}
                    </ul>
                );
                currentList = [];
                isInList = false;
            }
            return;
        }

        // 检查是否是列表项
        if (trimmedLine.startsWith('- ')) {
            if (!isInList) {
                isInList = true;
            }
            currentList.push(trimmedLine.substring(2));
            return;
        }

        // 检查是否是有序列表
        const orderedListMatch = trimmedLine.match(/^(\d+)\.\s(.+)$/);
        if (orderedListMatch) {
            if (!isInList) {
                isInList = true;
            }
            currentList.push(orderedListMatch[2]);
            return;
        }

        // 结束当前列表
        if (isInList && currentList.length > 0) {
            elements.push(
                <ul key={`list-${index}`} className="list-disc list-inside mb-3 space-y-1">
                    {currentList.map((item, i) => (
                        <li key={i} className="ml-2">{item}</li>
                    ))}
                </ul>
            );
            currentList = [];
            isInList = false;
        }

        // 检查分割线
        if (trimmedLine === '---') {
            elements.push(<hr key={`hr-${index}`} className="my-6 border-gray-300 dark:border-gray-600" />);
            return;
        }

        // 检查标题
        if (trimmedLine.startsWith('#')) {
            const level = trimmedLine.match(/^#+/)?.[0].length || 1;
            const text = trimmedLine.replace(/^#+\s*/, '');
            const HeadingTag = `h${Math.min(level, 6)}` as keyof React.JSX.IntrinsicElements;
            const headingClasses = {
                1: 'text-2xl font-bold mb-4 mt-6',
                2: 'text-xl font-bold mb-3 mt-5',
                3: 'text-lg font-bold mb-2 mt-4',
                4: 'text-base font-bold mb-2 mt-3',
                5: 'text-sm font-bold mb-1 mt-2',
                6: 'text-xs font-bold mb-1 mt-2'
            };
            elements.push(
                React.createElement(HeadingTag, {
                    key: `heading-${index}`,
                    className: headingClasses[level as keyof typeof headingClasses]
                }, text)
            );
            return;
        }

        // 处理粗体和斜体
        let processedText = trimmedLine;
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        processedText = processedText.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // 处理链接
        processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

        // 处理内联代码
        processedText = processedText.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

        // 创建段落元素
        elements.push(
            <p key={`p-${index}`} className="mb-3 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: processedText }} />
        );
    });

    // 处理最后的列表
    if (isInList && currentList.length > 0) {
        elements.push(
            <ul key="list-final" className="list-disc list-inside mb-3 space-y-1">
                {currentList.map((item, i) => (
                    <li key={i} className="ml-2">{item}</li>
                ))}
            </ul>
        );
    }

    return elements;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
    content,
    className = ''
}) => {
    const { isDarkMode } = useThemeMode();

    if (!content) {
        return null;
    }

    const parsedContent = parseMarkdown(content);

    return (
        <div className={`markdown-content ${className}`} data-color-mode={isDarkMode ? 'dark' : 'light'}>
            {parsedContent}
        </div>
    );
};
