"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FolderOpen, X, Eye, HardDrive, Image as LucideImage, ZoomIn, ZoomOut, RotateCcw, Cloud, Upload } from 'lucide-react';
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
import Image from 'next/image';

interface UnifiedImageProps {
    // 基础属性
    value?: string; // 当前选中的图片ID
    onChange?: (imageId: string | undefined) => void;
    className?: string;

    // 模式控制
    mode?: 'upload' | 'viewer' | 'combined'; // 组件模式

    // 上传模式属性
    showHasImageOption?: boolean; // 是否显示"是否有图片"选项

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
    showHasImageOption = true,
    size = 'sm',
    defaultMode = 'upload'
}) => {
    const [hasImage, setHasImage] = useState<boolean>(false);
    const [initialized, setInitialized] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [imageData, setImageData] = useState<string | null>(null);
    const [imageInfo, setImageInfo] = useState<StaticImageInfo | SupabaseImageInfo | null>(null);
    const [imageSource, setImageSource] = useState<'local' | 'cloud'>('local');
    const [isLoading, setIsLoading] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [currentMode, setCurrentMode] = useState<'upload' | 'viewer'>(defaultMode);
    const [userSelectedHasImage, setUserSelectedHasImage] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const dragAreaRef = useRef<HTMLDivElement>(null);

    const { notify } = useNotification();

    // 加载预览图片
    useEffect(() => {
        if (value) {
            loadPreviewImage(value);
            setHasImage(true);
        } else {
            setPreviewUrl(null);
            // 只有当用户明确选择"无图片"时才设置为false
            if (!userSelectedHasImage) {
                setHasImage(false);
            }
        }
    }, [value, userSelectedHasImage]); // 添加userSelectedHasImage依赖

    // 确保hasImage状态与value保持同步，但只在value有值时才重置
    useEffect(() => {
        if (value) {
            setHasImage(true);
            setUserSelectedHasImage(true);
        }
        // 注意：当value为undefined时，我们不重置hasImage状态
        // 这样可以保持用户的选择
        setInitialized(true);
    }, [value, setUserSelectedHasImage]);

    // 确保hasImage状态与用户选择保持一致
    useEffect(() => {
        if (userSelectedHasImage && initialized) {
            setHasImage(true);
        }
    }, [userSelectedHasImage, initialized]);

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
        setHasImage(true); // 确保设置为有图片状态
        setUserSelectedHasImage(true); // 确保用户选择状态
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
    const handleFileUpload = async (file: File) => {
        if (!file) return;

        try {
            setIsLoading(true);
            // 上传到Supabase
            const imageInfo = await supabaseImageManager.uploadImage(file);
            if (imageInfo) {
                onChange?.(imageInfo.id);
                // 保持在本地上传tab，不切换到云端选择
                setImageSource('local');
                setHasImage(true); // 确保设置为有图片状态
                setUserSelectedHasImage(true); // 确保用户选择状态
                // 直接设置预览URL，避免loadPreviewImage函数切换tab
                setPreviewUrl(imageInfo.url);
                notify({ type: "success", message: "图片上传成功" });
            }
        } catch (error) {
            console.error('上传失败:', error);
            notify({ type: "error", message: "图片上传失败" });
        } finally {
            setIsLoading(false);
        }
    };

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

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));

        if (imageFile) {
            await handleFileUpload(imageFile);
        } else {
            notify({ type: "error", message: "请拖拽图片文件" });
        }
    };

    // 处理图片删除
    const handleRemoveImage = async () => {
        if (value) {
            try {
                if (imageSource === 'cloud') {
                    await supabaseImageManager.deleteImage(value);
                } else {
                    staticImageManager.deleteImageSelection(value);
                }
                notify({
                    type: "success",
                    message: "图片删除成功",
                    description: `图片已从${imageSource === 'cloud' ? '云端' : '本地'}删除`
                });
            } catch (error) {
                console.error('删除失败:', error);
                notify({
                    type: "error",
                    message: "删除失败",
                    description: "无法删除图片"
                });
            }
        }
        setPreviewUrl(null);
        onChange?.(undefined);
        setHasImage(false);
        setUserSelectedHasImage(false);
    };

    // 处理是否有图片的选择
    const handleHasImageChange = (newValue: string) => {
        const hasImageNow = newValue === 'yes';
        setHasImage(hasImageNow);
        setUserSelectedHasImage(hasImageNow);

        if (!hasImageNow) {
            // 当用户选择"无图片"时，清除图片
            handleRemoveImage();
        }
        // 当用户选择"有图片"时，不立即清除value，让用户有机会选择图片
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
        <div className={`space-y-4 ${className}`}>
            {/* 是否有图片的选择 */}
            {showHasImageOption && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">是否包含图片？</Label>
                    <RadioGroup value={hasImage ? 'yes' : 'no'} onValueChange={handleHasImageChange}>
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="has-image-yes" />
                                <Label htmlFor="has-image-yes" className="text-sm">有图片</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="has-image-no" />
                                <Label htmlFor="has-image-no" className="text-sm">无图片</Label>
                            </div>
                        </div>
                    </RadioGroup>
                </div>
            )}

            {/* 图片选择区域 */}
            {hasImage && (
                <div className="space-y-3">
                    {/* Tab切换：本地上传 vs 云端选择 */}
                    <div className="flex border rounded-lg p-0.5 bg-gray-50 dark:bg-gray-800">
                        <button
                            type="button"
                            onClick={() => {
                                setImageSource('local');
                                // 保持hasImage状态不变
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
                                // 保持hasImage状态不变
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
                            // 本地上传功能 - 只在没有预览图片时显示
                            !previewUrl && (
                                <div className="w-full flex justify-center">
                                    <div
                                        ref={dragAreaRef}
                                        onDragEnter={handleDragEnter}
                                        onDragLeave={handleDragLeave}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer max-w-md ${isDragOver
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                            } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                        onClick={handleLocalUpload}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
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
                                                    支持 JPG、PNG、GIF 等格式
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        ) : (
                            // 云端选择功能
                            <div className="w-full flex justify-center">
                                <SupabaseImageSelectorDialog
                                    onImageSelected={handleImageSelected}
                                    trigger={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isLoading}
                                            className="flex items-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                                    上传中...
                                                </>
                                            ) : (
                                                <>
                                                    <FolderOpen className="h-4 w-4" />
                                                    选择图片
                                                </>
                                            )}
                                        </Button>
                                    }
                                />
                            </div>
                        )}

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
            )}
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

    // 渲染组合模式
    const renderCombinedMode = () => (
        <div className={className}>
            <div className="flex gap-2 mb-4">
                <Button
                    variant={currentMode === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentMode('upload')}
                >
                    上传模式
                </Button>
                <Button
                    variant={currentMode === 'viewer' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentMode('viewer')}
                >
                    查看模式
                </Button>
            </div>
            {currentMode === 'upload' ? renderUploadMode() : renderViewerMode()}
        </div>
    );

    // 根据模式渲染不同内容
    switch (mode) {
        case 'upload':
            return renderUploadMode();
        case 'viewer':
            return renderViewerMode();
        case 'combined':
        default:
            return renderCombinedMode();
    }
}; 