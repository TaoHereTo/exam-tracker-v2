"use client";

import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarTrigger, SidebarProvider, useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { SettingsView } from "@/components/views/SettingsView";
import { useImportExport } from "@/hooks/useImportExport";
import { OverviewView } from "@/components/views/OverviewView";
import { ChartsView } from "@/components/views/ChartsView";
import { ExerciseRecordView } from "@/components/views/HistoryView";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePlanProgress } from "@/hooks/usePlanProgress";
import DockNavigation from "@/components/layout/DockNavigation";
import type { RecordItem, StudyPlan, KnowledgeItem, PendingImport, UserSettings } from "@/types/record";
import { calcPlanProgress } from "@/lib/planUtils";
import NavModeContext from "@/contexts/NavModeContext";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { PersonalBestView } from "@/components/views/PersonalBestView";
import KnowledgeSummaryView from "@/components/views/KnowledgeSummaryView";
import { PasteProvider } from "@/contexts/PasteContext";
import { useAuth } from "@/contexts/AuthContext";

import { LogOut, User, Settings, SlidersHorizontal, PieChart, Trophy, ChevronUp } from "lucide-react";
import { generateUUID, isUUID } from "@/lib/utils";
import { MixedText } from "@/components/ui/MixedText";

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
import { GlobeAvatar } from "@/components/ui/GlobeAvatar";
import { UserProfileService } from "@/lib/userProfileService";
import type { UserProfile } from "@/types/user";

import { UserProfileDialog } from "./auth/UserProfileDialog";
import { AutoCloudSync } from "@/lib/autoCloudSync";
import { useThemeMode } from "@/hooks/useThemeMode";


import { PageTitle } from "@/components/ui/PageTitle";
import { LoadingWrapper, SimpleLoadingSpinner } from "@/components/ui/LoadingSpinner";
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

