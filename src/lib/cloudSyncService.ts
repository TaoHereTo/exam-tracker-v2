import { recordService, planService, knowledgeService, settingsService } from './databaseService';
import { RecordItem, StudyPlan, KnowledgeItem } from '../types/record';
import { supabase } from '../supabaseClient';
import { UserSettings, SyncReportItem } from '../types/common';

export interface SyncResult {
    success: boolean;
    message: string;
    details?: {
        records?: { uploaded: number; downloaded: number; skipped: number };
        plans?: { uploaded: number; downloaded: number; skipped: number };
        knowledge?: { uploaded: number; downloaded: number; skipped: number };
        settings?: { uploaded: boolean; downloaded: boolean };
    };
    report?: {
        records: SyncReportItem<RecordItem>[];
        plans: SyncReportItem<StudyPlan>[];
        knowledge: SyncReportItem<KnowledgeItem>[];
    };
}

export interface UploadProgress {
    current: number;
    total: number;
    currentItem: string;
    stage: 'checking' | 'uploading-records' | 'uploading-plans' | 'uploading-knowledge' | 'uploading-settings' | 'complete';
}

export class CloudSyncService {
    // 检查记录是否重复 - 全面比较所有字段
    private static isRecordDuplicate(localRecord: RecordItem, cloudRecord: RecordItem): boolean {
        const isDuplicate = (
            localRecord.date === cloudRecord.date &&
            localRecord.module === cloudRecord.module &&
            localRecord.total === cloudRecord.total &&
            localRecord.correct === cloudRecord.correct &&
            localRecord.duration === cloudRecord.duration
            // 注意：id字段不比较，因为本地和云端的id可能不同
        );

        if (isDuplicate) {
            // 记录完全匹配
        } else {
            // 记录不匹配
        }

        return isDuplicate;
    }

    // 检查计划是否重复 - 全面比较所有字段
    private static isPlanDuplicate(localPlan: StudyPlan, cloudPlan: StudyPlan): boolean {
        const isDuplicate = (
            localPlan.name === cloudPlan.name &&
            localPlan.module === cloudPlan.module &&
            localPlan.type === cloudPlan.type &&
            localPlan.startDate === cloudPlan.startDate &&
            localPlan.endDate === cloudPlan.endDate &&
            localPlan.target === cloudPlan.target &&
            localPlan.progress === cloudPlan.progress &&
            localPlan.status === cloudPlan.status &&
            localPlan.description === cloudPlan.description
            // 注意：id字段不比较，因为本地和云端的id可能不同
        );

        if (isDuplicate) {
            // 计划完全匹配
        } else {
            // 计划不匹配
        }

        return isDuplicate;
    }

    // 检查知识点是否重复 - 全面比较所有字段
    private static isKnowledgeDuplicate(localKnowledge: KnowledgeItem, cloudKnowledge: KnowledgeItem): boolean {
        // 基础字段比较
        const localRecord = localKnowledge as Record<string, unknown>;
        const cloudRecord = cloudKnowledge as Record<string, unknown>;

        if (localKnowledge.module !== cloudKnowledge.module) {
            // 知识点模块不匹配
            return false;
        }

        // 检查type字段（如果存在）
        if (localRecord.type !== cloudRecord.type) {
            // 知识点类型不匹配
            return false;
        }

        // 检查note字段（如果存在）
        if (localRecord.note !== cloudRecord.note) {
            // 知识点内容不匹配
            return false;
        }

        // 比较所有可能的字段
        const fieldsToCompare = [
            'imagePath',
            'subCategory',
            'date',
            'source',
            'idiom',
            'meaning'
        ];

        for (const field of fieldsToCompare) {
            const localValue = (localKnowledge as Record<string, unknown>)[field];
            const cloudValue = (cloudKnowledge as Record<string, unknown>)[field];

            // 处理undefined和null的情况
            if (localValue === undefined && cloudValue === undefined) continue;
            if (localValue === null && cloudValue === null) continue;
            if (localValue === undefined && cloudValue === null) continue;
            if (localValue === null && cloudValue === undefined) continue;

            // 如果本地有值但云端没有，或者本地没有但云端有，则不重复
            if ((localValue !== undefined && localValue !== null) !== (cloudValue !== undefined && cloudValue !== null)) {
                // 知识点字段存在性不匹配
                return false;
            }

            // 如果都有值，则比较值是否相等
            if (localValue !== cloudValue) {
                // 知识点字段值不匹配
                return false;
            }
        }

        // 知识点完全匹配
        return true;
    }

