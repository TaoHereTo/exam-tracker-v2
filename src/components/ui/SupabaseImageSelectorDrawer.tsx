"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Check, RefreshCw, Trash2, Cloud, AlertCircle, Eye, X } from 'lucide-react';
import { supabaseImageManager, type SupabaseImageInfo } from '@/lib/supabaseImageManager';
import { useNotification } from '@/components/magicui/NotificationProvider';
import Image from 'next/image';
import { smartImageSort } from '@/lib/utils';
import { MixedText } from './MixedText';
import { InlineLoadingSpinner } from './LoadingSpinner';
import { SimpleUiverseSpinner } from './UiverseSpinner';
import { useThemeMode } from '@/hooks/useThemeMode';

interface SupabaseImageSelectorDrawerProps {
    onImageSelected: (imageId: string) => void;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const SupabaseImageSelectorDrawer: React.FC<SupabaseImageSelectorDrawerProps> = ({
    onImageSelected,
    trigger,
    open,
    onOpenChange
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = open !== undefined ? open : internalIsOpen;
    const setIsOpen = onOpenChange || setInternalIsOpen;
    const [availableImages, setAvailableImages] = useState<SupabaseImageInfo[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sortKey, setSortKey] = useState<'time' | 'name'>('time');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const { notify, notifyLoading, updateToSuccess, updateToError } = useNotification();
    const { isDarkMode } = useThemeMode();

    // 预览图片
    const handlePreviewImage = (imageUrl: string) => {
        setPreviewImage(imageUrl);
        setIsPreviewing(true);
    };

    // 关闭预览
    const closePreview = () => {
        setPreviewImage(null);
        setIsPreviewing(false);
    };

    // 加载可用图片
    const loadAvailableImages = useCallback(async () => {
        setIsLoading(true);
        try {
            const images = await supabaseImageManager.getAllImages();
            setAvailableImages(images);
        } catch (error) {
            console.error('加载图片失败:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 处理图片选择
    const handleImageSelect = (imageId: string) => {
        setSelectedImage(imageId);
    };

    // 确认选择图片
    const handleConfirmSelection = () => {
        if (selectedImage) {
            onImageSelected(selectedImage);
            setIsOpen(false);
            setSelectedImage(null);
        }
    };

    // 处理删除图片
    const handleDeleteImage = async () => {
        if (!imageToDelete) return;

        setIsDeleting(true);
        const loadingId = notifyLoading?.('正在删除图片...');

        try {
            await supabaseImageManager.deleteImage(imageToDelete.id);
            await loadAvailableImages(); // 重新加载图片列表
            if (loadingId) {
                updateToSuccess?.(loadingId, '图片删除成功');
            }
            setDeleteConfirmOpen(false);
            setImageToDelete(null);
        } catch (error) {
            console.error('删除图片失败:', error);
            if (loadingId) {
                updateToError?.(loadingId, '删除图片失败');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // 处理搜索
    const handleSearch = (value: string) => {
        setSearchTerm(value);
    };

    // 处理排序
    const handleSortChange = (key: 'time' | 'name', order: 'asc' | 'desc') => {
        setSortKey(key);
        setSortOrder(order);
    };

    // 处理刷新
    const handleRefresh = () => {
        loadAvailableImages();
    };

    // 处理删除确认
    const handleDeleteConfirm = (image: SupabaseImageInfo) => {
        setImageToDelete({ id: image.id, name: image.originalName });
        setDeleteConfirmOpen(true);
    };

    // 处理删除取消
    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setImageToDelete(null);
    };

    // 处理关闭
    const handleClose = () => {
        setIsOpen(false);
        setSelectedImage(null);
        setSearchTerm('');
        setImageLoadErrors(new Set());
        setDeleteConfirmOpen(false);
        setImageToDelete(null);
        setIsPreviewing(false);
        setPreviewImage(null);
    };

    // 处理打开
    const handleOpen = () => {
        setIsOpen(true);
        loadAvailableImages();
    };

    // 处理打开状态变化
    const handleOpenChange = (open: boolean) => {
        if (open) {
            handleOpen();
        } else {
            handleClose();
        }
    };

    // 过滤和排序图片
    const processedImages = useMemo(() => {
        const filtered = availableImages.filter(image =>
            image.originalName && image.originalName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // 根据排序键和顺序进行排序
        return filtered.sort((a, b) => {
            if (sortKey === 'time') {
                const timeA = new Date(a.uploadedAt).getTime();
                const timeB = new Date(b.uploadedAt).getTime();
                return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
            } else {
                // 按名称排序，使用智能排序
                const result = smartImageSort(a, b);
                return sortOrder === 'asc' ? -result : result;
            }
        });
    }, [availableImages, searchTerm, sortKey, sortOrder]);

    // 组件挂载时加载图片
    useEffect(() => {
        if (isOpen) {
            loadAvailableImages();
        }
    }, [isOpen, loadAvailableImages]);

    return (
        <>
            <Drawer open={isOpen} onOpenChange={handleOpenChange}>
                {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
                <DrawerContent className="h-[90vh] flex flex-col" style={{ height: '90vh' }}>
                    <DrawerHeader className="flex-shrink-0 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Cloud className="h-5 w-5" />
                                <DrawerTitle><MixedText text="从云端选择图片" /></DrawerTitle>
                            </div>
                            <DrawerClose asChild>
                                <Button variant="ghost" size="sm">
                                    <X className="h-4 w-4" />
                                </Button>
                            </DrawerClose>
                        </div>
                    </DrawerHeader>

                    <div className="flex-1 min-h-0 flex flex-col">
                        {/* 搜索和排序 */}
                        <div className="flex-shrink-0 px-4 py-3 border-b">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="搜索图片..."
                                            value={searchTerm}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className="pl-10 h-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Select value={`${sortKey}-${sortOrder}`} onValueChange={(value) => {
                                        const [key, order] = value.split('-') as ['time' | 'name', 'asc' | 'desc'];
                                        handleSortChange(key, order);
                                    }}>
                                        <SelectTrigger className="w-32 h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[var(--z-urgent)]">
                                            <SelectItem value="time-desc">最新</SelectItem>
                                            <SelectItem value="time-asc">最旧</SelectItem>
                                            <SelectItem value="name-asc">名称A-Z</SelectItem>
                                            <SelectItem value="name-desc">名称Z-A</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="h-10 w-10 p-0 rounded-full">
                                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>
                        </div>


                        {/* 主内容区域 - 图片网格或预览 */}
                        <div className="flex-1 overflow-hidden">
                            {isPreviewing && previewImage ? (
                                /* 预览模式 */
                                <div className="h-full flex flex-col">
                                    {/* 预览头部 */}
                                    <div className="flex-shrink-0 flex items-center justify-between p-4 border-b">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-5 w-5" />
                                            <span className="font-medium"><MixedText text="图片预览" /></span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={closePreview}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* 预览内容 */}
                                    <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                                        <Image
                                            src={previewImage}
                                            alt="预览图片"
                                            width={800}
                                            height={600}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* 图片网格模式 */
                                <div className="h-full overflow-y-auto px-4 py-3" style={{ height: 'calc(90vh - 200px)', overflowY: 'auto' }}>
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-32">
                                            <SimpleUiverseSpinner />
                                        </div>
                                    ) : processedImages.length === 0 ? (
                                        <div className="flex items-center justify-center h-32">
                                            <div className="text-center">
                                                <Cloud className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    <MixedText text={searchTerm ? '没有找到匹配的图片' : '云端暂无图片'} />
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 pb-4">
                                            {processedImages.map((image) => (
                                                <div
                                                    key={image.id}
                                                    className={`group relative cursor-pointer transition-all duration-200 ${selectedImage === image.id
                                                        ? 'ring-2 ring-blue-500 ring-offset-2'
                                                        : ''
                                                        }`}
                                                    onClick={() => handleImageSelect(image.id)}
                                                >
                                                    <div className="aspect-square bg-gray-100 dark:bg-[#171717] rounded flex items-center justify-center mb-2 overflow-hidden relative group/image">
                                                        <Image
                                                            src={image.url}
                                                            alt={image.originalName}
                                                            width={80}
                                                            height={80}
                                                            className="object-cover w-full h-full"
                                                            onError={() => {
                                                                setImageLoadErrors(prev => new Set(prev).add(image.id));
                                                            }}
                                                        />

                                                        {/* 预览按钮 */}
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className={`h-6 px-2 text-xs ${isDarkMode
                                                                    ? 'bg-white text-black hover:bg-gray-100'
                                                                    : 'bg-black text-white hover:bg-gray-800'
                                                                    }`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // 阻止事件冒泡，避免触发图片选择
                                                                    handlePreviewImage(image.url);
                                                                }}
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                <MixedText text="预览" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="p-1">
                                                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate text-center">
                                                            <MixedText text={image.originalName} />
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-0.5">
                                                            {new Date(image.uploadedAt).toLocaleDateString()}
                                                        </div>
                                                    </div>

                                                    {/* 选择指示器 */}
                                                    {selectedImage === image.id && (
                                                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5">
                                                            <Check className="h-2 w-2" />
                                                        </div>
                                                    )}

                                                    {/* 删除按钮 */}
                                                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="h-4 w-4 p-0"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteConfirm(image);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-2 w-2" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p><MixedText text="删除图片" /></p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <DrawerFooter className="flex-shrink-0">
                        <div className="flex justify-end space-x-2">
                            <DrawerClose asChild>
                                <Button variant="outline">
                                    <MixedText text="取消" />
                                </Button>
                            </DrawerClose>
                            <Button
                                onClick={handleConfirmSelection}
                                disabled={!selectedImage}
                            >
                                <MixedText text="确认选择" />
                            </Button>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>


            {/* 删除确认对话框 */}
            <Drawer open={deleteConfirmOpen} onOpenChange={(open) => {
                setDeleteConfirmOpen(open);
                if (!open) {
                    setImageToDelete(null);
                }
            }}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle><MixedText text="确认删除" /></DrawerTitle>
                        <DrawerDescription>
                            <MixedText text={`确定要删除图片 "${imageToDelete?.name}" 吗？`} />
                            <br />
                            <br />
                            <MixedText text="此操作不可撤销，删除后无法恢复。" />
                        </DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={handleDeleteCancel} className="flex items-center justify-center rounded-full">
                                <MixedText text="取消" />
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteImage}
                                disabled={isDeleting}
                                className="flex items-center justify-center rounded-full"
                            >
                                {isDeleting ? (
                                    <>
                                        <InlineLoadingSpinner className="mr-2" />
                                        <MixedText text="删除中..." />
                                    </>
                                ) : (
                                    <MixedText text="确认删除" />
                                )}
                            </Button>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
};
