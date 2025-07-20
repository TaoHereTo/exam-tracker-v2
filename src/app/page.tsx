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
    toast.success("导出成功", {
      description: "您的所有数据已成功导出到本地JSON文件。",
    });
  };

  // 从 JSON 文件导入数据
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
            // 兼容两种结构：数组 或 { data: { records: [...] } }
            let recordsToImport: any[] = [];
            if (Array.isArray(importedObject)) {
              recordsToImport = importedObject;
            } else if (importedObject && importedObject.data && Array.isArray(importedObject.data.records)) {
              recordsToImport = importedObject.data.records;
            } else {
              alert('导入的文件格式不正确！');
              return;
            }
            // 标准化字段
            const normalized = recordsToImport.map((r: any) => ({
              id: r.id ?? Date.now() + Math.random(),
              date: r.date,
              module: r.module,
              total: r.total ?? r.totalCount ?? 0,
              correct: r.correct ?? r.correctCount ?? 0,
              duration: r.duration !== undefined ? (typeof r.duration === 'number' ? Number(r.duration.toFixed(1)).toString() : r.duration) : '',
            }));
            setRecords(normalized);
            toast.success("导入成功", {
              description: `成功导入 ${normalized.length} 条刷题记录！`,
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

  return (
    <div className="flex min-h-screen">
      {/* 左侧侧边栏，宽度固定 */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* 右侧主内容区，占据剩余空间 */}
      <div className="flex-1 p-8 bg-white">
        {activeTab === 'overview' && (
          <div>
            <h1 className="text-3xl font-bold mb-4">数据概览</h1>
          </div>
        )}
        {activeTab === 'charts' && (
          <div>
            <h1 className="text-3xl font-bold mb-4">数据图表</h1>
            <div className="mb-4 flex justify-end">
              <Select value={chartModuleFilter} onValueChange={setChartModuleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="筛选模块" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部模块</SelectItem>
                  <SelectItem value="政治理论">政治理论</SelectItem>
                  <SelectItem value="常识判断">常识判断</SelectItem>
                  <SelectItem value="言语理解">言语理解</SelectItem>
                  <SelectItem value="判断推理">判断推理</SelectItem>
                  <SelectItem value="数量关系">数量关系</SelectItem>
                  <SelectItem value="资料分析">资料分析</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Tabs defaultValue="perMinute" className="w-full max-w-5xl mx-auto mb-6">
              <TabsList className="w-full justify-center mb-4">
                <TabsTrigger value="perMinute">每分钟得分</TabsTrigger>
                <TabsTrigger value="accuracy">正确率</TabsTrigger>
              </TabsList>
              <TabsContent value="perMinute">
                <div style={{ height: '500px' }}>
                  {/* 按模块和日期统计每分钟得分 */}
                  {(() => {
                    const moduleScoreMap: Record<string, number> = {
                      '政治理论': 0.7,
                      '常识判断': 0.8,
                      '言语理解': 0.8,
                      '判断推理': 0.8,
                      '数量关系': 0.8,
                      '资料分析': 0.7,
                    };
                    const groupMap: Record<string, { date: string; module: string; correct: number; duration: number }> = {};
                    records.forEach(r => {
                      if (chartModuleFilter !== '全部' && r.module !== chartModuleFilter) return;
                      const key = `${r.date}__${r.module}`;
                      const correct = Number(r.correct) || 0;
                      const duration = typeof r.duration === 'string' ? parseFloat(r.duration) || 0 : r.duration;
                      if (!groupMap[key]) {
                        groupMap[key] = { date: r.date, module: r.module, correct: 0, duration: 0 };
                      }
                      groupMap[key].correct += correct;
                      groupMap[key].duration += duration;
                    });
                    const chartData = Object.values(groupMap).map(item => ({
                      date: item.date,
                      module: item.module,
                      score: item.duration > 0 ? (moduleScoreMap[item.module] || 1) * item.correct / item.duration : 0,
                      duration: item.duration,
                    }));
                    return <TrendChart data={chartData} />;
                  })()}
                </div>
              </TabsContent>
              <TabsContent value="accuracy">
                <div style={{ height: '500px' }}>
                  {/* 按模块和日期统计正确率 */}
                  {(() => {
                    const groupMap: Record<string, { date: string; module: string; correct: number; total: number }> = {};
                    records.forEach(r => {
                      if (chartModuleFilter !== '全部' && r.module !== chartModuleFilter) return;
                      const key = `${r.date}__${r.module}`;
                      const correct = Number(r.correct) || 0;
                      const total = Number(r.total) || 0;
                      if (!groupMap[key]) {
                        groupMap[key] = { date: r.date, module: r.module, correct: 0, total: 0 };
                      }
                      groupMap[key].correct += correct;
                      groupMap[key].total += total;
                    });
                    const chartData = Object.values(groupMap).map(item => ({
                      date: item.date,
                      module: item.module,
                      score: item.total > 0 ? (item.correct / item.total) * 100 : 0,
                      duration: 0,
                    }));
                    return <TrendChart data={chartData} />;
                  })()}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        {activeTab === 'best' && (
          <div>
            <h1 className="text-3xl font-bold mb-4">最佳成绩</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'politics', label: '政治理论' },
                { key: 'common', label: '常识判断' },
                { key: 'logic', label: '判断推理' },
                { key: 'verbal', label: '言语理解' },
                { key: 'math', label: '数量关系' },
                { key: 'data-analysis', label: '资料分析' },
              ].map(module => {
                // 过滤出该模块的所有记录
                const moduleRecords = records.filter(r => r.module === module.label);
                // 计算每分钟得分（模块分值*正确数/用时），并找出最高的
                const moduleScoreMap: Record<string, number> = {
                  '政治理论': 0.7,
                  '常识判断': 0.8,
                  '言语理解': 0.8,
                  '判断推理': 0.8,
                  '数量关系': 0.8,
                  '资料分析': 0.7,
                };
                const best = moduleRecords.reduce<{ record: RecordItem; perMinute: number } | null>((acc, cur) => {
                  const duration = parseFloat(cur.duration) || 0;
                  const perMinute = duration > 0 ? (moduleScoreMap[cur.module] || 1) * cur.correct / duration : 0;
                  if (!acc || perMinute > acc.perMinute) {
                    return { record: cur, perMinute };
                  }
                  return acc;
                }, null);
                return (
                  <Card key={module.key} className="shadow-md">
                    <CardHeader>
                      <CardTitle>{module.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {best ? (
                        <div>
                          <div className="text-2xl font-bold mb-2">{best.perMinute.toFixed(2)} 分/分钟</div>
                          <div className="text-sm text-gray-500">日期：{best.record.date}</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">暂无记录</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        {activeTab === 'modules' && <div><h1 className="text-3xl font-bold mb-4">知识点汇总</h1><KnowledgeSummaryView knowledge={knowledge} /></div>}
        {activeTab === 'form' && <div><h1 className="text-3xl font-bold mb-4">新增刷题记录</h1><NewRecordForm onAddRecord={addRecord} /></div>}
        {activeTab === 'history' && (
          <div>
            <h1 className="text-3xl font-bold mb-4">历史记录</h1>
            <HistoryTable
              records={records}
              selectedIds={selectedRecordIds}
              onSelectIds={setSelectedRecordIds}
              onDeleteRecord={deleteRecord}
              onBatchDelete={handleBatchDelete}
            />
          </div>
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
            />
          </div>
        )}
        {activeTab === 'settings-advanced' && <div><h1 className="text-3xl font-bold mb-4">高级设置</h1></div>}
        {activeTab === 'knowledge-entry' && <div><h1 className="text-3xl font-bold mb-4">知识点录入</h1><KnowledgeEntryView onAddKnowledge={addKnowledge} /></div>}
      </div>
    </div>
  );
}