    // 上传本地数据到云端
    static async uploadToCloud(
        localRecords: RecordItem[],
        localPlans: StudyPlan[],
        localKnowledge: KnowledgeItem[],
        localSettings: UserSettings,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<SyncResult> {
        try {
            let uploadedRecords = 0;
            let uploadedPlans = 0;
            let uploadedKnowledge = 0;
            let settingsUploaded = false;

            // 初始化报告
            const report = {
                records: [] as SyncReportItem<RecordItem>[],
                plans: [] as SyncReportItem<StudyPlan>[],
                knowledge: [] as SyncReportItem<KnowledgeItem>[]
            };

            const totalItems = localRecords.length + localPlans.length + localKnowledge.length + 1; // +1 for settings
            let currentProgress = 0;

            // 更新进度
            const updateProgress = (stage: UploadProgress['stage'], currentItem: string) => {
                currentProgress++;
                onProgress?.({
                    current: currentProgress,
                    total: totalItems,
                    currentItem,
                    stage
                });
            };

            // 预先获取云端数据，用于重复检查
            // 正在获取云端数据用于重复检查...
            updateProgress('checking', '正在检查云端数据...');
            const [cloudRecords, cloudPlans, cloudKnowledge] = await Promise.all([
                recordService.getRecords().catch(() => []),
                planService.getPlans().catch(() => []),
                knowledgeService.getKnowledge().catch(() => [])
            ]);
            // 云端现有数据统计

            // 上传刷题记录
            updateProgress('uploading-records', '正在上传刷题记录...');
            for (const record of localRecords) {
                try {
                    // 检查是否已存在相同的记录
                    const recordExists = cloudRecords.some(cloudRecord =>
                        this.isRecordDuplicate(record, cloudRecord)
                    );

                    if (recordExists) {
                        // 记录已存在，跳过
                        report.records.push({ item: record, action: 'skipped', reason: '记录已存在于云端' });
                        updateProgress('uploading-records', `跳过重复记录: ${record.date} ${record.module}`);
                        continue;
                    }

                    await recordService.addRecord({
                        date: record.date,
                        module: record.module,
                        total: record.total,
                        correct: record.correct,
                        duration: record.duration
                    });
                    uploadedRecords++;
                    report.records.push({ item: record, action: 'uploaded' });
                    updateProgress('uploading-records', `上传记录: ${record.date} ${record.module}`);
                    // 记录上传成功
                } catch (error) {
                    console.error(`记录上传失败: ${record.date} ${record.module}`, error);
                    report.records.push({ item: record, action: 'failed', reason: error instanceof Error ? error.message : '未知错误' });
                    updateProgress('uploading-records', `上传失败: ${record.date} ${record.module}`);
                    // 继续处理其他记录，不中断整个上传过程
                }
            }

            // 上传学习计划
            updateProgress('uploading-plans', '正在上传学习计划...');
            for (const plan of localPlans) {
                try {
                    // 正在上传计划

                    // 检查是否已存在相同的计划
                    const planExists = cloudPlans.some(cloudPlan =>
                        this.isPlanDuplicate(plan, cloudPlan)
                    );

                    if (planExists) {
                        // 计划已存在，跳过
                        report.plans.push({ item: plan, action: 'skipped', reason: '计划已存在于云端' });
                        updateProgress('uploading-plans', `跳过重复计划: ${plan.name}`);
                        continue;
                    }

                    await planService.addPlan({
                        name: plan.name,
                        module: plan.module,
                        type: plan.type,
                        startDate: plan.startDate,
                        endDate: plan.endDate,
                        target: plan.target,
                        progress: plan.progress,
                        status: plan.status,
                        description: plan.description
                    });
                    uploadedPlans++;
                    report.plans.push({ item: plan, action: 'uploaded' });
                    updateProgress('uploading-plans', `上传计划: ${plan.name}`);
                    // 计划上传成功
                } catch (error) {
                    console.error(`计划上传失败: ${plan.name}`, error);
                    report.plans.push({ item: plan, action: 'failed', reason: error instanceof Error ? error.message : '未知错误' });
                    updateProgress('uploading-plans', `上传失败: ${plan.name}`);
                    // 继续处理其他计划，不中断整个上传过程
                }
            }

            // 上传知识点
            updateProgress('uploading-knowledge', '正在上传知识点...');
            for (const knowledge of localKnowledge) {
                try {
                    const knowledgeRecord = knowledge as Record<string, unknown>;
                    const displayText = (knowledgeRecord.note as string)?.substring(0, 20) ||
                        (knowledgeRecord.idiom as string) ||
                        'unknown';
                    // 正在上传知识点

                    // 检查是否已存在相同的知识点
                    const knowledgeExists = cloudKnowledge.some(cloudKnowledgeItem =>
                        this.isKnowledgeDuplicate(knowledge, cloudKnowledgeItem)
                    );

                    if (knowledgeExists) {
                        // 知识点已存在，跳过
                        report.knowledge.push({ item: knowledge, action: 'skipped', reason: '知识点已存在于云端' });
                        updateProgress('uploading-knowledge', `跳过重复知识点: ${displayText}...`);
                        continue;
                    }

                    // 创建知识点数据，只包含存在的字段
                    const knowledgeData: Record<string, unknown> = {
                        module: knowledge.module,
                        imagePath: knowledgeRecord.imagePath
                    };

                    // 根据不同模块添加相应字段
                    if ('type' in knowledgeRecord) knowledgeData.type = knowledgeRecord.type;
                    if ('note' in knowledgeRecord) knowledgeData.note = knowledgeRecord.note;
                    if ('subCategory' in knowledgeRecord) knowledgeData.subCategory = knowledgeRecord.subCategory;
                    if ('date' in knowledgeRecord) knowledgeData.date = knowledgeRecord.date;
                    if ('source' in knowledgeRecord) knowledgeData.source = knowledgeRecord.source;
                    if ('idiom' in knowledgeRecord) knowledgeData.idiom = knowledgeRecord.idiom;
                    if ('meaning' in knowledgeRecord) knowledgeData.meaning = knowledgeRecord.meaning;

                    await knowledgeService.addKnowledge(knowledgeData as Omit<KnowledgeItem, 'id'>);
                    uploadedKnowledge++;
                    report.knowledge.push({ item: knowledge, action: 'uploaded' });
                    updateProgress('uploading-knowledge', `上传知识点: ${displayText}...`);
                    // 知识点上传成功
                } catch (error) {
                    console.error(`知识点上传失败:`, error);
                    report.knowledge.push({ item: knowledge, action: 'failed', reason: error instanceof Error ? error.message : '未知错误' });
                    const knowledgeRecord = knowledge as Record<string, unknown>;
                    const displayText = (knowledgeRecord.note as string)?.substring(0, 20) ||
                        (knowledgeRecord.idiom as string) ||
                        'unknown';
                    updateProgress('uploading-knowledge', `上传失败: ${displayText}...`);
                    // 继续处理其他知识点，不中断整个上传过程
                }
            }

            // 上传设置
            updateProgress('uploading-settings', '正在上传设置...');
            try {
                await settingsService.saveSettings(localSettings);
                settingsUploaded = true;
                updateProgress('uploading-settings', '设置上传成功');
            } catch (error) {
                // 设置上传失败
                updateProgress('uploading-settings', '设置上传失败');
            }

            updateProgress('complete', '上传完成');

            const skippedRecords = report.records.filter(r => r.action === 'skipped').length;
            const skippedPlans = report.plans.filter(p => p.action === 'skipped').length;
            const skippedKnowledge = report.knowledge.filter(k => k.action === 'skipped').length;

            return {
                success: true,
                message: `成功上传 ${uploadedRecords} 条记录、${uploadedPlans} 个计划、${uploadedKnowledge} 条知识点。跳过 ${skippedRecords} 条重复记录、${skippedPlans} 个重复计划、${skippedKnowledge} 条重复知识点。`,
                details: {
                    records: { uploaded: uploadedRecords, downloaded: 0, skipped: skippedRecords },
                    plans: { uploaded: uploadedPlans, downloaded: 0, skipped: skippedPlans },
                    knowledge: { uploaded: uploadedKnowledge, downloaded: 0, skipped: skippedKnowledge },
                    settings: { uploaded: settingsUploaded, downloaded: false }
                },
                report
            };
        } catch (error) {
            return {
                success: false,
                message: `上传失败: ${error instanceof Error ? error.message : '未知错误'}`
            };
        }
    }

    // 从云端下载数据到本地
    static async downloadFromCloud(): Promise<SyncResult> {
        try {
            let downloadedRecords = 0;
            let downloadedPlans = 0;
            let downloadedKnowledge = 0;
            let settingsDownloaded = false;

            // 下载刷题记录
            try {
                const cloudRecords = await recordService.getRecords();
                downloadedRecords = cloudRecords.length;
            } catch (error) {
                // 下载记录失败
            }

            // 下载学习计划
            try {
                const cloudPlans = await planService.getPlans();
                downloadedPlans = cloudPlans.length;
            } catch (error) {
                // 下载计划失败
            }

            // 下载知识点
            try {
                const cloudKnowledge = await knowledgeService.getKnowledge();
                downloadedKnowledge = cloudKnowledge.length;
            } catch (error) {
                // 下载知识点失败
            }

            // 下载设置
            try {
                const cloudSettings = await settingsService.getSettings();
                settingsDownloaded = Object.keys(cloudSettings).length > 0;
            } catch (error) {
                // 下载设置失败
            }

            return {
                success: true,
                message: `成功下载 ${downloadedRecords} 条记录、${downloadedPlans} 个计划、${downloadedKnowledge} 条知识点`,
                details: {
                    records: { uploaded: 0, downloaded: downloadedRecords, skipped: 0 },
                    plans: { uploaded: 0, downloaded: downloadedPlans, skipped: 0 },
                    knowledge: { uploaded: 0, downloaded: downloadedKnowledge, skipped: 0 },
                    settings: { uploaded: false, downloaded: settingsDownloaded }
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `下载失败: ${error instanceof Error ? error.message : '未知错误'}`
            };
        }
    }

    // 双向同步（合并本地和云端数据）
    static async syncData(
        localRecords: RecordItem[],
        localPlans: StudyPlan[],
        localKnowledge: KnowledgeItem[],
        localSettings: UserSettings
    ): Promise<SyncResult> {
        try {
            // 先上传本地数据
            const uploadResult = await this.uploadToCloud(localRecords, localPlans, localKnowledge, localSettings);

            // 再下载云端数据
            const downloadResult = await this.downloadFromCloud();

            if (uploadResult.success && downloadResult.success) {
                return {
                    success: true,
                    message: '数据同步完成',
                    details: {
                        records: {
                            uploaded: uploadResult.details?.records?.uploaded || 0,
                            downloaded: downloadResult.details?.records?.downloaded || 0,
                            skipped: uploadResult.details?.records?.skipped || 0
                        },
                        plans: {
                            uploaded: uploadResult.details?.plans?.uploaded || 0,
                            downloaded: downloadResult.details?.plans?.downloaded || 0,
                            skipped: uploadResult.details?.plans?.skipped || 0
                        },
                        knowledge: {
                            uploaded: uploadResult.details?.knowledge?.uploaded || 0,
                            downloaded: downloadResult.details?.knowledge?.downloaded || 0,
                            skipped: uploadResult.details?.knowledge?.skipped || 0
                        },
                        settings: {
                            uploaded: uploadResult.details?.settings?.uploaded || false,
                            downloaded: downloadResult.details?.settings?.downloaded || false
                        }
                    }
                };
            } else {
                return {
                    success: false,
                    message: `同步失败: ${uploadResult.message} | ${downloadResult.message}`
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `同步失败: ${error instanceof Error ? error.message : '未知错误'}`
            };
        }
    }

    // 查看云端数据概览
    static async getCloudDataOverview(): Promise<{
        records: { count: number; recent: RecordItem[] };
        plans: { count: number; recent: StudyPlan[] };
        knowledge: { count: number; recent: KnowledgeItem[] };
        settings: { hasSettings: boolean };
    }> {
        try {
            const [cloudRecords, cloudPlans, cloudKnowledge, cloudSettings] = await Promise.all([
                recordService.getRecords().catch(() => []),
                planService.getPlans().catch(() => []),
                knowledgeService.getKnowledge().catch(() => []),
                settingsService.getSettings().catch(() => ({}))
            ]);

            return {
                records: {
                    count: cloudRecords.length,
                    recent: cloudRecords.slice(0, 5) // 最近5条记录
                },
                plans: {
                    count: cloudPlans.length,
                    recent: cloudPlans.slice(0, 5) // 最近5个计划
                },
                knowledge: {
                    count: cloudKnowledge.length,
                    recent: cloudKnowledge.slice(0, 5) // 最近5条知识点
                },
                settings: {
                    hasSettings: Object.keys(cloudSettings).length > 0
                }
            };
        } catch (error) {
            console.error('获取云端数据概览失败:', error);
            throw error;
        }
    }

    // 清空云端数据
    static async clearCloudData(
        onProgress?: (progress: { current: number; total: number; currentItem: string }) => void
    ): Promise<{
        success: boolean;
        message: string;
        clearedCount: {
            records: number;
            plans: number;
            knowledge: number;
            settings: boolean;
        };
    }> {
        try {
            let clearedRecords = 0;
            let clearedPlans = 0;
            let clearedKnowledge = 0;
            let clearedSettings = false;

            // 获取当前数据数量用于统计
            const [cloudRecords, cloudPlans, cloudKnowledge] = await Promise.all([
                recordService.getRecords().catch(() => []),
                planService.getPlans().catch(() => []),
                knowledgeService.getKnowledge().catch(() => [])
            ]);

            clearedRecords = cloudRecords.length;
            clearedPlans = cloudPlans.length;
            clearedKnowledge = cloudKnowledge.length;

            // 清空所有数据 - 使用更可靠的删除方法
            // 开始清空云端数据...
            // 准备清空数据

            const totalSteps = 4;
            let currentStep = 0;

            // 清空记录
            onProgress?.({
                current: ++currentStep,
                total: totalSteps,
                currentItem: '正在清空刷题记录...'
            });
            const deleteRecords = await supabase.from('exercise_records').delete().gte('id', 0);

            // 清空计划
            onProgress?.({
                current: ++currentStep,
                total: totalSteps,
                currentItem: '正在清空学习计划...'
            });
            const deletePlans = await supabase.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            // 清空知识点
            onProgress?.({
                current: ++currentStep,
                total: totalSteps,
                currentItem: '正在清空知识点...'
            });
            const deleteKnowledge = await supabase.from('knowledge').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            // 清空设置
            onProgress?.({
                current: ++currentStep,
                total: totalSteps,
                currentItem: '正在清空设置...'
            });
            const deleteSettings = await supabase.from('user_settings').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');

            const deleteResults = [deleteRecords, deletePlans, deleteKnowledge, deleteSettings];

            // 删除操作结果

            // 验证删除结果
            const [remainingRecords, remainingPlans, remainingKnowledge] = await Promise.all([
                recordService.getRecords().catch(() => []),
                planService.getPlans().catch(() => []),
                knowledgeService.getKnowledge().catch(() => [])
            ]);

            // 删除后剩余数据统计

            clearedSettings = true;

            const actuallyClearedRecords = clearedRecords - remainingRecords.length;
            const actuallyClearedPlans = clearedPlans - remainingPlans.length;
            const actuallyClearedKnowledge = clearedKnowledge - remainingKnowledge.length;

            return {
                success: true,
                message: `成功清空云端数据：${actuallyClearedRecords} 条记录、${actuallyClearedPlans} 个计划、${actuallyClearedKnowledge} 条知识点、设置已清空`,
                clearedCount: {
                    records: actuallyClearedRecords,
                    plans: actuallyClearedPlans,
                    knowledge: actuallyClearedKnowledge,
                    settings: clearedSettings
                }
            };
        } catch (error) {
            console.error('清空云端数据失败:', error);
            return {
                success: false,
                message: `清空失败: ${error instanceof Error ? error.message : '未知错误'}`,
                clearedCount: {
                    records: 0,
                    plans: 0,
                    knowledge: 0,
                    settings: false
                }
            };
        }
    }
} 