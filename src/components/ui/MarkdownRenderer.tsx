'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useThemeMode } from '@/hooks/useThemeMode';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
    content,
    className = ''
}) => {
    const { isDarkMode } = useThemeMode();

    if (!content) {
        return null;
    }

    return (
        <div className={`markdown-content ${className}`} data-color-mode={isDarkMode ? 'dark' : 'light'}>
            <ReactMarkdown
                components={{
                    // 自定义标题样式
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-base font-bold mb-2 mt-3">{children}</h4>,
                    h5: ({ children }) => <h5 className="text-sm font-bold mb-1 mt-2">{children}</h5>,
                    h6: ({ children }) => <h6 className="text-xs font-bold mb-1 mt-2">{children}</h6>,

                    // 自定义段落样式
                    p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,

                    // 自定义列表样式
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="ml-2">{children}</li>,

                    // 自定义代码样式
                    code: ({ children, className }) => {
                        const isInline = !className;
                        if (isInline) {
                            return <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
                        }
                        return <code className={className}>{children}</code>;
                    },
                    pre: ({ children }) => (
                        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-3">
                            {children}
                        </pre>
                    ),

                    // 自定义引用样式
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-3">
                            {children}
                        </blockquote>
                    ),

                    // 自定义链接样式
                    a: ({ children, href }) => (
                        <a
                            href={href}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {children}
                        </a>
                    ),

                    // 自定义表格样式
                    table: ({ children }) => (
                        <div className="overflow-x-auto mb-3">
                            <table className="min-w-full border border-gray-300 dark:border-gray-600">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-700">{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr className="border-b border-gray-300 dark:border-gray-600">{children}</tr>,
                    th: ({ children }) => <th className="px-4 py-2 text-left font-semibold">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-2">{children}</td>,

                    // 自定义强调样式
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,

                    // 自定义分割线样式
                    hr: () => <hr className="my-6 border-gray-300 dark:border-gray-600" />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
