import { useState } from "react";
import { useNotification } from "@/components/magicui/NotificationProvider";
import type {
    RecordItem,
    KnowledgeItem,
    StudyPlan,
    ExamCountdown,
    PendingImport,
    UserSettings,
    CloudImageInfo,
    ExportData
} from "@/types/record";
import { format } from 'date-fns';
import { normalizeModuleName } from "@/config/exam";
import { supabaseImageManager } from "@/lib/supabaseImageManager";
import { generateUUID } from "@/lib/utils";

export function useImportExport(
    records: RecordItem[],
    setRecords: (r: RecordItem[]) => void,
    knowledge: KnowledgeItem[],
    setKnowledge: (k: KnowledgeItem[]) => void,
    plans?: StudyPlan[],
    setPlans?: (p: StudyPlan[]) => void,
    countdowns?: ExamCountdown[],
    setCountdowns?: (c: ExamCountdown[]) => void
) {
    const { notify } = useNotification();
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [pendingImport, setPendingImport] = useState<PendingImport>();

    // 获取所有相关设置
    function getAllSettings(): UserSettings {
        const keys = [
            'exam-tracker-nav-mode',
            'eye-care-enabled',
            'notify-change-enabled',
            'page-size',
            'theme',
            'theme-switch-type',
            'other-switch-type',
        ];
        const settings: UserSettings = {};
        keys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                if (value !== null) settings[key] = value;
            } catch (error) {
                // 忽略错误
            }
        });
        return settings;
    }

    // 写入所有相关设置
    function setAllSettings(settings: UserSettings) {
        if (!settings) return;
        Object.entries(settings).forEach(([key, value]) => {
            if (typeof value === 'string') {
                try {
                    localStorage.setItem(key, value);
                } catch (error) {
                    // 忽略错误
                }
            }
        });
    }

    // 格式化数据以确保一致性
    function formatRecord(record: RecordItem): RecordItem {
        // 统一 id 为 UUID；若不是 UUID，则生成新的 UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(record.id || ''));
        return {
            ...record,
            id: isUUID ? String(record.id) : generateUUID(),
            module: record.module as RecordItem['module'],
            createdAt: record.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    function formatKnowledge(knowledge: KnowledgeItem): KnowledgeItem {
        return {
            ...knowledge,
            id: knowledge.id || generateUUID(),
            module: knowledge.module as KnowledgeItem['module'],
            createdAt: knowledge.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    function formatPlan(plan: StudyPlan): StudyPlan {
        return {
            ...plan,
            id: plan.id || generateUUID(),
            module: plan.module as StudyPlan['module'],
            createdAt: plan.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    function formatCountdown(countdown: ExamCountdown): ExamCountdown {
        return {
            ...countdown,
            id: countdown.id || generateUUID(),
            createdAt: countdown.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    // 导出数据到 JSON 文件（使用新的统一格式）
    const handleExportData = () => {
        // 获取所有云端图片数据
        const cloudImages: CloudImageInfo[] = supabaseImageManager.getAllLocalImageInfo();

        // 格式化所有数据
        const formattedRecords = records.map(formatRecord);
        const formattedKnowledge = knowledge.map(formatKnowledge);
        const formattedPlans = (plans || []).map(formatPlan);
        const formattedCountdowns = (countdowns || []).map(formatCountdown);
        const settings = getAllSettings();

        const exportData: ExportData = {
            exportedAt: new Date().toISOString(),
            records: formattedRecords,
            knowledge: formattedKnowledge,
            plans: formattedPlans,
            countdowns: formattedCountdowns,
            settings,
            cloudImages,
            metadata: {
                totalRecords: formattedRecords.length,
                totalKnowledge: formattedKnowledge.length,
                totalPlans: formattedPlans.length,
                totalCountdowns: formattedCountdowns.length,
                totalImages: cloudImages.length,
                appVersion: '7.0.0'
            }
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

        notify({
            type: "success",
            message: "导出成功",
            description: `已导出 ${formattedRecords.length} 条记录、${formattedKnowledge.length} 条知识点、${formattedPlans.length} 个计划、${formattedCountdowns.length} 个倒计时、${cloudImages.length} 张图片。`
        });
    };

    // 从 JSON 文件导入数据（支持新格式和向后兼容）
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
                    const importedObject = JSON.parse(fileContent);

                    // 兼容导入：不依赖 version 字段
                    let importedRecords: RecordItem[] = [];
                    let importedKnowledge: KnowledgeItem[] = [];
                    let importedPlans: StudyPlan[] = [];
                    let importedCountdowns: ExamCountdown[] = [];
                    let importedSettings: UserSettings = {};
                    let importedCloudImages: CloudImageInfo[] = [];

                    // 优先读取常用键名；若无则尝试兼容键
                    importedRecords = importedObject.records || importedObject.data || [];
                    importedKnowledge = importedObject.knowledge || importedObject.knowledgeItems || [];
                    importedPlans = importedObject.plans || importedObject.studyPlans || [];
                    importedCountdowns = importedObject.countdowns || importedObject.examCountdowns || [];
                    importedSettings = importedObject.settings || {};
                    importedCloudImages = importedObject.cloudImages || [];

                    // 数据验证和格式化
                    const validatedRecords = importedRecords
                        .filter((r: RecordItem | Record<string, unknown>) => r && 'date' in r && 'module' in r && 'total' in r && typeof r.total === 'number')
                        .map(formatRecord);

                    const validatedKnowledge = importedKnowledge
                        .filter((k: KnowledgeItem | Record<string, unknown>) => k && 'module' in k && ('type' in k || 'note' in k))
                        .map(formatKnowledge);

                    const validatedPlans = importedPlans
                        .filter((p: StudyPlan | Record<string, unknown>) => p && 'name' in p && 'module' in p)
                        .map(formatPlan);

                    const validatedCountdowns = importedCountdowns
                        .filter((c: ExamCountdown | Record<string, unknown>) => c && 'name' in c && 'examDate' in c)
                        .map(formatCountdown);

                    // 导入云端图片
                    if (importedCloudImages.length > 0) {
                        supabaseImageManager.importImageInfo(importedCloudImages);
                    }

                    // 设置待导入数据
                    setPendingImport({
                        records: validatedRecords,
                        knowledge: validatedKnowledge,
                        plans: validatedPlans,
                        countdowns: validatedCountdowns,
                        settings: importedSettings,
                        cloudImages: importedCloudImages
                    });

                    setImportDialogOpen(true);

                } catch (error) {
                    console.error('导入文件解析失败:', error);
                    notify({
                        type: "error",
                        message: "导入失败",
                        description: "文件格式不正确，请选择有效的JSON文件。"
                    });
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // 确认导入
    const handleConfirmImport = () => {
        if (!pendingImport) return;

        try {
            // 导入设置
            if (pendingImport.settings) {
                setAllSettings(pendingImport.settings);
            }

            // 导入记录（去重）
            const existingRecordKeys = new Set(records.map(r => `${r.date}__${r.module}__${r.total}__${r.correct}__${r.duration}`));
            const newRecords = pendingImport.records.filter(r => {
                const key = `${r.date}__${r.module}__${r.total}__${r.correct}__${r.duration}`;
                return !existingRecordKeys.has(key);
            });

            // 导入知识点（去重）- 改进的去重逻辑
            // 创建现有知识点的内容键集合
            const existingKnowledgeContentKeys = new Set(knowledge.map(k =>
                `${k.module}__${k.type || ''}__${k.note || ''}__${k.subCategory || ''}__${k.date || ''}__${k.source || ''}__${k.imagePath || ''}`
            ));

            const newKnowledge = pendingImport.knowledge.filter(k => {
                // 为导入的知识点创建内容键
                const contentKey = `${k.module}__${k.type || ''}__${k.note || ''}__${k.subCategory || ''}__${k.date || ''}__${k.source || ''}__${k.imagePath || ''}`;
                return !existingKnowledgeContentKeys.has(contentKey);
            });

            // 导入计划（去重）
            if (pendingImport.plans && setPlans) {
                const existingPlanKeys = new Set(plans?.map(p => `${p.name}__${p.module}__${p.description || ''}`) || []);
                const newPlans = pendingImport.plans.filter(p => {
                    const key = `${p.name}__${p.module}__${p.description || ''}`;
                    return !existingPlanKeys.has(key);
                });
                setPlans([...newPlans, ...(plans || [])]);
            }

            // 更新状态
            setRecords([...newRecords, ...records]);
            setKnowledge([...newKnowledge, ...knowledge]);

            // 导入倒计时（去重）
            if (pendingImport.countdowns && setCountdowns) {
                const existingCountdownKeys = new Set(countdowns?.map(c => `${c.name}__${c.examDate}__${c.description || ''}`) || []);
                const newCountdowns = pendingImport.countdowns.filter(c => {
                    const key = `${c.name}__${c.examDate}__${c.description || ''}`;
                    return !existingCountdownKeys.has(key);
                });
                setCountdowns([...newCountdowns, ...(countdowns || [])]);
            }

            const newPlansCount = pendingImport.plans && setPlans ?
                pendingImport.plans.filter(p => {
                    const key = `${p.name}__${p.module}__${p.description || ''}`;
                    const existingPlanKeys = new Set(plans?.map(p => `${p.name}__${p.module}__${p.description || ''}`) || []);
                    return !existingPlanKeys.has(key);
                }).length : 0;

            const newCountdownsCount = pendingImport.countdowns && setCountdowns ?
                pendingImport.countdowns.filter(c => {
                    const key = `${c.name}__${c.examDate}__${c.description || ''}`;
                    const existingCountdownKeys = new Set(countdowns?.map(c => `${c.name}__${c.examDate}__${c.description || ''}`) || []);
                    return !existingCountdownKeys.has(key);
                }).length : 0;

            const stats = {
                total: pendingImport.records.length + pendingImport.knowledge.length + (pendingImport.plans?.length || 0) + (pendingImport.countdowns?.length || 0),
                added: newRecords.length + newKnowledge.length + newPlansCount + newCountdownsCount,
                repeated: (pendingImport.records.length - newRecords.length) + (pendingImport.knowledge.length - newKnowledge.length) +
                    ((pendingImport.plans?.length || 0) - newPlansCount) + ((pendingImport.countdowns?.length || 0) - newCountdownsCount),
                updated: 0,
                failed: 0
            };

            notify({
                type: "success",
                message: "导入成功",
                description: `成功导入 ${stats.added} 项数据，跳过 ${stats.repeated} 项重复数据。`
            });

            setImportDialogOpen(false);
            setPendingImport(undefined);

        } catch (error) {
            console.error('导入失败:', error);
            notify({
                type: "error",
                message: "导入失败",
                description: "导入过程中发生错误，请重试。"
            });
        }
    };

    return {
        handleExportData,
        handleImportData,
        handleConfirmImport,
        importDialogOpen,
        setImportDialogOpen,
        pendingImport,
        setPendingImport
    };
}