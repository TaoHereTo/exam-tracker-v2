"use client";

import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { SidebarTrigger, SidebarProvider, useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useImportExport } from "@/hooks/useImportExport";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePlanProgress } from "@/hooks/usePlanProgress";
import type { RecordItem, StudyPlan, KnowledgeItem, PendingImport, UserSettings } from "@/types/record";
import { calcPlanProgress } from "@/lib/planUtils";
import NavModeContext from "@/contexts/NavModeContext";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { PasteProvider } from "@/contexts/PasteContext";
import { useAuth } from "@/contexts/AuthContext";

import { LogOut, User, Settings, SlidersHorizontal, PieChart, Trophy, ChevronDown } from "lucide-react";
import { cn, generateUUID, isUUID } from "@/lib/utils";
import { MixedText } from "@/components/ui/MixedText";
import { TextAnimate } from "@/components/magicui/text-animate";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { UserProfileService } from "@/lib/userProfileService";
import type { UserProfile } from "@/types/user";

import { UserProfileDialog } from "./auth/UserProfileDialog";
import { AutoCloudSync } from "@/lib/autoCloudSync";
import { useThemeMode } from "@/hooks/useThemeMode";

import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";

import { PageTitle } from "@/components/ui/PageTitle";
import { LoadingWrapper, SimpleLoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SimpleUiverseSpinner } from "@/components/ui/UiverseSpinner";
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
import { buttonVariants } from "@/components/ui/button";
import { normalizePageTitle } from "@/config/exam";
import { clearLocalStorageData } from "@/lib/storageUtils";

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
const OverviewView = lazy(() =>
    import("@/components/views/OverviewView").then(module => ({
        default: module.OverviewView
    }))
);
const ChartsView = lazy(() =>
    import("@/components/views/ChartsView").then(module => ({
        default: module.ChartsView
    }))
);
const ExerciseRecordView = lazy(() =>
    import("@/components/views/HistoryView").then(module => ({
        default: module.ExerciseRecordView
    }))
);
const PersonalBestView = lazy(() =>
    import("@/components/views/PersonalBestView").then(module => ({
        default: module.PersonalBestView
    }))
);
const KnowledgeSummaryView = lazy(() =>
    import("@/components/views/KnowledgeSummaryView").then(module => ({
        default: module.default
    }))
);
const KnowledgeEntryView = lazy(() =>
    import("@/components/views/KnowledgeEntryView").then(module => ({
        default: module.default
    }))
);
const NewRecordForm = lazy(() =>
    import("@/components/forms/NewRecordForm").then(module => ({
        default: module.NewRecordForm
    }))
);
const SettingsView = lazy(() =>
    import("@/components/views/SettingsView").then(module => ({
        default: module.SettingsView
    }))
);

