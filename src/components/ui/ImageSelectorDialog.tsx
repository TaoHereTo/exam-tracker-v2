"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Check, Image as LucideImage, RefreshCw } from 'lucide-react';
import { staticImageManager } from '@/lib/staticImageManager';
import Image from 'next/image';

interface ImageSelectorDialogProps {
    onImageSelected: (imageId: string) => void;
    trigger?: React.ReactNode;
}

export const ImageSelectorDialog: React.FC<ImageSelectorDialogProps> = ({
    onImageSelected,
    trigger
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [availableImages, setAvailableImages] = useState<string[]>([]);
    const [filteredImages, setFilteredImages] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            loadAvailableImages();
        }
    }, [isOpen]);

    // 添加一个刷新按钮的处理函数
    const handleRefresh = () => {
        loadAvailableImages();
    };

    useEffect(() => {
        // 根据搜索词过滤图片
        const filtered = availableImages.filter(image =>
            image.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredImages(filtered);
    }, [availableImages, searchTerm]);

    const loadAvailableImages = async () => {
        setIsLoading(true);
        try {
            const images = await staticImageManager.getAvailableImages();
            setAvailableImages(images);
            setFilteredImages(images);
        } catch (error) {
            console.error('加载图片列表失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageSelect = (fileName: string) => {
        setSelectedImage(fileName);
    };

    const handleConfirm = () => {
        if (selectedImage) {
            const imageId = staticImageManager.selectImageByFileName(selectedImage);
            onImageSelected(imageId);
            setIsOpen(false);
            setSelectedImage(null);
            setSearchTerm('');
            setImageLoadErrors(new Set());
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        setSelectedImage(null);
        setSearchTerm('');
        setImageLoadErrors(new Set());
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <LucideImage className="h-4 w-4" />
                        选择图片
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>选择图片</DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col space-y-4">
                    {/* 搜索框和刷新按钮 */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="搜索图片..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            刷新
                        </Button>
                    </div>

                    {/* 图片列表 */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="text-gray-500">加载中...</div>
                            </div>
                        ) : filteredImages.length === 0 ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="text-gray-500">
                                    {searchTerm ? '没有找到匹配的图片' : '没有可用的图片'}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredImages.map((fileName) => (
                                    <div
                                        key={fileName}
                                        className={`relative border rounded-lg p-2 cursor-pointer transition-all ${selectedImage === fileName
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleImageSelect(fileName)}
                                    >
                                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center mb-2 overflow-hidden">
                                            {imageLoadErrors.has(fileName) ? (
                                                <div className="flex items-center justify-center w-full h-full">
                                                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                    </svg>
                                                </div>
                                            ) : (
                                                <Image
                                                    src={`/ImageOfKnow/${fileName}`}
                                                    alt={`图片: ${fileName}`}
                                                    className="w-full h-full object-cover"
                                                    width={200}
                                                    height={200}
                                                    onError={() => {
                                                        setImageLoadErrors(prev => new Set(prev).add(fileName));
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="text-xs text-center truncate">{fileName}</div>
                                        {selectedImage === fileName && (
                                            <div className="absolute top-2 right-2">
                                                <Check className="h-4 w-4 text-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancel}>
                        取消
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedImage}
                    >
                        确认选择
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}; 