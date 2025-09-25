'use client';

import React, { useRef, useEffect, useState } from 'react';
import SimpleRichTextEditor from './SimpleRichTextEditor';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import Image from 'next/image';
import { Eye } from 'lucide-react';

interface KnowledgeRichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    onImageChange?: (imageIds: string[]) => void;
    onPendingImagesChange?: (pendingImages: { localUrl: string; file: File | null; imageId: string | null }[]) => void;
}

export const KnowledgeRichTextEditor: React.FC<KnowledgeRichTextEditorProps> = ({
    value,
    onChange,
    placeholder = '请输入知识点内容...',
    className,
    onImageChange,
    onPendingImagesChange
}) => {
    const [pendingImages, setPendingImages] = useState<{ localUrl: string; file: File | null; imageId: string | null }[]>([]);
    const [accordionValue, setAccordionValue] = useState<string>("");
    const pendingImagesRef = useRef<{ localUrl: string; file: File | null; imageId: string | null }[]>([]);

    // 处理待上传图片变化
    const handlePendingImagesChange = (images: { localUrl: string; file: File | null; imageId: string | null }[]) => {
        console.log('图片状态更新:', images);
        pendingImagesRef.current = images;
        setPendingImages(images);
        // 保存到 localStorage
        try {
            localStorage.setItem('pendingImages', JSON.stringify(images));
        } catch (e) {
            console.log('无法保存到 localStorage:', e);
        }
        onPendingImagesChange?.(images);
    };

    // 从 localStorage 恢复图片状态
    useEffect(() => {
        try {
            const savedImages = localStorage.getItem('pendingImages');
            if (savedImages && pendingImages.length === 0) {
                const parsedImages = JSON.parse(savedImages);
                if (parsedImages.length > 0) {
                    console.log('从 localStorage 恢复图片状态:', parsedImages);
                    pendingImagesRef.current = parsedImages;
                    setPendingImages(parsedImages);
                }
            }
        } catch (e) {
            console.log('无法从 localStorage 恢复:', e);
        }
    }, []);

    // 确保图片状态在组件重新渲染时保持
    useEffect(() => {
        if (pendingImagesRef.current.length > 0 && pendingImages.length === 0) {
            console.log('恢复图片状态:', pendingImagesRef.current);
            setPendingImages(pendingImagesRef.current);
        }
    }, [pendingImages.length]);

    // 强制保持图片状态，防止意外丢失
    useEffect(() => {
        const interval = setInterval(() => {
            if (pendingImagesRef.current.length > 0 && pendingImages.length === 0) {
                console.log('定时检查：恢复图片状态', pendingImagesRef.current);
                setPendingImages(pendingImagesRef.current);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // 监听窗口焦点变化，确保图片状态保持
    useEffect(() => {
        const handleFocus = () => {
            console.log('窗口重新获得焦点，当前图片数量:', pendingImages.length);
            // 立即检查并恢复图片状态
            if (pendingImagesRef.current.length > 0 && pendingImages.length === 0) {
                console.log('窗口焦点恢复：立即恢复图片状态', pendingImagesRef.current);
                setPendingImages(pendingImagesRef.current);
            }
        };

        const handleBlur = () => {
            console.log('窗口失去焦点，当前图片数量:', pendingImages.length);
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, [pendingImages.length]);

    return (
        <div className="space-y-2">
            <SimpleRichTextEditor
                content={value}
                onChange={onChange}
                placeholder={placeholder}
                className={className}
                onImageChange={onImageChange}
                deferImageUpload={true} // 延迟上传，在保存时统一处理
                onPendingImagesChange={handlePendingImagesChange}
            />

            {/* 图片预览区域 */}
            {pendingImages.length > 0 && (
                <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue}>
                    <AccordionItem value="preview" data-accordion-item="preview">
                        <AccordionTrigger className="text-sm font-medium py-1">
                            图片预览 ({pendingImages.length})
                        </AccordionTrigger>
                        <AccordionContent>
                            <PhotoProvider>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
                                    {pendingImages.map((image, index) => {
                                        console.log(`渲染图片 ${index}:`, image.localUrl);
                                        return (
                                            <PhotoView key={index} src={image.localUrl}>
                                                <div className="cursor-pointer relative group">
                                                    <Image
                                                        src={image.localUrl}
                                                        alt={`预览图片 ${index + 1}`}
                                                        width={120}
                                                        height={120}
                                                        className="w-full h-24 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:opacity-80 transition-opacity"
                                                        onLoad={() => console.log(`图片 ${index} 加载成功`)}
                                                        onError={() => console.log(`图片 ${index} 加载失败`)}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="bg-black bg-opacity-50 rounded-full p-2">
                                                            <Eye className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </PhotoView>
                                        );
                                    })}
                                </div>
                            </PhotoProvider>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </div>
    );
};
