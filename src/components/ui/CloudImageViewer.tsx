"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Image as LucideImage, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { supabaseImageManager } from '@/lib/supabaseImageManager';
import Image from 'next/image';
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
}

export const CloudImageViewer: React.FC<CloudImageViewerProps> = ({
    imageId,
    className = '',
    size = 'sm'
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    const loadImage = useCallback(async () => {
        if (!imageId) return;

        setIsLoading(true);
        setHasError(false);
        try {
            const url = supabaseImageManager.getImageUrl(imageId);

            if (url) {
                // 直接设置图片URL，不进行额外的验证
                setImageUrl(url);
            } else {
                console.warn('无法获取图片URL:', imageId);
                setHasError(true);
            }
        } catch (error) {
            console.error('加载图片失败:', error);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    }, [imageId]);

    useEffect(() => {
        if (imageId) {
            loadImage();
        } else {
            setImageUrl(null);
            setHasError(false);
        }
    }, [imageId, loadImage]);

    const handlePreview = () => {
        if (imageUrl) {
            setDrawerOpen(true);
            // 重置缩放和旋转
            setScale(1);
            setRotation(0);
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
                        onClick={handlePreview}
                        className="h-6 w-6 p-0"
                    >
                        <LucideImage className="h-3 w-3" />
                    </Button>
                ) : (
                    <div className="flex items-center gap-1">
                        <LucideImage className={sizeClasses[size]} />
                        {isLoading && (
                            <div className="text-xs text-gray-500">加载中...</div>
                        )}
                        {hasError && !isLoading && (
                            <div className="text-xs text-red-500">加载失败</div>
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
                        {imageUrl && (
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
                                        onError={() => {
                                            console.error('图片加载失败:', imageUrl);
                                            setHasError(true);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
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