"use client";

import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SettingsView } from "@/components/views/SettingsView";
import { useImportExport } from "@/hooks/useImportExport";
import { OverviewView } from "@/components/views/OverviewView";
import { ChartsView } from "@/components/views/ChartsView";
import { ExerciseRecordView } from "@/components/views/HistoryView";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePlanProgress } from "@/hooks/usePlanProgress";
import DockNavigation from "@/components/layout/DockNavigation";
import type { RecordItem, StudyPlan, KnowledgeItem, PendingImport } from "@/types/record";
import { calcPlanProgress } from "@/lib/planUtils";
import NavModeContext from "@/contexts/NavModeContext";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { PersonalBestView } from "@/components/views/PersonalBestView";
import KnowledgeSummaryView from "@/components/views/KnowledgeSummaryView";
import { PasteProvider } from "@/contexts/PasteContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, SlidersHorizontal, MoreHorizontal } from "lucide-react";
import { getMixedTextStyle } from "@/lib/utils";
import { MixedText } from "@/components/ui/MixedText";
import { GlobalFontProvider } from "@/components/ui/GlobalFontProvider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobeAvatar } from "@/components/ui/GlobeAvatar";
import { UserProfileService } from "@/lib/userProfileService";
import type { UserProfile } from "@/types/user";

import { UserProfileDialog } from "./auth/UserProfileDialog";
import { AutoCloudSync } from "@/lib/autoCloudSync";
import { useTheme } from "next-themes";
import LightRays from "@/components/ui/LightRays/LightRays";

import { PageTitle } from "@/components/ui/PageTitle";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { ConfettiLoading } from "@/components/ui/LoadingSpinner";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { normalizePageTitle } from "@/config/exam";
import { NewRecordForm } from "@/components/forms/NewRecordForm";
import KnowledgeEntryView from "@/components/views/KnowledgeEntryView";

// 懒加载组件
const PlanListView = lazy(() =>
    import("@/components/views/PlanListView").then(module => ({
        default: module.default
    }))
);
const PlanDetailView = lazy(() =>
    import("@/components/views/PlanDetailView").then(module => ({
        default: module.default
    }))
);

