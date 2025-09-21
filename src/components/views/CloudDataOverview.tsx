import React, { useState, useEffect, useCallback } from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { CloudSyncService } from '@/lib/cloudSyncService';
import { useNotification } from '@/components/magicui/NotificationProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
import { Button, buttonVariants } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { CloudDataOverview as CloudDataOverviewType, ProgressCallback } from '@/types/common';
import { MixedText } from '@/components/ui/MixedText';
import { SimpleUiverseSpinner } from '@/components/ui/UiverseSpinner';
import { useLoading } from '@/hooks/useLoading';
import { useToast } from '@/hooks/useToast';
import { useCloudData } from '@/contexts/CloudDataContext';
import { cn } from '@/lib/utils';

interface CloudDataOverviewProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CloudDataOverview({ isOpen, onClose }: CloudDataOverviewProps) {
    const [data, setData] = useState<CloudDataOverviewType | null>(null);
    const [clearing, setClearing] = useState(false);
    const [clearProgress, setClearProgress] = useState<ProgressCallback | null>(null);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const { notify } = useNotification();
    const { loading, withLoading } = useLoading();
    const { showError } = useToast();
    const { setIsCloudDataLoading } = useCloudData();

    const loadCloudData = useCallback(async () => {
        setIsCloudDataLoading(true); // 设置全局加载状态
        try {
            await withLoading(async () => {
                // 暂时移除超时控制，直接调用
                const overview = await CloudSyncService.getCloudDataOverview();
                setData(overview);
            });
        } catch (error) {
            console.error('获取云端数据失败:', error);
            console.error('错误类型:', typeof error);
            console.error('错误详情:', error);

            // 只显示一次错误，避免重复toast
            const errorMessage = error instanceof Error ? error.message : "未知错误";
            if (errorMessage.includes('超时')) {
                showError('网络连接超时，请检查网络后重试');
            } else if (errorMessage.includes('未登录')) {
                showError('请先登录后再查看云端数据');
            } else if (errorMessage.includes('查询超时')) {
                showError('数据库查询超时，请稍后重试');
            } else {
                showError(`获取云端数据失败: ${errorMessage}`);
            }
        } finally {
            setIsCloudDataLoading(false); // 清除全局加载状态
        }
    }, [withLoading, showError, setIsCloudDataLoading]);

    useEffect(() => {
        if (isOpen) {
            loadCloudData();
        }
    }, [isOpen, loadCloudData]);

    const handleClearCloudData = async () => {
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
                // 重新加载数据
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
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-CN');
    };

    const totalDataCount = data ?
        data.records.count + data.plans.count + data.knowledge.count + (data.settings.hasSettings ? 1 : 0) : 0;

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="max-h-[80vh] p-0 flex flex-col">
                <DrawerHeader className="p-4 sm:p-6 flex-shrink-0">
                    <DrawerTitle className="text-base sm:text-lg"><MixedText text="云端数据概览" /></DrawerTitle>
                    <DrawerDescription className="text-xs sm:text-sm">
                        查看云端存储的数据统计和最近记录
                    </DrawerDescription>
                </DrawerHeader>

