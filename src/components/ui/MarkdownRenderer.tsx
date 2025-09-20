'use client';

import React from 'react';
import { useThemeMode } from '@/hooks/useThemeMode';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

// 简单的 Markdown 解析函数
function parseMarkdown(content: string, className?: string): React.ReactNode[] {
    if (!content) return [];

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentUnorderedList: string[] = [];
    let currentOrderedList: string[] = [];
    let isInUnorderedList = false;
    let isInOrderedList = false;

    // 处理文本中的 Markdown 语法
    const processInlineMarkdown = (text: string): string => {
        let processedText = text;

        // 处理颜色
        processedText = processedText.replace(/\{red\}(.*?)\{\/red\}/g, '<span style="color: #EE0000;">$1</span>');
        processedText = processedText.replace(/\{blue\}(.*?)\{\/blue\}/g, '<span style="color: #0066FF;">$1</span>');
        processedText = processedText.replace(/\{green\}(.*?)\{\/green\}/g, '<span style="color: #10b981;">$1</span>');
        processedText = processedText.replace(/\{orange\}(.*?)\{\/orange\}/g, '<span style="color: #f97316;">$1</span>');

        // 处理粗体和斜体
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        processedText = processedText.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // 处理链接
        processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

        // 处理内联代码
        processedText = processedText.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-[#171717] px-1 py-0.5 rounded text-sm font-mono">$1</code>');

        return processedText;
    };

    const finishCurrentList = (index: number) => {
        if (isInUnorderedList && currentUnorderedList.length > 0) {
            elements.push(
                <ul key={`ul-${index}`} className="list-disc mb-3 pl-5">
                    {currentUnorderedList.map((item, i) => (
                        <li key={i} className="leading-normal pl-1" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(item) }} />
                    ))}
                </ul>
            );
            currentUnorderedList = [];
            isInUnorderedList = false;
        }
        if (isInOrderedList && currentOrderedList.length > 0) {
            elements.push(
                <ol key={`ol-${index}`} className="list-decimal mb-3 pl-5">
                    {currentOrderedList.map((item, i) => (
                        <li key={i} className="leading-normal pl-1" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(item) }} />
                    ))}
                </ol>
            );
            currentOrderedList = [];
            isInOrderedList = false;
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            // 空行，结束当前列表
            finishCurrentList(index);
            return;
        }

        // 检查是否是无序列表项
        if (trimmedLine.startsWith('- ')) {
            // 如果之前是有序列表，先结束它
            if (isInOrderedList) {
                finishCurrentList(index);
            }
            if (!isInUnorderedList) {
                isInUnorderedList = true;
            }
            currentUnorderedList.push(trimmedLine.substring(2));
            return;
        }

        // 检查是否是有序列表
        const orderedListMatch = trimmedLine.match(/^(\d+)\.\s(.+)$/);
        if (orderedListMatch) {
            // 如果之前是无序列表，先结束它
            if (isInUnorderedList) {
                finishCurrentList(index);
            }
            if (!isInOrderedList) {
                isInOrderedList = true;
            }
            currentOrderedList.push(orderedListMatch[2]);
            return;
        }

        // 结束当前列表
        finishCurrentList(index);

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

        // 处理颜色
        let processedText = trimmedLine;
        processedText = processedText.replace(/\{red\}(.*?)\{\/red\}/g, '<span style="color: #EE0000;">$1</span>');
        processedText = processedText.replace(/\{blue\}(.*?)\{\/blue\}/g, '<span style="color: #0066FF;">$1</span>');
        processedText = processedText.replace(/\{green\}(.*?)\{\/green\}/g, '<span style="color: #10b981;">$1</span>');
        processedText = processedText.replace(/\{orange\}(.*?)\{\/orange\}/g, '<span style="color: #f97316;">$1</span>');

        // 处理粗体和斜体
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        processedText = processedText.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // 处理链接
        processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

        // 处理内联代码
        processedText = processedText.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-[#171717] px-1 py-0.5 rounded text-sm font-mono">$1</code>');

        // 创建段落元素
        elements.push(
            <p key={`p-${index}`} className={`${className || ''} leading-normal`}
                dangerouslySetInnerHTML={{ __html: processedText }} />
        );
    });

    // 处理最后的列表
    finishCurrentList(lines.length);

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

    const parsedContent = parseMarkdown(content, className);

    return (
        <div className={`markdown-content ${className}`} data-color-mode={isDarkMode ? 'dark' : 'light'}>
            {parsedContent}
        </div>
    );
};