export function MainApp() {
    const [activeTab, setActiveTab] = useState('overview'); // 默认显示'数据概览'
    const [knowledge, setKnowledge] = useLocalStorage<KnowledgeItem[]>("exam-tracker-knowledge-v2", []);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // navMode 必须先声明，再用 useRef(navMode)
    const [navMode] = useLocalStorage<'sidebar' | 'dock'>("exam-tracker-nav-mode", "sidebar");

    // 认证相关
    const { user, signOut } = useAuth();
    const { notify } = useNotification();

    const [showProfileDialog, setShowProfileDialog] = useState(false);

    // 删除确认对话框状态
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [recordsToDelete, setRecordsToDelete] = useState<number[]>([]);

    const loadUserProfile = useCallback(async () => {
        try {
            const profile = await UserProfileService.getUserProfile();
            setUserProfile(profile);
        } catch (error) {
            console.error('加载用户资料失败:', error);
            // 不设置错误状态，避免影响页面渲染
        }
    }, []);

    // 新增知识点添加函数 - 优化性能
    const addKnowledge = useCallback(async (newKnowledge: KnowledgeItem) => {
        const knowledgeWithId = { ...newKnowledge, id: Date.now().toString() + Math.random().toString(16).slice(2) };
        setKnowledge(prev => [knowledgeWithId, ...prev]);

        // 异步保存到云端，不阻塞UI
        setTimeout(() => {
            AutoCloudSync.autoSaveKnowledge(knowledgeWithId, notify);
        }, 0);
    }, [setKnowledge, notify]);

    // 加载用户资料 - 优化性能
    useEffect(() => {
        if (user && !userProfile) {
            // 延迟加载用户资料，不阻塞初始渲染
            const timer = setTimeout(() => {
                loadUserProfile();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [user, userProfile, loadUserProfile]);

    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsClient(true);
        setMounted(true);

        // 立即设置加载完成，避免不必要的延迟
        setIsLoading(false);

        // 处理URL参数 - 异步处理，不阻塞渲染
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const view = urlParams.get('view');
                if (view) {
                    setActiveTab(view);
                }
            }, 0);
        }
    }, []);

    // 计划和刷题记录持久化到localStorage
    const [plans, setPlans] = useLocalStorage<StudyPlan[]>("exam-tracker-plans-v2", []);
    const [records, setRecords] = useLocalStorage<RecordItem[]>("exam-tracker-records-v2", []);

    const {
        handleExportData,
        handleImportData,
        importDialogOpen,
        setImportDialogOpen,
        pendingImport,
        setPendingImport,
    } = useImportExport(records, setRecords, knowledge, setKnowledge, plans);

    // 刷题记录分页
    const [historyPage, setHistoryPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    // 选中的记录ID
    const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);

    // 当pageSize改变时，如果当前页超出新的总页数，则重置到第一页
    useEffect(() => {
        const newTotalPages = Math.ceil(records.length / pageSize);
        if (historyPage > newTotalPages && newTotalPages > 0) {
            setHistoryPage(1);
        }
    }, [pageSize, records.length, historyPage]);

    // 清理无效的选中记录ID（当记录被删除或页面切换时）
    useEffect(() => {
        const currentPageRecords = records.slice((historyPage - 1) * pageSize, historyPage * pageSize);
        const currentPageIds = currentPageRecords.map(r => r.id);
        setSelectedRecordIds(prev => prev.filter(id => currentPageIds.includes(id)));
    }, [records, historyPage, pageSize]);

    // 退出登录确认对话框状态
    const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

    const handleSignOutClick = useCallback(() => {
        setSignOutDialogOpen(true);
    }, []);

    const handleSignOut = useCallback(async () => {
        try {
            await signOut();
            notify({
                message: "已退出登录",
                description: "您已成功退出登录",
                type: "success"
            });
        } catch (error) {
            notify({
                message: "退出失败",
                description: "退出登录时出现错误",
                type: "error"
            });
        }
        setSignOutDialogOpen(false);
    }, [signOut, notify]);





    // 用户信息显示组件 - 侧边栏版本
    const SidebarUserInfo = () => {
        return (
            <div className="flex items-center gap-0 w-full">
                <div className="flex-shrink-0 flex items-center">
                    <GlobeAvatar size="lg" />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 flex-1 group cursor-pointer rounded-lg p-2 transition-colors">
                            <div className="flex flex-col flex-1 justify-center">
                                <MixedText
                                    text={userProfile?.display_name || userProfile?.username || user?.email || ''}
                                    className="text-sm font-medium text-gray-900 dark:text-gray-100"
                                />
                                <MixedText
                                    text={user?.email || ''}
                                    className="text-xs text-gray-500 dark:text-gray-400"
                                />
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        side="top"
                        sideOffset={5}
                        className="w-48"
                    >
                        <DropdownMenuLabel>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                <MixedText text={userProfile?.display_name || userProfile?.username || user?.email || ''} />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <MixedText text={userProfile?.bio || '座右铭'} />
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                            <User className="h-4 w-4 mr-2" />
                            <MixedText text="个人资料" />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                            <Settings className="h-4 w-4 mr-2" />
                            <MixedText text="基础设置" />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab('settings-advanced')}>
                            <SlidersHorizontal className="h-4 w-4 mr-2" />
                            <MixedText text="高级设置" />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOutClick} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                            <LogOut className="h-4 w-4 mr-2" />
                            <MixedText text="退出登录" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    };

    // 用户信息显示组件 - Dock版本
    const DockUserInfo = () => {
        return (
            <div className="flex items-center justify-center w-full">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="cursor-pointer rounded-lg p-2 transition-colors">
                            <GlobeAvatar size="md" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        side="top"
                        sideOffset={5}
                        className="w-48"
                    >
                        <DropdownMenuLabel>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                <MixedText text={userProfile?.display_name || userProfile?.username || user?.email || ''} />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <MixedText text={userProfile?.bio || '座右铭'} />
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                            <User className="h-4 w-4 mr-2" />
                            <MixedText text="个人资料" />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                            <Settings className="h-4 w-4 mr-2" />
                            <MixedText text="基础设置" />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab('settings-advanced')}>
                            <SlidersHorizontal className="h-4 w-4 mr-2" />
                            <MixedText text="高级设置" />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOutClick} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                            <LogOut className="h-4 w-4 mr-2" />
                            <MixedText text="退出登录" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    };

    // 其余代码保持不变...
    const handleClearAllData = async () => {
        const recordIds = records.map(r => r.id);
        const knowledgeIds = knowledge.map(k => k.id);
        const planIds = plans.map(p => p.id);

        setRecords([]);
        setKnowledge([]);
        setPlans([]);

        // 批量从云端删除所有数据
        for (const id of recordIds) {
            await AutoCloudSync.autoDeleteRecord(id, notify);
        }
        for (const id of knowledgeIds) {
            await AutoCloudSync.autoDeleteKnowledge(id, notify);
        }
        for (const id of planIds) {
            await AutoCloudSync.autoDeletePlan(id, notify);
        }
    };

    const handleBatchDelete = async () => {
        if (selectedRecordIds.length === 0) {
            notify({
                message: "请先选择要删除的记录",
                description: "请勾选要删除的刷题记录",
                type: "warning"
            });
            return;
        }

        setRecordsToDelete(selectedRecordIds);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        const recordIds = recordsToDelete;
        setRecords(prev => prev.filter(record => !recordsToDelete.includes(record.id)));
        setSelectedRecordIds([]); // 清空选中状态

        // 批量从云端删除选中的记录
        for (const id of recordIds) {
            await AutoCloudSync.autoDeleteRecord(id, notify);
        }

        notify({
            message: "删除成功",
            description: `已删除 ${recordsToDelete.length} 条刷题记录`,
            type: "success"
        });

        setDeleteDialogOpen(false);
        setRecordsToDelete([]);
    };

    const handleBatchDeleteKnowledge = async (ids: string[]) => {
        setKnowledge(prev => prev.filter(item => !ids.includes(item.id)));

        // 批量从云端删除
        for (const id of ids) {
            await AutoCloudSync.autoDeleteKnowledge(id, notify);
        }
    };

    const handleEditKnowledge = async (item: KnowledgeItem) => {
        setKnowledge(prev => prev.map(k => k.id === item.id ? item : k));

        // 自动更新到云端
        await AutoCloudSync.autoUpdateKnowledge(item, notify);
    };

    // 计算计划进度 - 优化性能
    const plansWithProgress = useMemo(() => {
        if (plans.length === 0) return [];

        return plans.map(plan => {
            const { progress, status } = calcPlanProgress(plan, records);
            return {
                ...plan,
                progress,
                status
            };
        });
    }, [plans, records]);

    // 使用计划进度hook
    usePlanProgress(plans, setPlans, records, calcPlanProgress);

    // 计算统计数据 - 优化性能
    const stats = useMemo(() => {
        if (records.length === 0 && knowledge.length === 0 && plans.length === 0) {
            return {
                totalRecords: 0,
                totalQuestions: 0,
                totalCorrect: 0,
                averageAccuracy: '0.0',
                totalHours: 0,
                totalMinutes: 0,
                totalKnowledge: 0,
                activePlans: 0
            };
        }

        const totalRecords = records.length;
        const totalQuestions = records.reduce((sum, record) => sum + record.total, 0);
        const totalCorrect = records.reduce((sum, record) => sum + record.correct, 0);
        const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100).toFixed(1) : '0.0';

        const totalDuration = records.reduce((sum, record) => {
            const [hours, minutes] = record.duration.split(':').map(Number);
            return sum + hours * 60 + minutes;
        }, 0);
        const totalHours = Math.floor(totalDuration / 60);
        const totalMinutes = totalDuration % 60;

        return {
            totalRecords,
            totalQuestions,
            totalCorrect,
            averageAccuracy,
            totalHours,
            totalMinutes,
            totalKnowledge: knowledge.length,
            activePlans: plans.filter(plan => plan.status === '进行中').length
        };
    }, [records, knowledge, plans]);

    // 处理导入确认
    const handleConfirmImport = useCallback(() => {
        if (!pendingImport) return;

        const { records: newRecords, knowledge: newKnowledge, plans: newPlans, settings } = pendingImport;

        if (newRecords.length > 0) {
            setRecords(prev => [...newRecords, ...prev]);
        }
        if (newKnowledge.length > 0) {
            setKnowledge(prev => [...newKnowledge, ...prev]);
        }
        if (newPlans && newPlans.length > 0) {
            setPlans(prev => [...newPlans, ...prev]);
        }

        setImportDialogOpen(false);
        setPendingImport(undefined);

        notify({
            message: "导入成功",
            description: `已导入 ${newRecords.length} 条记录、${newKnowledge.length} 条知识点${newPlans ? `、${newPlans.length} 个计划` : ''}`,
            type: "success"
        });
    }, [pendingImport, setRecords, setKnowledge, setPlans, setImportDialogOpen, setPendingImport, notify]);

    if (!isClient) {
        return null;
    }

    // 使用 resolvedTheme 来确保主题状态正确
    const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

    return (
        <GlobalFontProvider>
            <PasteProvider>
                <NavModeContext.Provider value={navMode}>
                    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
                        {/* LightRays 背景 - 仅在深色模式下显示，添加性能优化 */}
                        {isDarkMode && (
                            <div className="fixed inset-0 z-[1]">
                                <LightRays
                                    raysOrigin="top-center"
                                    raysColor="#6366f1"
                                    raysSpeed={0.6}
                                    lightSpread={1.5}
                                    rayLength={3.0}
                                    pulsating={true}
                                    fadeDistance={1.5}
                                    saturation={0.7}
                                    followMouse={false} // 禁用鼠标跟随以提高性能
                                    mouseInfluence={0.0} // 禁用鼠标影响
                                    noiseAmount={0.02} // 减少噪声
                                    distortion={0.01} // 减少扭曲
                                />
                            </div>
                        )}

                        <LoadingWrapper loading={isLoading}>
                            <div className="flex h-screen relative z-[2]">
                                {navMode === 'sidebar' ? (
                                    <Sidebar
                                        activeTab={activeTab}
                                        setActiveTab={setActiveTab}
                                        userInfo={<SidebarUserInfo />}
                                    />
                                ) : (
                                    <DockNavigation
                                        activeTab={activeTab}
                                        setActiveTab={setActiveTab}
                                        navMode={navMode}
                                        userInfo={<DockUserInfo />}
                                    />
                                )}

                                <main className="flex-1 overflow-auto p-6 w-full max-w-none">
                                    <PageTitle>{normalizePageTitle(activeTab)}</PageTitle>



                                    {activeTab === 'overview' && (
                                        <OverviewView
                                            records={records}
                                        />
                                    )}

                                    {activeTab === 'charts' && (
                                        <ChartsView records={records} />
                                    )}

                                    {activeTab === 'history' && (
                                        <ExerciseRecordView
                                            records={records.slice((historyPage - 1) * pageSize, historyPage * pageSize)}
                                            selectedRecordIds={selectedRecordIds}
                                            onSelectIds={setSelectedRecordIds}
                                            onBatchDelete={handleBatchDelete}
                                            historyPage={historyPage}
                                            setHistoryPage={setHistoryPage}
                                            totalPages={Math.ceil(records.length / pageSize)}
                                        />
                                    )}

                                    {activeTab === 'personal-best' && (
                                        <PersonalBestView records={records} />
                                    )}

                                    {activeTab === 'knowledge-summary' && (
                                        <KnowledgeSummaryView
                                            knowledge={knowledge}
                                            onBatchDeleteKnowledge={handleBatchDeleteKnowledge}
                                            onEditKnowledge={handleEditKnowledge}
                                        />
                                    )}

                                    {activeTab === 'knowledge-entry' && (
                                        <KnowledgeEntryView
                                            onAddKnowledge={addKnowledge}
                                        />
                                    )}

                                    {activeTab === 'form' && (
                                        <NewRecordForm
                                            onAddRecord={async (newRecord) => {
                                                setRecords(prev => [newRecord, ...prev]);

                                                // 自动保存到云端
                                                await AutoCloudSync.autoSaveRecord(newRecord, notify);
                                            }}
                                        />
                                    )}

                                    {activeTab === 'plan-list' && (
                                        <Suspense fallback={<ConfettiLoading className="h-64" />}>
                                            <PlanListView
                                                plans={plansWithProgress}
                                                onCreate={async (plan) => {
                                                    setPlans(prev => [plan, ...prev]);

                                                    // 自动保存到云端
                                                    await AutoCloudSync.autoSavePlan(plan, notify);
                                                }}
                                                onUpdate={async (plan) => {
                                                    setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));

                                                    // 自动更新到云端
                                                    await AutoCloudSync.autoUpdatePlan(plan, notify);
                                                }}
                                                onDelete={async (id) => {
                                                    setPlans(prev => prev.filter(p => p.id !== id));

                                                    // 自动从云端删除
                                                    await AutoCloudSync.autoDeletePlan(id, notify);
                                                }}
                                                onShowDetail={(id) => {
                                                    setActiveTab('plan-detail');
                                                }}
                                            />
                                        </Suspense>
                                    )}

                                    {activeTab === 'plan-detail' && (
                                        <Suspense fallback={<ConfettiLoading className="h-64" />}>
                                            {plansWithProgress.length > 0 ? (
                                                <PlanDetailView
                                                    plan={plansWithProgress[0]}
                                                    onBack={() => setActiveTab('plan-list')}
                                                    onEdit={() => { }}
                                                    onUpdate={async (updatedPlan: StudyPlan) => {
                                                        setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));

                                                        // 自动更新到云端
                                                        await AutoCloudSync.autoUpdatePlan(updatedPlan, notify);
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-64">
                                                    <div className="text-center">
                                                        <p className="text-gray-500 mb-4"><MixedText text="暂无学习计划" /></p>
                                                        <button
                                                            onClick={() => setActiveTab('plan-list')}
                                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                        >
                                                            返回计划列表
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </Suspense>
                                    )}

                                    {(activeTab === 'settings' || activeTab === 'settings-advanced') && (
                                        <SettingsView
                                            onExport={handleExportData}
                                            onImport={handleImportData}
                                            onClearAllData={handleClearAllData}
                                            pageSize={pageSize}
                                            setPageSize={setPageSize}
                                            activeTab={activeTab}
                                            navMode={navMode}
                                            records={records}
                                            plans={plans}
                                            knowledge={knowledge}
                                            settings={{
                                                pageSize,
                                                navMode,
                                                // 可以添加更多设置项
                                            }}
                                        />
                                    )}


                                </main>
                            </div>
                        </LoadingWrapper>

                        {/* 导入确认对话框 */}
                        <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle><MixedText text="确认导入数据" /></AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                        {pendingImport && (
                                            <div className="space-y-2">
                                                <p><MixedText text="即将导入以下数据：" /></p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li><MixedText text={`刷题记录：${pendingImport.records.length} 条`} /></li>
                                                    <li><MixedText text={`知识点：${pendingImport.knowledge.length} 条`} /></li>
                                                    {pendingImport.plans && <li><MixedText text={`学习计划：${pendingImport.plans.length} 个`} /></li>}
                                                </ul>
                                                <p className="text-sm text-gray-600 mt-2">
                                                    注意：导入的数据将与现有数据合并，重复的记录可能会被保留。
                                                </p>
                                            </div>
                                        )}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel><MixedText text="取消" /></AlertDialogCancel>
                                    <AlertDialogAction onClick={handleConfirmImport}><MixedText text="确认导入" /></AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* 删除确认对话框 */}
                        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle><MixedText text="确认删除" /></AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                        <div className="space-y-2">
                                            <p><MixedText text="确定要删除选中的" /> <MixedText text={`${recordsToDelete.length} 条`} /> <MixedText text="刷题记录吗？此操作不可恢复。" /></p>
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel><MixedText text="取消" /></AlertDialogCancel>
                                    <AlertDialogAction onClick={handleConfirmDelete}><MixedText text="确认删除" /></AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* 退出登录确认对话框 */}
                        <AlertDialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle><MixedText text="确认退出登录" /></AlertDialogTitle>
                                    <AlertDialogDescription>
                                        <MixedText text="您确定要退出登录吗？退出后需要重新登录才能使用应用。" />
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel><MixedText text="取消" /></AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSignOut} className="bg-red-600 hover:bg-red-700">
                                        <MixedText text="确认退出" />
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>


                        {/* 用户资料对话框 */}
                        <UserProfileDialog
                            isOpen={showProfileDialog}
                            onClose={() => setShowProfileDialog(false)}
                            onProfileUpdate={loadUserProfile}
                        />
                    </div>
                </NavModeContext.Provider>
            </PasteProvider>
        </GlobalFontProvider>
    );
} 