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

    // 测试连接
    const testConnection = useCallback(async () => {
        try {
            const result = await supabaseImageManager.testConnection();
            setConnectionStatus(result);

            // 只有在连接真正失败时才显示通知
            if (!result.success && !result.message.includes('连接正常')) {
                notify({
                    type: "error",
                    message: "连接测试失败",
                    description: result.message
                });
            }
        } catch (error) {
            console.error('连接测试失败:', error);
            setConnectionStatus({
                success: false,
                message: '连接测试失败'
            });
        }
    }, [notify]);

    // 加载可用图片
    const loadAvailableImages = useCallback(async () => {
        setIsLoading(true);
        try {
            // 先清理无效的图片记录
            supabaseImageManager.cleanupInvalidImageRecords();

            const images = await supabaseImageManager.getAllImages();
            setAvailableImages(images);
        } catch (error) {
            console.error('加载图片列表失败:', error);
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
            testConnection();
            loadAvailableImages();
        }
    }, [isOpen, testConnection, loadAvailableImages]);

    // 刷新图片列表
    const handleRefresh = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        await testConnection();
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
            console.error('删除图片失败:', error);
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

        // 使用智能排序
        filtered.sort(smartImageSort);

        return filtered;
    }, [availableImages, searchTerm]);

    const handleImageSelect = (imageId: string) => {
        // 如果点击的是已选中的图片，则取消选中
        if (selectedImage === imageId) {
            setSelectedImage(null);
        } else {
            // 否则选中新图片
            setSelectedImage(imageId);
        }
    };

    const handleConfirm = () => {
        if (selectedImage) {
            onImageSelected(selectedImage);
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



    // 格式化文件大小
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 格式化上传时间
    const formatUploadTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return '刚刚';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}小时前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Cloud className="h-4 w-4" />
                            选择云端图片
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Cloud className="h-5 w-5" />
                            选择云端图片
                        </DialogTitle>
                        <DialogDescription>
                            从云端存储桶中选择已上传的图片
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col space-y-4 min-h-0">
                        {/* 连接状态提示 - 只有在真正有问题且没有图片时才显示 */}
                        {connectionStatus && !connectionStatus.success && availableImages.length === 0 && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <div className="text-sm text-red-700 dark:text-red-300">
                                    <div className="font-medium">连接问题</div>
                                    <div className="text-xs">{connectionStatus.message}</div>
                                    <div className="text-xs mt-1">
                                        请检查 Supabase 配置或执行 SUPABASE_RLS_FIX.sql 中的 SQL 命令
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* 搜索框和操作按钮 */}
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="搜索图片..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9"
                                />
                            </div>

                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="flex items-center gap-2 h-9 px-3"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                刷新
                            </Button>


                        </div>

                        {/* 图片列表 */}
                        <div className="flex-1 overflow-y-auto" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        正在加载图片列表...
                                    </div>
                                </div>
                            ) : processedImages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-gray-500">
                                        <Cloud className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                        <p>{searchTerm ? '没有找到匹配的图片' : '没有已上传的图片'}</p>
                                        <p className="text-sm mt-1">请先上传图片到云端存储</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {processedImages.map((image) => (
                                            <div
                                                key={image.id}
                                                className={`relative border rounded-lg p-2 cursor-pointer transition-all group ${selectedImage === image.id
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                onClick={() => handleImageSelect(image.id)}
                                            >
                                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center mb-2 overflow-hidden">
                                                    {imageLoadErrors.has(image.id) ? (
                                                        <div className="flex items-center justify-center w-full h-full">
                                                            <div className="text-center">
                                                                <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                                </svg>
                                                                <p className="text-xs text-gray-500">图片加载失败</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Image
                                                            src={image.url}
                                                            alt={`图片: ${image.originalName}`}
                                                            className="w-full h-full object-cover"
                                                            width={200}
                                                            height={200}
                                                            onError={() => {
                                                                console.warn(`图片加载失败: ${image.originalName} (${image.url})`);
                                                                setImageLoadErrors(prev => new Set(prev).add(image.id));
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                {/* 图片信息 */}
                                                <div className="space-y-1">
                                                    <div className="text-xs text-center truncate font-medium">
                                                        {image.originalName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 text-center">
                                                        {formatFileSize(image.size)}
                                                    </div>
                                                    <div className="text-xs text-gray-400 text-center">
                                                        {formatUploadTime(image.uploadedAt)}
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

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            {isDeleting ? (
                                <div className="space-y-4">
                                    <p>正在删除图片，请稍候...</p>
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            正在删除: {imageToDelete?.name}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    确定要删除&ldquo;{imageToDelete?.name}&rdquo;吗？
                                    <br />
                                    <br />
                                    此操作不可撤销，图片将从云端永久删除。
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            style={{ background: '#EF4444' }}
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    删除中...
                                </div>
                            ) : (
                                '确认删除'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}; 