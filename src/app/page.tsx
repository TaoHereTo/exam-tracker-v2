"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { NewRecordForm } from "@/components/forms/NewRecordForm";
import { HistoryTable } from "@/components/tables/HistoryTable";
import { TrendChart } from "@/components/charts/TrendChart";

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
              <TrendChart records={records} />
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
        {activeTab === 'settings-basic' && <div><h1>基础设置</h1></div>}
        {activeTab === 'settings-advanced' && <div><h1>高级设置</h1></div>}
      </div>
    </div>
  );
}
