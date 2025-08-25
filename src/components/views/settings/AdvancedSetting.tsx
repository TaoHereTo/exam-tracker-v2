import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import React, { useState, useEffect, useCallback } from "react";
import { useLocalStorageBoolean, useLocalStorageString } from "@/hooks/useLocalStorage";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";




import { getLocalStorageInfo, formatStorageSize, type StorageInfo } from "@/lib/storageUtils";
import { Progress } from "@/components/ui/progress";
import { InlineLoadingSpinner } from "@/components/ui/LoadingSpinner";
import { supabaseImageManager, type SupabaseImageInfo } from "@/lib/supabaseImageManager";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Eye, Image as ImageIcon, Settings, Grid3X3, List, Trash2, Upload, XCircle, Package, CloudUpload } from "lucide-react";
import { smartImageSort } from "@/lib/utils";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MixedText } from "@/components/ui/MixedText";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";




export function AdvancedSetting() {
    const { notify } = useNotification();









    // 新功能4：localStorage使用量监控
    const [storageInfo, setStorageInfo] = React.useState<StorageInfo | null>(null);

    // 新功能5：图片管理
    const [showImageManager, setShowImageManager] = useState(false);
    const [cloudImages, setCloudImages] = useState<SupabaseImageInfo[]>([]);
    const [imageSearchTerm, setImageSearchTerm] = useState('');
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [imageManagerView, setImageManagerView] = useState<'grid' | 'list'>('grid');

    // 删除选中的图片
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteProgress, setDeleteProgress] = useState(0);
    const [currentDeletingImage, setCurrentDeletingImage] = useState<string>('');
    const [deleteDialogKey, setDeleteDialogKey] = useState(0); // 强制重新渲染的key





    // 加载云端图片
    const loadCloudImages = useCallback(async () => {
        setIsLoadingImages(true);
        try {
            const images = await supabaseImageManager.getAllImages();
            setCloudImages(images);
        } catch (error) {
            notify({
                type: "error",
                message: "加载失败",
                description: "无法从云端加载图片列表"
            });
        } finally {
            setIsLoadingImages(false);
        }
    }, [notify]);

    // 上传图片
    const handleUploadImage = useCallback(async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;

        input.onchange = async (e) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            if (files.length === 0) return;

            let successCount = 0;
            for (const file of files) {
                try {
                    await supabaseImageManager.uploadImage(file);
                    successCount++;
                } catch (error) {
                }
            }

            if (successCount > 0) {
                notify({
                    type: "success",
                    message: "上传成功",
                    description: `成功上传 ${successCount} 张图片`
                });
                await loadCloudImages();
            }
        };

        input.click();
    }, [notify, loadCloudImages]);

    const handleDeleteSelectedImages = async () => {
        if (selectedImages.size === 0) return;

        setImagesToDelete(Array.from(selectedImages));
        setDeleteDialogOpen(true);
    };

    const confirmDeleteImages = async () => {
        if (imagesToDelete.length === 0) return;

        // 立即设置删除状态，确保UI立即响应
        setIsDeleting(true);
        setDeleteProgress(0);
        setCurrentDeletingImage('准备删除...');
        setDeleteDialogKey(prev => prev + 1); // 强制重新渲染

        // 强制触发UI更新
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
            let successCount = 0;
            const totalImages = imagesToDelete.length;

            for (let i = 0; i < imagesToDelete.length; i++) {
                const imageId = imagesToDelete[i];
                const image = cloudImages.find(img => img.id === imageId);
                const imageName = image?.originalName || `图片${i + 1}`;

                // 更新当前删除的图片名称和进度
                setCurrentDeletingImage(imageName);
                const progress = ((i + 1) / totalImages) * 100;
                setDeleteProgress(progress);

                try {
                    const success = await supabaseImageManager.deleteImage(imageId);
                    if (success) successCount++;
                } catch (error) {
                }

                // 添加延迟让用户看到进度变化
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // 显示完成状态
            setDeleteProgress(100);
            setCurrentDeletingImage('删除完成');
            // 显示结果通知
            if (successCount > 0) {
                notify({
                    type: "success",
                    message: "删除成功",
                    description: `成功删除 ${successCount} 张图片`
                });
                setSelectedImages(new Set());
                // 重新加载图片列表
                await loadCloudImages();
            } else {
                notify({
                    type: "error",
                    message: "删除失败",
                    description: "没有图片被成功删除"
                });
            }

            // 延迟关闭对话框，让用户看到完成状态
            setTimeout(() => {
                setIsDeleting(false);
                setDeleteProgress(0);
                setCurrentDeletingImage('');
                setDeleteDialogOpen(false);
                setImagesToDelete([]);
            }, 1500);

        } catch (error) {
            // 重置状态
            setIsDeleting(false);
            setDeleteProgress(0);
            setCurrentDeletingImage('');
            setDeleteDialogOpen(false);
            setImagesToDelete([]);

            notify({
                type: "error",
                message: "删除失败",
                description: "删除过程中发生错误，请重试"
            });
        }
    };



    // 过滤和排序图片
    const filteredImages = cloudImages
        .filter(img =>
            img.originalName.toLowerCase().includes(imageSearchTerm.toLowerCase()) ||
            img.fileName.toLowerCase().includes(imageSearchTerm.toLowerCase())
        )
        .sort(smartImageSort);

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

    // 更新存储信息
    const updateStorageInfo = useCallback(() => {
        const info = getLocalStorageInfo();
        setStorageInfo(info);
    }, []);

    // 初始化存储信息监控
    useEffect(() => {
        updateStorageInfo();
        // 增加刷新间隔，减少频繁更新
        const interval = setInterval(updateStorageInfo, 30000); // 改为30秒
        return () => clearInterval(interval);
    }, [updateStorageInfo]);





    // 概览动画开关
    const [overviewAnimate, setOverviewAnimate] = useLocalStorageBoolean('overview-animate', true);

    return (
        <>
            {/* 数据概览动画设置 */}
            <Card className="mt-4 sm:mt-6">
                <CardHeader>
                    <CardTitle className="text-base sm:text-lg"><MixedText text="数据概览动画" /></CardTitle>
                    <CardDescription className="text-xs sm:text-sm"><MixedText text="关闭后，数据概览中的卡片将以静态列表展示，不再滚动动画。" /></CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                        <div className="flex-1">
                            <h3 className="font-medium text-sm sm:text-base"><MixedText text="启用滚动动画" /></h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1"><MixedText text="控制数据概览卡片是否进行滚动动画展示。" /></p>
                        </div>
                        <Switch checked={overviewAnimate} onCheckedChange={setOverviewAnimate} className="mt-2 sm:mt-0" />
                    </div>
                </CardContent>
            </Card>
            {/* 存储管理 */}
            <Card className="mt-4 sm:mt-6">
                <CardHeader>
                    <CardTitle className="text-base sm:text-lg"><MixedText text="存储管理" /></CardTitle>
                    <CardDescription className="text-xs sm:text-sm"><MixedText text="监控和管理本地存储使用情况。" /></CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                    {storageInfo && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                            <div className="flex-1">
                                <h3 className="font-medium text-sm sm:text-base"><MixedText text="本地存储使用情况" /></h3>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                    <MixedText text={`已使用 ${formatStorageSize(storageInfo.usedSize)} / ${formatStorageSize(5 * 1024 * 1024)} (${storageInfo.usagePercentage.toFixed(1)}%)`} />
                                </p>
                                <Progress
                                    value={storageInfo.usagePercentage}
                                    variant="info"
                                    showText={true}
                                    className="mt-2 h-2 sm:h-3"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                        <div className="flex-1">
                            <h3 className="font-medium text-sm sm:text-base"><MixedText text="云端图片管理" /></h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                <MixedText text="管理Supabase存储桶中的图片，支持上传、删除、搜索等功能。" />
                            </p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-0">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={() => {
                                                setShowImageManager(!showImageManager);
                                                if (!showImageManager) {
                                                    loadCloudImages();
                                                }
                                            }}
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 sm:h-9 sm:w-9"
                                        >
                                            {showImageManager ? <XCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <Package className="w-4 h-4 sm:w-5 sm:h-5" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">
                                        <p><MixedText text={showImageManager ? '隐藏管理' : '图片管理'} /></p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    {/* 图片管理界面 */}
                    {showImageManager && (
                        <div className="p-3 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm mt-3">
                            {/* 工具栏 */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:flex-none">
                                        <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-300 z-10 pointer-events-none" />
                                        <Input
                                            placeholder="搜索图片..."
                                            value={imageSearchTerm}
                                            onChange={(e) => setImageSearchTerm(e.target.value)}
                                            className="pl-7 sm:pl-10 w-full border-gray-200 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 h-8 sm:h-10 text-sm"
                                        />
                                    </div>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={loadCloudImages}
                                                    disabled={isLoadingImages}
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 sm:h-9 sm:w-9"
                                                >
                                                    <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoadingImages ? 'animate-spin' : ''}`} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="text-xs">
                                                <p><MixedText text="刷新" /></p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-0">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={() => setImageManagerView(imageManagerView === 'grid' ? 'list' : 'grid')}
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 sm:h-9 sm:w-9"
                                                >
                                                    {imageManagerView === 'grid' ? <List className="w-4 h-4 sm:w-5 sm:h-5" /> : <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="text-xs">
                                                <p><MixedText text={imageManagerView === 'grid' ? '列表视图' : '网格视图'} /></p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={handleUploadImage}
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 sm:h-9 sm:w-9"
                                                >
                                                    <CloudUpload className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="text-xs">
                                                <p><MixedText text="上传图片" /></p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {selectedImages.size > 0 && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={handleDeleteSelectedImages}
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 sm:h-9 sm:w-9"
                                                    >
                                                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="text-xs">
                                                    <p><MixedText text={`删除选中的 ${selectedImages.size} 张图片`} /></p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </div>

                            {/* 图片列表 */}
                            <div className="space-y-3 sm:space-y-4">
                                {isLoadingImages ? (
                                    <div className="flex items-center justify-center py-8 sm:py-12">
                                        <div className="flex items-center gap-2 sm:gap-3 text-gray-500">
                                            <InlineLoadingSpinner className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="text-xs sm:text-sm"><MixedText text="正在加载..." /></span>
                                        </div>
                                    </div>
                                ) : filteredImages.length === 0 ? (
                                    <div className="flex items-center justify-center py-8 sm:py-12">
                                        <div className="text-center">
                                            <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                                            <p className="text-gray-500 text-sm mb-1">
                                                <MixedText text={imageSearchTerm ? '没有找到匹配的图片' : '暂无图片'} />
                                            </p>
                                            {!imageSearchTerm && (
                                                <p className="text-xs sm:text-sm text-gray-400"><MixedText text="点击&quot;上传&quot;开始添加图片" /></p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`${imageManagerView === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4' : 'space-y-2'}`}>
                                        {filteredImages.map((image) => (
                                            <div
                                                key={image.id}
                                                className={`group relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer ${selectedImages.has(image.id)
                                                    ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                                                    : 'hover:border-gray-300 dark:hover:border-gray-600'
                                                    } ${imageManagerView === 'list' ? 'flex items-center gap-2 sm:gap-3 p-2' : 'p-1 sm:p-2'}`}
                                                onClick={() => {
                                                    const newSelected = new Set(selectedImages);
                                                    if (newSelected.has(image.id)) {
                                                        newSelected.delete(image.id);
                                                    } else {
                                                        newSelected.add(image.id);
                                                    }
                                                    setSelectedImages(newSelected);
                                                }}
                                            >
                                                {/* 选择框 */}
                                                <input
                                                    type="checkbox"
                                                    checked={selectedImages.has(image.id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        const newSelected = new Set(selectedImages);
                                                        if (e.target.checked) {
                                                            newSelected.add(image.id);
                                                        } else {
                                                            newSelected.delete(image.id);
                                                        }
                                                        setSelectedImages(newSelected);
                                                    }}
                                                    className="absolute top-1 sm:top-2 left-1 sm:left-2 z-10 w-3 h-3 sm:w-4 sm:h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                                />

                                                {/* 图片预览 */}
                                                <div
                                                    className={`${imageManagerView === 'list' ? 'w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0' : 'w-full aspect-square'} rounded overflow-hidden relative transition-transform duration-200 group-hover:scale-105`}
                                                    style={{
                                                        border: '1px solid #e5e7eb',
                                                        backgroundColor: 'white'
                                                    }}
                                                >
                                                    <Image
                                                        src={image.url}
                                                        alt={image.originalName}
                                                        width={200}
                                                        height={200}
                                                        className="w-full h-full object-cover"
                                                        style={{
                                                            backgroundColor: 'transparent',
                                                            display: 'block'
                                                        }}
                                                        onLoad={() => {
                                                            // 图片加载成功
                                                        }}
                                                        onError={(e) => {
                                                            // 图片加载失败
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.backgroundColor = '#f3f4f6';
                                                            target.style.display = 'flex';
                                                            target.style.alignItems = 'center';
                                                            target.style.justifyContent = 'center';
                                                            target.style.color = '#6b7280';
                                                            target.style.fontSize = '8px';
                                                            target.textContent = '加载失败';
                                                        }}
                                                    />

                                                    {/* 预览按钮 */}
                                                    <div className="absolute inset-0 bg-transparent transition-all duration-200 flex items-center justify-center">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={(e: React.MouseEvent) => {
                                                                            e.stopPropagation();
                                                                            // 打开图片预览
                                                                            window.open(image.url, '_blank');
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 shadow-sm z-20 h-7 w-7 sm:h-9 sm:w-9"
                                                                    >
                                                                        <Eye className="w-3 h-3 sm:w-5 sm:h-5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-xs">
                                                                    <p><MixedText text="预览图片" /></p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>

                                                {/* 图片信息 */}
                                                <div className={`${imageManagerView === 'list' ? 'flex-1 min-w-0' : 'mt-1 sm:mt-2'} space-y-1`}>
                                                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                                        {image.originalName}
                                                    </div>
                                                    <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <span><MixedText text={formatFileSize(image.size)} /></span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span><MixedText text={formatUploadTime(image.uploadedAt)} /></span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 统计信息 */}
                                {filteredImages.length > 0 && (
                                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                        <MixedText text={`共 ${filteredImages.length} 张图片${selectedImages.size > 0 ? `，选中 ${selectedImages.size} 张` : ''}`} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                </CardContent>
            </Card>

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                // 只有在不是删除过程中才允许关闭对话框
                if (!isDeleting) {
                    if (!open) {
                        setDeleteDialogOpen(false);
                        setImagesToDelete([]);
                        setDeleteProgress(0);
                        setCurrentDeletingImage('');
                    }
                } else {
                    // 如果正在删除中，强制保持对话框打开
                    if (!open) {
                        setDeleteDialogOpen(true);
                    }
                }
            }}>
                <AlertDialogContent key={`delete-dialog-${deleteDialogKey}`} className="p-4 sm:p-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg"><MixedText text="确认删除图片" /></AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            {isDeleting ? (
                                <div className="space-y-3 sm:space-y-4">
                                    <p className="text-xs sm:text-sm"><MixedText text="正在删除图片，请稍候..." /></p>
                                    <div className="space-y-2">
                                        <Progress
                                            value={deleteProgress}
                                            variant="danger"
                                            showText={true}
                                            className="h-2 sm:h-3"
                                        />
                                        {currentDeletingImage && (
                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                <MixedText text={`正在删除: ${currentDeletingImage}`} />
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs sm:text-sm">
                                    <MixedText text="确定要删除以下图片吗？此操作不可撤销！" />
                                    <br />
                                    <span className="font-medium text-red-600 text-xs sm:text-sm">
                                        {imagesToDelete.map(id => {
                                            const img = cloudImages.find(img => img.id === id);
                                            return img?.originalName || id;
                                        }).join('、')}
                                    </span>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel
                            disabled={isDeleting}
                            onClick={() => {
                                if (!isDeleting) {
                                    setDeleteDialogOpen(false);
                                    setImagesToDelete([]);
                                    setDeleteProgress(0);
                                    setCurrentDeletingImage('');
                                }
                            }}
                            className="h-8 sm:h-9 text-xs sm:text-sm"
                        >
                            <MixedText text="取消" />
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                confirmDeleteImages();
                            }}
                            disabled={isDeleting}
                            style={{ background: '#dc2626', color: 'white' }}
                            className="h-8 sm:h-9 text-xs sm:text-sm"
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-current"></div>
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
} 







