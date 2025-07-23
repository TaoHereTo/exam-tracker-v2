import { useState } from "react";
import { useNotification } from "@/components/magicui/NotificationProvider";

export function useImportExport(records: any[], setRecords: (r: any[]) => void, knowledge: any[], setKnowledge: (k: any[]) => void) {
    const { notify } = useNotification();
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [pendingImport, setPendingImport] = useState<{ records: any[], knowledge: any[] }>();

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

    return {
        handleExportData,
        handleImportData,
        importDialogOpen,
        setImportDialogOpen,
        pendingImport,
        setPendingImport,
    };
} 