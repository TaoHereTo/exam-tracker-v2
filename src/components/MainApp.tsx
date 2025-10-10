"use client";

import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarInset, SidebarTrigger, SidebarProvider, useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/animate-ui/components/radix/sidebar';
import { useImportExport } from "@/hooks/useImportExport";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePlanProgress } from "@/hooks/usePlanProgress";
import type { RecordItem, StudyPlan, KnowledgeItem, PendingImport, UserSettings, ExamCountdown, Note } from "@/types/record";
import type { CalendarEvent } from "@/components/views/ScheduleManagementView";
import { calcPlanProgress } from "@/lib/planUtils";
import NavModeContext from "@/contexts/NavModeContext";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { PasteProvider } from "@/contexts/PasteContext";
import { useAuth } from "@/contexts/AuthContext";
import { CloudDataProvider } from "@/contexts/CloudDataContext";
import { UnsavedChangesProvider } from "@/contexts/UnsavedChangesContext";
import { MODULES, normalizeModuleName } from '@/config/exam';

import { LogOut, User, Settings, SlidersHorizontal, PieChart, Trophy, ChevronDown } from "lucide-react";
import { cn, generateUUID, isUUID } from "@/lib/utils";
import { MixedText } from "@/components/ui/MixedText";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-with-animation";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip";

import { UserProfileService } from "@/lib/userProfileService";
import type { UserProfile } from "@/types/user";

import { UserProfileSheet } from "./auth/UserProfileSheet";
import { AutoCloudSync } from "@/lib/autoCloudSync";
import { useThemeMode } from "@/hooks/useThemeMode";

import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";
import { PlanCompletionCelebration } from "@/components/ui/PlanCompletionCelebration";
import { CountdownCompletionCelebration } from "@/components/ui/CountdownCompletionCelebration";

import { PageTitle } from "@/components/ui/PageTitle";
import { LoadingWrapper, SimpleLoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SimpleUiverseSpinner } from "@/components/ui/UiverseSpinner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { normalizePageTitle } from "@/config/exam";
import { clearLocalStorageData } from "@/lib/storageUtils";
import toast from 'react-hot-toast';

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
const SettingsView = lazy(() =>
    import("@/components/views/SettingsView").then(module => ({
        default: module.SettingsView
    }))
);

// 添加倒计时视图的懒加载
const CountdownView = lazy(() =>
    import("@/components/views/CountdownView").then(module => ({
        default: module.default
    }))
);

// 添加日程管理视图的懒加载
const ScheduleManagementView = lazy(() =>
    import("@/components/views/ScheduleManagementView").then(module => ({
        default: module.default
    }))
);


const NotesView = lazy(() =>
    import("@/components/views/NotesView").then(module => ({
        default: module.default
    }))
);

// 添加AI分析视图的懒加载
const AIAnalysisView = lazy(() =>
    import("@/components/views/AIAnalysisView").then(module => ({
        default: module.AIAnalysisView
    }))
);

