"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { NewRecordForm } from "@/components/forms/NewRecordForm";
import { HistoryTable } from "@/components/tables/HistoryTable";
import { TrendChart } from "@/components/charts/TrendChart";
import { SettingsView } from "@/components/views/SettingsView";
import KnowledgeEntryView from "@/components/views/KnowledgeEntryView";
import KnowledgeSummaryView from "@/components/views/KnowledgeSummaryView";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MODULE_SCORES } from "@/config/exam";
import { PersonalBestView } from "@/components/views/PersonalBestView";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { OverviewView } from "@/components/views/OverviewView";
import { ChartsView } from "@/components/views/ChartsView";
import { HistoryView } from "@/components/views/HistoryView";
import { NewRecordView } from "@/components/views/NewRecordView";
import { KnowledgeEntryTabView } from "@/components/views/KnowledgeEntryTabView";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import PlanListView from "@/components/views/PlanListView";
import PlanDetailView from "@/components/views/PlanDetailView";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { usePlanProgress } from "@/hooks/usePlanProgress";
import { MODULES as MODULES_CONFIG } from "@/config/exam";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { Home as HomeIcon, BarChart2, BookOpen, ClipboardList, Settings, Target } from "lucide-react";


// 定义刷题记录类型
type RecordItem = {
  id: number;
  date: string;
  module: string;
  total: number;
  correct: number;
  duration: string;
  // 可根据需要扩展字段
};
// 计划类型
type PlanType = "题量" | "正确率" | "错题数";
interface StudyPlan {
  id: string;
  name: string;
  module: string; // 板块
  type: PlanType;
  startDate: string;
  endDate: string;
  target: number; // 目标值（题量/正确率/错题数）
  progress: number; // 当前进度（自动计算）
  status: "未开始" | "进行中" | "已完成" | "未达成";
  description?: string;
}

// 统计计划进度
function calcPlanProgress(plan: StudyPlan, records: RecordItem[]): { progress: number; status: StudyPlan["status"] } {
  // 只统计在计划时间范围内、指定板块的记录
  const start = new Date(plan.startDate).getTime();
  const end = new Date(plan.endDate).getTime();
  const filtered = records.filter(r => {
    const t = new Date(r.date).getTime();
    return r.module === plan.module && t >= start && t <= end;
  });
  if (plan.type === "题量") {
    const total = filtered.reduce((sum, r) => sum + (r.total || 0), 0);
    let status: StudyPlan["status"] = "进行中";
    if (filtered.length === 0) status = "未开始";
    else if (total >= plan.target) status = "已完成";
    else if (new Date().getTime() > end) status = "未达成";
    return { progress: total, status };
  } else if (plan.type === "正确率") {
    const totalQ = filtered.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalC = filtered.reduce((sum, r) => sum + (r.correct || 0), 0);
    const rate = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
    let status: StudyPlan["status"] = "进行中";
    if (filtered.length === 0) status = "未开始";
    else if (rate >= plan.target) status = "已完成";
    else if (new Date().getTime() > end) status = "未达成";
    return { progress: rate, status };
  } else if (plan.type === "错题数") {
    const wrong = filtered.reduce((sum, r) => sum + ((r.total || 0) - (r.correct || 0)), 0);
    let status: StudyPlan["status"] = "进行中";
    if (filtered.length === 0) status = "未开始";
    else if (wrong <= plan.target) status = "已完成";
    else if (new Date().getTime() > end) status = "未达成";
    return { progress: wrong, status };
  }
  return { progress: 0, status: "未开始" };
}

