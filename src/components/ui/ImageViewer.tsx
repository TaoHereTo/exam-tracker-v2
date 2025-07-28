"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, HardDrive, Image as LucideImage } from 'lucide-react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { staticImageManager } from '@/lib/staticImageManager';
import { StaticImageInfo } from '@/lib/staticImageManager';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ImageViewerProps {
    imageId?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
    imageId,
    className = '',
    size = 'sm'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [imageData, setImageData] = useState<string | null>(null);
    const [imageInfo, setImageInfo] = useState<StaticImageInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        const loadImageData = async () => {
            if (!imageId) return;
            setIsLoading(true);
            try {
                const data = staticImageManager.getImagePreviewUrl(imageId);
                const info = staticImageManager.getImageInfo(imageId);

                setImageData(data);
                setImageInfo(info || null);
                // 重置缩放和旋转
                setZoom(1);
                setRotation(0);
            } catch (error) {
                console.error('加载图片失败:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (imageId && isOpen) {
            loadImageData();
        }
    }, [imageId, isOpen]);

    if (!imageId) {
        return null;
    }

    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-10 w-10'
    };



    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
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
                                {/* 图片显示区域 - 占据大部分空间 */}
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

                                {/* 图片控制按钮 - 固定在底部 */}
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
                                    <HardDrive className="h-4 w-4 text-green-600" />
                                    <span>图片来源: 本地文件夹</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}; 