export function MainApp() {
    const [activeTab, setActiveTab] = useState('overview'); // 默认显示'数据概览'
    const [knowledge, setKnowledge] = useLocalStorage<KnowledgeItem[]>("exam-tracker-knowledge-v2", []);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const { isDarkMode, mounted, getBackgroundStyle } = useThemeMode();

    // 移除dock模式，只保留sidebar模式
    const navMode = "sidebar";

    // 认证相关
    const { user, signOut } = useAuth();
    const { notify } = useNotification();

    const [showProfileDialog, setShowProfileDialog] = useState(false);

    // 删除确认对话框状态
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [recordsToDelete, setRecordsToDelete] = useState<string[]>([]);

    const loadUserProfile = useCallback(async () => {
        try {
            // 使用ensureUserProfile确保用户资料存在
            const profile = await UserProfileService.ensureUserProfile();
            setUserProfile(profile);
        } catch (error) {
            console.error('加载用户资料失败:', error);
            // 不设置错误状态，避免影响页面渲染
        }
    }, []);

    // 新增知识点添加函数 - 优化性能
    const addKnowledge = useCallback(async (newKnowledge: KnowledgeItem) => {
        const knowledgeWithId = { ...newKnowledge, id: generateUUID() };
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

    // 计划和刷题历史持久化到localStorage
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

    // 刷题历史分页
    const [historyPage, setHistoryPage] = useState(1);
    const pageSize = 10; // 固定为10条每页
    // 选中的记录ID
    const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

    // 清理无效的选中记录ID（当记录被删除或页面切换时）
    useEffect(() => {
        const currentPageRecords = records.slice((historyPage - 1) * pageSize, historyPage * pageSize);
        const currentPageIds = currentPageRecords.map(r => r.id);
        setSelectedRecordIds(prev => prev.filter(id => currentPageIds.includes(id)));
    }, [records, historyPage]);

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
        const [isOpen, setIsOpen] = useState(false);
        const { state } = useSidebar();
        const isCollapsed = state === 'collapsed';

        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground !justify-between !items-center">
                                <div className="flex flex-col items-center justify-center flex-1">
                                    <span className="truncate font-semibold text-sm">
                                        <MixedText text={userProfile?.display_name || userProfile?.username || user?.email || ''} />
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        <MixedText text={user?.email || ''} />
                                    </span>
                                </div>
                                <ChevronDown className={`size-4 transition-transform duration-200 ${isOpen ? '-rotate-180' : ''}`} />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-36 min-w-36 rounded-lg"
                            side={isCollapsed ? "top" : "bottom"}
                            align={isCollapsed ? "start" : "end"}
                            sideOffset={isCollapsed ? 8 : 4}
                            alignOffset={isCollapsed ? 40 : 0}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center justify-center px-2 py-2 text-center">
                                    <TextAnimate
                                        animation="blurIn"
                                        by="character"
                                        className="text-sm text-black dark:text-white font-medium"
                                        startOnView={true}
                                        once={false}
                                        duration={0.4}
                                        delay={0.05}
                                    >
                                        {userProfile?.bio || '座右铭'}
                                    </TextAnimate>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowProfileDialog(true)} className="flex justify-center">
                                <div className="flex items-center gap-4">
                                    <User className="h-4 w-4" />
                                    <MixedText text="个人资料" />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActiveTab('settings')} className="flex justify-center">
                                <div className="flex items-center gap-4">
                                    <Settings className="h-4 w-4" />
                                    <MixedText text="基础设置" />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActiveTab('settings-advanced')} className="flex justify-center">
                                <div className="flex items-center gap-4">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    <MixedText text="高级设置" />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOutClick} className="flex justify-center text-red-600 hover:text-red-700 focus:text-red-700">
                                <div className="flex items-center gap-4">
                                    <LogOut className="h-4 w-4 text-red-600" />
                                    <MixedText text="退出登录" />
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    };

    // 清空本地数据（不影响云端）
    const handleClearLocalData = async () => {
        try {
            // 清空localStorage中的数据
            clearLocalStorageData(['records', 'knowledge', 'plans']);

            // 清空React状态
            setRecords([]);
            setKnowledge([]);
            setPlans([]);
            setSelectedRecordIds([]);

            notify({
                type: 'success',
                message: '本地数据已清空',
                description: '已清空本地的刷题历史、知识点和学习计划'
            });
        } catch (error) {
            notify({
                type: 'error',
                message: '清空失败',
                description: '清空本地数据时发生错误'
            });
        }
    };

    const handleBatchDelete = async () => {
        if (selectedRecordIds.length === 0) {
            notify({
                message: "请先选择要删除的记录",
                description: "请勾选要删除的刷题历史",
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
            description: `已删除 ${recordsToDelete.length} 条刷题历史`,
            type: "success"
        });

        setDeleteDialogOpen(false);
        setRecordsToDelete([]);
    };

    const handleBatchDeleteKnowledge = async (ids: string[]) => {
        // 先更新本地数据
        setKnowledge(prev => {
            const filtered = prev.filter(item => !ids.includes(item.id));
            return filtered;
        });

        // 批量从云端删除，只删除UUID格式的ID（新格式）
        for (const id of ids) {
            if (isUUID(id)) {
                await AutoCloudSync.autoDeleteKnowledge(id, notify);
            }
        }
    };

    const handleEditKnowledge = async (item: KnowledgeItem) => {
        // 先更新本地数据
        setKnowledge(prev => prev.map(k => k.id === item.id ? item : k));

        // 检查 ID 格式
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);

        if (!isUUID) {
            // 对于旧格式ID，我们需要先将其转换为新格式，然后再同步到云端
            const newId = generateUUID();
            const updatedItem = { ...item, id: newId };

            // 更新本地数据为新ID
            setKnowledge(prev => prev.map(k => k.id === item.id ? updatedItem : k));

            // 通知用户ID已更新
            notify({
                type: 'info',
                message: 'ID格式已更新',
                description: '知识点ID已更新为新格式，正在同步到云端...'
            });

            // 对于旧格式ID，应该创建新记录而不是更新
            try {
                await AutoCloudSync.autoSaveKnowledge(updatedItem, notify);
            } catch (error) {
                console.error('MainApp - 编辑知识点失败 (ID转换):', {
                    originalId: item.id,
                    newId: updatedItem.id,
                    error: error instanceof Error ? error.message : String(error),
                    fullError: error
                });
            }
            return;
        }

        // 对于新格式ID，直接同步到云端
        try {
            await AutoCloudSync.autoUpdateKnowledge(item, notify);
        } catch (error) {
            console.error('MainApp - 编辑知识点失败 (直接更新):', {
                knowledgeId: item.id,
                knowledgeData: {
                    module: item.module,
                    type: (item as Record<string, unknown>).type,
                    note: (item as Record<string, unknown>).note,
                    subCategory: (item as Record<string, unknown>).subCategory,
                    date: (item as Record<string, unknown>).date,
                    source: (item as Record<string, unknown>).source,
                    imagePath: (item as Record<string, unknown>).imagePath
                },
                error: error instanceof Error ? error.message : String(error),
                fullError: error
            });
        }
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

    // 计划完成回调函数
    const handlePlanCompleted = useCallback((plan: StudyPlan) => {
        notify({
            type: 'success',
            message: '恭喜！你完成了一项计划！',
            description: `学习计划"${plan.name}"已完成！继续保持！`
        });
    }, [notify]);

    // 使用计划进度hook
    usePlanProgress(plans, setPlans, records, calcPlanProgress, handlePlanCompleted);

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

        // 导入记录（去重）
        const existingRecordKeys = new Set(records.map(r => `${r.date}__${r.module}__${r.total}__${r.correct}__${r.duration}`));
        const newRecords = pendingImport.records.filter(r => {
            const key = `${r.date}__${r.module}__${r.total}__${r.correct}__${r.duration}`;
            return !existingRecordKeys.has(key);
        });

        // 导入知识点（去重）- 改进的去重逻辑
        // 创建现有知识点的内容键集合
        const existingKnowledgeContentKeys = new Set(knowledge.map(k => 
            `${k.module}__${k.type || ''}__${k.note || ''}__${k.subCategory || ''}__${k.date || ''}__${k.source || ''}__${k.imagePath || ''}`
        ));
        
        const newKnowledge = pendingImport.knowledge.filter(k => {
            // 为导入的知识点创建内容键
            const contentKey = `${k.module}__${k.type || ''}__${k.note || ''}__${k.subCategory || ''}__${k.date || ''}__${k.source || ''}__${k.imagePath || ''}`;
            return !existingKnowledgeContentKeys.has(contentKey);
        });

        // 导入计划（去重）
        const existingPlanKeys = new Set(plans.map(p => `${p.name}__${p.module}__${p.type}__${p.startDate}__${p.endDate}`));
        let newPlans = pendingImport.plans || [];
        newPlans = newPlans.filter(p => {
            const key = `${p.name}__${p.module}__${p.type}__${p.startDate}__${p.endDate}`;
            return !existingPlanKeys.has(key);
        });

        if (newRecords.length > 0) {
            setRecords(prev => [...newRecords, ...prev]);
        }
        if (newKnowledge.length > 0) {
            setKnowledge(prev => [...newKnowledge, ...prev]);
        }
        if (newPlans.length > 0) {
            setPlans(prev => [...newPlans, ...prev]);
        }

        notify({
            message: "导入成功",
            description: `已导入 ${newRecords.length} 条记录、${newKnowledge.length} 条知识点${newPlans.length > 0 ? `、${newPlans.length} 个计划` : ''}，跳过 ${(pendingImport.records.length - newRecords.length) + (pendingImport.knowledge.length - newKnowledge.length) + ((pendingImport.plans?.length || 0) - newPlans.length)} 项重复数据`,
            type: "success"
        });

        setImportDialogOpen(false);
        setPendingImport(undefined);
    }, [pendingImport, records, knowledge, plans, setRecords, setKnowledge, setPlans, setImportDialogOpen, setPendingImport, notify]);

    if (!isClient) {
        return null;
    }

    return (
        <PasteProvider>
            <NavModeContext.Provider value={navMode}>
                <div className="min-h-screen w-full relative" style={getBackgroundStyle() as React.CSSProperties}>
                    <LoadingWrapper loading={isLoading}>
                        <SidebarProvider
                            style={{
                                "--sidebar-width": "16rem",
                                "--sidebar-width-mobile": "14rem",
                                "--sidebar-width-icon": "4rem",
                            } as React.CSSProperties & {
                                "--sidebar-width": string;
                                "--sidebar-width-mobile": string;
                                "--sidebar-width-icon": string;
                            }}
                        >
                            <div className="flex h-screen w-full relative z-[2] flex-col md:flex-row" data-sidebar="sidebar">
                                <Sidebar
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    userInfo={<SidebarUserInfo />}
                                />
                                <SidebarInset className="flex flex-col flex-1">
                                    {/* 固定的侧边栏触发器和标题栏 - 响应式设计 */}
                                    <div className="page-title-sticky flex items-center gap-2 p-2 sm:gap-4 sm:p-4 border-b border-border text-left bg-background dark:bg-background">
                                        <SidebarTrigger className="size-8 sm:size-10 hover:bg-accent hover:text-accent-foreground [&>svg]:!h-5 [&>svg]:!w-5 sm:[&>svg]:!h-6 sm:[&>svg]:!w-6 font-normal" />
                                        <div className="min-w-0 flex-1">
                                            <PageTitle className="text-lg sm:text-xl md:text-2xl truncate">{normalizePageTitle(activeTab)}</PageTitle>
                                        </div>
                                        <div className="flex items-center">
                                            <AnimatedThemeToggler className="w-8 h-8 sm:w-10 sm:h-10" />
                                        </div>
                                    </div>

                                    <div className={`content-scrollable w-full flex-1 ${activeTab === 'overview' ? 'p-0' : 'p-4 sm:p-6'} max-w-7xl mx-auto`}>
                                        {activeTab === 'overview' && (
                                            <Suspense fallback={
                                                <div className="flex items-center justify-center min-h-[60vh]">
                                                    <SimpleUiverseSpinner />
                                                </div>
                                            }>
                                                <OverviewView
                                                    records={records}
                                                />
                                            </Suspense>
                                        )}

                                        {activeTab === 'charts' && (
                                            <Suspense fallback={
                                                <div className="flex items-center justify-center min-h-[60vh]">
                                                    <SimpleUiverseSpinner />
                                                </div>
                                            }>
                                                <ChartsView records={records} />
                                            </Suspense>
                                        )}

                                        {activeTab === 'history' && (
                                            <Suspense fallback={
                                                <div className="flex items-center justify-center min-h-[60vh]">
                                                    <SimpleUiverseSpinner />
                                                </div>
                                            }>
                                                <ExerciseRecordView
                                                    records={records.slice((historyPage - 1) * pageSize, historyPage * pageSize)}
                                                    allRecords={records}
                                                    selectedRecordIds={selectedRecordIds}
                                                    onSelectIds={setSelectedRecordIds}
                                                    onBatchDelete={handleBatchDelete}
                                                    historyPage={historyPage}
                                                    setHistoryPage={setHistoryPage}
                                                    totalPages={Math.ceil(records.length / pageSize)}
                                                    totalRecords={records.length}
                                                />
                                            </Suspense>
                                        )}

                                        {activeTab === 'personal-best' && (
                                            <Suspense fallback={
                                                <div className="flex items-center justify-center min-h-[60vh]">
                                                    <SimpleUiverseSpinner />
                                                </div>
                                            }>
                                                <PersonalBestView records={records} />
                                            </Suspense>
                                        )}

                                        {activeTab === 'knowledge-summary' && (
                                            <Suspense fallback={
                                                <div className="flex items-center justify-center min-h-[60vh]">
                                                    <SimpleUiverseSpinner />
                                                </div>
                                            }>
                                                <KnowledgeSummaryView
                                                    knowledge={knowledge}
                                                    onBatchDeleteKnowledge={handleBatchDeleteKnowledge}
                                                    onEditKnowledge={handleEditKnowledge}
                                                />
                                            </Suspense>
                                        )}

                                        {activeTab === 'knowledge-entry' && (
                                            <Suspense fallback={
                                                <div className="flex items-center justify-center min-h-[60vh]">
                                                    <SimpleUiverseSpinner />
                                                </div>
                                            }>
                                                <KnowledgeEntryView
                                                    onAddKnowledge={addKnowledge}
                                                />
                                            </Suspense>
                                        )}

                                        {activeTab === 'form' && (
                                            <Suspense fallback={
                                                <div className="flex items-center justify-center min-h-[60vh]">
                                                    <SimpleUiverseSpinner />
                                                </div>
                                            }>
                                                <NewRecordForm
                                                    onAddRecord={async (newRecord) => {
                                                        setRecords(prev => [newRecord, ...prev]);

                                                        // 自动保存到云端
                                                        await AutoCloudSync.autoSaveRecord(newRecord, notify);
                                                    }}
                                                />
                                            </Suspense>
                                        )}

                                        {activeTab === 'plan-list' && (
                                            <Suspense fallback={
                                                <div className="flex items-center justify-center min-h-[60vh]">
                                                    <SimpleUiverseSpinner />
                                                </div>
                                            }>
                                                <PlanListView
                                                    plans={plansWithProgress}
                                                    onCreate={async (plan) => {
                                                        const formattedPlan: StudyPlan = {
                                                            ...plan,
                                                            module: plan.module as StudyPlan['module']
                                                        };
                                                        setPlans(prev => [formattedPlan, ...prev]);

                                                        // 检查 ID 格式，只有 UUID 格式的才保存到云端
                                                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(plan.id);

                                                        if (!isUUID) {
                                                            notify({
                                                                type: 'warning',
                                                                message: '本地保存成功',
                                                                description: '计划已保存到本地，但云端同步跳过（旧格式ID）'
                                                            });
                                                            return;
                                                        }

                                                        // 自动保存到云端
                                                        try {
                                                            await AutoCloudSync.autoSavePlan(formattedPlan, notify);
                                                        } catch (error) {
                                                            console.error('MainApp - 创建计划失败:', error);
                                                        }
                                                    }}
                                                    onUpdate={async (plan) => {
                                                        const formattedPlan: StudyPlan = {
                                                            ...plan,
                                                            module: plan.module as StudyPlan['module']
                                                        };
                                                        setPlans(prev => prev.map(p => p.id === plan.id ? formattedPlan : p));

                                                        // 自动更新到云端
                                                        await AutoCloudSync.autoUpdatePlan(formattedPlan, notify);
                                                    }}
                                                    onDelete={async (id) => {
                                                        setPlans(prev => prev.filter(p => p.id !== id));

                                                        // 检查 ID 格式，只有 UUID 格式的才从云端删除
                                                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

                                                        if (!isUUID) {
                                                            notify({
                                                                type: 'warning',
                                                                message: '本地删除成功',
                                                                description: '计划已从本地删除，但云端同步跳过（旧格式ID）'
                                                            });
                                                            return;
                                                        }

                                                        // 自动从云端删除
                                                        try {
                                                            await AutoCloudSync.autoDeletePlan(id, notify);
                                                        } catch (error) {
                                                            console.error('MainApp - 删除计划失败:', error);
                                                        }
                                                    }}
                                                />
                                            </Suspense>
                                        )}

                                        {activeTab === 'plan-detail' && (
                                            <Suspense fallback={
                                                <div className="flex items-center justify-center min-h-[60vh]">
                                                    <SimpleUiverseSpinner />
                                                </div>
                                            }>
                                                {plansWithProgress.length > 0 ? (
                                                    <PlanDetailView
                                                        plan={plansWithProgress[0]}
                                                        onBack={() => setActiveTab('plan-list')}
                                                        onEdit={() => { }}
                                                        onUpdate={async (plan) => {
                                                            const formattedPlan: StudyPlan = {
                                                                ...plan,
                                                                module: plan.module as StudyPlan['module']
                                                            };
                                                            setPlans(prev => prev.map(p => p.id === plan.id ? formattedPlan : p));

                                                            // 自动更新到云端
                                                            await AutoCloudSync.autoUpdatePlan(formattedPlan, notify);
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-64">
                                                        <div className="text-center">
                                                            <p className="text-gray-500"><MixedText text="未找到学习计划" /></p>
                                                        </div>
                                                    </div>
                                                )}
                                            </Suspense>
                                        )}

                                        {(activeTab === 'settings' || activeTab === 'settings-advanced') && (
                                            <Suspense fallback={
                                                <div className="flex items-center justify-center min-h-[60vh]">
                                                    <SimpleUiverseSpinner />
                                                </div>
                                            }>
                                                <SettingsView
                                                    onExport={handleExportData}
                                                    onImport={handleImportData}
                                                    onClearLocalData={handleClearLocalData}
                                                    activeTab={activeTab}
                                                    navMode={navMode}
                                                    records={records}
                                                    plans={plans}
                                                    knowledge={knowledge}
                                                    settings={{
                                                        'exam-tracker-nav-mode': navMode,
                                                        // 可以添加更多设置项
                                                    }}
                                                />
                                            </Suspense>
                                        )}
                                </div>
                                </SidebarInset>
                            </div>
                        </SidebarProvider>
                    </LoadingWrapper>
                        
                    {/* 导入确认对话框 - 响应式设计 */}
                    <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                        <AlertDialogContent className="w-11/12 max-w-md sm:max-w-lg">
                            <AlertDialogHeader>
                                <AlertDialogTitle><MixedText text="确认导入数据" /></AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    {pendingImport && (
                                        <div className="space-y-2">
                                            <p><MixedText text="即将导入以下数据：" /></p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li><MixedText text={`刷题历史：${pendingImport.records.length} 条`} /></li>
                                                <li><MixedText text={`知识点：${pendingImport.knowledge.length} 条`} /></li>
                                                {pendingImport.plans && <li><MixedText text={`学习计划：${pendingImport.plans.length} 个`} /></li>}
                                            </ul>
                                            <p className="text-sm text-gray-600 mt-2">
                                                注意：导入的数据将与现有数据合并，重复的数据将被自动跳过。
                                            </p>
                                        </div>
                                    )}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row">
                                <AlertDialogCancel className="w-full sm:w-auto"><MixedText text="取消" /></AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleConfirmImport} 
                                    className="w-full sm:w-auto"
                                    style={{ background: '#10B981', color: 'white' }}
                                >
                                    <MixedText text="确认导入" />
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* 删除确认对话框 - 响应式设计 */}
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent className="w-11/12 max-w-md sm:max-w-lg">
                            <AlertDialogHeader>
                                <AlertDialogTitle><MixedText text="确认删除" /></AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="space-y-2">
                                        <p><MixedText text="确定要删除选中的" /> <MixedText text={`${recordsToDelete.length} 条`} /> <MixedText text="刷题历史吗？此操作不可恢复。" /></p>
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row">
                                <AlertDialogCancel className="w-full sm:w-auto"><MixedText text="取消" /></AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleConfirmDelete}
                                    className={cn(buttonVariants({ variant: "danger" }), "w-full sm:w-auto")}
                                    style={{ color: 'white' }}
                                >
                                    <MixedText text="确认删除" />
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* 退出登录确认对话框 - 响应式设计 */}
                    <AlertDialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
                        <AlertDialogContent className="w-11/12 max-w-md sm:max-w-lg">
                            <AlertDialogHeader>
                                <AlertDialogTitle><MixedText text="确认退出登录" /></AlertDialogTitle>
                                <AlertDialogDescription>
                                    <MixedText text="您确定要退出登录吗？退出后需要重新登录才能使用应用。" />
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row">
                                <AlertDialogCancel className="w-full sm:w-auto"><MixedText text="取消" /></AlertDialogCancel>
                                <AlertDialogAction onClick={handleSignOut} className={cn(buttonVariants({ variant: "danger" }), "w-full sm:w-auto")}>
                                    <MixedText text="确认退出" />
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>


                    {/* 用户资料对话框 - 响应式设计 */}
                    <UserProfileDialog
                        isOpen={showProfileDialog}
                        onClose={() => setShowProfileDialog(false)}
                        onProfileUpdate={loadUserProfile}
                    />
                </div>
            </NavModeContext.Provider>
        </PasteProvider>
    );
}