export function MainApp() {
    const [activeTab, setActiveTab] = useState('overview'); // 默认显示'成绩概览'
    const [knowledge, setKnowledge] = useLocalStorage<KnowledgeItem[]>("exam-tracker-knowledge-v2", []);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const { isDarkMode, mounted, getBackgroundStyle } = useThemeMode();


    // 移除dock模式，只保留sidebar模式
    const navMode = "sidebar";

    // 认证相关
    const { user, signOut } = useAuth();
    const { notify, notifyLoading, updateToSuccess, updateToError } = useNotification();

    const [showProfileDialog, setShowProfileDialog] = useState(false);

    // 删除确认对话框状态
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [recordsToDelete, setRecordsToDelete] = useState<string[]>([]);

    // 计划完成庆祝弹窗状态
    const [celebrationOpen, setCelebrationOpen] = useState(false);
    const [completedPlan, setCompletedPlan] = useState<StudyPlan | null>(null);

    // 考试倒计时完成庆祝弹窗状态
    const [countdownCelebrationOpen, setCountdownCelebrationOpen] = useState(false);
    const [completedCountdown, setCompletedCountdown] = useState<ExamCountdown | null>(null);

    const loadUserProfile = useCallback(async () => {
        try {
            // 使用ensureUserProfile确保用户资料存在
            const profile = await UserProfileService.ensureUserProfile();
            setUserProfile(profile);
        } catch (error) {
            console.error('加载用户资料失败:', error);
            // 不设置错误状态，避免影响页面渲染
            setUserProfile(null);
        }
    }, []);

    // 新增知识点添加函数 - 优化性能
    const addKnowledge = useCallback(async (newKnowledge: KnowledgeItem) => {
        const knowledgeWithId = { ...newKnowledge, id: generateUUID() };
        setKnowledge(prev => [knowledgeWithId, ...prev]);

        // 异步保存到云端，不显示toast通知（由调用方管理）
        await AutoCloudSync.autoSaveKnowledge(knowledgeWithId, {
            notify,
            notifyLoading,
            updateToSuccess,
            updateToError
        }, false); // 传递 false 以禁用toast通知
    }, [setKnowledge, notify, notifyLoading, updateToSuccess, updateToError]);

    // 加载用户资料 - 优化性能
    useEffect(() => {
        if (user && !userProfile) {
            // 立即加载用户资料，确保头像能正常显示
            loadUserProfile();
        }
    }, [user, userProfile, loadUserProfile]); // 重新添加 loadUserProfile 依赖，因为它现在是稳定的

    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 计划完成回调函数 - Moved this function before useEffect that uses it
    const handlePlanCompleted = useCallback((plan: StudyPlan) => {
        setCompletedPlan(plan);
        setCelebrationOpen(true);
    }, []);

    // 处理计划庆祝弹窗关闭
    const handleCelebrationClose = useCallback(() => {
        setCelebrationOpen(false);
        setCompletedPlan(null);
    }, []);

    // 处理倒计时庆祝弹窗关闭
    const handleCountdownCelebrationClose = useCallback(() => {
        setCountdownCelebrationOpen(false);
        setCompletedCountdown(null);
    }, []);

    // 处理查看计划
    const handleViewCompletedPlans = useCallback(() => {
        setActiveTab('plan-list');
        // 可以在这里添加滚动到已完成计划的逻辑
    }, []);

    // 处理查看倒计时
    const handleViewCompletedCountdowns = useCallback(() => {
        setActiveTab('countdown');
    }, []);

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

        // 移除键盘测试快捷键
        return () => { };
    }, []); // Removed handlePlanCompleted from dependencies since it's now defined before this useEffect

    // 计划和刷题历史持久化到localStorage
    const [plans, setPlans] = useLocalStorage<StudyPlan[]>("exam-tracker-plans-v2", []);
    const [records, setRecords] = useLocalStorage<RecordItem[]>("exam-tracker-records-v2", []);
    const [countdowns, setCountdowns] = useLocalStorage<ExamCountdown[]>("exam-tracker-countdowns-v2", []);
    const [notes, setNotes] = useLocalStorage<Note[]>("exam-tracker-notes-v2", []);
    const [customEvents, setCustomEvents] = useLocalStorage<CalendarEvent[]>("exam-tracker-custom-events-v2", []);

    const {
        handleExportData,
        handleImportData,
        handleConfirmImport,
        importDialogOpen,
        setImportDialogOpen,
        pendingImport,
        setPendingImport,
    } = useImportExport(records, setRecords, knowledge, setKnowledge, plans, setPlans, countdowns, setCountdowns, notes, setNotes);

    // 刷题历史分页和筛选
    const [historyPage, setHistoryPage] = useState(1);
    const [historyModuleFilter, setHistoryModuleFilter] = useState('all'); // 添加模块筛选状态
    const pageSize = 10; // 固定为10条每页
    // 选中的记录ID
    const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

    // 根据模块筛选记录
    const filteredRecords = useMemo(() => {
        if (historyModuleFilter === 'all') {
            return records;
        }
        return records.filter(record => normalizeModuleName(record.module) === historyModuleFilter);
    }, [records, historyModuleFilter]);

    // 清理无效的选中记录ID（当记录被删除或页面切换时）
    useEffect(() => {
        const currentPageRecords = filteredRecords.slice((historyPage - 1) * pageSize, historyPage * pageSize);
        const currentPageIds = currentPageRecords.map(r => r.id);
        setSelectedRecordIds(prev => prev.filter(id => currentPageIds.includes(id)));
    }, [filteredRecords, historyPage]);

    // 当模块筛选改变时，重置到第一页
    useEffect(() => {
        setHistoryPage(1);
    }, [historyModuleFilter]);

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

        const userInfo = userProfile || user;

        if (!userInfo) {
            return (
                <div className="flex items-center justify-center p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            );
        }

        const getInitials = () => {
            const displayName = ('username' in userInfo && userInfo.username) ||
                userInfo.email ||
                'U';
            return displayName.charAt(0).toUpperCase();
        };

        // 获取用户名显示文本
        const getDisplayName = () => {
            return ('username' in userInfo && userInfo.username) ||
                userInfo.email ||
                '用户';
        };

        // 获取邮箱显示文本
        const getDisplayEmail = () => {
            return userInfo.email || '';
        };

        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                className={cn(
                                    "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                                    isCollapsed
                                        ? "justify-center items-center p-0 w-10 h-10 mx-auto"
                                        : "!justify-start !items-center !px-3"
                                )}
                                tooltip={isCollapsed ? "用户信息" : undefined}
                            >
                                {isCollapsed ? (
                                    // 折叠状态：显示用户姓名首字母头像
                                    <div className="flex items-center justify-center w-full h-full">
                                        <div
                                            className={cn(
                                                "w-7 h-7 rounded-md flex items-center justify-center text-sm font-semibold aspect-square",
                                                isDarkMode
                                                    ? "bg-white text-black"
                                                    : "bg-black text-white"
                                            )}
                                        >
                                            {getInitials()}
                                        </div>
                                    </div>
                                ) : (
                                    // 展开状态：显示头像 + 用户信息
                                    <>
                                        <div
                                            className={cn(
                                                "w-7 h-7 rounded-md flex items-center justify-center text-sm font-semibold mr-1 aspect-square flex-shrink-0",
                                                isDarkMode
                                                    ? "bg-white text-black"
                                                    : "bg-black text-white"
                                            )}
                                        >
                                            {getInitials()}
                                        </div>
                                        <div className="flex flex-col items-start justify-center flex-1 min-w-0">
                                            <span className="truncate font-semibold text-xs text-left w-full">
                                                <MixedText text={getDisplayName()} />
                                            </span>
                                            <span className="truncate text-xs text-muted-foreground text-left w-full">
                                                <MixedText text={getDisplayEmail()} />
                                            </span>
                                        </div>
                                        <ChevronDown className={`size-4 transition-transform duration-200 ${isOpen ? '-rotate-90' : ''}`} />
                                    </>
                                )}
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side="right"
                            align="end"
                            sideOffset={8}
                            alignOffset={15}
                            className="w-[--radix-popper-anchor-width] shadow-xl bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-lg z-[var(--z-maximum)]"
                            style={{
                                zIndex: 9999
                            } as React.CSSProperties}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center justify-center px-2 py-2 text-center">
                                    <TextAnimate
                                        animation="fadeIn"
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

                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                                    <User className="h-4 w-4 mr-1" />
                                    <MixedText text="个人资料" />
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                                    <Settings className="h-4 w-4 mr-1" />
                                    <MixedText text="程序设置" />
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={handleSignOutClick}
                                className="text-red-600 focus:text-red-700 logout-menu-item"
                            >
                                <LogOut className="h-4 w-4 mr-1 text-red-600" />
                                <MixedText
                                    text="退出登录"
                                    className="font-medium logout-text"
                                />
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
            clearLocalStorageData(['records', 'knowledge', 'plans', 'countdowns', 'events', 'ai', 'settings']);

            // 清空React状态
            setRecords([]);
            setKnowledge([]);
            setPlans([]);
            setCountdowns([]);
            setCustomEvents([]);
            setSelectedRecordIds([]);

            notify({
                type: 'success',
                message: '本地数据已清空',
                description: '已清空本地的刷题历史、知识点、学习计划、考试倒计时、自定义事件、AI设置和应用设置'
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

    // 更新记录
    const handleUpdateRecord = (updatedRecord: RecordItem) => {
        setRecords(prev => prev.map(record =>
            record.id === updatedRecord.id ? updatedRecord : record
        ));
    };

    const handleConfirmDelete = async () => {
        const recordIds = [...recordsToDelete]; // 创建副本以避免引用问题

        // 先更新本地数据
        setRecords(prev => prev.filter(record => !recordIds.includes(record.id)));
        setSelectedRecordIds([]); // 清空选中状态

        // 显示批量删除的加载通知
        let toastId: string | undefined;
        if (notifyLoading) {
            toastId = notifyLoading('正在从云端删除记录', `正在从云端删除 ${recordIds.length} 条刷题历史`);
        } else {
            notify({
                type: 'info',
                message: '正在从云端删除记录',
                description: `正在从云端删除 ${recordIds.length} 条刷题历史`
            });
        }

        // 统计删除成功和失败的数量
        let successCount = 0;
        let errorCount = 0;

        // 批量从云端删除选中的记录
        for (const id of recordIds) {
            try {
                await AutoCloudSync.autoDeleteRecord(id, {
                    notify: () => { }, // 完全禁用单个记录的通知
                    notifyLoading: undefined, // 不显示单个记录的加载通知
                    updateToSuccess: undefined, // 不更新单个记录的成功状态
                    updateToError: undefined // 不更新单个记录的错误状态
                });
                successCount++;
            } catch (error) {
                console.error('删除记录失败:', id, error);
                errorCount++;
            }
        }

        // 更新批量删除的最终状态
        if (toastId && updateToSuccess && errorCount === 0) {
            updateToSuccess(toastId, '删除成功', `已成功删除 ${successCount} 条刷题历史`);
        } else if (toastId && updateToError) {
            if (errorCount > 0) {
                updateToError(toastId, '删除完成', `成功删除 ${successCount} 条记录，${errorCount} 条记录删除失败`);
            } else if (updateToSuccess) {
                updateToSuccess(toastId, '删除成功', `已成功删除 ${successCount} 条刷题历史`);
            }
        } else {
            if (errorCount > 0) {
                notify({
                    type: 'warning',
                    message: '删除完成',
                    description: `成功删除 ${successCount} 条记录，${errorCount} 条记录删除失败`
                });
            } else {
                notify({
                    type: 'success',
                    message: '删除成功',
                    description: `已成功删除 ${successCount} 条刷题历史`
                });
            }
        }

        setDeleteDialogOpen(false);
        setRecordsToDelete([]);
    };

    const handleBatchDeleteKnowledge = async (ids: string[]) => {
        // 先更新本地数据
        setKnowledge(prev => {
            const filtered = prev.filter(item => !ids.includes(item.id));
            return filtered;
        });

        // 创建批量删除的加载通知
        const toastId = notifyLoading ? notifyLoading('正在从云端删除知识点...', `正在删除 ${ids.length} 个知识点`) : null;

        let successCount = 0;
        let errorCount = 0;

        // 批量从云端删除，只删除UUID格式的ID（新格式）
        for (const id of ids) {
            if (isUUID(id)) {
                try {
                    await AutoCloudSync.autoDeleteKnowledge(id, {
                        notify: () => { }, // 禁用单个通知
                        notifyLoading: undefined, // 不显示单个加载通知
                        updateToSuccess: undefined, // 不更新单个成功状态
                        updateToError: undefined // 不更新单个错误状态
                    });
                    successCount++;
                } catch (error) {
                    console.error('删除知识点失败:', id, error);
                    errorCount++;
                }
            }
        }

        // 更新批量删除的最终状态
        if (toastId && updateToSuccess && errorCount === 0) {
            updateToSuccess(toastId, '知识点删除成功', `已成功删除 ${successCount} 个知识点`);
        } else if (toastId && updateToError) {
            if (errorCount > 0) {
                updateToError(toastId, '删除完成', `成功删除 ${successCount} 个知识点，${errorCount} 个知识点删除失败`);
            } else if (updateToSuccess) {
                updateToSuccess(toastId, '知识点删除成功', `已成功删除 ${successCount} 个知识点`);
            }
        } else {
            if (errorCount > 0) {
                notify({
                    type: 'warning',
                    message: '删除完成',
                    description: `成功删除 ${successCount} 个知识点，${errorCount} 个知识点删除失败`
                });
            } else {
                notify({
                    type: 'success',
                    message: '知识点删除成功',
                    description: `已成功删除 ${successCount} 个知识点`
                });
            }
        }
    };

    const handleEditKnowledge = async (item: KnowledgeItem) => {
        // 先更新本地数据
        setKnowledge(prev => prev.map(k => k.id === item.id ? item : k));

        // 直接同步到云端
        try {
            await AutoCloudSync.autoUpdateKnowledge(item, {
                notify,
                notifyLoading,
                updateToSuccess,
                updateToError
            });
        } catch (error) {
            console.error('更新知识点失败:', error);
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

    // 使用计划进度hook - Moved this after handlePlanCompleted is defined
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


    if (!isClient) {
        return null;
    }

    // Component to handle sidebar state and update CSS variables for toast positioning
    // This component must be inside SidebarProvider to use useSidebar hook
    const UpdateToastPositioning = () => {
        const { state } = useSidebar();
        const isCollapsed = state === 'collapsed';

        React.useEffect(() => {
            // Update CSS variable based on sidebar state
            const updateCSSVariables = () => {
                const sidebarWidth = isCollapsed ?
                    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width-icon') || '68') :
                    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width') || '256');

                const offset = isCollapsed ? sidebarWidth / 2 : sidebarWidth / 2;
                document.documentElement.style.setProperty('--sidebar-offset', `${offset}px`);
            };

            updateCSSVariables();

            // Also update on window resize
            window.addEventListener('resize', updateCSSVariables);
            return () => window.removeEventListener('resize', updateCSSVariables);
        }, [isCollapsed]);

        return null; // This component doesn't render anything
    };

    return (
        <PasteProvider>
            <UnsavedChangesProvider>
                <NavModeContext.Provider value={navMode}>
                    <div className="h-screen w-full relative" style={getBackgroundStyle() as React.CSSProperties}>
                        <LoadingWrapper loading={isLoading}>
                            <SidebarProvider>
                                <CloudDataProvider>
                                    <Sidebar
                                        activeTab={activeTab}
                                        setActiveTab={setActiveTab}
                                        userInfo={<SidebarUserInfo />}
                                    />
                                    <SidebarInset>
                                        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                                            <div className="flex items-center gap-2 px-4">
                                                <SidebarTrigger className="-ml-1" />
                                                <div className="min-w-0 flex-1">
                                                    <PageTitle
                                                        className="text-lg sm:text-xl md:text-2xl truncate cursor-pointer"
                                                    >
                                                        {normalizePageTitle(activeTab)}
                                                    </PageTitle>
                                                </div>
                                            </div>
                                        </header>

                                        {/* 主题切换按钮 - 固定在右上角 */}
                                        <div className="fixed top-3 right-4 z-[var(--z-modal)] theme-toggle-button">
                                            <AnimatedThemeToggler className="w-8 h-8" />
                                        </div>

                                        <div className="flex flex-1 flex-col gap-layout-md p-page pt-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
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
                                                        records={filteredRecords.slice((historyPage - 1) * pageSize, historyPage * pageSize)}
                                                        allRecords={filteredRecords}
                                                        selectedRecordIds={selectedRecordIds}
                                                        onSelectIds={setSelectedRecordIds}
                                                        onBatchDelete={handleBatchDelete}
                                                        onUpdateRecord={handleUpdateRecord}
                                                        onAddRecord={async (newRecord) => {
                                                            setRecords(prev => [newRecord, ...prev]);

                                                            // 自动保存到云端
                                                            await AutoCloudSync.autoSaveRecord(newRecord, {
                                                                notify,
                                                                notifyLoading,
                                                                updateToSuccess,
                                                                updateToError
                                                            });
                                                        }}
                                                        historyPage={historyPage}
                                                        setHistoryPage={setHistoryPage}
                                                        totalPages={Math.ceil(filteredRecords.length / pageSize)}
                                                        totalRecords={filteredRecords.length}
                                                        moduleFilter={historyModuleFilter}
                                                        onModuleFilterChange={setHistoryModuleFilter}
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

                                                            // 自动保存到云端
                                                            try {
                                                                const savedPlan = await AutoCloudSync.autoSavePlan(formattedPlan, {
                                                                    notify,
                                                                    notifyLoading,
                                                                    updateToSuccess,
                                                                    updateToError
                                                                });

                                                                // 如果云端保存成功，使用云端返回的ID更新本地记录
                                                                if (savedPlan) {
                                                                    setPlans(prev => prev.map(p =>
                                                                        p.id === formattedPlan.id
                                                                            ? { ...p, id: savedPlan.id }
                                                                            : p
                                                                    ));
                                                                }
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

                                                            // 检查是否是置顶操作，如果是则不触发云端同步
                                                            const originalPlan = plans.find(p => p.id === plan.id);
                                                            const isPinToggle = originalPlan &&
                                                                originalPlan.isPinned !== plan.isPinned &&
                                                                JSON.stringify({ ...originalPlan, isPinned: plan.isPinned }) === JSON.stringify(plan);

                                                            if (!isPinToggle) {
                                                                // 自动更新到云端（置顶操作除外）
                                                                try {
                                                                    const updatedPlan = await AutoCloudSync.autoUpdatePlan(formattedPlan, {
                                                                        notify,
                                                                        notifyLoading,
                                                                        updateToSuccess,
                                                                        updateToError
                                                                    });

                                                                    // 如果云端返回了新的ID（比如重新创建的情况），更新本地记录
                                                                    if (updatedPlan && updatedPlan.id !== formattedPlan.id) {
                                                                        setPlans(prev => prev.map(p =>
                                                                            p.id === formattedPlan.id
                                                                                ? { ...p, id: updatedPlan.id }
                                                                                : p
                                                                        ));
                                                                    }
                                                                } catch (error) {
                                                                    console.error('MainApp - 更新计划失败:', error);
                                                                }
                                                            }
                                                        }}
                                                        onDelete={async (id) => {
                                                            // 只进行本地删除，不显示toast
                                                            setPlans(prev => prev.filter(p => p.id !== id));

                                                            // 自动从云端删除，显示toast
                                                            try {
                                                                await AutoCloudSync.autoDeletePlan(id, {
                                                                    notify,
                                                                    notifyLoading,
                                                                    updateToSuccess,
                                                                    updateToError
                                                                });
                                                            } catch (error) {
                                                                console.error('MainApp - 删除计划失败:', error);
                                                            }
                                                        }}
                                                        onBatchDelete={async (ids) => {
                                                            // 先更新本地数据
                                                            setPlans(prev => prev.filter(p => !ids.includes(p.id)));

                                                            // 显示批量删除的加载通知
                                                            let toastId: string | undefined;
                                                            if (notifyLoading) {
                                                                toastId = notifyLoading('正在从云端删除计划', `正在从云端删除 ${ids.length} 个学习计划`);
                                                            } else {
                                                                notify({
                                                                    type: 'info',
                                                                    message: '正在从云端删除计划',
                                                                    description: `正在从云端删除 ${ids.length} 个学习计划`
                                                                });
                                                            }

                                                            // 统计删除成功和失败的数量
                                                            let successCount = 0;
                                                            let errorCount = 0;

                                                            // 批量从云端删除选中的计划
                                                            for (const id of ids) {
                                                                try {
                                                                    await AutoCloudSync.autoDeletePlan(id, {
                                                                        notify: () => { }, // 完全禁用单个计划的通知
                                                                        notifyLoading: undefined, // 不显示单个计划的加载通知
                                                                        updateToSuccess: undefined, // 不更新单个计划的成功状态
                                                                        updateToError: undefined // 不更新单个计划的错误状态
                                                                    });
                                                                    successCount++;
                                                                } catch (error) {
                                                                    console.error('删除计划失败:', id, error);
                                                                    errorCount++;
                                                                }
                                                            }

                                                            // 更新批量删除的最终状态
                                                            if (toastId && updateToSuccess && errorCount === 0) {
                                                                updateToSuccess(toastId, '删除成功', `已成功删除 ${successCount} 个学习计划`);
                                                            } else if (toastId && updateToError) {
                                                                if (errorCount > 0) {
                                                                    updateToError(toastId, '删除完成', `成功删除 ${successCount} 个计划，${errorCount} 个计划删除失败`);
                                                                } else if (updateToSuccess) {
                                                                    updateToSuccess(toastId, '删除成功', `已成功删除 ${successCount} 个学习计划`);
                                                                }
                                                            } else {
                                                                if (errorCount > 0) {
                                                                    notify({
                                                                        type: 'warning',
                                                                        message: '删除完成',
                                                                        description: `成功删除 ${successCount} 个计划，${errorCount} 个计划删除失败`
                                                                    });
                                                                } else {
                                                                    notify({
                                                                        type: 'success',
                                                                        message: '删除成功',
                                                                        description: `已成功删除 ${successCount} 个学习计划`
                                                                    });
                                                                }
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
                                                                await AutoCloudSync.autoUpdatePlan(formattedPlan, {
                                                                    notify,
                                                                    notifyLoading,
                                                                    updateToSuccess,
                                                                    updateToError
                                                                });
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

                                            {activeTab === 'countdown' && (
                                                <Suspense fallback={
                                                    <div className="flex items-center justify-center min-h-[60vh]">
                                                        <SimpleUiverseSpinner />
                                                    </div>
                                                }>
                                                    <CountdownView
                                                        countdowns={countdowns}
                                                        onCreate={async (countdown) => {
                                                            const formattedCountdown: ExamCountdown = {
                                                                ...countdown
                                                            };
                                                            setCountdowns(prev => [formattedCountdown, ...prev]);


                                                            // 自动保存到云端
                                                            try {
                                                                const savedCountdown = await AutoCloudSync.autoSaveCountdown(formattedCountdown, {
                                                                    notify,
                                                                    notifyLoading,
                                                                    updateToSuccess,
                                                                    updateToError
                                                                });

                                                                // 如果云端保存成功，使用云端返回的ID更新本地记录
                                                                if (savedCountdown) {
                                                                    setCountdowns(prev => prev.map(c =>
                                                                        c.id === formattedCountdown.id
                                                                            ? { ...c, id: savedCountdown.id }
                                                                            : c
                                                                    ));
                                                                }
                                                            } catch (error) {
                                                                console.error('MainApp - 创建倒计时失败:', error);
                                                            }
                                                        }}
                                                        onUpdate={async (countdown) => {
                                                            const formattedCountdown: ExamCountdown = {
                                                                ...countdown
                                                            };
                                                            setCountdowns(prev => prev.map(c => c.id === countdown.id ? formattedCountdown : c));

                                                            // 检查是否是置顶操作，如果是则不触发云端同步
                                                            const originalCountdown = countdowns.find(c => c.id === countdown.id);
                                                            const isPinToggle = originalCountdown &&
                                                                originalCountdown.isPinned !== countdown.isPinned &&
                                                                JSON.stringify({ ...originalCountdown, isPinned: countdown.isPinned }) === JSON.stringify(countdown);

                                                            if (!isPinToggle) {
                                                                // 自动更新到云端（置顶操作除外）
                                                                try {
                                                                    const updatedCountdown = await AutoCloudSync.autoUpdateCountdown(formattedCountdown, {
                                                                        notify,
                                                                        notifyLoading,
                                                                        updateToSuccess,
                                                                        updateToError
                                                                    });

                                                                    // 如果云端返回了新的ID（比如重新创建的情况），更新本地记录
                                                                    if (updatedCountdown && updatedCountdown.id !== formattedCountdown.id) {
                                                                        setCountdowns(prev => prev.map(c =>
                                                                            c.id === formattedCountdown.id
                                                                                ? { ...c, id: updatedCountdown.id }
                                                                                : c
                                                                        ));
                                                                    }
                                                                } catch (error) {
                                                                    console.error('MainApp - 更新倒计时失败:', error);
                                                                }
                                                            }
                                                        }}
                                                        onDelete={async (id) => {
                                                            // 只进行本地删除，不显示toast
                                                            setCountdowns(prev => prev.filter(c => c.id !== id));

                                                            // 自动从云端删除，但不显示toast
                                                            try {
                                                                await AutoCloudSync.autoDeleteCountdown(id, {
                                                                    notify: () => { }, // 禁用单个删除的toast
                                                                    notifyLoading: undefined,
                                                                    updateToSuccess: undefined,
                                                                    updateToError: undefined
                                                                });
                                                            } catch (error) {
                                                                console.error('MainApp - 删除倒计时失败:', error);
                                                            }
                                                        }}
                                                        onBatchDelete={async (ids) => {
                                                            // 先更新本地数据
                                                            setCountdowns(prev => prev.filter(c => !ids.includes(c.id)));

                                                            // 显示批量删除的加载通知
                                                            let toastId: string | undefined;
                                                            if (notifyLoading) {
                                                                toastId = notifyLoading('正在从云端删除倒计时', `正在从云端删除 ${ids.length} 个考试倒计时`);
                                                            } else {
                                                                notify({
                                                                    type: 'info',
                                                                    message: '正在从云端删除倒计时',
                                                                    description: `正在从云端删除 ${ids.length} 个考试倒计时`
                                                                });
                                                            }

                                                            // 统计删除成功和失败的数量
                                                            let successCount = 0;
                                                            let errorCount = 0;

                                                            // 批量从云端删除选中的倒计时
                                                            for (const id of ids) {
                                                                try {
                                                                    await AutoCloudSync.autoDeleteCountdown(id, {
                                                                        notify: () => { }, // 完全禁用单个倒计时的通知
                                                                        notifyLoading: undefined, // 不显示单个倒计时的加载通知
                                                                        updateToSuccess: undefined, // 不更新单个倒计时的成功状态
                                                                        updateToError: undefined // 不更新单个倒计时的错误状态
                                                                    });
                                                                    successCount++;
                                                                } catch (error) {
                                                                    console.error('删除倒计时失败:', id, error);
                                                                    errorCount++;
                                                                }
                                                            }

                                                            // 更新批量删除的最终状态
                                                            if (toastId && updateToSuccess && errorCount === 0) {
                                                                updateToSuccess(toastId, '删除成功', `已成功删除 ${successCount} 个考试倒计时`);
                                                            } else if (toastId && updateToError) {
                                                                if (errorCount > 0) {
                                                                    updateToError(toastId, '删除完成', `成功删除 ${successCount} 个倒计时，${errorCount} 个倒计时删除失败`);
                                                                } else if (updateToSuccess) {
                                                                    updateToSuccess(toastId, '删除成功', `已成功删除 ${successCount} 个考试倒计时`);
                                                                }
                                                            } else {
                                                                if (errorCount > 0) {
                                                                    notify({
                                                                        type: 'warning',
                                                                        message: '删除完成',
                                                                        description: `成功删除 ${successCount} 个倒计时，${errorCount} 个倒计时删除失败`
                                                                    });
                                                                } else {
                                                                    notify({
                                                                        type: 'success',
                                                                        message: '删除成功',
                                                                        description: `已成功删除 ${successCount} 个考试倒计时`
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                        onCountdownComplete={(countdown) => {
                                                            setCompletedCountdown(countdown);
                                                            setCountdownCelebrationOpen(true);
                                                        }}
                                                    />
                                                </Suspense>
                                            )}

                                            {activeTab === 'calendar' && (
                                                <Suspense fallback={
                                                    <div className="flex items-center justify-center min-h-[60vh]">
                                                        <SimpleUiverseSpinner />
                                                    </div>
                                                }>
                                                    <ScheduleManagementView
                                                        countdowns={countdowns}
                                                        plans={plansWithProgress}
                                                        customEvents={customEvents}
                                                        onCreateEvent={(event) => {
                                                            // 保存自定义日程到本地存储
                                                            setCustomEvents(prev => [event, ...prev]);
                                                            toast.success('自定义日程创建成功');
                                                        }}
                                                        onUpdateEvent={(event) => {
                                                            // 更新自定义日程
                                                            setCustomEvents(prev => prev.map(e => e.id === event.id ? event : e));
                                                            toast.success('自定义日程更新成功');
                                                        }}
                                                        onDeleteEvent={(id) => {
                                                            // 删除自定义日程
                                                            setCustomEvents(prev => prev.filter(e => e.id !== id));
                                                            toast.success('自定义日程删除成功');
                                                        }}
                                                    />
                                                </Suspense>
                                            )}


                                            {activeTab === 'notes' && (
                                                <Suspense fallback={
                                                    <div className="flex items-center justify-center min-h-[60vh]">
                                                        <SimpleUiverseSpinner />
                                                    </div>
                                                }>
                                                    <NotesView />
                                                </Suspense>
                                            )}

                                            {activeTab === 'ai-analysis' && (
                                                <Suspense fallback={
                                                    <div className="flex items-center justify-center min-h-[60vh]">
                                                        <SimpleUiverseSpinner />
                                                    </div>
                                                }>
                                                    <AIAnalysisView records={records} />
                                                </Suspense>
                                            )}

                                            {(activeTab === 'settings') && (
                                                <Suspense fallback={
                                                    <div className="flex items-center justify-center min-h-[60vh]">
                                                        <SimpleUiverseSpinner />
                                                    </div>
                                                }>
                                                    <SettingsView
                                                        onExport={handleExportData}
                                                        onImport={handleImportData}
                                                        onClearLocalData={handleClearLocalData}
                                                        setRecords={setRecords}
                                                        setPlans={setPlans}
                                                        setKnowledge={setKnowledge}
                                                        setCountdowns={setCountdowns}
                                                        setNotes={setNotes}
                                                        activeTab={activeTab}
                                                        navMode={navMode}
                                                        records={records}
                                                        plans={plans}
                                                        countdowns={countdowns}
                                                        notes={notes}
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
                                </CloudDataProvider>
                            </SidebarProvider>
                        </LoadingWrapper>

                        {/* 导入确认对话框 - 响应式设计 */}
                        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                            <DialogContent className="w-[95vw] max-w-md sm:max-w-lg mx-4 sm:mx-auto">
                                <DialogHeader>
                                    <DialogTitle><MixedText text="确认导入数据" /></DialogTitle>
                                    {pendingImport && (
                                        <div className="space-y-2">
                                            <p><MixedText text="即将导入以下数据：" /></p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li><MixedText text={`刷题历史：${pendingImport.records.length} 条`} /></li>
                                                <li><MixedText text={`知识点：${pendingImport.knowledge.length} 条`} /></li>
                                                {pendingImport.plans && pendingImport.plans.length > 0 && <li><MixedText text={`学习计划：${pendingImport.plans.length} 个`} /></li>}
                                                {pendingImport.countdowns && pendingImport.countdowns.length > 0 && <li><MixedText text={`考试倒计时：${pendingImport.countdowns.length} 个`} /></li>}
                                                {pendingImport.notes && pendingImport.notes.length > 0 && <li><MixedText text={`笔记：${pendingImport.notes.length} 条`} /></li>}
                                                {pendingImport.settings && <li><MixedText text="设置数据" /></li>}
                                            </ul>
                                            <p className="text-sm text-gray-600 mt-2">
                                                注意：导入的数据将与现有数据合并，重复的数据将被自动跳过。
                                            </p>
                                        </div>
                                    )}
                                </DialogHeader>
                                <DialogFooter className="flex-col sm:flex-row">
                                    <Button
                                        variant="outline"
                                        className="flex items-center justify-center w-full sm:w-auto rounded-full"
                                        onClick={() => setImportDialogOpen(false)}
                                    >
                                        <MixedText text="取消" />
                                    </Button>
                                    <Button
                                        onClick={handleConfirmImport}
                                        variant="default"
                                        className="flex items-center justify-center w-full sm:w-auto rounded-full bg-[#db2777] hover:bg-[#db2777]/90 text-white dark:text-white shadow-none hover:shadow-none transition-all duration-200"
                                    >
                                        <MixedText text="确认导入" />
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* 删除确认对话框 */}
                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle><MixedText text="确认删除" /></DialogTitle>
                                    <DialogDescription>
                                        <MixedText text={`确定要删除选中的 ${recordsToDelete.length} 条刷题历史吗？`} />
                                        <br />
                                        <br />
                                        <MixedText text="此操作不可撤销，删除后无法恢复。" />
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex items-center justify-center rounded-full">
                                        <MixedText text="取消" />
                                    </Button>
                                    <Button
                                        onClick={handleConfirmDelete}
                                        variant="destructive"
                                        className="flex items-center justify-center rounded-full"
                                    >
                                        <MixedText text="确认删除" />
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* 退出登录确认对话框 - 响应式设计 */}
                        <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
                            <DialogContent className="w-[95vw] max-w-md sm:max-w-lg mx-4 sm:mx-auto">
                                <DialogHeader>
                                    <DialogTitle><MixedText text="确认退出登录" /></DialogTitle>
                                    <DialogDescription>
                                        <MixedText text="您确定要退出登录吗？退出后需要重新登录才能使用应用。" />
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="flex-col sm:flex-row">
                                    <Button
                                        variant="outline"
                                        className="flex items-center justify-center w-full sm:w-auto rounded-full"
                                        onClick={() => setSignOutDialogOpen(false)}
                                    >
                                        <MixedText text="取消" />
                                    </Button>
                                    <Button onClick={handleSignOut} variant="destructive" className="flex items-center justify-center w-full sm:w-auto rounded-full">
                                        <MixedText text="确认退出" />
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>


                        {/* 计划完成庆祝弹窗 */}
                        <PlanCompletionCelebration
                            isOpen={celebrationOpen}
                            onClose={handleCelebrationClose}
                            onViewPlans={handleViewCompletedPlans}
                            planName={completedPlan?.name || ''}
                        />

                        {/* 倒计时完成庆祝弹窗 */}
                        <CountdownCompletionCelebration
                            isOpen={countdownCelebrationOpen}
                            onClose={handleCountdownCelebrationClose}
                            onViewCountdowns={handleViewCompletedCountdowns}
                            countdownName={completedCountdown?.name || ''}
                        />

                        {/* 用户资料侧边栏 - 使用Sheet组件 */}
                        <UserProfileSheet
                            isOpen={showProfileDialog}
                            onClose={() => setShowProfileDialog(false)}
                            onProfileUpdate={loadUserProfile}
                        />

                    </div>
                </NavModeContext.Provider>
            </UnsavedChangesProvider>
        </PasteProvider>
    );
}
