"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Image as LucideImage, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { supabaseImageManager } from '@/lib/supabaseImageManager';
import Image from 'next/image';
import { SimpleLoadingSpinner } from './LoadingSpinner';
import { MixedText } from './MixedText';
import { SimpleUiverseSpinner } from './UiverseSpinner';
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";

interface CloudImageViewerProps {
    imageId?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean; // 是否禁用图片加载
}

export const CloudImageViewer: React.FC<CloudImageViewerProps> = ({
    imageId,
    className = '',
    size = 'sm',
    disabled = false
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false); // For tracking actual image load
    const [hasError, setHasError] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    const loadImage = useCallback(async () => {
        if (!imageId || disabled) return;

        setIsLoading(true);
        setHasError(false);
        try {
            const url = supabaseImageManager.getImageUrl(imageId);

            if (url) {
                // 直接设置URL，不进行预验证，让浏览器处理加载失败
                setImageUrl(url);
                setIsLoading(false);
            } else {
                console.warn('无法获取图片URL:', imageId);
                setHasError(true);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('加载图片失败:', error);
            setHasError(true);
            setIsLoading(false);
        }
    }, [imageId, disabled]);

    useEffect(() => {
        if (imageId && !disabled) {
            loadImage();
        } else {
            setImageUrl(null);
            setHasError(false);
        }
    }, [imageId, loadImage, disabled]);

    const handlePreview = (e: React.MouseEvent) => {
        // 阻止事件冒泡，避免触发行选择
        e.stopPropagation();
        if (imageUrl) {
            setDrawerOpen(true);
            // 重置缩放和旋转
            setScale(1);
            setRotation(0);
            // When opening the preview, we're loading the image again
            setIsImageLoading(true);
        }
    };

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.25));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const handleReset = () => {
        setScale(1);
        setRotation(0);
    };

    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-10 w-10'
    };

    if (!imageId) {
        return null;
    }

    return (
        <>
            <div className={`flex items-center gap-1 ${className}`}>
                {imageUrl && !hasError ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(e);
                        }}
                        className="h-6 w-6 p-0"
                    >
                        <LucideImage className="h-3 w-3" />
                    </Button>
                ) : (
                    <div className="flex items-center gap-1">
                        <LucideImage className={sizeClasses[size]} />
                        {isLoading && (
                            <SimpleLoadingSpinner />
                        )}
                        {hasError && !isLoading && (
                            <div className="text-xs text-red-500"><MixedText text="加载失败" /></div>
                        )}
                    </div>
                )}
            </div>

            {/* 图片预览 Drawer */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader className="pb-2">
                        <DrawerTitle className="flex items-center gap-2">
                            <LucideImage className="h-5 w-5" />
                            图片预览
                        </DrawerTitle>
                    </DrawerHeader>

                    <div className="flex-1 overflow-auto p-4">
                        {imageUrl && !hasError ? (
                            <div className="flex justify-center">
                                <div className="relative max-w-full max-h-[70vh]">
                                    <Image
                                        src={imageUrl}
                                        alt="图片预览"
                                        className="rounded-lg object-contain max-w-full max-h-full"
                                        width={800}
                                        height={600}
                                        style={{
                                            width: 'auto',
                                            height: 'auto',
                                            maxWidth: '100%',
                                            maxHeight: '70vh',
                                            transform: `scale(${scale}) rotate(${rotation}deg)`,
                                            transition: 'transform 0.2s ease-in-out'
                                        }}
                                        onLoad={() => {
                                            // 图片加载成功时的处理
                                            setIsImageLoading(false);
                                        }}
                                        onError={() => {
                                            // 图片加载失败时的处理
                                            setHasError(true);
                                            setImageUrl(null);
                                            setIsImageLoading(false);
                                        }}
                                    />
                                    {isImageLoading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                            <SimpleUiverseSpinner />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : hasError ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <LucideImage className="h-16 w-16 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground mb-2">图片加载失败</p>
                                <p className="text-sm text-muted-foreground/80">图片文件可能不存在或已被删除</p>
                            </div>
                        ) : null}
                    </div>

                    <DrawerFooter className="pt-2">
                        <div className="flex justify-center items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleZoomOut}
                                disabled={scale <= 0.25}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-gray-500 min-w-[60px] text-center">
                                {Math.round(scale * 100)}%
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleZoomIn}
                                disabled={scale >= 3}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRotate}
                            >
                                <RotateCw className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                            >
                                重置
                            </Button>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
};