"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Search, Check, RefreshCw, Trash2, Cloud, AlertCircle } from 'lucide-react';
import { supabaseImageManager, type SupabaseImageInfo } from '@/lib/supabaseImageManager';
import { useNotification } from '@/components/magicui/NotificationProvider';
import Image from 'next/image';
import { smartImageSort } from '@/lib/utils';
import { MixedText } from './MixedText';
import { InlineLoadingSpinner } from './LoadingSpinner';

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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
    const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { notify } = useNotification();

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

        setIsDeleting(true);
        try {
            const success = await supabaseImageManager.deleteImage(imageToDelete.id);
            if (success) {
                notify({
                    type: "success",
                    message: "删除成功",
                    description: `"${imageToDelete.name}"已从云端删除`
                });
                // 重新加载图片列表
                await loadAvailableImages();
            } else {
                notify({
                    type: "error",
                    message: "删除失败",
                    description: "无法删除图片，请检查网络连接"
                });
            }
        } catch (error) {
            notify({
                type: "error",
                message: "删除失败",
                description: "删除图片时发生错误，请稍后重试"
            });
        } finally {
            setIsDeleting(false);
            setDeleteConfirmOpen(false);
            setImageToDelete(null);
        }
    };

    // 使用useMemo来处理过滤和排序
    const processedImages = useMemo(() => {
        // 过滤图片
        const filtered = availableImages.filter(image =>
            image.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            image.fileName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // 智能排序
        return filtered.sort(smartImageSort);
    }, [availableImages, searchTerm]);

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
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <div className="flex justify-center">
                            <Button variant="outline" className="w-48">
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
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="搜索图片名称..."
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
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                <MixedText text="刷新" />
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
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {processedImages.map((image) => (
                                            <div
                                                key={image.id}
                                                className={`group relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-md ${selectedImage === image.id
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                                onClick={() => handleImageSelect(image.id)}
                                            >
                                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center mb-2 overflow-hidden">
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
                                                    <div className="absolute top-2 right-2">
                                                        <Check className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                )}

                                                {/* 删除按钮 */}
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-600"
                                                    onClick={(e: React.MouseEvent) => handleDeleteImage(image.id, e)}
                                                    title="删除图片"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button variant="outline" onClick={handleCancel}>
                            <MixedText text="取消" />
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!selectedImage}
                        >
                            <MixedText text="确认选择" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle><MixedText text="确认删除" /></AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            {isDeleting && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                    <InlineLoadingSpinner />
                                </div>
                            )}
                            {isDeleting ? (
                                <div className="space-y-4">
                                    <p><MixedText text="正在删除图片，请稍候..." /></p>
                                    <div className="flex items-center gap-2">
                                        <InlineLoadingSpinner />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            <MixedText text={`正在删除: ${imageToDelete?.name}`} />
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <MixedText text={`确定要删除"${imageToDelete?.name}"吗？`} />
                                    <br />
                                    <br />
                                    <MixedText text="此操作不可撤销，图片将从云端永久删除。" />
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}><MixedText text="取消" /></AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            style={{ background: '#EF4444' }}
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <InlineLoadingSpinner />
                                    <MixedText text="删除中..." />
                                </div>
                            ) : (
                                <MixedText text="确认删除" />
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}; 