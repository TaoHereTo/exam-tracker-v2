import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AppearanceSetting } from "./settings/AppearanceSetting";
import { PaginationSetting } from "./settings/PaginationSetting";

import { Progress } from "@/components/ui/progress";

import { DataImportExport } from "@/components/features/DataImportExport";
import { AdvancedSetting } from "./settings/AdvancedSetting";
import SaveSettingsButton from "./settings/SaveSettingsButton";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { Download, Upload, Eye } from "lucide-react";
import { useState } from "react";
import { CloudSyncService, UploadProgress } from "@/lib/cloudSyncService";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { CloudDataOverview } from "./CloudDataOverview";
import { SyncReportItem } from "@/types/common";
import { RecordItem, StudyPlan, KnowledgeItem, UserSettings } from "@/types/record";
import { MixedText } from "@/components/ui/MixedText";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export function SettingsView({
    onExport, onImport, onClearLocalData,
    pageSize, setPageSize,
    activeTab,
    navMode,
    records = [],
    plans = [],
    knowledge = [],
    settings = {}
}: {
    onExport?: () => void;
    onImport?: () => void;
    onClearLocalData?: () => void;
    pageSize: number;
    setPageSize: (n: number) => void;
    activeTab?: string;
    navMode?: string;
    records?: RecordItem[];
    plans?: StudyPlan[];
    knowledge?: KnowledgeItem[];
    settings?: UserSettings;
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const [syncStatus, setSyncStatus] = useState<string>('');
    const [syncReport, setSyncReport] = useState<{
        records: SyncReportItem<RecordItem>[];
        plans: SyncReportItem<StudyPlan>[];
        knowledge: SyncReportItem<KnowledgeItem>[];
    } | null>(null);
    const [showCloudOverview, setShowCloudOverview] = useState(false);
    const { notify } = useNotification();

    const handleUploadToCloud = async () => {
        setIsUploading(true);
        setSyncStatus('正在检查云端数据...');
        setSyncReport(null);
        setUploadProgress(null);

        try {
            const result = await CloudSyncService.uploadToCloud(
                records,
                plans,
                knowledge,
                settings,
                (progress) => {
                    setUploadProgress(progress);
                    setSyncStatus(progress.currentItem);
                }
            );

            if (result.success) {
                setSyncStatus('');
                setSyncReport(result.report || null);
                notify({
                    message: "上传成功",
                    description: result.message,
                    type: "success"
                });
            } else {
                setSyncStatus('');
                notify({
                    message: "上传失败",
                    description: result.message,
                    type: "error"
                });
            }
        } catch (error) {
            setSyncStatus('');
            notify({
                message: "上传失败",
                description: error instanceof Error ? error.message : "未知错误",
                type: "error"
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
        }
    };

    const handleDownloadFromCloud = async () => {
        setIsDownloading(true);
        try {
            const result = await CloudSyncService.downloadFromCloud();

            if (result.success) {
                notify({
                    message: "下载成功",
                    description: result.message,
                    type: "success"
                });
            } else {
                notify({
                    message: "下载失败",
                    description: result.message,
                    type: "error"
                });
            }
        } catch (error) {
            notify({
                message: "下载失败",
                description: error instanceof Error ? error.message : "未知错误",
                type: "error"
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleViewCloudData = () => {
        setShowCloudOverview(true);
    };

    if (activeTab === 'settings-advanced') {
        return (
            <>
                <AdvancedSetting />
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle><MixedText text="危险操作" /></CardTitle>
                        <CardDescription><MixedText text="此处操作不可逆，请谨慎使用！" /></CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h3 className="font-medium"><MixedText text="清空本地数据" /></h3>
                                    <p className="text-sm text-muted-foreground">
                                        仅删除本地浏览器中的数据，不影响云端。
                                    </p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <InteractiveHoverButton
                                            hoverColor="#DC2626"
                                            className="h-9"
                                        >
                                            清空本地数据
                                        </InteractiveHoverButton>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle><MixedText text="确认清空本地数据？" /></AlertDialogTitle>
                                            <AlertDialogDescription>
                                                此操作将从本地清除所有刷题记录、知识点与学习计划，但不会影响云端数据。
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel><MixedText text="取消" /></AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={onClearLocalData}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                确认清空
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-6 max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle><MixedText text="数据管理" /></CardTitle>
                        <CardDescription>
                            备份、恢复您的应用数据。请及时保存。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h3 className="font-medium"><MixedText text="备份与恢复" /></h3>
                                <p className="text-sm text-muted-foreground">
                                    将所有数据导出到文件、或从文件恢复。
                                </p>
                            </div>
                            <DataImportExport onImport={onImport!} onExport={onExport!} />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h3 className="font-medium"><MixedText text="云端数据同步" /></h3>
                                <p className="text-sm text-muted-foreground">
                                    将数据同步到云端，实现多设备数据共享和备份。
                                </p>
                                {syncStatus && (
                                    <p className="text-xs text-blue-600 mt-1"><MixedText text={syncStatus} /></p>
                                )}
                                {uploadProgress && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between text-xs text-gray-600">
                                            <span><MixedText text="上传进度" /></span>
                                            <span><MixedText text={`${uploadProgress.current}/${uploadProgress.total}`} /></span>
                                        </div>
                                        <Progress
                                            value={(uploadProgress.current / uploadProgress.total) * 100}
                                            variant="upload"
                                            showText={true}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <InteractiveHoverButton
                                            onClick={handleUploadToCloud}
                                            disabled={isUploading}
                                            hoverColor="#059669"
                                            icon={<Upload className="w-4 h-4" />}
                                            className="text-sm h-9"
                                        >
                                            {isUploading ? "上传中..." : "上传到云端"}
                                        </InteractiveHoverButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p><MixedText text="将本地数据上传到云端备份" /></p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <InteractiveHoverButton
                                            onClick={handleDownloadFromCloud}
                                            disabled={isDownloading}
                                            hoverColor="#3B82F6"
                                            icon={<Download className="w-4 h-4" />}
                                            className="text-sm h-9"
                                        >
                                            {isDownloading ? "下载中..." : "从云端下载"}
                                        </InteractiveHoverButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p><MixedText text="从云端下载数据到本地" /></p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <InteractiveHoverButton
                                            onClick={handleViewCloudData}
                                            hoverColor="#8B5CF6"
                                            icon={<Eye className="w-4 h-4" />}
                                            className="text-sm h-9"
                                        >
                                            查看云端数据
                                        </InteractiveHoverButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p><MixedText text="查看云端存储的数据详情" /></p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        {/* 同步报告显示 */}
                        {syncReport && (
                            <div className="p-4 border rounded-lg bg-gray-50">
                                <h4 className="font-medium mb-3"><MixedText text="同步报告" /></h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            <MixedText text={String(syncReport.records.filter(r => r.action === 'uploaded').length)} />
                                        </div>
                                        <div className="text-gray-600"><MixedText text="记录上传" /></div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            <MixedText text={String(syncReport.plans.filter(p => p.action === 'uploaded').length)} />
                                        </div>
                                        <div className="text-gray-600"><MixedText text="计划上传" /></div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            <MixedText text={String(syncReport.knowledge.filter(k => k.action === 'uploaded').length)} />
                                        </div>
                                        <div className="text-gray-600"><MixedText text="知识点上传" /></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 新增设置卡片 */}
                <AppearanceSetting />
                <PaginationSetting pageSize={pageSize} setPageSize={setPageSize} />
                <div className="flex justify-end mt-4">
                    {navMode && <SaveSettingsButton navMode={navMode as 'sidebar' | 'dock'} />}
                </div>

                {/* 云端数据概览 */}
                <CloudDataOverview
                    isOpen={showCloudOverview}
                    onClose={() => setShowCloudOverview(false)}
                />
            </div>
        </TooltipProvider>
    );
} 