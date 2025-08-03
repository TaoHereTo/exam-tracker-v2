"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Eye, HardDrive, Image as LucideImage, ZoomIn, ZoomOut, RotateCcw, Cloud, Upload } from 'lucide-react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { staticImageManager } from '@/lib/staticImageManager';
import { StaticImageInfo } from '@/lib/staticImageManager';
import { supabaseImageManager } from '@/lib/supabaseImageManager';
import { SupabaseImageInfo } from '@/lib/supabaseImageManager';
import { SupabaseImageSelectorDialog } from './SupabaseImageSelectorDialog';
import { useNotification } from '@/components/magicui/NotificationProvider';
import { ConfettiLoading } from './LoadingSpinner';
import { MixedText } from './MixedText';
import Image from 'next/image';
import { usePasteContext } from '@/contexts/PasteContext';

interface UnifiedImageProps {
    // 基础属性
    value?: string; // 当前选中的图片ID
    onChange?: (imageId: string | undefined) => void;
    className?: string;

    // 模式控制
    mode?: 'upload' | 'viewer' | 'combined'; // 组件模式

    // 查看器模式属性
    size?: 'sm' | 'md' | 'lg'; // 查看器按钮大小

    // 组合模式属性
    defaultMode?: 'upload' | 'viewer'; // 组合模式下的默认模式
}

