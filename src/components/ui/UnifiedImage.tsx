"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CapsuleButton } from './CapsuleButton';
import { X, Eye, Cloud, FileImage, Upload, Image as ImageIcon } from 'lucide-react';
import { supabaseImageManager } from '@/lib/supabaseImageManager';
import { useNotification } from '@/components/magicui/NotificationProvider';
import Image from 'next/image';
import { MixedText } from './MixedText';
import { SupabaseImageSelectorDialog } from './SupabaseImageSelectorDialog';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import { usePasteContext } from '@/contexts/PasteContext';

interface UnifiedImageProps {
    value?: string; // 当前选中的图片ID
    onChange?: (imageId: string | undefined) => void;
    className?: string;
    mode?: 'upload' | 'select' | 'combined'; // 上传模式
    size?: 'sm' | 'md' | 'lg'; // 组件大小
}

export const UnifiedImage: React.FC<UnifiedImageProps> = ({
    value,
    onChange,
    className = '',
    mode = 'combined',
    size = 'md'
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const componentId = useRef(`unified-image-${Math.random().toString(36).substr(2, 9)}`);

    const { notify } = useNotification();
    const { registerPasteHandler, unregisterPasteHandler, setActiveHandler } = usePasteContext();

    // 处理文件上传
    const handleFileUpload = useCallback(async (file: File) => {
        // 文件类型验证
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

        setIsLoading(true);
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

            if (errorMessage.includes('RLS') || errorMessage.includes('权限不足')) {
                notify({
                    type: "error",
                    message: "权限配置问题",
                    description: "请检查 Supabase 存储桶配置"
                });
            } else {
                notify({
                    type: "error",
                    message: "上传失败",
                    description: errorMessage
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [onChange, notify]);

    // 处理粘贴图片
    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    await handleFileUpload(file);
                    break;
                }
            }
        }
    }, [handleFileUpload]);

    // 注册粘贴处理器
    useEffect(() => {
        const currentComponentId = componentId.current;
        const currentComponentRef = componentRef.current;

        registerPasteHandler(currentComponentId, handlePaste);

        // 同时添加直接的事件监听器作为备用
        const handleDirectPaste = (e: ClipboardEvent) => {
            handlePaste(e);
        };

        if (currentComponentRef) {
            currentComponentRef.addEventListener('paste', handleDirectPaste);
        }

        return () => {
            unregisterPasteHandler(currentComponentId);

            if (currentComponentRef) {
                currentComponentRef.removeEventListener('paste', handleDirectPaste);
            }
        };
    }, [registerPasteHandler, unregisterPasteHandler, handlePaste]);

    // 加载预览图片
    useEffect(() => {
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

        if (isLoading) return;

        const files = Array.from(e.dataTransfer.files);
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

    // 仅移除当前选择，不进行云端删除
    const handleRemoveImage = async () => {
        setPreviewUrl(null);
        onChange?.(undefined);
        notify({
            type: "success",
            message: "已移除图片",
            description: "仅取消本次选择，不会删除云端文件"
        });
    };

    // 预览图片
    const handlePreview = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        }
    };

    // 处理图片选择
    const handleImageSelected = (imageId: string) => {
        onChange?.(imageId);
        const cloudUrl = supabaseImageManager.getImageUrl(imageId);
        if (cloudUrl) {
            setPreviewUrl(cloudUrl);
        }
        notify({
            type: "success",
            message: "图片选择成功",
            description: "已从云端选择图片"
        });
    };

    const sizeClasses = {
        sm: 'max-h-32',
        md: 'max-h-48',
        lg: 'max-h-64'
    };

    return (
        <div
            ref={componentRef}
            data-unified-image="true"
            data-component-id={componentId.current}
            className={`space-y-2 ${className}`}
            tabIndex={0}
            onFocus={() => {
                setActiveHandler(componentId.current);
            }}
            onBlur={() => {
                setActiveHandler(null);
            }}
            onClick={(e) => {
                // 阻止事件冒泡，避免触发表单验证
                e.stopPropagation();
                setActiveHandler(componentId.current);
            }}
        >
            {/* 图片上传区域 */}
            {!previewUrl && (
                <div className="space-y-3">
                    {/* 上传区域 */}
                    {(mode === 'upload' || mode === 'combined') && (
                        <div
                            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors relative ${isDragOver
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {isLoading ? (
                                <div className="flex flex-col items-center space-y-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p className="text-sm text-gray-600">
                                        <MixedText text="正在上传..." />
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="flex flex-col items-center space-y-1">
                                        <FileImage className="h-6 w-6 text-gray-400" />
                                        <div className="text-center">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                <MixedText text="拖拽或粘贴图片" />
                                            </p>
                                        </div>
                                    </div>

                                    {/* 按钮区域 */}
                                    <div
                                        className="flex flex-col sm:flex-row gap-2 w-full max-w-80"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* 本地选择按钮 */}
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                disabled={isLoading}
                                                id={`file-input-${componentId.current}`}
                                            />
                                            <div className="w-full">
                                                <InteractiveHoverButton
                                                    hoverColor="#65a30d"
                                                    className="w-full text-xs py-1.5"
                                                    icon={<Upload className="w-3 h-3" />}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        document.getElementById(`file-input-${componentId.current}`)?.click();
                                                    }}
                                                >
                                                    <MixedText text="从本地选择" />
                                                </InteractiveHoverButton>
                                            </div>
                                        </div>

                                        {/* 云端选择按钮 */}
                                        {mode !== 'upload' && (
                                            <div className="flex-1">
                                                <SupabaseImageSelectorDialog
                                                    onImageSelected={handleImageSelected}
                                                    trigger={
                                                        <InteractiveHoverButton
                                                            hoverColor="#0284c7"
                                                            className="w-full text-xs py-1.5"
                                                            icon={<Cloud className="w-3 h-3" />}
                                                            type="button"
                                                        >
                                                            <MixedText text="从云端选择" />
                                                        </InteractiveHoverButton>
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>


                                </div>
                            )}
                        </div>
                    )}

                    {/* 选择按钮 - 移除这个重复的部分 */}
                    {/* {(mode === 'select' || mode === 'combined') && (
                        <div className="flex justify-center">
                            <Button
                                onClick={() => setShowSelector(true)}
                                variant="outline"
                                disabled={isLoading}
                                className="flex items-center gap-2 w-48"
                            >
                                <ImageIcon className="h-4 w-4" />
                                <MixedText text="从云端选择图片" />
                            </Button>
                        </div>
                    )} */}
                </div>
            )}

            {/* 图片预览区域 */}
            {previewUrl && (
                <>
                    <div className="relative">
                        <div className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-800">
                            <Image
                                src={previewUrl}
                                alt="图片预览"
                                className={`max-w-full object-contain rounded ${sizeClasses[size]}`}
                                width={400}
                                height={200}
                            />
                            {/* 存储位置指示器 */}
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Cloud className="h-4 w-4 text-blue-600" />
                                <span><MixedText text="图片来源: 云端存储" /></span>
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="absolute top-2 right-2 flex gap-1">
                            <CapsuleButton
                                size="sm"
                                variant="secondary"
                                onClick={handlePreview}
                                className="h-8 w-8 p-0"
                            >
                                <Eye className="h-4 w-4" />
                            </CapsuleButton>
                            <CapsuleButton
                                size="sm"
                                variant="destructive"
                                onClick={handleRemoveImage}
                                disabled={isDeleting}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </CapsuleButton>
                        </div>
                    </div>

                    {/* 重新上传/选择按钮 */}
                    <div
                        className="flex gap-1 justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(mode === 'upload' || mode === 'combined') && (
                            <CapsuleButton
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                <MixedText text="重新上传" />
                            </CapsuleButton>
                        )}
                        {(mode === 'select' || mode === 'combined') && (
                            <SupabaseImageSelectorDialog
                                onImageSelected={handleImageSelected}
                                trigger={
                                    <CapsuleButton
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2"
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                        <MixedText text="重新选择" />
                                    </CapsuleButton>
                                }
                            />
                        )}
                    </div>
                </>
            )}

            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
            />

            {/* 图片选择对话框（已通过 trigger 集成，无需额外渲染） */}
        </div>
    );
}; 