export const NavModeContext = createContext<'sidebar' | 'dock'>("sidebar");

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview'); // 默认显示'数据概览'
  const [records, setRecords] = useLocalStorageState<RecordItem[]>("exam-tracker-records-v2", []);
  const [knowledge, setKnowledge] = useLocalStorageState<any[]>("exam-tracker-knowledge-v2", []);

  // 新增知识点添加函数
  const addKnowledge = (newKnowledge: any) => {
    setKnowledge(prev => [{ ...newKnowledge, id: Date.now().toString() + Math.random().toString(16).slice(2) }, ...prev]);
  };

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const { notify } = useNotification();

  const addRecord = (newRecord: RecordItem) => {
    setRecords(prevRecords => [newRecord, ...prevRecords]);
    notify({ type: "success", message: "记录已保存", description: `模块 \"${newRecord.module}\" 的新记录已添加。` });
  };

  const deleteRecord = (idToDelete: number) => {
    setRecords(prevRecords => prevRecords.filter(record => record.id !== idToDelete));
  };

  const handleClearAllData = () => {
    setRecords([]);
    setKnowledge([]);
    notify({ type: "success", message: "操作成功", description: "您的所有应用数据已被清空。" });
  };

  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);

  const handleBatchDelete = () => {
    setRecords(prev => prev.filter(r => !selectedRecordIds.includes(r.id)));
    setSelectedRecordIds([]);
    notify({ type: "success", message: "批量删除成功", description: `已删除 ${selectedRecordIds.length} 条记录。` });
  };

  // 导出数据到 JSON 文件（支持知识点）
  const handleExportData = () => {
    const exportData = {
      records,
      knowledge,
      exportedAt: new Date().toISOString(),
      version: 2,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam-tracker-backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify({ type: "success", message: "导出成功", description: "您的所有数据（包括知识点）已成功导出到本地JSON文件。" });
  };

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ records: any[], knowledge: any[] }>();

  // 从 JSON 文件导入数据（支持知识点）
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fileContent = event.target?.result as string;
          try {
            const importedObject = JSON.parse(fileContent);
            // 兼容多种结构
            let importedRecords: any[] = [];
            let importedKnowledge: any[] = [];
            if (Array.isArray(importedObject)) {
              importedRecords = importedObject;
            } else if (importedObject && importedObject.records) {
              importedRecords = importedObject.records;
              if (Array.isArray(importedObject.knowledge)) {
                importedKnowledge = importedObject.knowledge;
              }
            } else if (importedObject && importedObject.data && Array.isArray(importedObject.data.records)) {
              importedRecords = importedObject.data.records;
            } else {
              alert('导入的文件格式不正确！');
              return;
            }
            // 建立中英文模块映射
            const moduleMap: Record<string, string> = {
              '资料分析': 'data-analysis',
              '政治理论': 'politics',
              '数量关系': 'math',
              '常识判断': 'common',
              '言语理解': 'verbal',
              '判断推理': 'logic',
              'data-analysis': 'data-analysis',
              'politics': 'politics',
              'math': 'math',
              'common': 'common',
              'verbal': 'verbal',
              'logic': 'logic',
            };
            function normalizeDate(date: any) {
              if (!date) return '';
              if (typeof date === 'string' && /^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) return date;
              const d = new Date(date);
              if (!isNaN(d.getTime())) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
              }
              return '';
            }
            const normalizedRecords = importedRecords.map((r: any) => ({
              id: r.id ?? Date.now() + Math.random(),
              date: normalizeDate(r.date),
              module: moduleMap[r.module] ?? r.module,
              total: r.total ?? r.totalCount ?? 0,
              correct: r.correct ?? r.correctCount ?? 0,
              duration: r.duration !== undefined ? (typeof r.duration === 'number' ? Number(r.duration.toFixed(1)).toString() : r.duration) : '',
            }));
            // 补全知识点id，保证id为字符串且唯一
            const normalizedKnowledge = importedKnowledge.map((k: any) => {
              let id = k.id;
              if (!id || typeof id !== 'string') {
                id = Date.now().toString() + Math.random().toString(16).slice(2);
              }
              return { ...k, id };
            });
            setPendingImport({ records: normalizedRecords, knowledge: normalizedKnowledge });
            setImportDialogOpen(true);
          } catch (err) {
            alert('导入失败，文件内容不是有效的 JSON！');
          }
        } catch (err) {
          alert('导入失败，文件内容不是有效的 JSON！');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const [chartModuleFilter, setChartModuleFilter] = useState<string>('全部');

  // 按日期降序排序
  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // 历史记录分页
  const [historyPage, setHistoryPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [exportFormat, setExportFormat] = useState("json");
  const handleSaveSettings = () => {
    notify({ type: "success", message: "设置已保存" });
    // 可在此处将设置同步到 localStorage 或后端
  };
  const totalPages = Math.ceil(sortedRecords.length / pageSize);
  const pagedRecords = sortedRecords.slice((historyPage - 1) * pageSize, historyPage * pageSize);

  const handleBatchDeleteKnowledge = (ids: string[]) => {
    setKnowledge(prev => prev.filter(item => item.id && !ids.includes(item.id)));
  };

  // 学习计划相关状态
  const [plans, setPlans] = useState<StudyPlan[]>([]); // Plan[]
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  // 新建/编辑/删除计划
  const handleCreatePlan = (plan: any) => setPlans(prev => [plan, ...prev]);
  const handleUpdatePlan = (plan: any) => setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
  const handleDeletePlan = (id: string) => setPlans(prev => prev.filter(p => p.id !== id));

  // 进入详情
  const handleShowDetail = (id: string) => setActivePlanId(id);
  // 返回列表
  const handleBackToList = () => setActivePlanId(null);

  // plans和records变化时自动统计进度
  usePlanProgress(plans, setPlans, records, calcPlanProgress);

  // 英文key转中文
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

  const [navMode, setNavMode] = useLocalStorageState<'sidebar' | 'dock'>("exam-tracker-nav-mode", "sidebar");
  if (!isClient) return null;
  // Dock 一级导航配置
  const dockNavs = [
    { key: 'overview', icon: <BarChart2 />, label: '数据概览' },
    { key: 'charts', icon: <BarChart2 />, label: '数据图表' },
    { key: 'history', icon: <ClipboardList />, label: '历史记录' },
    { key: 'knowledge-entry', icon: <BookOpen />, label: '知识点录入' },
    { key: 'settings-basic', icon: <Settings />, label: '设置' },
  ];
  return (
    <NavModeContext.Provider value={navMode}>
      <div className="flex min-h-screen">
        {/* 左侧侧边栏或底部Dock，宽度固定 */}
        {navMode === 'sidebar' ? (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        ) : (
          <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center bg-transparent">
            <Dock>
              {dockNavs.map(nav => (
                <DockIcon
                  key={nav.key}
                  onClick={() => setActiveTab(nav.key)}
                  className="pointer-events-auto"
                  title={nav.label}
                >
                  {nav.icon}
                </DockIcon>
              ))}
            </Dock>
          </div>
        )}
        {/* 右侧主内容区，占据剩余空间 */}
        <div className="flex-1 p-8 bg-white dark:bg-gray-950 dark:text-gray-100">
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
                      onUpdate={handleUpdatePlan}
                    />
                  })()
                )
                : (
                  <PlanListView
                    plans={plans}
                    onCreate={handleCreatePlan}
                    onUpdate={handleUpdatePlan}
                    onDelete={handleDeletePlan}
                    onShowDetail={handleShowDetail}
                  />
                )
              }
            </div>
          )}
          {activeTab === 'progress' && <div><h1 className="text-3xl font-bold mb-4">进度追踪</h1></div>}
          {activeTab === 'settings-basic' && (
            <div>
              <h1 className="text-3xl font-bold mb-4">基础设置</h1>
              <SettingsView
                onExport={handleExportData}
                onImport={handleImportData}
                onClearAllData={handleClearAllData}
                pageSize={pageSize}
                setPageSize={setPageSize}
                exportFormat={exportFormat}
                setExportFormat={setExportFormat}
                onSaveSettings={handleSaveSettings}
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
                setPageSize={setPageSize}
                exportFormat={exportFormat}
                setExportFormat={setExportFormat}
                onSaveSettings={handleSaveSettings}
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
