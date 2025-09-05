import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import React, { useState, useEffect, useCallback } from "react";
import { useLocalStorageBoolean, useLocalStorageString } from "@/hooks/useLocalStorage";
import { useTheme } from "next-themes";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InlineLoadingSpinner } from "@/components/ui/LoadingSpinner";
import { supabaseImageManager, type SupabaseImageInfo } from "@/lib/supabaseImageManager";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode } from "@/hooks/useThemeMode";

import { getLocalStorageInfo, formatStorageSize, type StorageInfo } from "@/lib/storageUtils";
import { smartImageSort } from "@/lib/utils";
import Image from "next/image";
import { 
  Save, Search, RefreshCw, Eye, Image as ImageIcon, Grid3X3, List, 
  Trash2, CloudUpload, XCircle, Package, Settings, SlidersHorizontal,
  Upload, Download, Eye as EyeIcon, CloudUpload as CloudUploadIcon, CloudDownload
} from "lucide-react";
import { MixedText } from "@/components/ui/MixedText";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { RecordItem, StudyPlan, KnowledgeItem, UserSettings } from "@/types/record";
import type { UploadProgress } from "@/lib/cloudSyncService";
import type { SyncReportItem } from "@/types/common";

export function UnifiedSettings({
  onExport, 
  onImport, 
  onClearLocalData,
  records = [],
  plans = [],
  knowledge = [],
  settings = {},
  activeTab,
  navMode,
}: {
  onExport?: () => void;
  onImport?: () => void;
  onClearLocalData?: () => void;
  records?: RecordItem[];
  plans?: StudyPlan[];
  knowledge?: KnowledgeItem[];
  settings?: UserSettings;
  activeTab?: string;
  navMode?: string;
}) {
  const { notify } = useNotification();
  const { isDarkMode } = useThemeMode();
  const { theme, setTheme } = useTheme();
  
  // Appearance settings
  const [eyeCare, setEyeCare] = useLocalStorageBoolean('eye-care-enabled', false);
  
  // Advanced settings - localStorage monitoring
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  
  // Advanced settings - image management
  const [showImageManager, setShowImageManager] = useState(false);
  const [cloudImages, setCloudImages] = useState<SupabaseImageInfo[]>([]);
  const [imageSearchTerm, setImageSearchTerm] = useState('');
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [imageManagerView, setImageManagerView] = useState<'grid' | 'list'>('grid');
  
  // Advanced settings - delete images
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [currentDeletingImage, setCurrentDeletingImage] = useState<string>('');
  const [deleteDialogKey, setDeleteDialogKey] = useState(0);
  
  // Advanced settings - overview animation
  const [overviewAnimate, setOverviewAnimate] = useLocalStorageBoolean('overview-animate', true);
  
  // Cloud sync states
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [syncReport, setSyncReport] = useState<{
    records: SyncReportItem<RecordItem>[];
    plans: SyncReportItem<StudyPlan>[];
    knowledge: SyncReportItem<KnowledgeItem>[];
  } | null>(null);
  const [showCloudOverview, setShowCloudOverview] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);

  // Update storage info
  const updateStorageInfo = useCallback(() => {
    const info = getLocalStorageInfo();
    setStorageInfo(info);
  }, []);

  useEffect(() => {
    updateStorageInfo();
    const interval = setInterval(updateStorageInfo, 30000);
    return () => clearInterval(interval);
  }, [updateStorageInfo]);

  // Eye care mode effect
  useEffect(() => {
    localStorage.setItem('eye-care-enabled', eyeCare ? 'true' : 'false');
    if (eyeCare && theme === 'light') {
      document.body.classList.add('eye-care');
    } else {
      document.body.classList.remove('eye-care');
    }
  }, [eyeCare, theme]);

  // Disable eye care when switching to dark mode
  useEffect(() => {
    if (theme === 'dark' && eyeCare) {
      setEyeCare(false);
    }
  }, [theme, eyeCare, setEyeCare]);

  // Image management functions
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
          console.error('上传图片失败:', error);
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

    setIsDeleting(true);
    setDeleteProgress(0);
    setCurrentDeletingImage('准备删除...');
    setDeleteDialogKey(prev => prev + 1);

    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      let successCount = 0;
      const totalImages = imagesToDelete.length;

      for (let i = 0; i < imagesToDelete.length; i++) {
        const imageId = imagesToDelete[i];
        const image = cloudImages.find(img => img.id === imageId);
        const imageName = image?.originalName || `图片${i + 1}`;

        setCurrentDeletingImage(imageName);
        const progress = ((i + 1) / totalImages) * 100;
        setDeleteProgress(progress);

        try {
          const success = await supabaseImageManager.deleteImage(imageId);
          if (success) successCount++;
        } catch (error) {
          console.error('删除图片失败:', error);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setDeleteProgress(100);
      setCurrentDeletingImage('删除完成');
      
      if (successCount > 0) {
        notify({
          type: "success",
          message: "删除成功",
          description: `成功删除 ${successCount} 张图片`
        });
        setSelectedImages(new Set());
        await loadCloudImages();
      } else {
        notify({
          type: "error",
          message: "删除失败",
          description: "没有图片被成功删除"
        });
      }

      setTimeout(() => {
        setIsDeleting(false);
        setDeleteProgress(0);
        setCurrentDeletingImage('');
        setDeleteDialogOpen(false);
        setImagesToDelete([]);
      }, 1500);

    } catch (error) {
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

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format upload time
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

  // Filter and sort images
  const filteredImages = cloudImages
    .filter(img =>
      img.originalName.toLowerCase().includes(imageSearchTerm.toLowerCase()) ||
      img.fileName.toLowerCase().includes(imageSearchTerm.toLowerCase())
    )
    .sort(smartImageSort);

  // Cloud sync functions
  const handleUploadToCloud = async () => {
    // This would integrate with your cloud sync service
    notify({
      message: "功能开发中",
      description: "云端同步功能正在开发中",
      type: "info"
    });
  };

  const handleDownloadFromCloud = async () => {
    // This would integrate with your cloud sync service
    notify({
      message: "功能开发中",
      description: "云端下载功能正在开发中",
      type: "info"
    });
  };

  const handleViewCloudData = () => {
    setShowCloudOverview(true);
  };

  const handleCancelUpload = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-2 sm:px-4">
      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg"><MixedText text="外观模式" /></CardTitle>
          <CardDescription className="text-xs sm:text-sm"><MixedText text="设置应用的外观和导航方式。" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Theme Switch */}
          <div className="flex flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
            <div className="flex-1">
              <h3 className="font-medium text-sm sm:text-base"><MixedText text="深浅色切换" /></h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1"><MixedText text="切换浅色、深色或跟随系统。" /></p>
            </div>
            <div className="w-auto">
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-auto min-w-[120px] sm:min-w-[180px] h-8 sm:h-10 text-sm">
                  <SelectValue placeholder="选择外观" className="text-sm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light" className="text-sm"><MixedText text="浅色模式" /></SelectItem>
                  <SelectItem value="dark" className="text-sm"><MixedText text="深色模式" /></SelectItem>
                  <SelectItem value="system" className="text-sm"><MixedText text="跟随系统" /></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Eye Care Mode */}
          <div className="flex flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
            <div className="flex-1">
              <h3 className="font-medium text-sm sm:text-base"><MixedText text="护眼模式" /></h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {theme === 'dark'
                  ? <MixedText text="护眼模式仅在浅色模式下可用，请先切换到浅色模式。" />
                  : <MixedText text="开启后页面整体色调更柔和，减少视觉疲劳。" />
                }
              </p>
            </div>
            <Switch
              checked={eyeCare}
              onCheckedChange={setEyeCare}
              disabled={theme === 'dark'}
              className="mt-0"
            />
          </div>

          {/* Overview Animation */}
          <div className="flex flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
            <div className="flex-1">
              <h3 className="font-medium text-sm sm:text-base"><MixedText text="数据概览动画" /></h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1"><MixedText text="控制数据概览卡片是否进行滚动动画展示。" /></p>
            </div>
            <Switch checked={overviewAnimate} onCheckedChange={setOverviewAnimate} className="mt-0" />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl"><MixedText text="数据与存储管理" /></CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            管理您的应用数据、存储使用情况和本地数据操作。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
            <div>
              <h3 className="font-medium text-sm sm:text-base"><MixedText text="备份与恢复" /></h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                将所有数据导出到文件、或从文件恢复。
              </p>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onExport}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <MixedText text="导出数据" />
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onImport}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <MixedText text="导入数据" />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="p-3 sm:p-4 border rounded-lg">
            <div className="flex flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-medium text-sm sm:text-base"><MixedText text="云端数据同步" /></h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  将数据同步到云端，实现多设备数据共享和备份。
                </p>
              </div>
              <div className="flex gap-1 sm:gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleUploadToCloud}
                      disabled={isUploading}
                      variant="outline"
                      size="sm"
                      className="h-8 sm:h-9 w-8 sm:w-9"
                    >
                      <CloudUploadIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p><MixedText text="将本地数据上传到云端备份" /></p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleDownloadFromCloud}
                      disabled={isDownloading}
                      variant="outline"
                      size="sm"
                      className="h-8 sm:h-9 w-8 sm:w-9"
                    >
                      <CloudDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p><MixedText text="从云端下载数据到本地" /></p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleViewCloudData}
                      variant="outline"
                      size="sm"
                      className="h-8 sm:h-9 w-8 sm:w-9"
                    >
                      <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p><MixedText text="查看云端存储的数据详情" /></p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Local Storage Usage */}
          {storageInfo && (
            <div className="flex flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
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

          {/* Clear Local Data */}
          <div className="flex flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
            <div>
              <h3 className="font-medium text-sm sm:text-base"><MixedText text="清空本地数据" /></h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                仅删除本地浏览器中的数据，不影响云端。
              </p>
            </div>
            <AlertDialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
              <AlertDialogTrigger asChild>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 sm:h-9 w-8 sm:w-9 p-0"
                        onClick={() => {
                          setClearDataDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <p><MixedText text="清空本地数据" /></p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-11/12 max-w-md p-4 sm:p-6">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base sm:text-lg"><MixedText text="确认清空本地数据？" /></AlertDialogTitle>
                  <AlertDialogDescription className="text-xs sm:text-sm">
                    此操作将从本地清除所有刷题历史、知识点与学习计划，但不会影响云端数据。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"><MixedText text="取消" /></AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (onClearLocalData) {
                        onClearLocalData();
                      }
                      setClearDataDialogOpen(false);
                    }}
                    className={cn(buttonVariants({ variant: "destructive" }), "w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9")}
                  >
                    确认清空
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Cloud Image Management */}
          <div className="flex flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
            <div className="flex-1">
              <h3 className="font-medium text-sm sm:text-base"><MixedText text="云端图片管理" /></h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                <MixedText text="管理Supabase存储桶中的图片，支持上传、删除、搜索等功能。" />
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
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

          {/* Image Management Interface */}
          {showImageManager && (
            <div className="p-3 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#171717] shadow-sm mt-3">
              {/* Toolbar */}
              <div className="flex flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
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
                <div className="flex items-center gap-1 sm:gap-2">
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleDeleteSelectedImages}
                          variant="destructive"
                          size="icon"
                          disabled={selectedImages.size === 0}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        <p><MixedText text={selectedImages.size > 0 ? `删除选中的 ${selectedImages.size} 张图片` : '请选择要删除的图片'} /></p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Image List */}
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
                          : ''
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
                        {/* Checkbox */}
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
                          className="absolute top-1 sm:top-2 left-1 sm:left-2 z-10 w-3 h-3 sm:w-4 sm:h-4 text-blue-600 bg-white dark:bg-[#171717] border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />

                        {/* Image Preview */}
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
                              // Image loaded successfully
                            }}
                            onError={(e) => {
                              // Image loading failed
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

                          {/* Preview Button */}
                          <div className="absolute inset-0 bg-transparent transition-all duration-200 flex items-center justify-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      // Open image preview
                                      window.open(image.url, '_blank');
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-[#171717]/90 shadow-sm z-20 h-7 w-7 sm:h-9 sm:w-9"
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

                        {/* Image Info */}
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

                {/* Statistics */}
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





      {/* Delete Image Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!isDeleting) {
          if (!open) {
            setDeleteDialogOpen(false);
            setImagesToDelete([]);
            setDeleteProgress(0);
            setCurrentDeletingImage('');
          }
        } else {
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
          <AlertDialogFooter className="flex flex-row sm:flex-row gap-2">
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
              className="bg-[#dc2626] text-white shadow-xs hover:bg-[#dc2626]/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 h-8 sm:h-9 text-xs sm:text-sm"
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


    </div>
  );
}
