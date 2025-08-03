"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Eye, Cloud, FileImage } from 'lucide-react';
import { supabaseImageManager } from '@/lib/supabaseImageManager';
import { useNotification } from '@/components/magicui/NotificationProvider';
import Image from 'next/image';
import { MixedText } from './MixedText';

interface SupabaseImageUploadProps {
    value?: string; // 当前选中的图片ID
    onChange?: (imageId: string | undefined) => void;
    className?: string;
}

export const SupabaseImageUpload: React.FC<SupabaseImageUploadProps> = ({
    value,
    onChange,
    className = ''
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { notify } = useNotification();

    // 加载预览图片
    React.useEffect(() => {
        if (value) {
            loadPreviewImage(value);
        } else {
            setPreviewUrl(null);
        }
    }, [value]);

    const loadPreviewImage = async (imageId: string) => {
        try {
            const imageUrl = supabaseImageManager.getImageUrl(imageId);
            if (imageUrl) {
                setPreviewUrl(imageUrl);
            }
        } catch (error) {
            console.error('加载预览图片失败:', error);
        }
    };

    // 处理文件上传
    const handleFileUpload = useCallback(async (file: File) => {
        // 改进的文件类型验证
        const isImageByMime = file.type.startsWith('image/');
        const isImageByExtension = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);

        if (!isImageByMime && !isImageByExtension) {
            notify({
                type: "error",
                message: "文件类型错误",
                description: "请选择图片文件"
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            notify({
                type: "error",
                message: "文件过大",
                description: "图片大小不能超过5MB"
            });
            return;
        }

        setIsUploading(true);
        try {
            const imageInfo = await supabaseImageManager.uploadImage(file);
            onChange?.(imageInfo.id);
            setPreviewUrl(imageInfo.url);

            notify({
                type: "success",
                message: "图片上传成功",
                description: "图片已上传到云端存储"
            });
        } catch (error) {
            console.error('上传失败:', error);
            const errorMessage = error instanceof Error ? error.message : "图片上传失败";

            // 如果是 RLS 错误，提供更友好的提示
            if (errorMessage.includes('RLS') || errorMessage.includes('权限不足')) {
                notify({
                    type: "error",
                    message: "权限配置问题",
                    description: "请检查 Supabase 存储桶配置。参考 SUPABASE_RLS_FIX.sql 文件。"
                });
            } else {
                notify({
                    type: "error",
                    message: "上传失败",
                    description: errorMessage
                });
            }
        } finally {
            setIsUploading(false);
        }
    }, [onChange, notify]);

    // 处理文件选择
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    // 处理拖拽
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        // 如果正在上传，忽略拖拽
        if (isUploading) {
            // 正在上传中，忽略拖拽操作
            return;
        }

        const files = Array.from(e.dataTransfer.files);
        // 拖拽的文件信息

        // 改进的文件类型检查：不仅检查MIME类型，还检查文件扩展名
        const imageFile = files.find(file => {
            const isImageByMime = file.type.startsWith('image/');
            const isImageByExtension = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);
            return isImageByMime || isImageByExtension;
        });

        if (imageFile) {
            handleFileUpload(imageFile);
        } else {
            notify({ type: "error", message: "请拖拽图片文件" });
        }
    };

    // 处理图片删除
    const handleRemoveImage = async () => {
        if (value) {
            setIsDeleting(true);
            try {
                await supabaseImageManager.deleteImage(value);
                notify({
                    type: "success",
                    message: "图片删除成功",
                    description: "图片已从云端删除"
                });
            } catch (error) {
                console.error('删除失败:', error);
                notify({
                    type: "error",
                    message: "删除失败",
                    description: "无法删除图片"
                });
            } finally {
                setIsDeleting(false);
            }
        }
        setPreviewUrl(null);
        onChange?.(undefined);
    };

    // 预览图片
    const handlePreview = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* 图片上传区域 */}
            {!previewUrl && (
                <div className="space-y-3">
                    {/* 上传区域 */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="flex flex-col items-center space-y-2">
                            <FileImage className="h-8 w-8 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    拖拽图片到此处，或
                                </p>
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                    <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                        点击选择文件
                                    </span>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">
                                支持 JPG、PNG、GIF 格式，最大 5MB
                            </p>
                        </div>
                    </div>

                    {/* 上传进度 */}
                    {isUploading && (
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                            <div className="animate-spin rounded-full h-4 w-4" style={{ border: '2px solid #e5e7eb', borderTop: '2px solid #2563eb' }}></div>
                            <span><MixedText text="正在上传图片..." /></span>
                        </div>
                    )}
                </div>
            )}

            {/* 图片预览和操作 */}
            {previewUrl && (
                <>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePreview}
                            className="flex items-center gap-2"
                        >
                            <Eye className="h-4 w-4" />
                            预览图片
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveImage}
                            disabled={isDeleting}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4" style={{ border: '2px solid #e5e7eb', borderTop: '2px solid #dc2626' }}></div>
                                    删除中...
                                </>
                            ) : (
                                <>
                                    <X className="h-4 w-4" />
                                    删除图片
                                </>
                            )}
                        </Button>
                    </div>

                    {/* 图片预览 */}
                    <div className="relative">
                        <div className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-800">
                            <Image
                                src={previewUrl}
                                alt="图片预览"
                                className="max-w-full max-h-48 object-contain rounded"
                                width={400}
                                height={200}
                            />
                            {/* 存储位置指示器 */}
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Cloud className="h-4 w-4 text-blue-600" />
                                <span><MixedText text="图片来源: 云端存储" /></span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}; 