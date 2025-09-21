"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Check, RefreshCw, Trash2, Cloud, AlertCircle, Eye } from 'lucide-react';
import { supabaseImageManager, type SupabaseImageInfo } from '@/lib/supabaseImageManager';
import { useNotification } from '@/components/magicui/NotificationProvider';
import Image from 'next/image';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { smartImageSort } from '@/lib/utils';
import { MixedText } from './MixedText';
import { InlineLoadingSpinner } from './LoadingSpinner';
import { SimpleUiverseSpinner } from './UiverseSpinner';
import { useThemeMode } from '@/hooks/useThemeMode';

interface SupabaseImageSelectorDialogProps {
    onImageSelected: (imageId: string) => void;
    trigger?: React.ReactNode;
}

export const SupabaseImageSelectorDialog: React.FC<SupabaseImageSelectorDialogProps> = ({
    onImageSelected,
    trigger
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [availableImages, setAvailableImages] = useState<SupabaseImageInfo[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sortKey, setSortKey] = useState<'time' | 'name'>('time');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
    const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { notify, notifyLoading, updateToSuccess, updateToError } = useNotification();
    const { isDarkMode } = useThemeMode();

    // 加载可用图片
    const loadAvailableImages = useCallback(async () => {
        setIsLoading(true);
        try {
            // 先清理无效的图片记录
            supabaseImageManager.cleanupInvalidImageRecords();

            const images = await supabaseImageManager.getAllImages();
            setAvailableImages(images);
        } catch (error) {
            notify({
                type: "error",
                message: "加载失败",
                description: "无法从云端加载图片列表"
            });
        } finally {
            setTimeout(() => {
                setIsLoading(false);
            }, 300);
        }
    }, [notify]);

    useEffect(() => {
        if (isOpen) {
            loadAvailableImages();
        }
    }, [isOpen, loadAvailableImages]);

    // 刷新图片列表
    const handleRefresh = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        // 清理无效记录并重新加载
        supabaseImageManager.cleanupInvalidImageRecords();
        await loadAvailableImages();
    };

    // 删除图片
    const handleDeleteImage = async (imageId: string, event: React.MouseEvent) => {
        event.stopPropagation();

        // 找到要删除的图片信息
        const imageToDelete = availableImages.find(img => img.id === imageId);
        const imageName = imageToDelete?.originalName || '这张图片';

        // 设置要删除的图片信息并打开确认对话框
        setImageToDelete({ id: imageId, name: imageName });
        setDeleteConfirmOpen(true);
    };

    // 确认删除
    const confirmDelete = async () => {
        if (!imageToDelete) return;

        // Show loading notification instead of progress bar
        let toastId: string | undefined;
        if (notifyLoading) {
            toastId = notifyLoading("正在删除图片", `正在删除: ${imageToDelete.name}`);
        } else {
            // Fallback to regular notification if notifyLoading is not available
            notify({
                type: "info",
                message: "正在删除图片",
                description: `正在删除: ${imageToDelete.name}`
            });
        }

        try {
            const success = await supabaseImageManager.deleteImage(imageToDelete.id);
            if (success) {
                if (toastId && updateToSuccess) {
                    updateToSuccess(toastId, "删除成功", `"${imageToDelete.name}"已从云端删除`);
                } else {
                    notify({
                        type: "success",
                        message: "删除成功",
                        description: `"${imageToDelete.name}"已从云端删除`
                    });
                }
                // 重新加载图片列表
                await loadAvailableImages();
            } else {
                if (toastId && updateToError) {
                    updateToError(toastId, "删除失败", "无法删除图片，请检查网络连接");
                } else {
                    notify({
                        type: "error",
                        message: "删除失败",
                        description: "无法删除图片，请检查网络连接"
                    });
                }
            }
        } catch (error) {
            if (toastId && updateToError) {
                updateToError(toastId, "删除失败", "删除图片时发生错误，请稍后重试");
            } else {
                notify({
                    type: "error",
                    message: "删除失败",
                    description: "删除图片时发生错误，请稍后重试"
                });
            }
        } finally {
            // Close the dialog after a short delay to ensure the user sees the result
            setTimeout(() => {
                setDeleteConfirmOpen(false);
                setImageToDelete(null);
            }, 1000);
        }
    };

    // 使用useMemo来处理过滤和排序
    const processedImages = useMemo(() => {
        // 过滤图片
        const filtered = availableImages.filter(image =>
            image.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            image.fileName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // 排序
        const sorted = [...filtered];
        if (sortKey === 'name') {
            sorted.sort((a, b) => a.originalName.localeCompare(b.originalName, 'zh-CN'));
        } else {
            // time
            sorted.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
        }
        if (sortOrder === 'desc') sorted.reverse();
        return sorted;
    }, [availableImages, searchTerm, sortKey, sortOrder]);

    // 处理图片选择
    const handleImageSelect = (imageId: string) => {
        setSelectedImage(imageId);
    };

    // 确认选择
    const handleConfirm = () => {
        if (selectedImage) {
            onImageSelected(selectedImage);
            setIsOpen(false);
            setSelectedImage(null);
        }
    };

    // 取消选择
    const handleCancel = () => {
        setIsOpen(false);
        setSelectedImage(null);
        setSearchTerm('');
    };

    // 格式化文件大小
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // 格式化上传时间
    const formatUploadTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => {
                // 如果删除确认对话框正在打开，不要关闭父 Dialog
                if (!open && deleteConfirmOpen) return;
                setIsOpen(open);
            }}>
                <DialogTrigger asChild>
                    {trigger || (
                        <div className="flex justify-center">
                            <Button type="button" variant="outline" className="w-48 rounded-full">
                                <MixedText text="从云端选择图片" />
                            </Button>
                        </div>
                    )}
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Cloud className="h-5 w-5" />
                            <MixedText text="从云端选择图片" />
                        </DialogTitle>
                        <DialogDescription>
                            <MixedText text="从云端存储中选择图片，支持搜索和预览" />
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col space-y-4 min-h-0">
                        {/* 搜索和操作栏 */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-300 z-10 pointer-events-none" />
                                <Input
                                    placeholder="搜索图片名称..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={`${sortKey}_${sortOrder}`}
                                    onValueChange={(v) => {
                                        const [k, o] = v.split('_');
                                        setSortKey(k as 'time' | 'name');
                                        setSortOrder(o as 'asc' | 'desc');
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="排序" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="time_desc">时间降序</SelectItem>
                                        <SelectItem value="time_asc">时间升序</SelectItem>
                                        <SelectItem value="name_asc">名称升序</SelectItem>
                                        <SelectItem value="name_desc">名称降序</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="h-9 w-9"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        {/* 连接状态提示 */}
                        {connectionStatus && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${connectionStatus.success
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                }`}>
                                <AlertCircle className="h-4 w-4" />
                                <MixedText text={connectionStatus.message} />
                            </div>
                        )}

                        {/* 图片列表 */}
                        <div className="flex-1 overflow-y-auto" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <InlineLoadingSpinner />
                                </div>
                            ) : processedImages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <MixedText text={searchTerm ? '没有找到匹配的图片' : '云端暂无图片'} />
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <PhotoProvider>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {processedImages.map((image) => (
                                            <div
                                                key={image.id}
                                                className={`group relative cursor-pointer rounded-lg transition-all duration-200 ${selectedImage === image.id
                                                    ? 'ring-4 ring-blue-500 ring-offset-4 bg-blue-50 dark:bg-blue-900/20 shadow-lg z-10 m-2'
                                                    : 'border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-md hover:shadow-lg'
                                                    }`}
                                                onClick={() => handleImageSelect(image.id)}
                                            >
                                                <div className="aspect-square bg-gray-100 dark:bg-[#171717] rounded flex items-center justify-center mb-2 overflow-hidden relative group/image">
                                                    <Image
                                                        src={image.url}
                                                        alt={image.originalName}
                                                        width={200}
                                                        height={200}
                                                        className="object-cover w-full h-full"
                                                        onError={() => {
                                                            setImageLoadErrors(prev => new Set(prev).add(image.id));
                                                        }}
                                                    />

                                                    {/* 预览按钮 */}
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                                                        <PhotoView src={image.url}>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className={`h-8 px-3 text-xs ${isDarkMode
                                                                    ? 'bg-white text-black hover:bg-gray-100'
                                                                    : 'bg-black text-white hover:bg-gray-800'
                                                                    }`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // 阻止事件冒泡，避免触发图片选择
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                <MixedText text="预览" />
                                                            </Button>
                                                        </PhotoView>
                                                    </div>
                                                </div>

                                                <div className="p-2">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate text-center">
                                                        <MixedText text={image.originalName} />
                                                    </div>
                                                    <div className="text-xs text-gray-500 text-center">
                                                        <MixedText text={formatFileSize(image.size)} />
                                                    </div>
                                                    <div className="text-xs text-gray-400 text-center">
                                                        <MixedText text={formatUploadTime(image.uploadedAt)} />
                                                    </div>
                                                </div>

                                                {/* 选择指示器 */}
                                                {selectedImage === image.id && (
                                                    <div className="absolute top-2 right-2 z-20">
                                                        <div className="bg-blue-500 rounded-full p-1 shadow-md">
                                                            <Check className="h-5 w-5 text-white" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 删除按钮 */}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 border-0 z-20"
                                                                onClick={(e: React.MouseEvent) => handleDeleteImage(image.id, e)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p><MixedText text="删除图片" /></p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        ))}
                                    </div>
                                </PhotoProvider>
                            )}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="h-9"
                        >
                            <MixedText text="取消" />
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!selectedImage}
                            variant="default"
                            className="h-9"
                        >
                            <MixedText text="确认选择" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <Dialog open={deleteConfirmOpen} onOpenChange={(open) => {
                setDeleteConfirmOpen(open);
                // 关闭确认弹窗时不要自动关闭父选择弹窗
                if (!open) {
                    setIsOpen(true);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle><MixedText text="确认删除" /></DialogTitle>
                        <DialogDescription>
                            <MixedText text={`确定要删除图片"${imageToDelete?.name}"吗？`} />
                            <br />
                            <br />
                            <MixedText text="此操作不可撤销，删除后无法恢复。" />
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-full">
                                <MixedText text="取消" />
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={confirmDelete}
                            variant="destructive"
                            className="rounded-full"
                        >
                            <MixedText text="确认删除" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};