                <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-3">
                            <div className="flex items-center">
                                <LoadingSpinner size="sm" />
                                <span className="ml-2 text-sm"><MixedText text="正在加载云端数据..." /></span>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                <MixedText text="如果长时间无响应，可能是网络问题" />
                            </p>
                        </div>
                    ) : data ? (
                        <>
                            {/* 数据统计卡片 */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <Card className="h-[100px] sm:h-[120px] flex items-center justify-center">
                                    <div className="flex flex-col items-center text-center w-full">
                                        <CardHeader className="pb-1 px-3 sm:px-6 pt-0 w-full">
                                            <CardTitle className="text-sm"><MixedText text="刷题历史" /></CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center justify-center px-3 sm:px-6 py-0 w-full">
                                            <div className="text-xl sm:text-2xl font-bold text-blue-600">
                                                <MixedText text={String(data.records.count)} />
                                            </div>
                                            <p className="text-xs text-gray-500"><MixedText text="条记录" /></p>
                                        </CardContent>
                                    </div>
                                </Card>

                                <Card className="h-[100px] sm:h-[120px] flex items-center justify-center">
                                    <div className="flex flex-col items-center text-center w-full">
                                        <CardHeader className="pb-1 px-3 sm:px-6 pt-0 w-full">
                                            <CardTitle className="text-sm"><MixedText text="学习计划" /></CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center justify-center px-3 sm:px-6 py-0 w-full">
                                            <div className="text-xl sm:text-2xl font-bold text-green-600">
                                                <MixedText text={String(data.plans.count)} />
                                            </div>
                                            <p className="text-xs text-gray-500"><MixedText text="个计划" /></p>
                                        </CardContent>
                                    </div>
                                </Card>

                                <Card className="h-[100px] sm:h-[120px] flex items-center justify-center">
                                    <div className="flex flex-col items-center text-center w-full">
                                        <CardHeader className="pb-1 px-3 sm:px-6 pt-0 w-full">
                                            <CardTitle className="text-sm"><MixedText text="知识点" /></CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center justify-center px-3 sm:px-6 py-0 w-full">
                                            <div className="text-xl sm:text-2xl font-bold text-purple-600">
                                                <MixedText text={String(data.knowledge.count)} />
                                            </div>
                                            <p className="text-xs text-gray-500"><MixedText text="条知识点" /></p>
                                        </CardContent>
                                    </div>
                                </Card>

                                <Card className="h-[100px] sm:h-[120px] flex items-center justify-center">
                                    <div className="flex flex-col items-center text-center w-full">
                                        <CardHeader className="pb-1 px-3 sm:px-6 pt-0 w-full">
                                            <CardTitle className="text-sm"><MixedText text="设置" /></CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center justify-center px-3 sm:px-6 py-0 w-full">
                                            <div className="text-xl sm:text-2xl font-bold text-green-600">
                                                {data.settings.hasSettings ? '✓' : '✗'}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {data.settings.hasSettings ? '已保存' : '未保存'}
                                            </p>
                                        </CardContent>
                                    </div>
                                </Card>
                            </div>

                            {/* 清空云端数据按钮 */}
                            {totalDataCount > 0 && (
                                <Card className="border-destructive/50 bg-destructive/5">
                                    <CardContent className="pt-4 sm:pt-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div>
                                                <h4 className="font-medium text-destructive text-sm sm:text-base"><MixedText text="危险操作" /></h4>
                                                <p className="text-xs sm:text-sm text-destructive/80 mt-1">
                                                    云端共有 <MixedText text={String(totalDataCount)} /> 项数据
                                                </p>
                                            </div>
                                            <Dialog open={showClearDialog || clearing} onOpenChange={setShowClearDialog}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        disabled={clearing}
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-8 w-8 sm:h-9 sm:w-9"
                                                    >
                                                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="p-4 sm:p-6">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-base sm:text-lg">
                                                            {clearing ? <MixedText text="正在清空云端数据" /> : <MixedText text="确认删除" />}
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
                                                            <div className="text-xs sm:text-sm">
                                                                <MixedText text="确定要清空所有云端数据吗？" />
                                                                <br />
                                                                <br />
                                                                <MixedText text="此操作将删除以下数据：" />
                                                                <br />• <MixedText text={String(data.records.count)} /> 条刷题历史
                                                                <br />• <MixedText text={String(data.plans.count)} /> 个学习计划
                                                                <br />• <MixedText text={String(data.knowledge.count)} /> 条知识点
                                                                <br />• 应用设置
                                                                <br />
                                                                <br />
                                                                <MixedText text="此操作不可撤销，删除后无法恢复。" />
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
                                                                    确认清空
                                                                </Button>
                                                            </>
                                                        )}
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}


                        </>
                    ) : (
                        <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                            暂无云端数据
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
} 