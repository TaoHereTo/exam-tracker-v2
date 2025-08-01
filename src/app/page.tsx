"use client";

import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SettingsView } from "@/components/views/SettingsView";
import { useImportExport } from "@/hooks/useImportExport";
import { OverviewView } from "@/components/views/OverviewView";
import { ChartsView } from "@/components/views/ChartsView";
import { HistoryView } from "@/components/views/HistoryView";
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

import { PageTitle } from "@/components/ui/PageTitle";
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
import { normalizeModuleName } from "@/config/exam";
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



export default function Home() {
  const [activeTab, setActiveTab] = useState('overview'); // 默认显示'数据概览'
  const [knowledge, setKnowledge] = useLocalStorage<KnowledgeItem[]>("exam-tracker-knowledge-v2", []);

  // 新增知识点添加函数
  const addKnowledge = (newKnowledge: KnowledgeItem) => {
    setKnowledge(prev => [{ ...newKnowledge, id: Date.now().toString() + Math.random().toString(16).slice(2) }, ...prev]);
  };

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    // 处理URL参数
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const view = urlParams.get('view');
      if (view) {
        setActiveTab(view);
      }
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

  // 历史记录分页
  const [historyPage, setHistoryPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // navMode 必须先声明，再用 useRef(navMode)
  const [navMode] = useLocalStorage<'sidebar' | 'dock'>("exam-tracker-nav-mode", "sidebar");

  const sortedRecords = useMemo(() =>
    [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [records]
  );
  const totalPages = Math.ceil(sortedRecords.length / pageSize);

  // 智能分页：如果当前页超出新的总页数，则跳转到最后一页
  useEffect(() => {
    if (historyPage > totalPages && totalPages > 0) {
      setHistoryPage(totalPages);
    }
  }, [records, historyPage, totalPages]);

  const pagedRecords = useMemo(() =>
    sortedRecords.slice((historyPage - 1) * pageSize, historyPage * pageSize),
    [sortedRecords, historyPage, pageSize]
  );

  // 学习计划相关状态
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  // 进入详情
  const handleShowDetail = useCallback((id: string) => setActivePlanId(id), []);
  // 返回列表
  const handleBackToList = useCallback(() => setActivePlanId(null), []);

  // 新增增删改逻辑
  const addRecord = useCallback((record: RecordItem) => setRecords(prev => [record, ...prev]), [setRecords]);
  const deleteRecord = useCallback((id: number) => setRecords(prev => prev.filter(r => r.id !== id)), [setRecords]);
  const createPlan = useCallback((plan: StudyPlan) => setPlans(prev => [plan, ...prev]), [setPlans]);
  const updatePlan = useCallback((plan: StudyPlan) => setPlans(prev => prev.map(p => p.id === plan.id ? plan : p)), [setPlans]);
  const deletePlan = useCallback((id: string) => setPlans(prev => prev.filter(p => p.id !== id)), [setPlans]);

  // plans和records变化时自动统计进度
  const memoizedCalcPlanProgress = useCallback(calcPlanProgress, []);
  usePlanProgress(plans, setPlans, records, memoizedCalcPlanProgress);



  // 清空所有数据
  const handleClearAllData = () => {
    setRecords([]);
    setKnowledge([]);
    notify({ type: "success", message: "操作成功", description: "您的所有应用数据已被清空。" });
  };

  // 选中记录 id
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);

  const { notify } = useNotification();

  // 批量删除
  const handleBatchDelete = () => {
    setRecords(prev => prev.filter(r => !selectedRecordIds.includes(r.id)));
    setSelectedRecordIds([]);
    notify({ type: "success", message: "批量删除成功", description: `已删除 ${selectedRecordIds.length} 条记录。` });
  };

  // 使用统一的配置，不再需要重复定义
  const handleBatchDeleteKnowledge = (ids: string[]) => {
    // 删除知识点
    setKnowledge(prev => prev.filter(item => item.id && !ids.includes(item.id)));
  };

  const handleEditKnowledge = (item: KnowledgeItem) => {
    // 更新知识点
    setKnowledge(prev => prev.map(k => k.id === item.id ? { ...k, ...item } : k));
  };





  if (!isClient) return null;
  return (
    <PasteProvider>
      <NavModeContext.Provider value={navMode}>
        <div className="flex min-h-screen">
          {/* 左侧侧边栏或底部Dock，宽度固定 */}
          {navMode === 'sidebar' ? (
            <div className="fixed left-0 top-0 h-full z-10">
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          ) : (
            <DockNavigation activeTab={activeTab} setActiveTab={setActiveTab} navMode={navMode} />
          )}
          {/* 右侧主内容区，占据剩余空间 */}
          <div className={`flex-1 p-8 pb-[80px] bg-white dark:bg-gray-950 dark:text-gray-100 ${navMode === 'sidebar' ? 'ml-52' : ''}`}>
            {activeTab === 'overview' && isClient && (
              <div>
                <PageTitle>数据概览</PageTitle>
                <OverviewView records={sortedRecords} />
              </div>
            )}
            {activeTab === 'charts' && (
              <div>
                <PageTitle>数据图表</PageTitle>
                <ChartsView
                  records={records}
                />
              </div>
            )}
            {activeTab === 'best' && (
              <div>
                <PageTitle>个人最佳</PageTitle>
                <PersonalBestView records={records.map(r => ({ ...r, module: normalizeModuleName(r.module) }))} />
              </div>
            )}
            {activeTab === 'modules' && (
              <div>
                <PageTitle>知识点汇总</PageTitle>
                <KnowledgeSummaryView knowledge={knowledge} onBatchDeleteKnowledge={handleBatchDeleteKnowledge} onEditKnowledge={handleEditKnowledge} />
              </div>
            )}
            {activeTab === 'form' && (
              <div>
                <PageTitle>新增刷题记录</PageTitle>
                <div className="flex flex-col items-center justify-center min-h-[80vh] mt-0">
                  <NewRecordForm onAddRecord={addRecord} />
                </div>
              </div>
            )}
            {activeTab === 'history' && (
              <div>
                <PageTitle>历史记录</PageTitle>
                <HistoryView
                  records={pagedRecords}
                  selectedRecordIds={selectedRecordIds}
                  onSelectIds={setSelectedRecordIds}
                  onDeleteRecord={deleteRecord}
                  onBatchDelete={handleBatchDelete}
                  historyPage={historyPage}
                  setHistoryPage={setHistoryPage}
                  totalPages={totalPages}
                />
              </div>
            )}
            {activeTab === 'plan' && (
              <div>
                <PageTitle>学习计划</PageTitle>
                {activePlanId
                  ? (
                    (() => {
                      const plan = plans.find(p => p.id === activePlanId);
                      if (!plan) return <div className="text-gray-400">未找到该计划</div>;
                      return (
                        <Suspense fallback={<div className="text-center">加载中...</div>}>
                          <PlanDetailView
                            plan={plan}
                            onBack={handleBackToList}
                            onEdit={() => { /* 可弹窗编辑 */ }}
                            onUpdate={updatePlan}
                          />
                        </Suspense>
                      )
                    })()
                  )
                  : (
                    <Suspense fallback={<div className="text-center">加载中...</div>}>
                      <PlanListView
                        plans={plans}
                        onCreate={createPlan}
                        onUpdate={updatePlan}
                        onDelete={deletePlan}
                        onShowDetail={handleShowDetail}
                      />
                    </Suspense>
                  )
                }
              </div>
            )}
            {activeTab === 'settings-basic' && (
              <div>
                <PageTitle>基础设置</PageTitle>
                <SettingsView
                  onExport={handleExportData}
                  onImport={handleImportData}
                  onClearAllData={handleClearAllData}
                  pageSize={pageSize}
                  setPageSize={(n: number) => setPageSize(n)}
                  navMode={navMode}
                  activeTab={activeTab}
                />
              </div>
            )}
            {activeTab === 'settings-advanced' && (
              <div>
                <PageTitle>高级设置</PageTitle>
                <SettingsView
                  onExport={handleExportData}
                  onImport={handleImportData}
                  onClearAllData={handleClearAllData}
                  pageSize={pageSize}
                  setPageSize={(n: number) => setPageSize(n)}
                  activeTab={activeTab}
                />
              </div>
            )}
            {activeTab === 'knowledge-entry' && (
              <div>
                <PageTitle>知识点录入</PageTitle>
                <div className="flex flex-col items-center justify-center min-h-[80vh] mt-0">
                  <KnowledgeEntryView onAddKnowledge={addKnowledge} />
                </div>
              </div>
            )}
          </div>
          <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认导入数据</AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingImport && (
                    <>
                      即将导入 <b>{pendingImport.records.length}</b> 条刷题记录
                      {pendingImport.knowledge && pendingImport.knowledge.length > 0 && (
                        <>，<b>{pendingImport.knowledge.length}</b> 条知识点</>
                      )}
                      {pendingImport.plans && pendingImport.plans.length > 0 && (
                        <>，<b>{pendingImport.plans.length}</b> 个学习计划</>
                      )}
                      。是否确认导入？
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  if (pendingImport) {
                    setRecords(pendingImport.records);
                    if (pendingImport.knowledge && pendingImport.knowledge.length > 0) {
                      setKnowledge(pendingImport.knowledge);
                    }
                    if (pendingImport.plans && pendingImport.plans.length > 0) {
                      setPlans(pendingImport.plans);
                    }
                    setTimeout(() => {
                      setPendingImport(undefined);
                    }, 100);
                    // 新增：导入统计提示
                    const pi = pendingImport as PendingImport;
                    if (pi.importStats) {
                      notify({
                        type: "info",
                        message: `本次导入共${pi.importStats.total}条，去重后新增${pi.importStats.added}条，${pi.importStats.repeated}条与现有数据重复。`
                      });
                    }
                  }
                  setImportDialogOpen(false);
                  const plansCount = pendingImport?.plans?.length ?? 0;
                  notify({
                    type: "success",
                    message: "导入成功",
                    description: `成功导入 ${pendingImport?.records.length ?? 0} 条刷题记录${pendingImport?.knowledge?.length ? `，${pendingImport.knowledge.length} 条知识点` : ''}${plansCount > 0 ? `，${plansCount} 个学习计划` : ''}！`
                  });
                }}>
                  确认导入
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </NavModeContext.Provider>
    </PasteProvider>
  );
}