export const UnifiedImage: React.FC<UnifiedImageProps> = ({
    value,
    onChange,
    className = '',
    mode = 'combined',
    size = 'sm',

}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [imageData, setImageData] = useState<string | null>(null);
    const [imageInfo, setImageInfo] = useState<StaticImageInfo | SupabaseImageInfo | null>(null);
    const [imageSource, setImageSource] = useState<'local' | 'cloud'>('local');
    const [isLoading, setIsLoading] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessingPaste, setIsProcessingPaste] = useState(false);

    const dragAreaRef = useRef<HTMLDivElement>(null);
    const componentId = useRef<string>(`unified-image-${Date.now()}-${Math.random()}`);

    const { notify } = useNotification();
    const { registerPasteHandler, unregisterPasteHandler } = usePasteContext();

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
            // 优先尝试从云端加载
            const cloudUrl = supabaseImageManager.getImageUrl(imageId);
            if (cloudUrl) {
                setPreviewUrl(cloudUrl);
                setImageSource('cloud');
                return;
            }

            // 如果云端没有，再尝试从本地加载
            const localUrl = staticImageManager.getImagePreviewUrl(imageId);
            if (localUrl) {
                setPreviewUrl(localUrl);
                setImageSource('local');
                return;
            }
        } catch {
        }
    };

    // 处理图片选择
    const handleImageSelected = (imageId: string) => {
        onChange?.(imageId);
        setImageSource('cloud');
        // 直接设置预览URL，避免loadPreviewImage函数干扰
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

    // 处理文件上传（通用函数）
    const handleFileUpload = useCallback(async (file: File) => {
        if (!file) return;

        // 改进的文件类型验证
        const isImageByMime = file.type.startsWith('image/');
        const isImageByExtension = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);

        if (!isImageByMime && !isImageByExtension) {
            notify({ type: "error", message: "文件类型错误", description: "请选择图片文件" });
            return;
        }

        // 检查文件大小（5MB限制）
        if (file.size > 5 * 1024 * 1024) {
            notify({ type: "error", message: "文件过大", description: "图片大小不能超过5MB" });
            return;
        }

        try {
            setIsLoading(true);
            // 上传到Supabase，保持原始文件名
            const imageInfo = await supabaseImageManager.uploadImage(file);
            if (imageInfo) {
                onChange?.(imageInfo.id);
                // 保持在本地上传tab，不切换到云端选择
                setImageSource('local');
                // 直接设置预览URL，避免loadPreviewImage函数切换tab
                setPreviewUrl(imageInfo.url);
                notify({ type: "success", message: "图片上传成功" });
            } else {
                notify({ type: "error", message: "图片上传失败", description: "上传返回了空结果" });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "图片上传失败";
            notify({ type: "error", message: "图片上传失败", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [notify, onChange]);

    // 处理本地上传
    const handleLocalUpload = async () => {
        try {
            // 创建文件输入元素
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = false;

            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    await handleFileUpload(file);
                }
            };

            input.click();
        } catch {
            notify({ type: "error", message: "选择文件失败" });
        }
    };

    // 处理云端选择
    const handleCloudSelect = () => {
        // 触发隐藏的云端选择对话框
        const trigger = document.querySelector('[data-cloud-select-trigger]') as HTMLElement;
        if (trigger) {
            trigger.click();
        }
    };

    // 重写的粘贴事件监听 - 简化逻辑，避免重复处理
    const handlePasteEvent = useCallback(async (e: React.ClipboardEvent<HTMLDivElement> | ClipboardEvent) => {
        // 防止重复处理
        if (isProcessingPaste) {
            return;
        }

        // 检查是否在输入框中粘贴，如果是则不处理
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
            return;
        }

        // 获取clipboardData
        const clipboardData = (e as ClipboardEvent).clipboardData;
        if (!clipboardData) {
            return;
        }

        // 设置处理状态
        setIsProcessingPaste(true);

        try {
            let imageFound = false;

            // 首先检查传统的 clipboardData.items
            if (clipboardData.items && clipboardData.items.length > 0) {
                const items = Array.from(clipboardData.items) as DataTransferItem[];

                for (const item of items) {
                    if (item.kind === 'file' && item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file && file.size > 0) {
                            if ('preventDefault' in e) e.preventDefault();
                            await handleFileUpload(file);
                            imageFound = true;
                            break;
                        }
                    }
                }
            }

            // 如果items中没有找到，检查files
            if (!imageFound && clipboardData.files && clipboardData.files.length > 0) {
                const files = Array.from(clipboardData.files) as File[];

                for (const file of files) {
                    if (file.type.startsWith('image/') && file.size > 0) {
                        if ('preventDefault' in e) e.preventDefault();
                        await handleFileUpload(file);
                        imageFound = true;
                        break;
                    }
                }
            }

            // 如果传统方法都失败，尝试现代 Clipboard API
            if (!imageFound && navigator.clipboard && navigator.clipboard.read) {
                try {
                    const clipboardItems = await navigator.clipboard.read();
                    for (const clipboardItem of clipboardItems) {
                        // 尝试常见的图片类型
                        const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

                        for (const type of imageTypes) {
                            if (clipboardItem.types.includes(type)) {
                                try {
                                    const blob = await clipboardItem.getType(type);
                                    if (blob.size > 0) {
                                        const extension = type.split('/')[1] || 'png';
                                        const fileName = `pasted-image-${Date.now()}.${extension}`;
                                        const file = new File([blob], fileName, { type });

                                        if ('preventDefault' in e) e.preventDefault();
                                        await handleFileUpload(file);
                                        imageFound = true;
                                        break;
                                    }
                                } catch (error) {
                                }
                            }
                        }

                        if (imageFound) break;
                    }
                } catch (clipboardError) {
                }
            }

            if (!imageFound) {
                // 只在真正没有找到图片时才显示错误通知
                notify({
                    type: "error",
                    message: "剪贴板中没有图片",
                    description: "请确保已复制图片文件到剪贴板，或尝试截图后粘贴"
                });
            }
        } catch (error) {
            notify({
                type: "error",
                message: "粘贴失败",
                description: "处理粘贴内容时发生错误，请重试"
            });
        } finally {
            // 重置处理状态
            setIsProcessingPaste(false);
        }
    }, [handleFileUpload, notify, isProcessingPaste]);

    // 注册粘贴处理器到Context
    useEffect(() => {
        const handleGlobalPaste = async (e: ClipboardEvent) => {
            // 转换为React事件并处理
            const reactEvent = e as unknown as React.ClipboardEvent<HTMLDivElement>;
            await handlePasteEvent(reactEvent);
        };

        const currentComponentId = componentId.current;
        registerPasteHandler(currentComponentId, handleGlobalPaste);

        return () => {
            unregisterPasteHandler(currentComponentId);
        };
    }, [handlePasteEvent, registerPasteHandler, unregisterPasteHandler]);



    // 拖拽相关处理函数
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // 只有当离开拖拽区域时才设置isDragOver为false
        if (!dragAreaRef.current?.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // 处理拖拽放置
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (isLoading) {
            return;
        }

        const files = Array.from(e.dataTransfer.files);

        // 改进的文件类型检查：不仅检查MIME类型，还检查文件扩展名
        const imageFile = files.find(file => {
            const isImageByMime = file.type.startsWith('image/');
            const isImageByExtension = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);
            return isImageByMime || isImageByExtension;
        });

        if (imageFile) {
            try {
                await handleFileUpload(imageFile);
            } catch (error) {
                // 错误处理已在 handleFileUpload 中完成
            }
        } else {
            notify({ type: "error", message: "请拖拽图片文件" });
        }
    };

    // 处理图片删除
    const handleRemoveImage = async () => {
        // 只是取消选择，不删除图片
        setPreviewUrl(null);
        onChange?.(undefined);
    };

    // 预览图片
    const handlePreview = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        }
    };

    // 查看器相关
    useEffect(() => {
        const loadImageData = async () => {
            if (!value) return;
            setIsLoading(true);
            try {
                // 尝试从云端加载
                const cloudUrl = supabaseImageManager.getImageUrl(value);
                const cloudInfo = supabaseImageManager.getImageInfo(value);

                if (cloudUrl && cloudInfo) {
                    setImageData(cloudUrl);
                    setImageInfo(cloudInfo);
                    setImageSource('cloud');
                    setZoom(1);
                    setRotation(0);
                    setIsLoading(false);
                    return;
                }

                // 尝试从本地加载
                const localUrl = staticImageManager.getImagePreviewUrl(value);
                const localInfo = staticImageManager.getImageInfo(value);

                if (localUrl && localInfo) {
                    setImageData(localUrl);
                    setImageInfo(localInfo);
                    setImageSource('local');
                    setZoom(1);
                    setRotation(0);
                    setIsLoading(false);
                    return;
                }

                setIsLoading(false);
            } catch (error) {
                setIsLoading(false);
            }
        };
        if (value && isViewerOpen) {
            loadImageData();
        }
    }, [value, isViewerOpen]);

    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-10 w-10'
    };

    // 渲染上传模式
    const renderUploadMode = () => (
        <div
            className={`${className}`}
            tabIndex={0}
            data-unified-image="true"
            data-component-id={componentId.current}
        >
            {/* 图片选择区域 */}
            <div className="space-y-5">
                {/* Tab切换：本地上传 vs 云端选择 */}
                <div className="flex border rounded-lg p-0.5 bg-gray-50 dark:bg-gray-800">
                    <button
                        type="button"
                        onClick={() => {
                            setImageSource('local');
                        }}
                        className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all active:scale-95 ${imageSource === 'local'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                    >
                        <HardDrive className="h-4 w-4 inline mr-2" />
                        <MixedText text="本地上传" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setImageSource('cloud');
                        }}
                        className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all active:scale-95 ${imageSource === 'cloud'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                    >
                        <Cloud className="h-4 w-4 inline mr-2" />
                        <MixedText text="云端选择" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {imageSource === 'local' ? (
                        // 本地上传功能 - 只有没有预览图片时才显示拖拽区域
                        <div className="w-full flex justify-center">
                            {!previewUrl && (
                                <div
                                    ref={dragAreaRef}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onMouseEnter={() => {
                                        // 鼠标悬停时让虚线框获得焦点，以便接收粘贴事件
                                        dragAreaRef.current?.focus();
                                    }}
                                    tabIndex={0}
                                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer w-full max-w-md h-32 flex flex-col items-center justify-center focus:outline-none ${isDragOver
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                        } ${isLoading ? 'opacity-50' : ''}`}
                                    onClick={handleLocalUpload}
                                    style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="mx-auto mb-3">
                                                <ConfettiLoading />
                                            </div>
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                                                <MixedText text="正在上传图片..." />
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                <MixedText text="请稍候，不要关闭页面" />
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                <MixedText text="点击选择或拖拽图片上传" />
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                <MixedText text="支持通过快捷键粘贴上传" />
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        // 云端选择功能 - 只有没有预览图片时才显示云端选择虚线框
                        <div className="w-full flex justify-center">
                            {!previewUrl && (
                                <div
                                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer w-full max-w-md h-32 flex flex-col items-center justify-center focus:outline-none ${isLoading ? 'opacity-50' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}
                                    onClick={handleCloudSelect}
                                    style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="mx-auto mb-3">
                                                <ConfettiLoading />
                                            </div>
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                                                <MixedText text="正在加载图片..." />
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                <MixedText text="请稍候，不要关闭页面" />
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <LucideImage className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                <MixedText text="点击从云端选择图片" />
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                <MixedText text="从云端存储中选择已有图片" />
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 预览和取消按钮，只在有图片时显示 */}
                    {previewUrl && (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handlePreview}
                                className="flex items-center gap-2"
                            >
                                <Eye className="h-4 w-4" />
                                <MixedText text="预览图片" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveImage}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700"
                            >
                                <X className="h-4 w-4" />
                                <MixedText text="取消选择" />
                            </Button>
                        </>
                    )}
                </div>

                {/* 图片预览 */}
                {previewUrl && (
                    <div className="relative">
                        <div className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-800">
                            <Image
                                src={previewUrl}
                                alt="图片预览"
                                className="max-w-full max-h-48 object-contain rounded"
                                width={400}
                                height={200}
                                onError={(e) => {
                                    // 图片加载失败时的处理
                                    const target = e.target as HTMLImageElement;
                                    target.style.backgroundColor = '#f3f4f6';
                                    target.style.display = 'flex';
                                    target.style.alignItems = 'center';
                                    target.style.justifyContent = 'center';
                                    target.style.color = '#6b7280';
                                    target.style.fontSize = '12px';
                                    target.textContent = '图片加载失败';
                                    // 不抛出console.error，避免页面报错
                                }}
                            />
                            {/* 存储位置指示器 */}
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                {imageSource === 'cloud' ? (
                                    <>
                                        <Cloud className="h-4 w-4 text-blue-600" />
                                        <span><MixedText text="图片来源: 云端存储" /></span>
                                    </>
                                ) : (
                                    <>
                                        <HardDrive className="h-4 w-4 text-green-600" />
                                        <span><MixedText text="图片来源: 本地文件夹" /></span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 隐藏的云端选择对话框 */}
            <SupabaseImageSelectorDialog
                onImageSelected={handleImageSelected}
                trigger={<div data-cloud-select-trigger style={{ display: 'none' }} />}
            />
        </div>
    );

    // 渲染查看器模式
    const renderViewerMode = () => {
        if (!value) return null;

        return (
            <Drawer open={isViewerOpen} onOpenChange={setIsViewerOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DrawerTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={`p-1 min-w-0 w-8 h-8 ${className}`}
                            >
                                <LucideImage className={sizeClasses[size]} />
                            </Button>
                        </DrawerTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p><MixedText text="查看图片" /></p>
                    </TooltipContent>
                </Tooltip>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-2xl h-[80vh] flex flex-col">
                        <DrawerHeader className="flex-shrink-0">
                            <DrawerTitle className="text-center">
                                <MixedText text={imageInfo?.originalName || imageInfo?.fileName || '图片预览'} />
                            </DrawerTitle>
                            <DrawerDescription className="text-center">
                                <MixedText text="查看和操作图片，支持缩放、旋转等功能" />
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="flex-1 p-6 overflow-hidden">
                            {isLoading ? (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 flex justify-center items-center">
                                        <ConfettiLoading />
                                    </div>
                                </div>
                            ) : imageData ? (
                                <div className="flex flex-col h-full">
                                    {/* 图片显示区域 */}
                                    <div className="flex-1 flex justify-center items-center overflow-hidden">
                                        <div className="relative">
                                            <Image
                                                src={imageData}
                                                alt="图片预览"
                                                className="max-w-full max-h-[45vh] object-contain rounded-lg shadow-lg transition-transform duration-200"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '45vh',
                                                    width: 'auto',
                                                    height: 'auto',
                                                    transform: `scale(${zoom}) rotate(${rotation}deg)`
                                                }}
                                                width={600}
                                                height={400}
                                                onError={(e) => {
                                                    // 图片加载失败时的处理
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.backgroundColor = '#f3f4f6';
                                                    target.style.display = 'flex';
                                                    target.style.alignItems = 'center';
                                                    target.style.justifyContent = 'center';
                                                    target.style.color = '#6b7280';
                                                    target.style.fontSize = '14px';
                                                    target.textContent = '图片加载失败';
                                                    // 不抛出console.error，避免页面报错
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* 图片控制按钮 */}
                                    <div className="flex items-center justify-center gap-2 py-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                                            disabled={zoom <= 0.5}
                                        >
                                            <ZoomOut className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[60px] text-center">
                                            {Math.round(zoom * 100)}%
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setZoom(Math.min(3, zoom + 0.2))}
                                            disabled={zoom >= 3}
                                        >
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRotation(rotation + 90)}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setZoom(1);
                                                setRotation(0);
                                            }}
                                        >
                                            <MixedText text="重置" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 flex justify-center items-center">
                                        <div className="text-gray-500"><MixedText text="图片信息丢失，请重新选择图片" /></div>
                                    </div>
                                </div>
                            )}

                            {imageInfo && (
                                <div className="mt-4 text-center text-sm text-gray-500 pt-4">
                                    <p className="font-medium"><MixedText text={imageInfo.originalName || imageInfo.fileName || '未知文件'} /></p>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        {imageSource === 'cloud' ? (
                                            <>
                                                <Cloud className="h-4 w-4 text-blue-600" />
                                                <span><MixedText text="图片来源: 云端存储" /></span>
                                            </>
                                        ) : (
                                            <>
                                                <HardDrive className="h-4 w-4 text-green-600" />
                                                <span><MixedText text="图片来源: 本地文件夹" /></span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    };

    // 根据模式渲染不同内容
    switch (mode) {
        case 'upload':
            return renderUploadMode();
        case 'viewer':
            return renderViewerMode();
        default:
            return renderUploadMode();
    }
}; 