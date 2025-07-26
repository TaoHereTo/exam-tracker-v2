import { useState } from "react";
import { useNotification } from "@/components/magicui/NotificationProvider";
import type { RecordItem, KnowledgeItem, StudyPlan } from "@/types/record";
import { format } from 'date-fns';
import { normalizeModuleName } from "@/config/exam";

export function useImportExport(
    records: RecordItem[],
    setRecords: (r: RecordItem[]) => void,
    knowledge: KnowledgeItem[],
    setKnowledge: (k: KnowledgeItem[]) => void,
    plans?: StudyPlan[],
    setPlans?: (p: StudyPlan[]) => void
) {
    const { notify } = useNotification();
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    type ImportStats = { total: number; added: number; repeated: number };
    type PendingImport = {
        records: RecordItem[];
        knowledge: KnowledgeItem[];
        plans?: StudyPlan[];
        settings?: Record<string, string>;
        importStats?: ImportStats;
    };
    const [pendingImport, setPendingImport] = useState<PendingImport>();

    // 获取所有相关设置
    function getAllSettings() {
        const keys = [
            'exam-tracker-nav-mode',
            'eye-care-enabled',
            'notify-change-enabled',
            'page-size',
            'theme',
        ];
        const settings: Record<string, string> = {};
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) settings[key] = value;
        });
        return settings;
    }
    // 写入所有相关设置
    function setAllSettings(settings: Record<string, string>) {
        if (!settings) return;
        Object.entries(settings).forEach(([key, value]) => {
            if (typeof value === 'string') {
                localStorage.setItem(key, value);
            }
        });
    }

    // 导出数据到 JSON 文件（支持知识点、学习计划、设置）
    const handleExportData = () => {
        const exportData = {
            records,
            knowledge,
            plans: plans || [],
            settings: getAllSettings(),
            exportedAt: new Date().toISOString(),
            version: 3,
        };
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const today = format(new Date(), 'yyyy-MM-dd');
        a.href = url;
        a.download = `行测记录_${today}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        notify({ type: "success", message: "导出成功", description: "您的所有数据（包括知识点、学习计划、设置）已成功导出到本地JSON文件。" });
    };

    // 从 JSON 文件导入数据（支持知识点、学习计划、设置）
    const handleImportData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const fileContent = event.target?.result as string;
                    try {
                        const importedObject = JSON.parse(fileContent);
                        // 兼容多种结构
                        let importedRecords: RecordItem[] = [];
                        let importedKnowledge: KnowledgeItem[] = [];
                        let importedPlans: StudyPlan[] = [];
                        let importedSettings: Record<string, string> = {};
                        if (Array.isArray(importedObject)) {
                            importedRecords = importedObject;
                        } else if (importedObject && importedObject.records) {
                            importedRecords = importedObject.records;
                            if (Array.isArray(importedObject.knowledge)) {
                                importedKnowledge = importedObject.knowledge;
                            }
                            if (Array.isArray(importedObject.plans)) {
                                importedPlans = importedObject.plans;
                            }
                            if (importedObject.settings && typeof importedObject.settings === 'object') {
                                importedSettings = importedObject.settings;
                            }
                        } else if (importedObject && importedObject.data && Array.isArray(importedObject.data.records)) {
                            importedRecords = importedObject.data.records;
                        } else {
                            alert('导入的文件格式不正确！');
                            return;
                        }
                        // 使用统一的模块名称映射
                        function normalizeDate(date: unknown) {
                            if (!date) return '';
                            if (typeof date === 'string' && /^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) return date;
                            if (typeof date === 'string' || typeof date === 'number' || date instanceof Date) {
                                const d = new Date(date);
                                if (!isNaN(d.getTime())) {
                                    const y = d.getFullYear();
                                    const m = String(d.getMonth() + 1).padStart(2, '0');
                                    const day = String(d.getDate()).padStart(2, '0');
                                    return `${y}-${m}-${day}`;
                                }
                            }
                            return '';
                        }
                        const normalizedRecords = importedRecords.map((r: RecordItem | (Record<string, unknown> & { totalCount?: number; correctCount?: number })) => {
                            const total = 'total' in r ? r.total : ('totalCount' in r ? (r as { totalCount?: number }).totalCount ?? 0 : 0);
                            const correct = 'correct' in r ? r.correct : ('correctCount' in r ? (r as { correctCount?: number }).correctCount ?? 0 : 0);
                            return {
                                id: typeof r.id === 'number' ? r.id : Date.now() + Math.floor(Math.random() * 10000),
                                date: normalizeDate(r.date),
                                module: normalizeModuleName(String((r as Record<string, unknown>).module)),
                                total: typeof total === 'number' ? total : Number(total) || 0,
                                correct: typeof correct === 'number' ? correct : Number(correct) || 0,
                                duration: r.duration !== undefined ? (typeof r.duration === 'number' ? Number(r.duration).toString() : String(r.duration)) : '',
                            };
                        });
                        // 补全知识点id，保证id为字符串且唯一，只保留有module字段的知识点
                        function hasModuleField(k: unknown): k is KnowledgeItem {
                            return typeof k === 'object' && k !== null && 'module' in k && typeof (k as KnowledgeItem).module === 'string' && (k as KnowledgeItem).module.length > 0;
                        }
                        const normalizedKnowledge = importedKnowledge
                            .filter(hasModuleField)
                            .map((k: KnowledgeItem) => {
                                let id = k.id;
                                if (!id || typeof id !== 'string') {
                                    id = Date.now().toString() + Math.random().toString(16).slice(2);
                                }
                                return { ...k, id };
                            });
                        // plans 不做特殊处理，直接导入
                        if (setPlans && Array.isArray(importedPlans)) {
                            setPlans(importedPlans);
                        }
                        // 现有数据去重 key
                        function recordKey(r: RecordItem) {
                            return `${r.date}__${r.module}__${r.total}__${r.correct}__${r.duration}`;
                        }
                        const existingKeys = new Set(records.map(recordKey));
                        const importKeys = new Set<string>();
                        const dedupedRecords: RecordItem[] = [];
                        let repeatCount = 0;
                        normalizedRecords.forEach(r => {
                            const key = recordKey(r);
                            if (existingKeys.has(key)) {
                                repeatCount++;
                                return; // 跳过与现有数据重复的
                            }
                            if (!importKeys.has(key)) {
                                dedupedRecords.push(r);
                                importKeys.add(key);
                            } else {
                                repeatCount++;
                            }
                        });
                        // settings 写入 localStorage
                        setAllSettings(importedSettings);
                        setPendingImport({
                            records: [...records, ...dedupedRecords],
                            knowledge: normalizedKnowledge,
                            plans: importedPlans,
                            settings: importedSettings,
                            importStats: {
                                total: normalizedRecords.length,
                                added: dedupedRecords.length,
                                repeated: repeatCount
                            }
                        });
                        setImportDialogOpen(true);
                        // 不再此处 notify
                    } catch {
                        alert('导入失败，文件内容不是有效的 JSON！');
                    }
                } catch {
                    alert('导入失败，文件内容不是有效的 JSON！');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return {
        handleExportData,
        handleImportData,
        importDialogOpen,
        setImportDialogOpen,
        pendingImport,
        setPendingImport,
    };
} 