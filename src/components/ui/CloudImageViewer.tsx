"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Image as LucideImage, ZoomIn, ZoomOut, RotateCw, X } from 'lucide-react';
import { supabaseImageManager } from '@/lib/supabaseImageManager';
import Image from 'next/image';
import { MixedText } from './MixedText';
import { SimpleUiverseSpinner } from './UiverseSpinner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogOverlay,
    DialogPortal,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { getZIndex } from '@/lib/zIndexConfig';

// 自定义 DialogContent，不包含默认的关闭按钮
const CustomDialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <DialogPrimitive.Content
        ref={ref}
        className={cn(
            "fixed left-[50%] top-[50%] z-[var(--z-dialog)] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200",
            "bg-white dark:bg-black",
            "border-[color:var(--input-border)]",
            "text-black dark:text-white",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
            className
        )}
        {...props}
    >
        {children}
    </DialogPrimitive.Content>
));
CustomDialogContent.displayName = DialogPrimitive.Content.displayName;

interface CloudImageViewerProps {
    imageId?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
}

export const CloudImageViewer: React.FC<CloudImageViewerProps> = ({
    imageId,
    className = '',
    size = 'sm',
    disabled = false
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    const loadImage = useCallback(async () => {
        if (!imageId || disabled) return;

        console.log('CloudImageViewer: Loading image', imageId);
        setIsLoading(true);
        setHasError(false);
        try {
            const url = supabaseImageManager.getImageUrl(imageId);
            console.log('CloudImageViewer: Got URL', url);
            if (url) {
                setImageUrl(url);
                setIsLoading(false);
            } else {
                console.warn('CloudImageViewer: 无法获取图片URL:', imageId);
                setHasError(true);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('CloudImageViewer: 加载图片失败:', error);
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
        e.stopPropagation();
        console.log('CloudImageViewer: handlePreview called', { imageId, imageUrl, hasError });
        if (imageUrl && !hasError) {
            setDialogOpen(true);
            setScale(1);
            setRotation(0);
        } else {
            console.warn('CloudImageViewer: Cannot open preview', { imageUrl, hasError });
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
                        className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 border-0 shadow-none"
                    >
                        <LucideImage className="h-4 w-4" />
                    </Button>
                ) : (
                    <div className="flex items-center gap-1">
                        <LucideImage className={sizeClasses[size]} />
                        {isLoading && (
                            <SimpleUiverseSpinner />
                        )}
                        {hasError && !isLoading && (
                            <div className="text-xs text-red-500"><MixedText text="加载失败" /></div>
                        )}
                    </div>
                )}
            </div>

            {/* 图片预览 Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogPortal>
                    <DialogOverlay
                        style={{
                            zIndex: getZIndex('URGENT') + 1, // 比抽屉更高
                        }}
                    />
                    <CustomDialogContent
                        className="max-w-4xl max-h-[90vh] p-0"
                        style={{
                            zIndex: getZIndex('URGENT') + 2, // 比抽屉更高
                        }}
                    >
                        <DialogHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                                <DialogTitle className="flex items-center gap-2">
                                    <LucideImage className="h-5 w-5" />
                                    <MixedText text="图片预览" />
                                </DialogTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDialogOpen(false)}
                                    className="h-8 w-8 p-0 rounded-full border-0 shadow-none hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </DialogHeader>

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
                                                console.log('CloudImageViewer: Image loaded successfully');
                                            }}
                                            onError={() => {
                                                console.error('CloudImageViewer: Image load error');
                                                setHasError(true);
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : hasError ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <LucideImage className="h-16 w-16 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground mb-2"><MixedText text="图片加载失败" /></p>
                                    <p className="text-sm text-muted-foreground/80"><MixedText text="图片文件可能不存在或已被删除" /></p>
                                </div>
                            ) : null}
                        </div>

                        {/* 控制按钮 */}
                        <div className="p-4 pt-2 border-t">
                            <div className="flex justify-center items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleZoomOut}
                                    disabled={scale <= 0.25}
                                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-gray-500 min-w-[60px] text-center">
                                    {Math.round(scale * 100)}%
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleZoomIn}
                                    disabled={scale >= 3}
                                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRotate}
                                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <RotateCw className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <MixedText text="重置" />
                                </Button>
                            </div>
                        </div>
                    </CustomDialogContent>
                </DialogPortal>
            </Dialog>
        </>
    );
};
