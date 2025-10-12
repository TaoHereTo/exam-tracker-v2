'use client';

import React, { useState } from 'react';
import TiptapEditorWrapper from '@/components/rich-text-editors/TiptapEditorWrapper';

export default function TestEditorPage() {
    const [content, setContent] = useState('<p>欢迎使用 Tiptap 编辑器！</p>');

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Tiptap 编辑器测试</h1>

            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">编辑器内容：</h2>
                <TiptapEditorWrapper
                    content={content}
                    onChange={setContent}
                    placeholder="开始输入..."
                    showCatalog={true}
                    customMinHeight="400px"
                    customMaxHeight="600px"
                />
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-semibold mb-2">HTML 输出：</h2>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto">
                    {content}
                </pre>
            </div>
        </div>
    );
}
