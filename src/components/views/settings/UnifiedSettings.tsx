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
import { Progress } from "@/components/animate-ui/components/radix/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/simple-tabs";
import { ThemeColorProvider, PAGE_THEME_COLORS } from "@/contexts/ThemeColorContext";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip";
import { InlineLoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode } from "@/hooks/useThemeMode";

import {
  Save, Search, RefreshCw, Eye, Image as ImageIcon, Grid3X3, List,
  Trash2, CloudUpload, XCircle, Package, Settings, SlidersHorizontal,
  Upload, Download, Eye as EyeIcon, CloudUpload as CloudUploadIcon, CloudDownload
} from "lucide-react";
import { MixedText } from "@/components/ui/MixedText";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { RecordItem, StudyPlan, KnowledgeItem, UserSettings, ExamCountdown, Note } from "@/types/record";
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
  setCountdowns,
  setNotes,
  records = [],
  plans = [],
  knowledge = [],
  countdowns = [],
  notes = [],
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
  setCountdowns?: React.Dispatch<React.SetStateAction<ExamCountdown[]>>;
  setNotes?: React.Dispatch<React.SetStateAction<Note[]>>;
  records?: RecordItem[];
  plans?: StudyPlan[];
  knowledge?: KnowledgeItem[];
  countdowns?: ExamCountdown[];
  notes?: Note[];
  settings?: UserSettings;
  activeTab?: string;
  navMode?: string;
}) {
  const { notify, notifyLoading, updateToSuccess, updateToError } = useNotification();
  const { isDarkMode } = useThemeMode();
  const { theme, setTheme } = useTheme();

  // Appearance settings
  const [eyeCare, setEyeCare] = useLocalStorageBoolean('eye-care-enabled', false);



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
        countdowns || [],
        notes || [],
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
        // Show error notification with more details
        const errorMessage = result.message || "上传过程中发生未知错误";
        notify({
          type: "error",
          message: "上传失败",
          description: errorMessage
        });

        // Log detailed error information for debugging
        console.error("上传失败详情:", {
          success: result.success,
          message: result.message,
          details: result.details
        });
      }
    } catch (error) {
      console.error("上传过程中发生异常:", error);

      let errorMessage = "未知错误";
      if (error instanceof Error) {
        errorMessage = error.message;

        // 提供更友好的错误信息
        if (error.message.includes('invalid input syntax for type uuid')) {
          errorMessage = "知识点ID格式错误，请尝试重新导入数据";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "网络连接失败，请检查网络连接后重试";
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = "权限不足，请重新登录";
        } else if (error.message.includes('timeout')) {
          errorMessage = "请求超时，请稍后重试";
        }
      }

      notify({
        type: "error",
        message: "上传失败",
        description: errorMessage
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

        if (setCountdowns && result.report.countdowns) {
          setCountdowns(result.report.countdowns.map(item => item.item));
        }

        if (setNotes && result.report.notes) {
          setNotes(result.report.notes.map(item => item.item));
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
              <TabsList className="items-center h-10 px-2 py-1">
                <TabsTrigger value="appearance" className="flex items-center px-6 py-2">外观设置</TabsTrigger>
                <TabsTrigger value="data" className="flex items-center px-6 py-2">数据管理</TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center px-6 py-2">AI功能</TabsTrigger>
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


            {/* 云端数据概览 */}
            <CloudDataOverview
              isOpen={showCloudOverview}
              onClose={() => setShowCloudOverview(false)}
              localRecords={records}
              localPlans={plans}
              localKnowledge={knowledge}
              localCountdowns={countdowns}
              localNotes={[]} // 暂时传递空数组，因为设置页面没有管理本地笔记数据
              localSettings={settings}
              onClearLocalData={onClearLocalData}
            />

          </Tabs>
        </ThemeColorProvider>
      </div>
    </TooltipProvider>
  );
}
