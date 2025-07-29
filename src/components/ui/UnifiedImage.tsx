"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FolderOpen, X, Eye, HardDrive, Image as LucideImage, ZoomIn, ZoomOut, RotateCcw, Cloud } from 'lucide-react';
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
    const [hasImage, setHasImage] = useState<boolean>(!!value);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [imageData, setImageData] = useState<string | null>(null);
    const [imageInfo, setImageInfo] = useState<StaticImageInfo | SupabaseImageInfo | null>(null);
    const [imageSource, setImageSource] = useState<'local' | 'cloud'>('local');
    const [isLoading, setIsLoading] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [currentMode, setCurrentMode] = useState<'upload' | 'viewer'>(defaultMode);

    const { notify } = useNotification();

    // 加载预览图片
    useEffect(() => {
        if (value) {
            loadPreviewImage(value);
            setHasImage(true);
        } else {
            setPreviewUrl(null);
            setHasImage(false);
        }
    }, [value]);

    const loadPreviewImage = async (imageId: string) => {
        try {
            // 尝试从云端加载
            const cloudUrl = supabaseImageManager.getImageUrl(imageId);
            if (cloudUrl) {
                setPreviewUrl(cloudUrl);
                setImageSource('cloud');
                return;
            }

            // 尝试从本地加载
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
        loadPreviewImage(imageId);
        onChange?.(imageId);

        notify({
            type: "success",
            message: "图片选择成功",
            description: "已从本地文件夹中选择图片"
        });
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
    };

    // 处理是否有图片的选择
    const handleHasImageChange = (newValue: string) => {
        const hasImageNow = newValue === 'yes';
        setHasImage(hasImageNow);

        if (!hasImageNow) {
            handleRemoveImage();
        }
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
                    <div className="flex items-center gap-2">
                        <SupabaseImageSelectorDialog
                            onImageSelected={handleImageSelected}
                            trigger={
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <FolderOpen className="h-4 w-4" />
                                    选择图片
                                </Button>
                            }
                        />

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
                                {imageInfo?.fileName || imageInfo?.originalName || '图片预览'}
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
                                    <p className="font-medium">{imageInfo.fileName || imageInfo.originalName || '未知文件'}</p>
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