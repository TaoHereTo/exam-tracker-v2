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
import { LoadingSpinner } from './LoadingSpinner';
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
        } catch (error) {
            console.error('加载预览图片失败:', error);
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
            console.log('开始上传文件:', file.name, file.type, file.size);
            console.log('文件详细信息:', {
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified
            });

            // 上传到Supabase，保持原始文件名
            console.log('调用 supabaseImageManager.uploadImage...');
            const imageInfo = await supabaseImageManager.uploadImage(file);
            console.log('上传结果:', imageInfo);

            if (imageInfo) {
                console.log('上传成功，设置图片信息');
                onChange?.(imageInfo.id);
                // 保持在本地上传tab，不切换到云端选择
                setImageSource('local');
                // 直接设置预览URL，避免loadPreviewImage函数切换tab
                setPreviewUrl(imageInfo.url);
                notify({ type: "success", message: "图片上传成功" });
            } else {
                console.error('上传返回了空结果');
                notify({ type: "error", message: "图片上传失败", description: "上传返回了空结果" });
            }
        } catch (error) {
            console.error('上传失败:', error);
            console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
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
        } catch (error) {
            console.error('选择文件失败:', error);
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
        console.log('=== UnifiedImage 粘贴事件触发 ===');

        // 防止重复处理
        if (isProcessingPaste) {
            console.log('正在处理粘贴事件，跳过重复处理');
            return;
        }

        // 检查是否在输入框中粘贴，如果是则不处理
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
            console.log('在输入框中粘贴，跳过处理');
            return;
        }

        // 获取clipboardData
        const clipboardData = (e as ClipboardEvent).clipboardData;
        if (!clipboardData) {
            console.log('没有clipboardData，跳过处理');
            return;
        }

        // 设置处理状态
        setIsProcessingPaste(true);

        console.log('开始处理图片粘贴');
        console.log('clipboardData.items:', clipboardData.items?.length || 0);
        console.log('clipboardData.files:', clipboardData.files?.length || 0);

        try {
            let imageFound = false;

            // 首先检查传统的 clipboardData.items
            if (clipboardData.items && clipboardData.items.length > 0) {
                console.log('检查 clipboardData.items...');
                const items = Array.from(clipboardData.items) as DataTransferItem[];

                for (const item of items) {
                    console.log('检查item:', item.type, item.kind);

                    if (item.kind === 'file' && item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file && file.size > 0) {
                            console.log('找到图片文件:', file.name, file.type, file.size);
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
                console.log('检查 clipboardData.files...');
                const files = Array.from(clipboardData.files) as File[];

                for (const file of files) {
                    console.log('检查file:', file.name, file.type, file.size);

                    if (file.type.startsWith('image/') && file.size > 0) {
                        console.log('找到图片文件:', file.name, file.type, file.size);
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
                    console.log('尝试现代 Clipboard API...');
                    const clipboardItems = await navigator.clipboard.read();
                    console.log('Clipboard API 项目数量:', clipboardItems.length);

                    for (const clipboardItem of clipboardItems) {
                        console.log('Clipboard 项目类型:', clipboardItem.types);

                        // 尝试常见的图片类型
                        const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

                        for (const type of imageTypes) {
                            if (clipboardItem.types.includes(type)) {
                                try {
                                    const blob = await clipboardItem.getType(type);
                                    if (blob.size > 0) {
                                        console.log(`找到图片内容，类型: ${type}，大小: ${blob.size} 字节`);
                                        const extension = type.split('/')[1] || 'png';
                                        const fileName = `pasted-image-${Date.now()}.${extension}`;
                                        const file = new File([blob], fileName, { type });

                                        if ('preventDefault' in e) e.preventDefault();
                                        await handleFileUpload(file);
                                        imageFound = true;
                                        break;
                                    }
                                } catch (error) {
                                    console.log(`获取类型 ${type} 失败:`, error);
                                }
                            }
                        }

                        if (imageFound) break;
                    }
                } catch (clipboardError) {
                    console.log('Clipboard API 失败:', clipboardError);
                }
            }

            if (!imageFound) {
                console.log('没有找到图片内容');
                // 只在真正没有找到图片时才显示错误通知
                notify({
                    type: "error",
                    message: "剪贴板中没有图片",
                    description: "请确保已复制图片文件到剪贴板，或尝试截图后粘贴"
                });
            }
        } catch (error) {
            console.error('粘贴处理失败:', error);
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
        console.log('拖拽进入区域');
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('拖拽离开区域');
        // 只有当离开拖拽区域时才设置isDragOver为false
        if (!dragAreaRef.current?.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        // 如果正在加载，忽略拖拽
        if (isLoading) {
            console.log('正在加载中，忽略拖拽操作');
            return;
        }

        console.log('=== 拖拽调试信息 ===');
        console.log('拖拽事件触发 - 文件数量:', e.dataTransfer.files.length);
        console.log('当前imageSource:', imageSource);
        console.log('当前previewUrl:', previewUrl);
        console.log('拖拽事件对象:', e);
        console.log('dataTransfer对象:', e.dataTransfer);

        const files = Array.from(e.dataTransfer.files);
        console.log('拖拽的文件:', files.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            lastModified: f.lastModified
        })));

        // 改进的文件类型检查：不仅检查MIME类型，还检查文件扩展名
        const imageFile = files.find(file => {
            const isImageByMime = file.type.startsWith('image/');
            const isImageByExtension = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);
            console.log(`文件 ${file.name} 检查结果:`, {
                isImageByMime,
                isImageByExtension,
                mimeType: file.type,
                extension: file.name.split('.').pop()
            });
            return isImageByMime || isImageByExtension;
        });

        console.log('找到的图片文件:', imageFile);

        if (imageFile) {
            console.log('开始上传拖拽的图片:', imageFile.name);
            try {
                await handleFileUpload(imageFile);
                console.log('拖拽上传完成');
            } catch (error) {
                console.error('拖拽上传过程中发生错误:', error);
            }
        } else {
            console.log('没有找到有效的图片文件');
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
                console.error('加载图片失败:', error);
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
            className={`space-y-4 ${className}`}
            tabIndex={0}
            data-unified-image="true"
            data-component-id={componentId.current}
        >
            {/* 图片选择区域 */}
            <div className="space-y-3">
                {/* Tab切换：本地上传 vs 云端选择 */}
                <div className="flex border rounded-lg p-0.5 bg-gray-50 dark:bg-gray-800">
                    <button
                        type="button"
                        onClick={() => {
                            setImageSource('local');
                        }}
                        className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${imageSource === 'local'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                    >
                        <HardDrive className="h-4 w-4 inline mr-2" />
                        本地上传
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setImageSource('cloud');
                        }}
                        className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${imageSource === 'cloud'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                    >
                        <Cloud className="h-4 w-4 inline mr-2" />
                        云端选择
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
                                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer w-full max-w-md h-32 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isDragOver
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                        } ${isLoading ? 'opacity-50' : ''}`}
                                    onClick={handleLocalUpload}
                                    style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="mx-auto mb-3">
                                                <LoadingSpinner size="lg" />
                                            </div>
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                                                正在上传图片...
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                请稍候，不要关闭页面
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                点击选择或拖拽图片上传
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                支持通过快捷键粘贴上传
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
                                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer w-full max-w-md h-32 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isLoading ? 'opacity-50' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}
                                    onClick={handleCloudSelect}
                                    style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="mx-auto mb-3">
                                                <LoadingSpinner size="lg" />
                                            </div>
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                                                正在加载图片...
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                请稍候，不要关闭页面
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <LucideImage className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                点击从云端选择图片
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                从云端存储中选择已有图片
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
                                预览图片
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveImage}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700"
                            >
                                <X className="h-4 w-4" />
                                取消选择
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
                            />
                            {/* 存储位置指示器 */}
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                {imageSource === 'cloud' ? (
                                    <>
                                        <Cloud className="h-4 w-4 text-blue-600" />
                                        <span>图片来源: 云端存储</span>
                                    </>
                                ) : (
                                    <>
                                        <HardDrive className="h-4 w-4 text-green-600" />
                                        <span>图片来源: 本地文件夹</span>
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
                        <p>查看图片</p>
                    </TooltipContent>
                </Tooltip>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-2xl h-[80vh] flex flex-col">
                        <DrawerHeader className="flex-shrink-0">
                            <DrawerTitle className="text-center">
                                {imageInfo?.originalName || imageInfo?.fileName || '图片预览'}
                            </DrawerTitle>
                            <DrawerDescription className="text-center">
                                查看和操作图片，支持缩放、旋转等功能
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="flex-1 p-6 overflow-hidden">
                            {isLoading ? (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 flex justify-center items-center">
                                        <div className="text-gray-500">加载中...</div>
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
                                            重置
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 flex justify-center items-center">
                                        <div className="text-gray-500">图片信息丢失，请重新选择图片</div>
                                    </div>
                                </div>
                            )}

                            {imageInfo && (
                                <div className="mt-4 text-center text-sm text-gray-500 pt-4">
                                    <p className="font-medium">{imageInfo.originalName || imageInfo.fileName || '未知文件'}</p>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        {imageSource === 'cloud' ? (
                                            <>
                                                <Cloud className="h-4 w-4 text-blue-600" />
                                                <span>图片来源: 云端存储</span>
                                            </>
                                        ) : (
                                            <>
                                                <HardDrive className="h-4 w-4 text-green-600" />
                                                <span>图片来源: 本地文件夹</span>
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