import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { CloudSyncService } from '@/lib/cloudSyncService';
import { useNotification } from '@/components/magicui/NotificationProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Cloud, HardDrive } from 'lucide-react';
import { CircularButton } from '@/components/ui/circular-button';
import { CloudDataOverview as CloudDataOverviewType, ProgressCallback } from '@/types/common';
import { MixedText } from '@/components/ui/MixedText';
import { useToast } from '@/hooks/useToast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { RecordItem, StudyPlan, KnowledgeItem, ExamCountdown } from '@/types/record';

interface CloudDataOverviewProps {
    isOpen: boolean;
    onClose: () => void;
    localRecords?: RecordItem[];
    localPlans?: StudyPlan[];
    localKnowledge?: KnowledgeItem[];
    localCountdowns?: ExamCountdown[];
    onClearLocalData?: () => void;
}

export function CloudDataOverview({ isOpen, onClose, localRecords = [], localPlans = [], localKnowledge = [], localCountdowns = [], onClearLocalData }: CloudDataOverviewProps) {
    const [data, setData] = useState<CloudDataOverviewType | null>(null);
    const [clearing, setClearing] = useState(false);
    const [clearProgress, setClearProgress] = useState<ProgressCallback | null>(null);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingModule, setDeletingModule] = useState<string | null>(null);
    const [deleteProgress, setDeleteProgress] = useState<ProgressCallback | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
    const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
    const { notify } = useNotification();
    const { showError } = useToast();

    const loadCloudData = useCallback(async () => {
        if (isLoading) {
            return;
        }

        setIsLoading(true);
        setLoadError(null);

        try {
            // 添加最小loading时间，确保用户能看到loading状态
            const [overview] = await Promise.all([
                CloudSyncService.getCloudDataOverview(),
                new Promise(resolve => setTimeout(resolve, 500)) // 最小500ms loading时间
            ]);

            setData(overview);
        } catch (error) {
            console.error('CloudDataOverview: Error loading cloud data:', error);
            let errorMessage = "未知错误";

            if (error instanceof Error) {
                if (error.message.includes('Failed to fetch')) {
                    errorMessage = "网络连接失败，请检查网络连接后重试";
                } else if (error.message.includes('用户未登录')) {
                    errorMessage = "用户未登录，请先登录";
                } else {
                    errorMessage = error.message;
                }
            }

            setLoadError(errorMessage);
            showError(`获取云端数据失败: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, showError]);

    useEffect(() => {
        if (isOpen) {
            loadCloudData();
        } else {
            setData(null);
            setLoadError(null);
        }
    }, [isOpen, loadCloudData]);

    const handleClearCloudData = useCallback(async () => {
        setShowClearDialog(false);
        setClearing(true);
        setClearProgress(null);
        try {
            const result = await CloudSyncService.clearCloudData((progress: ProgressCallback) => {
                setClearProgress(progress);
            });

            if (result.success) {
                notify({
                    message: "清空成功",
                    description: result.message,
                    type: "success"
                });
                await loadCloudData();
            } else {
                notify({
                    message: "清空失败",
                    description: result.message,
                    type: "error"
                });
            }
        } catch (error) {
            notify({
                message: "清空失败",
                description: error instanceof Error ? error.message : "未知错误",
                type: "error"
            });
        } finally {
            setClearing(false);
            setClearProgress(null);
        }
    }, [notify, loadCloudData]);

    const handleDeleteModuleData = useCallback(async (dataType: 'records' | 'plans' | 'knowledge' | 'countdowns' | 'settings') => {
        setShowDeleteDialog(null);
        setDeletingModule(dataType);
        setDeleteProgress(null);
        try {
            const result = await CloudSyncService.clearSpecificCloudData(dataType, (progress: ProgressCallback) => {
                setDeleteProgress(progress);
            });

            if (result.success) {
                notify({
                    message: "删除成功",
                    description: result.message,
                    type: "success"
                });
                await loadCloudData();
            } else {
                notify({
                    message: "删除失败",
                    description: result.message,
                    type: "error"
                });
            }
        } catch (error) {
            notify({
                message: "删除失败",
                description: error instanceof Error ? error.message : "未知错误",
                type: "error"
            });
        } finally {
            setDeletingModule(null);
            setDeleteProgress(null);
        }
    }, [notify, loadCloudData]);

    const formatDateTime = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleString('zh-CN');
    }, []);

    const totalDataCount = useMemo(() => data ?
        data.records.count + data.plans.count + data.knowledge.count + data.countdowns.count + (data.settings.hasSettings ? 1 : 0) : 0, [data]);

    // 本地数据统计
    const localDataCount = useMemo(() =>
        localRecords.length + localPlans.length + localKnowledge.length + localCountdowns.length,
        [localRecords, localPlans, localKnowledge, localCountdowns]
    );

    // 数据项类型定义
    type DataItem = {
        id: 'records' | 'plans' | 'knowledge' | 'countdowns' | 'settings';
        name: string;
        count: number;
        lastUpdated: string | null | undefined;
        color: string;
        bgColor: string;
        borderColor: string;
    };

    // 云端数据项定义
    const cloudDataItems: DataItem[] = useMemo(() => data ? [
        {
            id: 'records',
            name: '刷题历史',
            count: data.records.count,
            lastUpdated: data.records.lastUpdated,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            id: 'plans',
            name: '学习计划',
            count: data.plans.count,
            lastUpdated: data.plans.lastUpdated,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            id: 'knowledge',
            name: '知识点',
            count: data.knowledge.count,
            lastUpdated: data.knowledge.lastUpdated,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        },
        {
            id: 'countdowns',
            name: '考试倒计时',
            count: data.countdowns.count,
            lastUpdated: data.countdowns.lastUpdated,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200'
        },
        {
            id: 'settings',
            name: '设置',
            count: data.settings.hasSettings ? 1 : 0,
            lastUpdated: data.settings.lastUpdated,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200'
        }
    ] : [], [data]);

    // 本地数据项定义
    const localDataItems: DataItem[] = useMemo(() => [
        {
            id: 'records',
            name: '刷题历史',
            count: localRecords.length,
            lastUpdated: localRecords.length > 0 ?
                (localRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date) : undefined,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            id: 'plans',
            name: '学习计划',
            count: localPlans.length,
            lastUpdated: localPlans.length > 0 ?
                (localPlans.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())[0].createdAt) : undefined,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            id: 'knowledge',
            name: '知识点',
            count: localKnowledge.length,
            lastUpdated: localKnowledge.length > 0 ?
                (localKnowledge.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())[0].createdAt) : undefined,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        },
        {
            id: 'countdowns',
            name: '考试倒计时',
            count: localCountdowns.length,
            lastUpdated: localCountdowns.length > 0 ?
                (localCountdowns.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())[0].createdAt) : undefined,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200'
        }
    ], [localRecords, localPlans, localKnowledge, localCountdowns]);

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="max-h-[80vh] p-0 flex flex-col">
                <DrawerHeader className="p-4 sm:p-6 flex-shrink-0">
                    <DrawerTitle className="text-base sm:text-lg"><MixedText text="数据概览" /></DrawerTitle>
                    <DrawerDescription className="text-xs sm:text-sm">
                        查看云端和本地数据统计
                    </DrawerDescription>
                </DrawerHeader>

                <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex-1 overflow-y-auto">
                    {/* 测试内容 */}
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            测试：Drawer内容区域正常显示
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            云端数据: {data ? '已加载' : '未加载'} |
                            本地数据: 记录{localRecords.length}条, 计划{localPlans.length}条, 知识点{localKnowledge.length}条, 倒计时{localCountdowns.length}条
                        </p>
                    </div>

                    <Tabs defaultValue="cloud" className="w-full">
                        <div className="flex justify-center items-center mb-4">
                            <TabsList className="items-center h-10">
                                <TabsTrigger value="cloud" className="flex items-center gap-2">
                                    <Cloud className="w-4 h-4" />
                                    <MixedText text="云端数据" />
                                </TabsTrigger>
                                <TabsTrigger value="local" className="flex items-center gap-2">
                                    <HardDrive className="w-4 h-4" />
                                    <MixedText text="本地数据" />
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="cloud" className="space-y-3 sm:space-y-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-3">
                                    <div className="flex items-center">
                                        <LoadingSpinner size="sm" />
                                        <span className="ml-2 text-sm"><MixedText text="正在加载云端数据..." /></span>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        <MixedText text="如果长时间无响应，可能是网络问题" />
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={loadCloudData}
                                        className="mt-2"
                                    >
                                        <MixedText text="重试" />
                                    </Button>
                                </div>
                            ) : loadError ? (
                                <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-4">
                                    <div className="text-center">
                                        <div className="text-red-500 text-sm mb-3 font-medium">
                                            <MixedText text="加载失败" />
                                        </div>
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                                            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                                                {loadError}
                                            </p>
                                            {loadError.includes('网络连接失败') && (
                                                <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
                                                    <p>• 请检查网络连接是否正常</p>
                                                    <p>• 尝试刷新页面后重试</p>
                                                    <p>• 如果问题持续，请稍后再试</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={loadCloudData}
                                                className="text-xs"
                                            >
                                                <MixedText text="重试" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.location.reload()}
                                                className="text-xs"
                                            >
                                                <MixedText text="刷新页面" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : data ? (
                                <>
                                    {/* 数据统计表格 */}
                                    <div className="bg-white rounded-lg border border-border/50 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-muted/20">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                                            <MixedText text="数据类型" />
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                                                            <MixedText text="数量" />
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                                                            <MixedText text="最后更新时间" />
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                                                            <MixedText text="操作" />
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/30">
                                                    {cloudDataItems.map((item) => (
                                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-4 h-4 rounded-full ${item.color.replace('text-', 'bg-')}`} />
                                                                    <span className="font-medium text-sm">
                                                                        <MixedText text={item.name} />
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className={`font-bold text-lg ${item.color}`}>
                                                                    <MixedText text={item.count.toString()} />
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center text-sm text-muted-foreground">
                                                                {item.lastUpdated ? (
                                                                    <MixedText text={formatDateTime(item.lastUpdated)} />
                                                                ) : (
                                                                    <MixedText text="无数据" />
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                {item.count > 0 ? (
                                                                    <>
                                                                        <div className="flex justify-center">
                                                                            <CircularButton
                                                                                variant="destructive"
                                                                                size="default"
                                                                                disabled={deletingModule === item.id}
                                                                                onClick={() => setShowDeleteDialog(item.id)}
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </CircularButton>
                                                                        </div>
                                                                        <Dialog open={showDeleteDialog === item.id || deletingModule === item.id} onOpenChange={(open) => {
                                                                            if (!open && !deletingModule) {
                                                                                setShowDeleteDialog(null);
                                                                            }
                                                                        }}>
                                                                            <DialogContent className="p-4 sm:p-6">
                                                                                <DialogHeader>
                                                                                    <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
                                                                                        <AlertTriangle className="w-5 h-5 text-destructive" />
                                                                                        {deletingModule === item.id ? (
                                                                                            <MixedText text={`正在删除${item.name}`} />
                                                                                        ) : (
                                                                                            <MixedText text={`确认删除${item.name}`} />
                                                                                        )}
                                                                                    </DialogTitle>
                                                                                    {deletingModule === item.id ? (
                                                                                        <div className="space-y-3 sm:space-y-4">
                                                                                            <p className="text-xs sm:text-sm">
                                                                                                <MixedText text={`正在删除${item.name}，请稍候...`} />
                                                                                            </p>
                                                                                            {deleteProgress && (
                                                                                                <div className="space-y-2">
                                                                                                    <div className="flex justify-between text-xs text-gray-600">
                                                                                                        <span><MixedText text="删除进度" /></span>
                                                                                                        <span><MixedText text={`${deleteProgress.current}/${deleteProgress.total}`} /></span>
                                                                                                    </div>
                                                                                                    <Progress
                                                                                                        value={(deleteProgress.current / deleteProgress.total) * 100}
                                                                                                        variant="danger"
                                                                                                        showText={true}
                                                                                                        className="h-2 sm:h-3"
                                                                                                    />
                                                                                                    <p className="text-xs sm:text-sm text-gray-600">
                                                                                                        {deleteProgress.currentItem}
                                                                                                    </p>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="text-xs sm:text-sm space-y-2">
                                                                                            <p>
                                                                                                <MixedText text={`确定要删除所有${item.name}数据吗？`} />
                                                                                            </p>
                                                                                            <p className="text-muted-foreground">
                                                                                                <MixedText text={`将删除 ${item.count} 条${item.name}数据`} />
                                                                                            </p>
                                                                                            <p className="text-destructive font-medium">
                                                                                                <MixedText text="此操作不可撤销，删除后无法恢复。" />
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                </DialogHeader>
                                                                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                                                                    {!deletingModule && (
                                                                                        <>
                                                                                            <Button
                                                                                                variant="outline"
                                                                                                className="h-8 sm:h-9 text-xs sm:text-sm rounded-full"
                                                                                                onClick={() => setShowDeleteDialog(null)}
                                                                                            >
                                                                                                <MixedText text="取消" />
                                                                                            </Button>
                                                                                            <Button
                                                                                                onClick={() => handleDeleteModuleData(item.id)}
                                                                                                variant="destructive"
                                                                                                className="h-8 sm:h-9 text-xs sm:text-sm rounded-full"
                                                                                            >
                                                                                                <MixedText text="确认删除" />
                                                                                            </Button>
                                                                                        </>
                                                                                    )}
                                                                                </DialogFooter>
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex justify-center">
                                                                        <span className="text-xs text-muted-foreground">
                                                                            <MixedText text="无数据" />
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 清空所有云端数据 */}
                                    {totalDataCount > 0 && (
                                        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                <div>
                                                    <h4 className="font-medium text-destructive text-sm sm:text-base flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        <MixedText text="危险操作" />
                                                    </h4>
                                                    <p className="text-xs sm:text-sm text-destructive/80 mt-1">
                                                        云端共有 <MixedText text={totalDataCount.toString()} /> 项数据
                                                    </p>
                                                </div>
                                                <Dialog open={showClearDialog || clearing} onOpenChange={setShowClearDialog}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            disabled={clearing}
                                                            variant="destructive"
                                                            size="sm"
                                                            className="h-8 sm:h-9 text-xs sm:text-sm rounded-full"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            <MixedText text="清空所有数据" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="p-4 sm:p-6">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
                                                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                                                {clearing ? <MixedText text="正在清空云端数据" /> : <MixedText text="确认清空所有数据" />}
                                                            </DialogTitle>
                                                            {clearing ? (
                                                                <div className="space-y-3 sm:space-y-4">
                                                                    <p className="text-xs sm:text-sm"><MixedText text="正在清空云端数据，请稍候..." /></p>
                                                                    {clearProgress && (
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between text-xs text-gray-600">
                                                                                <span><MixedText text="清空进度" /></span>
                                                                                <span><MixedText text={`${clearProgress.current}/${clearProgress.total}`} /></span>
                                                                            </div>
                                                                            <Progress
                                                                                value={(clearProgress.current / clearProgress.total) * 100}
                                                                                variant="danger"
                                                                                showText={true}
                                                                                className="h-2 sm:h-3"
                                                                            />
                                                                            <p className="text-xs sm:text-sm text-gray-600">
                                                                                {clearProgress.currentItem}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs sm:text-sm space-y-2">
                                                                    <p>
                                                                        <MixedText text="确定要清空所有云端数据吗？" />
                                                                    </p>
                                                                    <p className="text-muted-foreground">
                                                                        <MixedText text="此操作将删除以下数据：" />
                                                                    </p>
                                                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                                                        <li><MixedText text={`${data.records.count} 条刷题历史`} /></li>
                                                                        <li><MixedText text={`${data.plans.count} 个学习计划`} /></li>
                                                                        <li><MixedText text={`${data.knowledge.count} 条知识点`} /></li>
                                                                        <li><MixedText text={`${data.countdowns.count} 个考试倒计时`} /></li>
                                                                        <li><MixedText text="应用设置" /></li>
                                                                    </ul>
                                                                    <p className="text-destructive font-medium">
                                                                        <MixedText text="此操作不可撤销，删除后无法恢复。" />
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </DialogHeader>
                                                        <DialogFooter className="flex-col sm:flex-row gap-2">
                                                            {!clearing && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="h-8 sm:h-9 text-xs sm:text-sm rounded-full"
                                                                        onClick={() => setShowClearDialog(false)}
                                                                    >
                                                                        <MixedText text="取消" />
                                                                    </Button>
                                                                    <Button
                                                                        onClick={handleClearCloudData}
                                                                        variant="destructive"
                                                                        className="h-8 sm:h-9 text-xs sm:text-sm rounded-full"
                                                                    >
                                                                        <MixedText text="确认清空" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                                    <MixedText text="暂无云端数据" />
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="local" className="space-y-3 sm:space-y-4">
                            {/* 本地数据统计表格 */}
                            <div className="bg-white rounded-lg border border-border/50 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/20">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                                    <MixedText text="数据类型" />
                                                </th>
                                                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                                                    <MixedText text="数量" />
                                                </th>
                                                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                                                    <MixedText text="最后更新时间" />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {localDataItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full ${item.color.replace('text-', 'bg-')}`} />
                                                            <span className="font-medium text-sm">
                                                                <MixedText text={item.name} />
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`font-bold text-lg ${item.color}`}>
                                                            <MixedText text={item.count.toString()} />
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-sm text-muted-foreground">
                                                        {item.lastUpdated ? (
                                                            <MixedText text={formatDateTime(item.lastUpdated)} />
                                                        ) : (
                                                            <MixedText text="无数据" />
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 本地数据统计信息 */}
                            {localDataCount > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <HardDrive className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                                            <MixedText text="本地数据统计" />
                                        </span>
                                    </div>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <MixedText text={`本地共有 ${localDataCount} 项数据`} />
                                    </p>
                                </div>
                            )}

                            {/* 清空本地数据按钮 */}
                            {localDataCount > 0 && (
                                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div>
                                            <h4 className="font-medium text-destructive text-sm sm:text-base flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                <MixedText text="清空本地数据" />
                                            </h4>
                                            <p className="text-xs sm:text-sm text-destructive/80 mt-1">
                                                <MixedText text="仅删除本地浏览器中的数据，不影响云端" />
                                            </p>
                                        </div>
                                        <Dialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-8 sm:h-9 text-xs sm:text-sm rounded-full"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    <MixedText text="清空本地数据" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="w-11/12 max-w-md p-4 sm:p-6">
                                                <DialogHeader>
                                                    <DialogTitle className="text-base sm:text-lg"><MixedText text="确认清空本地数据" /></DialogTitle>
                                                    <DialogDescription className="text-xs sm:text-sm">
                                                        <MixedText text="确定要清空所有本地数据吗？" />
                                                        <br />
                                                        <br />
                                                        <MixedText text="此操作将删除本地浏览器中的：刷题历史、知识点、学习计划、考试倒计时、自定义事件、AI设置和应用设置。" />
                                                        <br />
                                                        <br />
                                                        <MixedText text="此操作不可撤销，删除后无法恢复。云端数据不受影响。" />
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 rounded-full"
                                                        onClick={() => setClearDataDialogOpen(false)}
                                                    >
                                                        <MixedText text="取消" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            if (onClearLocalData) {
                                                                onClearLocalData();
                                                            }
                                                            setClearDataDialogOpen(false);
                                                        }}
                                                        variant="destructive"
                                                        className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 rounded-full"
                                                    >
                                                        确认清空
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            )}

                            {localDataCount === 0 && (
                                <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                                    <MixedText text="暂无本地数据" />
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </DrawerContent>
        </Drawer >
    );
}