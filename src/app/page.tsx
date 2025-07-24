"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SettingsView } from "@/components/views/SettingsView";
import { useImportExport } from "@/hooks/useImportExport";
import { OverviewView } from "@/components/views/OverviewView";
import { ChartsView } from "@/components/views/ChartsView";
import { HistoryView } from "@/components/views/HistoryView";
import { NewRecordView } from "@/components/views/NewRecordView";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { usePlanProgress } from "@/hooks/usePlanProgress";
import DockNavigation from "@/components/layout/DockNavigation";
import { usePlans } from "@/hooks/usePlans";
import { useRecords } from "@/hooks/useRecords";
import type { KnowledgeItem } from "@/types/record";
import { calcPlanProgress } from "@/lib/planUtils";
import NavModeContext from "@/contexts/NavModeContext";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { PersonalBestView } from "@/components/views/PersonalBestView";
import KnowledgeSummaryView from "@/components/views/KnowledgeSummaryView";
import PlanListView from "@/components/views/PlanListView";
import PlanDetailView from "@/components/views/PlanDetailView";
import PageTitle from "@/components/ui/PageTitle";
import { KnowledgeEntryTabView } from "@/components/views/KnowledgeEntryTabView";
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


export default function Home() {
  const [activeTab, setActiveTab] = useState('overview'); // 默认显示'数据概览'
  const [knowledge, setKnowledge] = useLocalStorageState<KnowledgeItem[]>("exam-tracker-knowledge-v2", []);

  // 新增知识点添加函数
  const addKnowledge = (newKnowledge: KnowledgeItem) => {
    setKnowledge(prev => [{ ...newKnowledge, id: Date.now().toString() + Math.random().toString(16).slice(2) }, ...prev]);
  };

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  // 替换计划相关逻辑
  const {
    plans,
    setPlans,
    createPlan,
    updatePlan,
    deletePlan,
  } = usePlans([]);
  // 替换记录相关逻辑
  const {
    records,
    setRecords,
    addRecord,
    deleteRecord,
  } = useRecords([]);

  const {
    handleExportData,
    handleImportData,
    importDialogOpen,
    setImportDialogOpen,
    pendingImport,
    setPendingImport,
  } = useImportExport(records, setRecords, knowledge, setKnowledge);

  // 历史记录分页
  const [historyPage, setHistoryPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [exportFormat, setExportFormat] = useState("json");
  // navMode 必须先声明，再用 useRef(navMode)
  const [navMode] = useLocalStorageState<'sidebar' | 'dock'>("exam-tracker-nav-mode", "sidebar");

  // 移除未使用的 setNavMode 和 lastSavedNavMode 变量
  // 移除未使用的 setNavMode 和 lastSavedNavMode 变量
  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sortedRecords.length / pageSize);
  const pagedRecords = sortedRecords.slice((historyPage - 1) * pageSize, historyPage * pageSize);

  // 学习计划相关状态
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  // 进入详情
  const handleShowDetail = (id: string) => setActivePlanId(id);
  // 返回列表
  const handleBackToList = () => setActivePlanId(null);

  // plans和records变化时自动统计进度
  usePlanProgress(plans, setPlans, records, calcPlanProgress);

  // 批量清空各类数据
  const handleClearRecords = () => {
    setRecords([]);
    notify({ type: "success", message: "历史记录已清空" });
  };
  const handleClearKnowledge = () => {
    setKnowledge([]);
    notify({ type: "success", message: "知识点已清空" });
  };
  const handleClearPlans = () => {
    setPlans([]);
    notify({ type: "success", message: "学习计划已清空" });
  };

  // 清空所有数据
  const handleClearAllData = () => {
    setRecords([]);
    setKnowledge([]);
    notify({ type: "success", message: "操作成功", description: "您的所有应用数据已被清空。" });
  };

  // 选中记录 id
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);

  // 批量删除
  const handleBatchDelete = () => {
    setRecords(prev => prev.filter(r => !selectedRecordIds.includes(r.id)));
    setSelectedRecordIds([]);
    notify({ type: "success", message: "批量删除成功", description: `已删除 ${selectedRecordIds.length} 条记录。` });
  };

  const { notify } = useNotification();

  // 恢复 moduleLabelMap 和 handleBatchDeleteKnowledge
  const moduleLabelMap: Record<string, string> = {
    'data-analysis': '资料分析',
    'politics': '政治理论',
    'math': '数量关系',
    'common': '常识判断',
    'verbal': '言语理解',
    'logic': '判断推理',
    '资料分析': '资料分析',
    '政治理论': '政治理论',
    '数量关系': '数量关系',
    '常识判断': '常识判断',
    '言语理解': '言语理解',
    '判断推理': '判断推理',
  };
  const handleBatchDeleteKnowledge = (ids: string[]) => {
    setKnowledge(prev => prev.filter(item => item.id && !ids.includes(item.id)));
  };

  if (!isClient) return null;
  return (
    <NavModeContext.Provider value={navMode}>
      <div className="flex min-h-screen">
        {/* 左侧侧边栏或底部Dock，宽度固定 */}
        {navMode === 'sidebar' ? (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        ) : (
          <DockNavigation activeTab={activeTab} setActiveTab={setActiveTab} navMode={navMode} />
        )}
        {/* 右侧主内容区，占据剩余空间 */}
        <div className="flex-1 p-8 pb-[80px] bg-white dark:bg-gray-950 dark:text-gray-100">
          {activeTab === 'overview' && isClient && <OverviewView records={sortedRecords} />}
          {activeTab === 'charts' && (
            <ChartsView
              records={records}
            />
          )}
          {activeTab === 'best' && (
            <div>
              <h1 className="text-3xl font-bold mb-4">最佳成绩</h1>
              <PersonalBestView records={records.map(r => ({ ...r, module: (typeof r.module === 'string' && moduleLabelMap[r.module]) ? moduleLabelMap[r.module] : r.module }))} />
            </div>
          )}
          {activeTab === 'modules' && (
            <div>
              <h1 className="text-3xl font-bold mb-4">知识点汇总</h1>
              <KnowledgeSummaryView knowledge={knowledge} onBatchDeleteKnowledge={handleBatchDeleteKnowledge} />
            </div>
          )}
          {activeTab === 'form' && <NewRecordView onAddRecord={addRecord} />}
          {activeTab === 'history' && (
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
          )}
          {activeTab === 'plan' && (
            <div>
              {activePlanId
                ? (
                  (() => {
                    const plan = plans.find(p => p.id === activePlanId);
                    if (!plan) return <div className="text-gray-400">未找到该计划</div>;
                    return <PlanDetailView
                      plan={plan}
                      onBack={handleBackToList}
                      onEdit={() => { /* 可弹窗编辑 */ }}
                      onUpdate={updatePlan}
                    />
                  })()
                )
                : (
                  <PlanListView
                    plans={plans}
                    onCreate={createPlan}
                    onUpdate={updatePlan}
                    onDelete={deletePlan}
                    onShowDetail={handleShowDetail}
                  />
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
                exportFormat={exportFormat}
                setExportFormat={(f: string) => setExportFormat(f)}
                navMode={navMode}
                activeTab={activeTab}
              />
            </div>
          )}
          {activeTab === 'settings-advanced' && (
            <div>
              <h1 className="text-3xl font-bold mb-4">高级设置</h1>
              <SettingsView
                onExport={handleExportData}
                onImport={handleImportData}
                onClearAllData={handleClearAllData}
                pageSize={pageSize}
                setPageSize={(n: number) => setPageSize(n)}
                exportFormat={exportFormat}
                setExportFormat={(f: string) => setExportFormat(f)}
                activeTab={activeTab}
                onClearRecords={handleClearRecords}
                onClearKnowledge={handleClearKnowledge}
                onClearPlans={handleClearPlans}
              />
            </div>
          )}
          {activeTab === 'knowledge-entry' && <KnowledgeEntryTabView onAddKnowledge={addKnowledge} />}
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
                  setTimeout(() => {
                    setPendingImport(undefined);
                  }, 100);
                }
                setImportDialogOpen(false);
                notify({ type: "success", message: "导入成功", description: `成功导入 ${pendingImport?.records.length ?? 0} 条刷题记录${pendingImport?.knowledge?.length ? `，${pendingImport.knowledge.length} 条知识点` : ''}！` });
              }}>确认导入</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </NavModeContext.Provider>
  );
}
