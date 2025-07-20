"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { NewRecordForm } from "@/components/forms/NewRecordForm";
import { HistoryTable } from "@/components/tables/HistoryTable";
import { TrendChart } from "@/components/charts/TrendChart";
import { SettingsView } from "@/components/views/SettingsView";

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

  const addRecord = (newRecord: RecordItem) => {
    setRecords(prevRecords => [newRecord, ...prevRecords]);
  };

  const deleteRecord = (idToDelete: number) => {
    setRecords(prevRecords => prevRecords.filter(record => record.id !== idToDelete));
  };

  // 导出数据到 JSON 文件
  const handleExportData = () => {
    const json = JSON.stringify(records, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'records-backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 从 JSON 文件导入数据（新版，兼容旧结构）
  const handleImportData = () => {
    // 1. 创建一个隐藏的文件输入框
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json'; // 只允许选择JSON文件
    // 2. 当用户选择文件后，触发此事件
    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) {
        return; // 用户取消了选择
      }
      const reader = new FileReader();
      // 3. 文件读取成功后
      reader.onload = (e) => {
        try {
          const fileContent = e.target?.result as string;
          const importedObject = JSON.parse(fileContent);
          // 4. 核心逻辑：检查文件结构，找到真正的记录数组
          // 检查是否存在 data.records 并且它是一个数组
          if (importedObject && importedObject.data && Array.isArray(importedObject.data.records)) {
            const recordsToImport = importedObject.data.records.map((r: any) => ({
              id: r.id ?? Date.now() + Math.random(),
              date: r.date,
              module: r.module,
              total: r.total ?? r.totalCount ?? 0,
              correct: r.correct ?? r.correctCount ?? 0,
              duration: r.duration !== undefined ? (typeof r.duration === 'number' ? Number(r.duration.toFixed(1)).toString() : r.duration) : '',
            }));
            setRecords(recordsToImport);
            alert(`成功导入 ${recordsToImport.length} 条刷题记录！`);
          } else {
            // 如果文件结构不认识，则提示错误
            alert('错误：无法识别的文件格式。请确保您选择的是正确的备份文件。');
          }
        } catch (error: any) {
          // 如果JSON解析失败，提示错误
          console.error("导入失败:", error);
          alert(`导入失败：文件解析错误。请检查文件是否损坏。\n错误信息: ${error.message}`);
        }
      };
      // 5. 读取文件内容
      reader.readAsText(file);
    };
    // 6. 模拟点击，弹出文件选择窗口
    fileInput.click();
  };

  return (
    <div className="flex min-h-screen">
      {/* 左侧侧边栏，宽度固定 */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* 右侧主内容区，占据剩余空间 */}
      <div className="flex-1 p-8 bg-white">
        {activeTab === 'overview' && (
          <div>
            <h1 className="text-3xl font-bold mb-4">数据趋势图</h1>
            <div style={{ height: '400px' }}>
              <TrendChart data={records.map(r => ({
                date: r.date,
                module: r.module,
                score: r.total ? Math.round((r.correct / r.total) * 100) : 0,
                duration: typeof r.duration === 'string' ? parseFloat(r.duration) || 0 : r.duration,
              }))} />
            </div>
          </div>
        )}
        {activeTab === 'charts' && <div><h1>数据图表</h1></div>}
        {activeTab === 'best' && <div><h1>最佳成绩</h1></div>}
        {activeTab === 'modules' && <div><h1>模块知识点</h1></div>}
        {activeTab === 'form' && <NewRecordForm onAddRecord={addRecord} />}
        {activeTab === 'history' && <HistoryTable records={records} onDeleteRecord={deleteRecord} />}
        {activeTab === 'plan' && <div><h1>制定计划</h1></div>}
        {activeTab === 'progress' && <div><h1>进度追踪</h1></div>}
        {activeTab === 'settings-basic' && <SettingsView onExport={handleExportData} onImport={handleImportData} />}
        {activeTab === 'settings-advanced' && <div><h1>高级设置</h1></div>}
      </div>
    </div>
  );
}
