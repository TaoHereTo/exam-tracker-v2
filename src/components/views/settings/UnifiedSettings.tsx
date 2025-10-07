import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocalStorageBoolean, useLocalStorageString } from "@/hooks/useLocalStorage";
import { useTheme } from "next-themes";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/simple-tabs";
import { ThemeColorProvider, PAGE_THEME_COLORS } from "@/contexts/ThemeColorContext";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip";
import { InlineLoadingSpinner } from "@/components/ui/LoadingSpinner";
import { supabaseImageManager, type SupabaseImageInfo } from "@/lib/supabaseImageManager";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode } from "@/hooks/useThemeMode";

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
import type { RecordItem, StudyPlan, KnowledgeItem, UserSettings, ExamCountdown } from "@/types/record";
import type { UploadProgress } from "@/lib/cloudSyncService";
import type { SyncReportItem } from "@/types/common";
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { CloudDataOverview } from "@/components/views/CloudDataOverview";
import { CloudSyncService } from "@/lib/cloudSyncService";
import { UnifiedTable, type DataTableColumn } from "@/components/ui/UnifiedTable";
import { AISettings } from "./AISettings";
import { Type } from "lucide-react";

export function UnifiedSettings({
  onExport,
  onImport,
  onClearLocalData,
  setRecords,  // Add setter functions
  setPlans,
  setKnowledge,
  records = [],
  plans = [],
  knowledge = [],
  countdowns = [],
  settings = {},
  activeTab,
  navMode,
}: {
  onExport?: () => void;
  onImport?: () => void;
  onClearLocalData?: () => void;
  setRecords?: React.Dispatch<React.SetStateAction<RecordItem[]>>;  // Add setter types
  setPlans?: React.Dispatch<React.SetStateAction<StudyPlan[]>>;
  setKnowledge?: React.Dispatch<React.SetStateAction<KnowledgeItem[]>>;
  records?: RecordItem[];
  plans?: StudyPlan[];
  knowledge?: KnowledgeItem[];
  countdowns?: ExamCountdown[];
  settings?: UserSettings;
  activeTab?: string;
  navMode?: string;
}) {
  const { notify, notifyLoading, updateToSuccess, updateToError } = useNotification();
  const { isDarkMode } = useThemeMode();
  const { theme, setTheme } = useTheme();

  // Appearance settings
  const [eyeCare, setEyeCare] = useLocalStorageBoolean('eye-care-enabled', false);


  // Advanced settings - image management
  const [showImageManager, setShowImageManager] = useState(false);
  const [cloudImages, setCloudImages] = useState<SupabaseImageInfo[]>([]);
  const [imageSearchTerm, setImageSearchTerm] = useState('');
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  // Pagination for image management
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Advanced settings - delete images
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Cloud sync states
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number; currentItem: string } | null>(null);
  const [syncReport, setSyncReport] = useState<{
    records: SyncReportItem<RecordItem>[];
    plans: SyncReportItem<StudyPlan>[];
    knowledge: SyncReportItem<KnowledgeItem>[];
  } | null>(null);
  const [showCloudOverview, setShowCloudOverview] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  // Add state for confirmation dialogs
  const [uploadConfirmDialogOpen, setUploadConfirmDialogOpen] = useState(false);
  const [downloadConfirmDialogOpen, setDownloadConfirmDialogOpen] = useState(false);

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

    // Close the dialog immediately and show loading notification
    setDeleteDialogOpen(false);

    // Show loading notification
    let toastId: string | undefined;
    if (notifyLoading) {
      toastId = notifyLoading("正在删除图片", `正在删除 ${imagesToDelete.length} 张图片`);
    } else {
      // Fallback to regular notification if notifyLoading is not available
      notify({
        type: "info",
        message: "正在删除图片",
        description: `正在删除 ${imagesToDelete.length} 张图片`
      });
    }

    try {
      let successCount = 0;

      for (let i = 0; i < imagesToDelete.length; i++) {
        const imageId = imagesToDelete[i];
        const image = cloudImages.find(img => img.id === imageId);
        const imageName = image?.originalName || `图片${i + 1}`;

        try {
          const success = await supabaseImageManager.deleteImage(imageId);
          if (success) successCount++;
        } catch (error) {
          console.error('删除图片失败:', error);
        }
      }

      // Update to success notification
      if (toastId && updateToSuccess) {
        updateToSuccess(toastId, "删除成功", `成功删除 ${successCount} 张图片`);
      } else {
        notify({
          type: "success",
          message: "删除成功",
          description: `成功删除 ${successCount} 张图片`
        });
      }

      setSelectedImages(new Set());
      await loadCloudImages();
    } catch (error) {
      // Update to error notification
      if (toastId && updateToError) {
        updateToError(toastId, "删除失败", "删除过程中发生错误，请重试");
      } else {
        notify({
          type: "error",
          message: "删除失败",
          description: "删除过程中发生错误，请重试"
        });
      }
    } finally {
      // Clear the images to delete array
      setImagesToDelete([]);
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

  // Add sorting state variables (like in SupabaseImageSelectorDialog)
  const [sortKey, setSortKey] = useState<'time' | 'name'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Update the filteredImages with sorting (like in SupabaseImageSelectorDialog)
  const filteredImages = useMemo(() => {
    // 过滤图片
    const filtered = cloudImages.filter(img =>
      img.originalName.toLowerCase().includes(imageSearchTerm.toLowerCase()) ||
      img.fileName.toLowerCase().includes(imageSearchTerm.toLowerCase())
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
  }, [cloudImages, imageSearchTerm, sortKey, sortOrder]);

  // Cloud sync functions
  const handleUploadToCloud = async () => {
    setUploadConfirmDialogOpen(true);
  };

  const confirmUploadToCloud = async () => {
    setUploadConfirmDialogOpen(false);
    try {
      // Set uploading state
      setIsUploading(true);
      setUploadProgress({
        current: 0,
        total: 4,
        currentItem: "准备上传...",
        stage: 'checking',
        isPaused: false,
        isCancelled: false
      });

      // Upload data to cloud with progress reporting
      const result = await CloudSyncService.uploadToCloud(
        records || [],
        plans || [],
        knowledge || [],
        settings || {},
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.success) {
        // Show success notification
        notify({
          type: "success",
          message: "上传成功",
          description: result.message
        });
      } else {
        // Show error notification
        notify({
          type: "error",
          message: "上传失败",
          description: result.message
        });
      }
    } catch (error) {
      notify({
        type: "error",
        message: "上传失败",
        description: error instanceof Error ? error.message : "未知错误"
      });
    } finally {
      // Reset uploading state
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDownloadFromCloud = async () => {
    setDownloadConfirmDialogOpen(true);
  };

  const confirmDownloadFromCloud = async () => {
    setDownloadConfirmDialogOpen(false);
    try {
      // Set downloading state
      setIsDownloading(true);
      setDownloadProgress({ current: 0, total: 4, currentItem: "准备下载..." });

      // Download data from cloud with progress reporting
      const result = await CloudSyncService.downloadFromCloud((progress) => {
        setDownloadProgress(progress);
      });

      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.success && result.report) {
        // Update local state with downloaded data
        if (setRecords && result.report.records) {
          setRecords(result.report.records.map(item => item.item));
        }

        if (setPlans && result.report.plans) {
          setPlans(result.report.plans.map(item => item.item));
        }

        if (setKnowledge && result.report.knowledge) {
          setKnowledge(result.report.knowledge.map(item => item.item));
        }

        // Show success notification
        notify({
          type: "success",
          message: "下载成功",
          description: result.message
        });
      } else {
        // Show error notification
        notify({
          type: "error",
          message: "下载失败",
          description: result.message
        });
      }
    } catch (error) {
      notify({
        type: "error",
        message: "下载失败",
        description: error instanceof Error ? error.message : "未知错误"
      });
    } finally {
      // Reset downloading state
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleViewCloudData = () => {
    setShowCloudOverview(true);
  };

  const handleCancelUpload = () => {
    if (abortController) {
      abortController.abort();
    }
  };


  // Save all settings to cloud
  const handleSaveAllSettings = async () => {
    try {
      // Show loading notification
      const toastId = notifyLoading ? notifyLoading('正在保存设置到云端...', '正在同步所有设置到云端') : null;

      // Collect all current settings
      const currentSettings: UserSettings = {
        theme: theme || 'system',
        'eye-care-enabled': eyeCare ? 'true' : 'false',
        // Add other settings as needed
      };

      // Save settings to cloud using CloudSyncService
      const result = await CloudSyncService.saveSettingsToCloud(currentSettings);

      if (result.success) {
        // Update to success notification
        if (toastId && updateToSuccess) {
          updateToSuccess(toastId, '设置已保存到云端');
        } else {
          notify({
            type: 'success',
            message: '设置已保存到云端'
          });
        }
      } else {
        // Update to error notification
        if (toastId && updateToError) {
          updateToError(toastId, '设置保存失败', result.message || '保存设置时发生错误');
        } else {
          notify({
            type: 'error',
            message: '设置保存失败',
            description: result.message || '保存设置时发生错误'
          });
        }
      }
    } catch (error) {
      console.error('保存设置到云端失败:', error);

      // Show error notification
      notify({
        type: 'error',
        message: '设置保存失败',
        description: error instanceof Error ? error.message : '保存设置时发生未知错误'
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="px-2 sm:px-4 -mx-4" style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
      }}>
        <ThemeColorProvider defaultColor={PAGE_THEME_COLORS.settings}>
          <Tabs defaultValue="appearance" className="w-full" themeColor={PAGE_THEME_COLORS.settings}>
            <div className="flex justify-center items-center mb-6 py-2">
              <TabsList className="items-center h-10">
                <TabsTrigger value="appearance" className="flex items-center">外观设置</TabsTrigger>
                <TabsTrigger value="data" className="flex items-center">数据管理</TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center">AI功能</TabsTrigger>
              </TabsList>
            </div>

            <TabsContents>
              <TabsContent value="appearance">
                {/* Appearance Settings */}
                <div className="space-y-6">

                  {/* Theme Switch */}
                  <div className="flex flex-row items-start sm:items-center justify-between py-4 gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base sm:text-lg text-foreground"><MixedText text="深浅色切换" /></h3>
                      <p className="text-sm text-muted-foreground mt-1"><MixedText text="切换浅色、深色或跟随系统。" /></p>
                    </div>
                    <div className="w-auto">
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-[120px] h-8 sm:h-10 text-sm">
                          <SelectValue placeholder="选择外观" className="text-sm" />
                        </SelectTrigger>
                        <SelectContent className="select-content-fixed-width" position="popper" sideOffset={4}>
                          <SelectItem value="light" className="text-sm"><MixedText text="浅色模式" /></SelectItem>
                          <SelectItem value="dark" className="text-sm"><MixedText text="深色模式" /></SelectItem>
                          <SelectItem value="system" className="text-sm"><MixedText text="跟随系统" /></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>

                  {/* Eye Care Mode */}
                  <div className="flex flex-row items-start sm:items-center justify-between py-4 gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base sm:text-lg text-foreground"><MixedText text="护眼模式" /></h3>
                      <p className="text-sm text-muted-foreground mt-1">
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

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>

                </div>

                {/* Save Settings Button - Bottom right */}
                <div className="flex justify-center mt-8 mb-6">
                  <Button
                    onClick={handleSaveAllSettings}
                    variant="default"
                    className="flex items-center justify-center h-9 w-32 text-sm font-medium shadow-none hover:shadow-none transition-all duration-200 rounded-full bg-[#db2777] hover:bg-[#db2777]/90 text-white dark:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      <MixedText text="保存设置" />
                    </div>
                  </Button>
                </div>
              </TabsContent>


              <TabsContent value="data">
                {/* Data Management */}
                <div className="space-y-6">

                  {/* Backup and Restore */}
                  <div className="flex flex-row items-start sm:items-center justify-between py-4 gap-3">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg text-foreground"><MixedText text="备份与恢复" /></h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        将所有数据导出到文件、或从文件恢复。
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={onExport}
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full"
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
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          <MixedText text="导入数据" />
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* 数据概览 */}
                  <div className="flex flex-row items-start sm:items-center justify-between py-4 gap-3">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg text-foreground"><MixedText text="数据概览" /></h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        查看云端和本地数据详情。
                      </p>
                    </div>
                    <div className="flex gap-1 sm:gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleViewCloudData}
                            disabled={isUploading || isDownloading}
                            variant="outline"
                            size="sm"
                            className="h-8 sm:h-9 w-8 sm:w-9 rounded-full"
                          >
                            <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          <p><MixedText text="查看数据详情" /></p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>

                  {/* Cloud Data Sync */}
                  <div className="py-4">
                    <div className="flex flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg text-foreground"><MixedText text="云端数据同步" /></h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          将数据同步到云端，实现多设备数据共享和备份。
                        </p>
                      </div>
                      <div className="flex gap-1 sm:gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleUploadToCloud}
                              disabled={isUploading || isDownloading}
                              variant="outline"
                              size="sm"
                              className="h-8 sm:h-9 w-8 sm:w-9 rounded-full"
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
                              disabled={isUploading || isDownloading}
                              variant="outline"
                              size="sm"
                              className="h-8 sm:h-9 w-8 sm:w-9 rounded-full"
                            >
                              <CloudDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            <p><MixedText text="从云端下载数据到本地" /></p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Upload Progress Bar */}
                    {isUploading && uploadProgress && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="font-medium"><MixedText text={uploadProgress.currentItem} /></span>
                          <span>{uploadProgress.current}/{uploadProgress.total}</span>
                        </div>
                        <Progress
                          value={(uploadProgress.current / uploadProgress.total) * 100}
                          variant="upload"
                          showText={true}
                        />
                      </div>
                    )}

                    {/* Download Progress Bar */}
                    {isDownloading && downloadProgress && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="font-medium"><MixedText text={downloadProgress.currentItem} /></span>
                          <span>{downloadProgress.current}/{downloadProgress.total}</span>
                        </div>
                        <Progress
                          value={(downloadProgress.current / downloadProgress.total) * 100}
                          variant="upload"
                          showText={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>

                  {/* Cloud Image Management */}
                  <div className="flex flex-row items-start sm:items-center justify-between py-4 gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base sm:text-lg text-foreground"><MixedText text="云端图片管理" /></h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        <MixedText text="管理Supabase存储桶中的图片，支持上传、删除、搜索等功能。" />
                      </p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Tooltip key={showImageManager ? 'collapsed' : 'expanded'}>
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
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full"
                          >
                            {showImageManager ? <XCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <Package className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          <p>{showImageManager ? '收起管理' : '展开管理'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Image Management Interface */}
                  {showImageManager && (
                    <div className="mt-3">
                      {(() => {
                        // 定义表格列
                        const imageColumns: DataTableColumn<SupabaseImageInfo>[] = [
                          {
                            key: 'thumbnail',
                            label: '缩略图',
                            className: 'w-32',
                            render: (image) => (
                              <PhotoProvider>
                                <PhotoView src={image.url}>
                                  <div className="relative w-16 h-12 rounded overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity">
                                    <Image
                                      src={image.url}
                                      alt={image.originalName}
                                      width={64}
                                      height={48}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
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
                                  </div>
                                </PhotoView>
                              </PhotoProvider>
                            )
                          },
                          {
                            key: 'originalName',
                            label: '文件名',
                            className: 'min-w-[200px]',
                            render: (image) => (
                              <div className="font-medium text-gray-900 dark:text-gray-100 truncate" title={image.originalName}>
                                {image.originalName}
                              </div>
                            )
                          },
                          {
                            key: 'size',
                            label: '大小',
                            className: 'w-24',
                            render: (image) => (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatFileSize(image.size)}
                              </span>
                            )
                          },
                          {
                            key: 'uploadedAt',
                            label: '上传时间',
                            className: 'w-40',
                            render: (image) => (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatUploadTime(image.uploadedAt)}
                              </span>
                            )
                          }
                        ];


                        // 计算分页数据
                        const totalPages = Math.ceil(filteredImages.length / itemsPerPage);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const paginatedImages = filteredImages.slice(startIndex, endIndex);

                        return (
                          <UnifiedTable
                            columns={imageColumns}
                            data={paginatedImages}
                            selected={Array.from(selectedImages)}
                            onSelect={(selected) => setSelectedImages(new Set(selected))}
                            rowKey={(image) => image.id}
                            onBatchDelete={handleDeleteSelectedImages}
                            batchDeleteText={`删除选中的 ${selectedImages.size} 张图片`}
                            filters={[
                              {
                                type: 'search',
                                placeholder: '搜索图片...',
                                value: imageSearchTerm,
                                onChange: setImageSearchTerm
                              },
                              {
                                type: 'select',
                                placeholder: '排序方式',
                                value: `${sortKey}_${sortOrder}`,
                                onChange: (value) => {
                                  const [k, o] = value.split('_');
                                  setSortKey(k as 'time' | 'name');
                                  setSortOrder(o as 'asc' | 'desc');
                                },
                                options: [
                                  { value: 'time_desc', label: '时间降序' },
                                  { value: 'time_asc', label: '时间升序' },
                                  { value: 'name_asc', label: '名称升序' },
                                  { value: 'name_desc', label: '名称降序' }
                                ]
                              }
                            ]}
                            actions={[
                              {
                                label: '',
                                icon: <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoadingImages ? 'animate-spin' : ''}`} />,
                                onClick: loadCloudImages,
                                disabled: isLoadingImages,
                                variant: 'outline',
                                className: 'h-8 w-8 sm:h-9 sm:w-9 rounded-full',
                                tooltip: '刷新图片列表'
                              },
                              {
                                label: '',
                                icon: <CloudUpload className="w-4 h-4 sm:w-5 sm:h-5" />,
                                onClick: handleUploadImage,
                                variant: 'outline',
                                className: 'h-8 w-8 sm:h-9 sm:w-9 rounded-full',
                                tooltip: '上传图片'
                              },
                              {
                                label: '',
                                icon: <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />,
                                onClick: handleDeleteSelectedImages,
                                disabled: selectedImages.size === 0,
                                variant: 'destructive',
                                className: 'h-8 w-8 sm:h-9 sm:w-9 rounded-full',
                                tooltip: selectedImages.size > 0 ? `删除选中的 ${selectedImages.size} 张图片` : '请选择要删除的图片'
                              }
                            ]}
                            pagination={{
                              currentPage,
                              totalPages,
                              onPageChange: setCurrentPage,
                              totalItems: filteredImages.length
                            }}
                            className="w-full"
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Save Settings Button - Bottom right */}
                <div className="flex justify-center mt-8 mb-6">
                  <Button
                    onClick={handleSaveAllSettings}
                    variant="default"
                    className="flex items-center justify-center h-9 w-32 text-sm font-medium shadow-none hover:shadow-none transition-all duration-200 rounded-full bg-[#db2777] hover:bg-[#db2777]/90 text-white dark:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      <MixedText text="保存设置" />
                    </div>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ai">
                <AISettings />
              </TabsContent>
            </TabsContents>

            {/* Upload Confirmation Dialog */}
            <Dialog open={uploadConfirmDialogOpen} onOpenChange={setUploadConfirmDialogOpen}>
              <DialogContent className="p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg"><MixedText text="确认上传数据到云端？" /></DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    此操作将把本地的所有刷题历史、学习计划和知识点数据上传到云端进行备份。如果云端已有数据，可能会被覆盖。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-row sm:flex-row gap-2">
                  <Button variant="outline"
                    onClick={() => setUploadConfirmDialogOpen(false)}
                    className="flex items-center justify-center h-8 sm:h-9 text-xs sm:text-sm rounded-full"
                  >
                    <MixedText text="取消" />
                  </Button>
                  <Button
                    onClick={confirmUploadToCloud}
                    className="flex items-center justify-center bg-[#10b981] text-white shadow-none hover:bg-[#10b981]/90 focus-visible:ring-green-500/20 dark:focus-visible:ring-green-500/40 h-8 sm:h-9 text-xs sm:text-sm rounded-full"
                  >
                    <MixedText text="确认上传" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Download Confirmation Dialog */}
            <Dialog open={downloadConfirmDialogOpen} onOpenChange={setDownloadConfirmDialogOpen}>
              <DialogContent className="p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg"><MixedText text="确认从云端下载数据？" /></DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    此操作将从云端下载所有数据到本地，可能会覆盖您当前的本地数据。请确保您已备份重要数据。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-row sm:flex-row gap-2">
                  <Button variant="outline"
                    onClick={() => setDownloadConfirmDialogOpen(false)}
                    className="flex items-center justify-center h-8 sm:h-9 text-xs sm:text-sm rounded-full"
                  >
                    <MixedText text="取消" />
                  </Button>
                  <Button
                    onClick={confirmDownloadFromCloud}
                    className="flex items-center justify-center bg-[#3b82f6] text-white shadow-none hover:bg-[#3b82f6]/90 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-500/40 h-8 sm:h-9 text-xs sm:text-sm rounded-full"
                  >
                    <MixedText text="确认下载" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Image Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) {
                setImagesToDelete([]);
              }
            }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle><MixedText text="确认删除" /></DialogTitle>
                  <DialogDescription>
                    <MixedText text={`确定要删除选中的 ${imagesToDelete.length} 张图片吗？`} />
                    <br />
                    <br />
                    <MixedText text="此操作不可撤销，删除后无法恢复。" />
                    <br />
                    <br />
                    <span className="font-medium text-red-600 text-sm">
                      {imagesToDelete.map(id => {
                        const img = cloudImages.find(img => img.id === id);
                        return img?.originalName || id;
                      }).join('、')}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      setImagesToDelete([]);
                    }}
                    className="flex items-center justify-center rounded-full"
                  >
                    <MixedText text="取消" />
                  </Button>
                  <Button
                    onClick={confirmDeleteImages}
                    variant="destructive"
                    className="flex items-center justify-center rounded-full"
                  >
                    <MixedText text="确认删除" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 云端数据概览 */}
            <CloudDataOverview
              isOpen={showCloudOverview}
              onClose={() => setShowCloudOverview(false)}
              localRecords={records}
              localPlans={plans}
              localKnowledge={knowledge}
              localCountdowns={countdowns}
              onClearLocalData={onClearLocalData}
            />

          </Tabs>
        </ThemeColorProvider>
      </div>
    </TooltipProvider>
  );
}
