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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CloudSyncService } from '@/lib/cloudSyncService';
import { useNotification } from '@/components/magicui/NotificationProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import { Trash2 } from 'lucide-react';
import { CloudDataOverview as CloudDataOverviewType, ProgressCallback } from '@/types/common';
import { MixedText } from '@/components/ui/MixedText';

interface CloudDataOverviewProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CloudDataOverview({ isOpen, onClose }: CloudDataOverviewProps) {
    const [data, setData] = useState<CloudDataOverviewType | null>(null);
    const [loading, setLoading] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [clearProgress, setClearProgress] = useState<ProgressCallback | null>(null);
    const { notify } = useNotification();

    const loadCloudData = useCallback(async () => {
        setLoading(true);
        try {
            const overview = await CloudSyncService.getCloudDataOverview();
            setData(overview);
        } catch (error) {
            notify({
                message: "获取云端数据失败",
                description: error instanceof Error ? error.message : "未知错误",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        if (isOpen) {
            loadCloudData();
        }
    }, [isOpen, loadCloudData]);

    const handleClearCloudData = async () => {
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
            <DrawerContent className="max-h-[80vh]">
                <DrawerHeader>
                    <DrawerTitle><MixedText text="云端数据概览" /></DrawerTitle>
                    <DrawerDescription>
                        查看云端存储的数据统计和最近记录
                    </DrawerDescription>
                </DrawerHeader>

                <div className="px-4 pb-4 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <LoadingSpinner size="md" />
                            <span className="ml-2"><MixedText text="正在加载云端数据..." /></span>
                        </div>
                    ) : data ? (
                        <>
                            {/* 数据统计卡片 */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="h-[120px] flex flex-col">
                                    <CardHeader className="pb-0">
                                        <CardTitle className="text-sm"><MixedText text="刷题记录" /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex items-center justify-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            <MixedText text={String(data.records.count)} />
                                        </div>
                                        <p className="text-xs text-gray-500"><MixedText text="条记录" /></p>
                                    </CardContent>
                                </Card>

                                <Card className="h-[120px] flex flex-col">
                                    <CardHeader className="pb-0">
                                        <CardTitle className="text-sm"><MixedText text="学习计划" /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex items-center justify-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            <MixedText text={String(data.plans.count)} />
                                        </div>
                                        <p className="text-xs text-gray-500"><MixedText text="个计划" /></p>
                                    </CardContent>
                                </Card>

                                <Card className="h-[120px] flex flex-col">
                                    <CardHeader className="pb-0">
                                        <CardTitle className="text-sm"><MixedText text="知识点" /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex items-center justify-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            <MixedText text={String(data.knowledge.count)} />
                                        </div>
                                        <p className="text-xs text-gray-500"><MixedText text="条知识点" /></p>
                                    </CardContent>
                                </Card>

                                <Card className="h-[120px] flex flex-col">
                                    <CardHeader className="pb-0">
                                        <CardTitle className="text-sm"><MixedText text="设置" /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex items-center justify-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {data.settings.hasSettings ? '✓' : '✗'}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {data.settings.hasSettings ? '已保存' : '未保存'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* 清空云端数据按钮 */}
                            {totalDataCount > 0 && (
                                <Card className="border-destructive/50 bg-destructive/5">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-destructive"><MixedText text="危险操作" /></h4>
                                                <p className="text-sm text-destructive/80">
                                                    云端共有 <MixedText text={String(totalDataCount)} /> 项数据
                                                </p>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <InteractiveHoverButton
                                                        disabled={clearing}
                                                        hoverColor="#dc2626"
                                                        icon={<Trash2 className="w-4 h-4" />}
                                                        className="text-sm h-9"
                                                    >
                                                        {clearing ? "清空中..." : "清空云端数据"}
                                                    </InteractiveHoverButton>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle><MixedText text="确认清空云端数据？" /></AlertDialogTitle>
                                                        <AlertDialogDescription asChild>
                                                            {clearing ? (
                                                                <div className="space-y-4">
                                                                    <p><MixedText text="正在清空云端数据，请稍候..." /></p>
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
                                                                            />
                                                                            <p className="text-sm text-gray-600">
                                                                                {clearProgress.currentItem}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    此操作将永久删除云端的所有数据，包括：
                                                                    <br />• <MixedText text={String(data.records.count)} /> 条刷题记录
                                                                    <br />• <MixedText text={String(data.plans.count)} /> 个学习计划
                                                                    <br />• <MixedText text={String(data.knowledge.count)} /> 条知识点
                                                                    <br />• 应用设置
                                                                    <br /><br />
                                                                    <strong><MixedText text="此操作无法撤销！" /></strong>
                                                                </div>
                                                            )}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel><MixedText text="取消" /></AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={handleClearCloudData}
                                                            className="bg-destructive text-white hover:bg-destructive/90"
                                                        >
                                                            确认清空
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}


                        </>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            暂无云端数据
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
} 