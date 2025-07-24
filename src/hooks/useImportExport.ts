import { useState } from "react";
import { useNotification } from "@/components/magicui/NotificationProvider";
import type { RecordItem, KnowledgeItem } from "@/types/record";

export function useImportExport(
    records: RecordItem[],
    setRecords: (r: RecordItem[]) => void,
    knowledge: KnowledgeItem[],
    setKnowledge: (k: KnowledgeItem[]) => void,
    plans?: any[],
    setPlans?: (p: any[]) => void
) {
    const { notify } = useNotification();
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [pendingImport, setPendingImport] = useState<{ records: RecordItem[]; knowledge: KnowledgeItem[]; plans?: any[]; settings?: Record<string, any> }>();

    // 获取所有相关设置
    function getAllSettings() {
        const keys = [
            'exam-tracker-nav-mode',
            'eye-care-enabled',
            'notify-change-enabled',
            'page-size',
            'theme',
        ];
        const settings: Record<string, any> = {};
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) settings[key] = value;
        });
        return settings;
    }
    // 写入所有相关设置
    function setAllSettings(settings: Record<string, any>) {
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
        a.href = url;
        a.download = 'exam-tracker-backup.json';
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
        input.onchange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files[0];
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
                        let importedPlans: any[] = [];
                        let importedSettings: Record<string, any> = {};
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
                        function normalizeDate(date: unknown) {
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
                        const normalizedRecords = importedRecords.map((r: RecordItem) => ({
                            id: r.id ?? Date.now() + Math.random(),
                            date: normalizeDate(r.date),
                            module: moduleMap[r.module] ?? r.module,
                            total: r.total ?? r.totalCount ?? 0,
                            correct: r.correct ?? r.correctCount ?? 0,
                            duration: r.duration !== undefined ? (typeof r.duration === 'number' ? Number(r.duration.toFixed(1)).toString() : r.duration) : '',
                        }));
                        // 补全知识点id，保证id为字符串且唯一
                        const normalizedKnowledge = importedKnowledge.map((k: KnowledgeItem) => {
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
                        // settings 写入 localStorage
                        setAllSettings(importedSettings);
                        setPendingImport({ records: normalizedRecords, knowledge: normalizedKnowledge, plans: importedPlans, settings: importedSettings });
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

    return {
        handleExportData,
        handleImportData,
        importDialogOpen,
        setImportDialogOpen,
        pendingImport,
        setPendingImport,
    };
} 