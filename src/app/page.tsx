"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { NewRecordForm } from "@/components/forms/NewRecordForm";
import { HistoryTable } from "@/components/tables/HistoryTable";
import { TrendChart } from "@/components/charts/TrendChart";
import { SettingsView } from "@/components/views/SettingsView";
import KnowledgeEntryView from "@/components/views/KnowledgeEntryView";
import KnowledgeSummaryView from "@/components/views/KnowledgeSummaryView";
import { toast } from "sonner";
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

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview'); // 默认显示'数据概览'
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
  const [records, setRecords] = useState<RecordItem[]>([]);

  // 新增知识点状态
  const [knowledge, setKnowledge] = useState<any[]>([]);

  // 新增知识点添加函数
  const addKnowledge = (newKnowledge: any) => {
    setKnowledge(prev => [newKnowledge, ...prev]);
  };

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  // 当组件第一次加载时，尝试从 localStorage 读取数据
  useEffect(() => {
    const savedRecords = localStorage.getItem('exam-tracker-records-v2');
    if (savedRecords) {
      const parsed: any[] = JSON.parse(savedRecords);
      // 兼容旧数据，补全 id 字段
      setRecords(parsed.map(r => ({ id: r.id ?? Date.now() + Math.random(), ...r })));
    }
  }, []);
  // 当 records 状态发生变化时，自动将其保存到 localStorage
  useEffect(() => {
    localStorage.setItem('exam-tracker-records-v2', JSON.stringify(records));
  }, [records]);

  // 当组件第一次加载时，尝试从 localStorage 读取知识点
  useEffect(() => {
    const savedKnowledge = localStorage.getItem('exam-tracker-knowledge-v2');
    if (savedKnowledge) {
      setKnowledge(JSON.parse(savedKnowledge));
    }
  }, []);
  // 当 knowledge 状态发生变化时，自动将其保存到 localStorage
  useEffect(() => {
    localStorage.setItem('exam-tracker-knowledge-v2', JSON.stringify(knowledge));
  }, [knowledge]);

  const addRecord = (newRecord: RecordItem) => {
    setRecords(prevRecords => [newRecord, ...prevRecords]);
    toast.success("记录已保存", {
      description: `模块 "${newRecord.module}" 的新记录已添加。`,
    });
  };

  const deleteRecord = (idToDelete: number) => {
    setRecords(prevRecords => prevRecords.filter(record => record.id !== idToDelete));
  };

  const handleClearAllData = () => {
    setRecords([]);
    setKnowledge([]);
    toast.success("操作成功", {
      description: "您的所有应用数据已被清空。",
    });
  };

  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);

  const handleBatchDelete = () => {
    setRecords(prev => prev.filter(r => !selectedRecordIds.includes(r.id)));
    setSelectedRecordIds([]);
    toast.success("批量删除成功", { description: `已删除 ${selectedRecordIds.length} 条记录。` });
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
    toast.success("导出成功", {
      description: "您的所有数据（包括知识点）已成功导出到本地JSON文件。",
    });
  };

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
            // 标准化刷题记录
            const normalizedRecords = importedRecords.map((r: any) => ({
              id: r.id ?? Date.now() + Math.random(),
              date: r.date,
              module: r.module,
              total: r.total ?? r.totalCount ?? 0,
              correct: r.correct ?? r.correctCount ?? 0,
              duration: r.duration !== undefined ? (typeof r.duration === 'number' ? Number(r.duration.toFixed(1)).toString() : r.duration) : '',
            }));
            setRecords(normalizedRecords);
            // 标准化知识点（直接存储各模块原始结构，便于表格展示）
            if (importedKnowledge.length > 0) {
              setKnowledge(importedKnowledge);
            }
            toast.success("导入成功", {
              description: `成功导入 ${normalizedRecords.length} 条刷题记录${importedKnowledge.length > 0 ? `，${importedKnowledge.length} 条知识点` : ''}！`,
            });
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
    toast.success("设置已保存");
    // 可在此处将设置同步到 localStorage 或后端
  };
  const totalPages = Math.ceil(sortedRecords.length / pageSize);
  const pagedRecords = sortedRecords.slice((historyPage - 1) * pageSize, historyPage * pageSize);

  return (
    <div className="flex min-h-screen">
      {/* 左侧侧边栏，宽度固定 */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* 右侧主内容区，占据剩余空间 */}
      <div className="flex-1 p-8 bg-white dark:bg-gray-950 dark:text-gray-100">
        {activeTab === 'overview' && isClient && <OverviewView records={sortedRecords} />}
        {activeTab === 'charts' && (
          <ChartsView
            records={records}
            chartModuleFilter={chartModuleFilter}
            setChartModuleFilter={setChartModuleFilter}
          />
        )}
        {activeTab === 'best' && (
          <div>
            <h1 className="text-3xl font-bold mb-4">最佳成绩</h1>
            <PersonalBestView records={records.map(r => ({ ...r, module: r.module as keyof typeof MODULE_SCORES }))} />
          </div>
        )}
        {activeTab === 'modules' && <div><h1 className="text-3xl font-bold mb-4">知识点汇总</h1><KnowledgeSummaryView knowledge={knowledge} /></div>}
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
        {activeTab === 'plan' && <div><h1 className="text-3xl font-bold mb-4">制定计划</h1></div>}
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
            />
          </div>
        )}
        {activeTab === 'knowledge-entry' && <KnowledgeEntryTabView onAddKnowledge={addKnowledge} />}
      </div>
    </div>
  );
}
