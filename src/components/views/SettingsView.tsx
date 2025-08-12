import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AppearanceSetting } from "./settings/AppearanceSetting";
import { PaginationSetting } from "./settings/PaginationSetting";



import { DataImportExport } from "@/components/features/DataImportExport";
import { AdvancedSetting } from "./settings/AdvancedSetting";
import SaveSettingsButton from "./settings/SaveSettingsButton";
import { Button } from "@/components/ui/button";
import { Download, Upload, Eye, Trash2, CloudUpload, CloudDownload } from "lucide-react";
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
    const { notify } = useNotification();
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


    const handleUploadToCloud = async () => {
        const controller = new AbortController();
        setAbortController(controller);
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
                },
                controller
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
                if (result.message === '上传已取消') {
                    notify({
                        message: "上传已取消",
                        description: "用户取消了上传操作",
                        type: "warning"
                    });
                } else {
                    notify({
                        message: "上传失败",
                        description: result.message,
                        type: "error"
                    });
                }
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
            setAbortController(null);
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

    const handleCancelUpload = () => {
        if (abortController) {
            abortController.abort();
        }
    };





    console.log('SettingsView - activeTab:', activeTab);

    if (activeTab === 'settings-advanced') {
        console.log('显示高级设置页面');
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
                                <AlertDialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
                                    <AlertDialogTrigger asChild>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9"
                                                        onClick={() => {
                                                            console.log('清空本地数据按钮被点击了');
                                                            setClearDataDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p><MixedText text="清空本地数据" /></p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
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
                                                onClick={() => {
                                                    console.log('AlertDialogAction onClick 被触发');
                                                    console.log('onClearLocalData:', onClearLocalData);
                                                    if (onClearLocalData) {
                                                        onClearLocalData();
                                                    } else {
                                                        console.error('onClearLocalData 是 undefined');
                                                    }
                                                    setClearDataDialogOpen(false);
                                                }}
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

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="font-medium"><MixedText text="云端数据同步" /></h3>
                                    <p className="text-sm text-muted-foreground">
                                        将数据同步到云端，实现多设备数据共享和备份。
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={handleUploadToCloud}
                                                disabled={isUploading}
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9"
                                            >
                                                <CloudUpload className="w-5 h-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p><MixedText text="将本地数据上传到云端备份" /></p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={handleDownloadFromCloud}
                                                disabled={isDownloading}
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9"
                                            >
                                                <CloudDownload className="w-5 h-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p><MixedText text="从云端下载数据到本地" /></p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={handleViewCloudData}
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p><MixedText text="查看云端存储的数据详情" /></p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* 状态和进度显示 */}
                            {syncStatus && (
                                <p className="text-xs text-blue-600 mb-2"><MixedText text={syncStatus} /></p>
                            )}
                            {uploadProgress && (
                                <div className="space-y-2">
                                    <div className="text-xs text-gray-600 mb-1">
                                        <span><MixedText text={`上传进度 ${uploadProgress.current}/${uploadProgress.total}`} /></span>
                                    </div>



                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-300"
                                                style={{
                                                    width: `${uploadProgress.total > 0 ? Math.round((uploadProgress.current / uploadProgress.total) * 100) : 0}%`,
                                                    backgroundColor: '#94a3b8'
                                                }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleCancelUpload}
                                            className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                                            title="取消上传"
                                        >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 同步报告显示 */}
                        {syncReport && (
                            <div className="p-4 border rounded-lg bg-gray-50">
                                <h4 className="font-medium mb-3"><MixedText text="同步报告" /></h4>
                                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
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



                                {/* 跳过项目统计 */}
                                {(() => {
                                    const skippedRecords = syncReport.records.filter(r => r.action === 'skipped');
                                    const skippedPlans = syncReport.plans.filter(p => p.action === 'skipped');
                                    const skippedKnowledge = syncReport.knowledge.filter(k => k.action === 'skipped');

                                    if (skippedRecords.length > 0 || skippedPlans.length > 0 || skippedKnowledge.length > 0) {
                                        return (
                                            <div className="mt-3 p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                                                <h5 className="font-medium text-yellow-800 mb-2">
                                                    <MixedText text="跳过项目" />
                                                </h5>
                                                <div className="text-xs text-yellow-700">
                                                    <div><MixedText text={`记录: ${skippedRecords.length} 条`} /></div>
                                                    <div><MixedText text={`计划: ${skippedPlans.length} 条`} /></div>
                                                    <div><MixedText text={`知识点: ${skippedKnowledge.length} 条`} /></div>
                                                    <div className="mt-1 text-yellow-600">
                                                        <MixedText text="（已存在于云端，跳过上传）" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
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