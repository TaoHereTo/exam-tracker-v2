"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FolderOpen, X, Eye, HardDrive } from 'lucide-react';
import { staticImageManager } from '@/lib/staticImageManager';
import { ImageSelectorDialog } from './ImageSelectorDialog';
import { useNotification } from '@/components/magicui/NotificationProvider';
import Image from 'next/image';

interface ImageUploadProps {
    value?: string; // 当前选中的图片ID
    onChange?: (imageId: string | undefined) => void;
    className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    className = ''
}) => {
    const [hasImage, setHasImage] = useState<boolean>(!!value);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { notify } = useNotification();

    // 加载预览图片
    React.useEffect(() => {
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
            const previewUrl = staticImageManager.getImagePreviewUrl(imageId);
            if (previewUrl) {
                setPreviewUrl(previewUrl);
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
            staticImageManager.deleteImageSelection(value);
        }
        setPreviewUrl(null);
        onChange?.(undefined);
        setHasImage(false);
        notify({ type: "success", message: "图片选择已删除" });
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
        if (value) {
            staticImageManager.openImageFile(value).catch(error => {
                notify({ type: "error", message: "无法预览图片", description: error.message });
            });
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* 是否有图片的选择 */}
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

            {/* 图片选择区域 */}
            {hasImage && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <ImageSelectorDialog
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
                                    <HardDrive className="h-4 w-4 text-green-600" />
                                    <span>图片来源: 本地文件夹</span>
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            )}
        </div>
    );
}; 