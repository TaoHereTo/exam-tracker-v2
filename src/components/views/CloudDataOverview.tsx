import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { CloudSyncService } from '@/lib/cloudSyncService';
import { useNotification } from '@/components/magicui/NotificationProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Progress } from '@/components/animate-ui/components/radix/progress';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Cloud, HardDrive, FileText } from 'lucide-react';
import { CircularButton } from '@/components/ui/circular-button';
import { CloudDataOverview as CloudDataOverviewType, ProgressCallback } from '@/types/common';
import { MixedText } from '@/components/ui/MixedText';
import { useToast } from '@/hooks/useToast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/simple-tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';
import type { RecordItem, StudyPlan, KnowledgeItem, ExamCountdown, Note } from '@/types/record';

interface CloudDataOverviewProps {
    isOpen: boolean;
    onClose: () => void;
    localRecords?: RecordItem[];
    localPlans?: StudyPlan[];
    localKnowledge?: KnowledgeItem[];
    localCountdowns?: ExamCountdown[];
    localNotes?: Note[];
    localSettings?: Record<string, unknown> | null; // 本地设置数据
    onClearLocalData?: () => void;
}

export function CloudDataOverview({ isOpen, onClose, localRecords = [], localPlans = [], localKnowledge = [], localCountdowns = [], localNotes = [], localSettings = null, onClearLocalData }: CloudDataOverviewProps) {
    const [data, setData] = useState<CloudDataOverviewType | null>(null);
    const [clearing, setClearing] = useState(false);
    const [clearProgress, setClearProgress] = useState<ProgressCallback | null>(null);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
    const { notify } = useNotification();
    const { showError } = useToast();
    const isLoadingRef = useRef(false);

    // 如果数据已返回但仍处于加载态，进行兜底修正，避免意外卡住加载
    useEffect(() => {
        if (data && isLoading) {
            setIsLoading(false);
        }
    }, [data, isLoading]);

    // 为请求添加超时保护，避免无限加载
    const withTimeout = async <T,>(promise: Promise<T>, ms: number = 10000): Promise<T> => {
        return await Promise.race<T>([
            promise,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('请求超时，请稍后重试')), ms))
        ]);
    };

    const loadCloudData = useCallback(async () => {
        // 如果正在加载，直接返回，避免重复请求
        if (isLoadingRef.current) {
            return;
        }

        isLoadingRef.current = true;
        setIsLoading(true);
        setLoadError(null);

        try {
            const [overview] = await Promise.all([
                withTimeout(CloudSyncService.getCloudDataOverview(), 12000),
                new Promise(resolve => setTimeout(resolve, 500))
            ]);
            setData(overview);
        } catch (error) {
            console.error('CloudDataOverview: Error loading cloud data:', error);
            let errorMessage = "未知错误";
            if (error instanceof Error) {
                if (error.message.includes('Failed to fetch')) {
                    errorMessage = "网络连接失败，请检查网络连接后重试";
                } else if (error.message.includes('超时')) {
                    errorMessage = "请求超时，请检查网络或稍后重试";
                } else if (error.message.includes('用户未登录')) {
                    errorMessage = "用户未登录，请先登录";
                } else {
                    errorMessage = error.message;
                }
            }
            setLoadError(errorMessage);
            showError(`获取云端数据失败: ${errorMessage}`);
        } finally {
            isLoadingRef.current = false;
            setIsLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        if (isOpen) {
            // 抽屉打开时总是加载数据
            loadCloudData();
        } else {
            // 抽屉关闭时清理状态
            setData(null);
            setLoadError(null);
            isLoadingRef.current = false;
            setIsLoading(false);
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


    const formatDateTime = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleString('zh-CN');
    }, []);

    const totalDataCount = useMemo(() => data ?
        data.records.count + data.plans.count + data.knowledge.count + data.countdowns.count + data.notes.count + (data.settings.hasSettings ? 1 : 0) : 0, [data]);

    // 本地数据统计（笔记数据完全存储在云端，不计入本地统计）
    const localDataCount = useMemo(() =>
        localRecords.length + localPlans.length + localKnowledge.length + localCountdowns.length + (localSettings ? 1 : 0),
        [localRecords, localPlans, localKnowledge, localCountdowns, localSettings]
    );

    // 数据项类型定义
    type DataItem = {
        id: 'records' | 'plans' | 'knowledge' | 'countdowns' | 'notes' | 'settings';
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
            id: 'notes',
            name: '笔记',
            count: data.notes.count,
            lastUpdated: data.notes.lastUpdated,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200'
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
        },
        {
            id: 'notes',
            name: '笔记',
            count: 0, // 笔记数据完全存储在云端，本地没有存储
            lastUpdated: undefined, // 本地没有笔记数据
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200'
        },
        {
            id: 'settings',
            name: '设置',
            count: localSettings ? 1 : 0,
            lastUpdated: localSettings ? new Date().toISOString() : undefined,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200'
        }
    ], [localRecords, localPlans, localKnowledge, localCountdowns, localSettings]);

    return (
        <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DrawerContent className="max-h-[80vh] p-0 flex flex-col">
                <DrawerHeader className="sr-only">
                    <VisuallyHidden>
                        <DrawerTitle>云端数据概览</DrawerTitle>
                    </VisuallyHidden>
                </DrawerHeader>
                <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-3 sm:pb-4 flex-1 overflow-y-auto">

                    <Tabs defaultValue="cloud" className="w-full">
                        <div className="flex justify-center items-center mb-4 relative z-10">
                            <TabsList className="items-center h-10 relative z-10">
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

                        <TabsContent value="cloud" className="space-y-3 sm:space-y-4" staticLayout>
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-3">
                                    <div className="flex items-center">
                                        <LoadingSpinner size="sm" />
                                        <span className="ml-2 text-sm"><MixedText text="正在加载云端数据..." /></span>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        <MixedText text="如果长时间无响应，可能是网络问题" />
                                    </p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={loadCloudData}
                                                className="mt-2"
                                            >
                                                <MixedText text="重试" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <MixedText text="重新加载云端数据" />
                                        </TooltipContent>
                                    </Tooltip>
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
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={loadCloudData}
                                                        className="text-xs"
                                                    >
                                                        <MixedText text="重试" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <MixedText text="重新加载云端数据" />
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.location.reload()}
                                                        className="text-xs"
                                                    >
                                                        <MixedText text="刷新页面" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <MixedText text="刷新整个页面" />
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            ) : data ? (
                                <>
                                    {/* 数据统计表格 */}
                                    <div className="bg-white rounded-lg border border-border/50 overflow-hidden max-w-4xl mx-auto">
                                        {/* 云端数据统计信息 */}
                                        <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-2">
                                                <Cloud className="w-4 h-4 text-green-600" />
                                                <span className="font-medium text-green-900 dark:text-green-100 text-sm">
                                                    <MixedText text="云端数据统计" />
                                                </span>
                                                <span className="text-sm text-green-700 dark:text-green-300">
                                                    <MixedText text={`共 ${totalDataCount} 项数据`} />
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-muted/20">
                                                    <tr>
                                                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
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
                                                    {cloudDataItems.map((item) => (
                                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                                            <td className="px-4 py-4 text-center">
                                                                <span className="font-medium text-sm">
                                                                    <MixedText text={item.name || '数据'} />
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className={`font-bold text-lg ${item.color}`}>
                                                                    {item.id === 'settings' ? (
                                                                        <MixedText text={item.count > 0 ? "已保存" : "未保存"} />
                                                                    ) : (
                                                                        <MixedText text={item.count.toString()} />
                                                                    )}
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

                                    {/* 清空所有云端数据 */}
                                    {totalDataCount > 0 && (
                                        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 max-w-4xl mx-auto">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-destructive text-sm sm:text-base flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        <MixedText text="清空云端数据" />
                                                    </h4>
                                                    <p className="text-xs sm:text-sm text-destructive/80 mt-1">
                                                        <MixedText text="仅删除云端服务器中的数据，不影响本地" />
                                                    </p>
                                                </div>
                                                <div className="flex justify-center">
                                                    <Dialog open={showClearDialog || clearing} onOpenChange={setShowClearDialog}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <DialogTrigger asChild>
                                                                    <CircularButton
                                                                        variant="destructive"
                                                                        size="default"
                                                                        disabled={clearing}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </CircularButton>
                                                                </DialogTrigger>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>清空所有云端数据</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <DialogContent className="p-4 sm:p-6" style={{ zIndex: 9999 }}>
                                                            <DialogHeader>
                                                                <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
                                                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                                                    {clearing ? <MixedText text="正在清空云端数据" /> : <MixedText text="确认清空云端数据" />}
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
                                                                            <MixedText text="此操作将删除云端服务器中的：刷题历史、知识点、学习计划、考试倒计时和应用设置。" />
                                                                        </p>
                                                                        <p className="text-destructive font-medium">
                                                                            <MixedText text="此操作不可撤销，删除后无法恢复。本地数据不受影响。" />
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
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                                    <MixedText text="暂无云端数据" />
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="local" className="space-y-3 sm:space-y-4" staticLayout>
                            {/* 本地数据统计表格 */}
                            <div className="bg-white rounded-lg border border-border/50 overflow-hidden max-w-4xl mx-auto">
                                {/* 本地数据统计信息 */}
                                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                                            <MixedText text="本地数据统计" />
                                        </span>
                                        <span className="text-sm text-blue-700 dark:text-blue-300">
                                            <MixedText text={`共 ${localDataCount} 项数据`} />
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/20">
                                            <tr>
                                                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
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
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="font-medium text-sm">
                                                            <MixedText text={item.name || '数据'} />
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`font-bold text-lg ${item.color}`}>
                                                            {item.id === 'settings' ? (
                                                                <MixedText text={item.count > 0 ? "已保存" : "未保存"} />
                                                            ) : item.id === 'notes' ? (
                                                                <MixedText text="云端存储" />
                                                            ) : (
                                                                <MixedText text={item.count.toString()} />
                                                            )}
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

                            {/* 清空本地数据按钮 */}
                            {localDataCount > 0 && (
                                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 max-w-4xl mx-auto">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-destructive text-sm sm:text-base flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                <MixedText text="清空本地数据" />
                                            </h4>
                                            <p className="text-xs sm:text-sm text-destructive/80 mt-1">
                                                <MixedText text="仅删除本地浏览器中的数据，不影响云端" />
                                            </p>
                                        </div>
                                        <div className="flex justify-center">
                                            <Dialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <DialogTrigger asChild>
                                                            <CircularButton
                                                                variant="destructive"
                                                                size="default"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </CircularButton>
                                                        </DialogTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>清空所有本地数据</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <DialogContent className="w-11/12 max-w-md p-4 sm:p-6" style={{ zIndex: 9999 }}>
                                                    <DialogHeader>
                                                        <DialogTitle className="text-base sm:text-lg"><MixedText text="确认清空本地数据" /></DialogTitle>
                                                        <DialogDescription className="text-xs sm:text-sm">
                                                            <MixedText text="确定要清空所有本地数据吗？" />
                                                            <br />
                                                            <br />
                                                            <MixedText text="此操作将删除本地浏览器中的：刷题历史、知识点、学习计划、考试倒计时和应用设置。" />
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
        </Drawer>
    );
}