'use client';

import React from 'react';
import SimpleRichTextEditor from './SimpleRichTextEditor';

interface KnowledgeRichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    onImageChange?: (imageIds: string[]) => void;
    onPendingImagesChange?: (pendingImages: { localUrl: string; file: File | null; imageId: string | null }[]) => void;
    clearPreviewImages?: boolean;
    editorMinHeight?: string;
    editorMaxHeight?: string;
}

export const KnowledgeRichTextEditor: React.FC<KnowledgeRichTextEditorProps> = ({
    value,
    onChange,
    placeholder = '请输入知识点内容...',
    className,
    onImageChange,
    onPendingImagesChange,
    clearPreviewImages = false,
    editorMinHeight = '200px',
    editorMaxHeight = '400px'
}) => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <SimpleRichTextEditor
                    content={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={className}
                    onImageChange={onImageChange}
                    deferImageUpload={true} // 延迟上传，在保存时统一处理
                    onPendingImagesChange={onPendingImagesChange}
                    customMinHeight={editorMinHeight}
                    customMaxHeight={editorMaxHeight}
                    clearPreviewImages={clearPreviewImages}
                />
            </div>
        </div>
    );
};