export function MainApp() {
    const [activeTab, setActiveTab] = useState('overview'); // 默认显示'数据概览'
    const [knowledge, setKnowledge] = useLocalStorage<KnowledgeItem[]>("exam-tracker-knowledge-v2", []);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const { isDarkMode, mounted, getBackgroundStyle } = useThemeMode();

    // navMode 必须先声明，再用 useRef(navMode)
    const [navMode] = useLocalStorage<'sidebar' | 'dock'>("exam-tracker-nav-mode", "sidebar");

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
                            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        <MixedText text={userProfile?.display_name || userProfile?.username || user?.email || ''} />
                                    </span>
                                    <span className="truncate text-xs">
                                        <MixedText text={user?.email || ''} />
                                    </span>
                                </div>
                                <ChevronUp className="ml-auto size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-32 min-w-32 rounded-lg"
                            side={isCollapsed ? "top" : "bottom"}
                            align={isCollapsed ? "start" : "end"}
                            sideOffset={isCollapsed ? 8 : 4}
                            alignOffset={isCollapsed ? 40 : 0}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <GlobeAvatar size="sm" />
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            <MixedText text={userProfile?.display_name || userProfile?.username || user?.email || ''} />
                                        </span>
                                        <span className="truncate text-xs">
                                            <MixedText text={userProfile?.bio || '座右铭'} />
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {/* 仅在 Dock 模式下显示：数据概览 / 最佳成绩（图标 + 文本） */}
                            {navMode === 'dock' && (
                                <>
                                    <DropdownMenuItem onClick={() => setActiveTab('overview')}>
                                        <PieChart className="h-4 w-4 mr-2" />
                                        <MixedText text="数据概览" />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setActiveTab('personal-best')}>
                                        <Trophy className="h-4 w-4 mr-2" />
                                        <MixedText text="最佳成绩" />
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
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
                            <DropdownMenuItem onClick={handleSignOutClick}>
                                <LogOut className="h-4 w-4 mr-2" />
                                <MixedText text="退出登录" />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    };

    // 用户信息显示组件 - Dock版本
    const DockUserInfo = () => {
        const [isHovered, setIsHovered] = useState(false);
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="flex items-center justify-center w-full">
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <div
                                    className={`cursor-pointer rounded-lg p-2 transition-all duration-200 ${isHovered || isOpen
                                        ? 'bg-gray-100 dark:bg-gray-800 shadow-sm'
                                        : ''
                                        }`}
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => {
                                        setIsHovered(false);
                                        // 延迟关闭，给用户时间移动到下拉菜单
                                        setTimeout(() => {
                                            if (!isHovered) {
                                                setIsOpen(false);
                                            }
                                        }, 100);
                                    }}
                                >
                                    <GlobeAvatar size="md" />
                                </div>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>点击展开菜单</p>
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                        align="start"
                        side="top"
                        sideOffset={5}
                        className="w-48 text-left"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => {
                            setIsHovered(false);
                            setIsOpen(false);
                        }}
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
                        {/* Dock模式下增加“数据概览 / 最佳成绩”入口（图标+文字） */}
                        <>
                            {navMode === 'dock' && (
                                <>
                                    <DropdownMenuItem onClick={() => setActiveTab('overview')} className="justify-start">
                                        <PieChart className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <MixedText text="数据概览" />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setActiveTab('personal-best')} className="justify-start">
                                        <Trophy className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <MixedText text="最佳成绩" />
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                        </>
                        <DropdownMenuItem onClick={() => setShowProfileDialog(true)} className="justify-start">
                            <User className="h-4 w-4 mr-2 flex-shrink-0" />
                            <MixedText text="个人资料" />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab('settings')} className="justify-start">
                            <Settings className="h-4 w-4 mr-2 flex-shrink-0" />
                            <MixedText text="基础设置" />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab('settings-advanced')} className="justify-start">
                            <SlidersHorizontal className="h-4 w-4 mr-2 flex-shrink-0" />
                            <MixedText text="高级设置" />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOutClick} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 justify-start">
                            <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                            <MixedText text="退出登录" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
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

    return (
        <PasteProvider>
            <NavModeContext.Provider value={navMode}>
                <div className="min-h-screen w-full relative" style={getBackgroundStyle() as React.CSSProperties}>

                    <LoadingWrapper loading={isLoading}>
                        {navMode === 'sidebar' ? (
                            <SidebarProvider
                                style={{
                                    "--sidebar-width": "240px",
                                    "--sidebar-width-icon": "5rem",
                                } as React.CSSProperties & {
                                    "--sidebar-width": string;
                                    "--sidebar-width-icon": string;
                                }}
                            >
                                <div className="flex h-screen w-full relative z-[2]" data-sidebar="sidebar">
                                    <Sidebar
                                        activeTab={activeTab}
                                        setActiveTab={setActiveTab}
                                        userInfo={<SidebarUserInfo />}
                                    />
                                    <main className="flex-1 w-full overflow-hidden bg-background dark:bg-background min-w-0 h-full transition-[margin] duration-200 ease-linear peer-data-[state=collapsed]:md:ml-[var(--sidebar-width-icon)] peer flex flex-col">
                                        {/* 固定的侧边栏触发器和标题栏 */}
                                        <div className="page-title-sticky flex items-center gap-4 p-4 border-b border-border text-left bg-background dark:bg-background">
                                            <SidebarTrigger className="size-10 hover:bg-accent hover:text-accent-foreground [&>svg]:!h-6 [&>svg]:!w-6 font-normal" />
                                            <PageTitle>{normalizePageTitle(activeTab)}</PageTitle>
                                        </div>

                                        <div className={`content-scrollable w-full flex-1 ${activeTab === 'overview' ? 'p-0' : 'p-6'} max-w-7xl mx-auto`}>
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
                                                    totalRecords={records.length}
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
                                                <Suspense fallback={<SimpleLoadingSpinner />}>
                                                    <PlanListView
                                                        plans={plansWithProgress}
                                                        onCreate={async (plan) => {
                                                            const formattedPlan = {
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
                                                            const formattedPlan = {
                                                                ...plan,
                                                                module: plan.module as StudyPlan['module']
                                                            };

                                                            // 检查 ID 格式
                                                            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(plan.id);

                                                            if (!isUUID) {
                                                                // 对于旧格式ID，我们需要先将其转换为新格式，然后再同步到云端
                                                                const newId = generateUUID();
                                                                const updatedPlan = { ...formattedPlan, id: newId };

                                                                // 更新本地数据为新ID
                                                                setPlans(prev => prev.map(p => p.id === plan.id ? updatedPlan : p));

                                                                // 通知用户ID已更新
                                                                notify({
                                                                    type: 'info',
                                                                    message: 'ID格式已更新',
                                                                    description: '学习计划ID已更新为新格式，正在同步到云端...'
                                                                });

                                                                // 使用新ID同步到云端
                                                                try {
                                                                    await AutoCloudSync.autoUpdatePlan(updatedPlan, notify);
                                                                } catch (error) {
                                                                    console.error('MainApp - 编辑计划失败:', error);
                                                                }
                                                                return;
                                                            }

                                                            // 对于新格式ID，直接更新本地和云端
                                                            setPlans(prev => prev.map(p => p.id === plan.id ? formattedPlan : p));

                                                            // 自动更新到云端
                                                            try {
                                                                await AutoCloudSync.autoUpdatePlan(formattedPlan, notify);
                                                            } catch (error) {
                                                                console.error('MainApp - 编辑计划失败:', error);
                                                            }
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
                                                <Suspense fallback={<SimpleLoadingSpinner />}>
                                                    {plansWithProgress.length > 0 ? (
                                                        <PlanDetailView
                                                            plan={plansWithProgress[0]}
                                                            onBack={() => setActiveTab('plan-list')}
                                                            onEdit={() => { }}
                                                            onUpdate={async (plan) => {
                                                                const formattedPlan = {
                                                                    ...plan,
                                                                    module: plan.module as StudyPlan['module']
                                                                };

                                                                // 检查 ID 格式
                                                                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(plan.id);

                                                                if (!isUUID) {
                                                                    // 对于旧格式ID，我们需要先将其转换为新格式，然后再同步到云端
                                                                    const newId = generateUUID();
                                                                    const updatedPlan = { ...formattedPlan, id: newId };

                                                                    // 更新本地数据为新ID
                                                                    setPlans(prev => prev.map(p => p.id === plan.id ? updatedPlan : p));

                                                                    // 通知用户ID已更新
                                                                    notify({
                                                                        type: 'info',
                                                                        message: 'ID格式已更新',
                                                                        description: '学习计划ID已更新为新格式，正在同步到云端...'
                                                                    });

                                                                    // 使用新ID同步到云端
                                                                    try {
                                                                        await AutoCloudSync.autoUpdatePlan(updatedPlan, notify);
                                                                    } catch (error) {
                                                                        console.error('MainApp - 编辑计划失败:', error);
                                                                    }
                                                                    return;
                                                                }

                                                                // 对于新格式ID，直接更新本地和云端
                                                                setPlans(prev => prev.map(p => p.id === plan.id ? formattedPlan : p));

                                                                // 自动更新到云端
                                                                try {
                                                                    await AutoCloudSync.autoUpdatePlan(formattedPlan, notify);
                                                                } catch (error) {
                                                                    console.error('MainApp - 编辑计划失败:', error);
                                                                }
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
                                            )}
                                        </div>
                                    </main>
                                </div>
                            </SidebarProvider>
                        ) : (
                            <div className="flex h-screen relative z-[2]">
                                <DockNavigation
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    navMode={navMode}
                                    userInfo={<DockUserInfo />}
                                />
                                <main className={`flex-1 overflow-hidden ${activeTab === 'overview' ? 'p-0' : ''} w-full max-w-7xl mx-auto bg-background dark:bg-background text-left flex flex-col`}>
                                    {/* 固定的页面标题栏 */}
                                    <div className="page-title-sticky bg-background dark:bg-background border-b border-border">
                                        {activeTab === 'overview' ? (
                                            <div className="p-6">
                                                <PageTitle>{normalizePageTitle(activeTab)}</PageTitle>
                                            </div>
                                        ) : (
                                            <div className="p-6 pb-4">
                                                <PageTitle>{normalizePageTitle(activeTab)}</PageTitle>
                                            </div>
                                        )}
                                    </div>

                                    {/* 可滚动的内容区域 */}
                                    <div className={`content-scrollable flex-1 ${activeTab === 'overview' ? '' : 'p-6 pt-2'}`}>

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
                                            totalRecords={records.length}
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
                                        <Suspense fallback={<SimpleLoadingSpinner />}>
                                            <PlanListView
                                                plans={plansWithProgress}
                                                onCreate={async (plan) => {
                                                    const formattedPlan = {
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
                                                    const formattedPlan = {
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
                                        <Suspense fallback={<SimpleLoadingSpinner />}>
                                            {plansWithProgress.length > 0 ? (
                                                <PlanDetailView
                                                    plan={plansWithProgress[0]}
                                                    onBack={() => setActiveTab('plan-list')}
                                                    onEdit={() => { }}
                                                    onUpdate={async (plan) => {
                                                        const formattedPlan = {
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
                                    )}
                                    </div>
                                </main>
                            </div>
                        )}
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
                                                <li><MixedText text={`刷题历史：${pendingImport.records.length} 条`} /></li>
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
                                        <p><MixedText text="确定要删除选中的" /> <MixedText text={`${recordsToDelete.length} 条`} /> <MixedText text="刷题历史吗？此操作不可恢复。" /></p>
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel><MixedText text="取消" /></AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleConfirmDelete}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    style={{ color: 'white' }}
                                >
                                    <MixedText text="确认删除" />
                                </AlertDialogAction>
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
    );
}