import { recordService, planService, knowledgeService, settingsService } from './databaseService';
import { RecordItem, StudyPlan, KnowledgeItem } from '../types/record';
import { supabase } from '../supabaseClient';
import { SyncReportItem } from '../types/common';
import { UserSettings } from '../types/record';

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
    isPaused?: boolean;
    isCancelled?: boolean;
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

        // 全面比较所有字段
        const isDuplicate = localRecord.type === cloudRecord.type &&
            localRecord.note === cloudRecord.note &&
            localRecord.subCategory === cloudRecord.subCategory &&
            localRecord.date === cloudRecord.date &&
            localRecord.source === cloudRecord.source &&
            localRecord.imagePath === cloudRecord.imagePath;

        return isDuplicate;
    }

    private static hasKnowledgeChanges(localKnowledge: KnowledgeItem, cloudKnowledge: KnowledgeItem): boolean {
        // 检查是否有任何字段不同（说明编辑过）
        const localRecord = localKnowledge as Record<string, unknown>;
        const cloudRecord = cloudKnowledge as Record<string, unknown>;

        // 比较所有相关字段
        return localKnowledge.module !== cloudKnowledge.module ||
            localRecord.type !== cloudRecord.type ||
            localRecord.note !== cloudRecord.note ||
            localRecord.subCategory !== cloudRecord.subCategory ||
            localRecord.date !== cloudRecord.date ||
            localRecord.source !== cloudRecord.source ||
            localRecord.imagePath !== cloudRecord.imagePath;
    }

    // 批量上传记录到云端
    private static async batchUploadRecords(
        recordsToUpload: RecordItem[],
        onProgress?: (progress: UploadProgress) => void,
        abortController?: AbortController
    ): Promise<{ uploaded: number; report: SyncReportItem<RecordItem>[] }> {
        if (recordsToUpload.length === 0) {
            return { uploaded: 0, report: [] };
        }

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) throw new Error('用户未登录');

        // 构建批量插入数据
        const recordsData = recordsToUpload.map(record => ({
            user_id: userId,
            date: record.date,
            module: record.module,
            total: record.total,
            correct: record.correct,
            duration: record.duration
        }));

        // 批量插入记录
        const { data, error } = await supabase
            .from('exercise_records')
            .insert(recordsData)
            .select();

        if (error) {
            throw new Error(`批量上传记录失败: ${error.message}`);
        }

        const report = recordsToUpload.map(record => ({
            item: record,
            action: 'uploaded' as const
        }));

        return { uploaded: data?.length || 0, report };
    }

    // 批量上传计划到云端
    private static async batchUploadPlans(
        plansToUpload: StudyPlan[],
        onProgress?: (progress: UploadProgress) => void,
        abortController?: AbortController
    ): Promise<{ uploaded: number; report: SyncReportItem<StudyPlan>[] }> {
        if (plansToUpload.length === 0) {
            return { uploaded: 0, report: [] };
        }

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) throw new Error('用户未登录');

        // 构建批量插入数据
        const plansData = plansToUpload.map(plan => ({
            user_id: userId,
            name: plan.name,
            module: plan.module,
            type: plan.type,
            "startDate": plan.startDate,
            "endDate": plan.endDate,
            target: plan.target,
            progress: plan.progress,
            status: plan.status,
            description: plan.description
        }));

        // 批量插入计划
        const { data, error } = await supabase
            .from('plans')
            .insert(plansData)
            .select();

        if (error) {
            throw new Error(`批量上传计划失败: ${error.message}`);
        }

        const report = plansToUpload.map(plan => ({
            item: plan,
            action: 'uploaded' as const
        }));

        return { uploaded: data?.length || 0, report };
    }

    // 批量上传知识点到云端
    private static async batchUploadKnowledge(
        knowledgeToUpload: KnowledgeItem[],
        onProgress?: (progress: UploadProgress) => void,
        abortController?: AbortController
    ): Promise<{ uploaded: number; report: SyncReportItem<KnowledgeItem>[] }> {
        if (knowledgeToUpload.length === 0) {
            return { uploaded: 0, report: [] };
        }

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) throw new Error('用户未登录');

        console.log('开始批量上传知识点:', {
            count: knowledgeToUpload.length,
            userId: userId
        });

        // 构建批量插入数据
        const knowledgeData = knowledgeToUpload.map(knowledge => {
            // 确保必填字段不为空
            if (!knowledge.type || !knowledge.note) {
                console.warn('跳过无效的知识点:', {
                    id: knowledge.id,
                    type: knowledge.type,
                    note: knowledge.note
                });
                return null;
            }

            const data: Record<string, unknown> = {
                user_id: userId,
                module: knowledge.module,
                type: knowledge.type,
                note: knowledge.note
            };

            // 处理可选字段
            if (knowledge.subCategory) data.subCategory = knowledge.subCategory;
            if (knowledge.date) data.date = knowledge.date;
            if (knowledge.source) data.source = knowledge.source;
            if (knowledge.imagePath) data.imagePath = knowledge.imagePath;

            return data;
        }).filter(Boolean); // 过滤掉无效的数据

        console.log('知识点数据准备完成:', {
            sampleData: knowledgeData[0],
            totalCount: knowledgeData.length
        });

        // 批量插入知识点
        const { data, error } = await supabase
            .from('knowledge')
            .insert(knowledgeData)
            .select();

        if (error) {
            console.error('知识点批量上传失败:', error);

            // 如果是数据验证错误，返回部分成功的结果
            if (error.code === '23502' || error.message.includes('not-null constraint')) {
                console.warn('部分知识点数据无效，跳过无效数据');
                return {
                    uploaded: 0, report: knowledgeToUpload.map(k => ({
                        item: k,
                        action: 'failed' as const,
                        reason: '知识点数据无效（type或note字段为空）'
                    }))
                };
            }

            throw new Error(`批量上传知识点失败: ${error.message} (代码: ${error.code})`);
        }

        console.log('知识点批量上传成功:', {
            uploaded: data?.length || 0
        });

        const report = knowledgeToUpload.map(knowledge => ({
            item: knowledge,
            action: 'uploaded' as const
        }));

        return { uploaded: data?.length || 0, report };
    }

    // 上传本地数据到云端 - 优化版本
    static async uploadToCloud(
        localRecords: RecordItem[],
        localPlans: StudyPlan[],
        localKnowledge: KnowledgeItem[],
        localSettings: UserSettings,
        onProgress?: (progress: UploadProgress) => void,
        abortController?: AbortController
    ): Promise<SyncResult> {
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

        try {
            console.log('开始云端上传，数据统计:', {
                records: localRecords.length,
                plans: localPlans.length,
                knowledge: localKnowledge.length
            });

            // 检查是否取消
            const checkCancelled = () => {
                if (abortController?.signal.aborted) {
                    throw new Error('上传已取消');
                }
            };

            // 预先获取云端数据，用于重复检查
            onProgress?.({
                current: 0,
                total: 4,
                currentItem: '正在检查云端数据...',
                stage: 'checking',
                isPaused: false,
                isCancelled: false
            });

            const [cloudRecords, cloudPlans, cloudKnowledge] = await Promise.all([
                recordService.getRecords().catch(() => []),
                planService.getPlans().catch(() => []),
                knowledgeService.getKnowledge().catch(() => [])
            ]);

            console.log('云端数据获取完成:', {
                cloudRecords: cloudRecords.length,
                cloudPlans: cloudPlans.length,
                cloudKnowledge: cloudKnowledge.length
            });

            checkCancelled();

            // 过滤出需要上传的记录（去重）
            const recordsToUpload = localRecords.filter(record =>
                !cloudRecords.some(cloudRecord => this.isRecordDuplicate(record, cloudRecord))
            );

            // 过滤出需要上传的计划（去重）
            const plansToUpload = localPlans.filter(plan =>
                !cloudPlans.some(cloudPlan => this.isPlanDuplicate(plan, cloudPlan))
            );

            // 过滤出需要上传的知识点（去重）
            const knowledgeToUpload = localKnowledge.filter(knowledge => {
                // 检查是否有相同ID的知识点需要更新
                const existingKnowledgeWithSameId = cloudKnowledge.find(cloudKnowledgeItem =>
                    cloudKnowledgeItem.id === knowledge.id
                );

                if (existingKnowledgeWithSameId) {
                    // 如果有变化，需要更新
                    const hasChanges = this.hasKnowledgeChanges(knowledge, existingKnowledgeWithSameId);
                    if (hasChanges) {
                        report.knowledge.push({
                            item: knowledge,
                            action: 'skipped',
                            reason: '知识点需要更新，暂不支持批量更新'
                        });
                    } else {
                        report.knowledge.push({
                            item: knowledge,
                            action: 'skipped',
                            reason: '知识点内容完全相同'
                        });
                    }
                    return false;
                }

                // 检查是否有内容相同但ID不同的知识点
                return !cloudKnowledge.some(cloudKnowledgeItem =>
                    this.isKnowledgeDuplicate(knowledge, cloudKnowledgeItem)
                );
            });

            console.log('数据过滤完成:', {
                recordsToUpload: recordsToUpload.length,
                plansToUpload: plansToUpload.length,
                knowledgeToUpload: knowledgeToUpload.length
            });

            // 批量上传记录
            if (recordsToUpload.length > 0) {
                onProgress?.({
                    current: 1,
                    total: 4,
                    currentItem: `正在批量上传 ${recordsToUpload.length} 条记录...`,
                    stage: 'uploading-records',
                    isPaused: false,
                    isCancelled: false
                });

                const { uploaded, report: recordsReport } = await this.batchUploadRecords(
                    recordsToUpload,
                    onProgress,
                    abortController
                );
                uploadedRecords = uploaded;
                report.records.push(...recordsReport);
            } else {
                report.records.push(...localRecords.map(record => ({
                    item: record,
                    action: 'skipped' as const,
                    reason: '记录已存在于云端'
                })));
            }

            checkCancelled();

            // 批量上传计划
            if (plansToUpload.length > 0) {
                onProgress?.({
                    current: 2,
                    total: 4,
                    currentItem: `正在批量上传 ${plansToUpload.length} 个计划...`,
                    stage: 'uploading-plans',
                    isPaused: false,
                    isCancelled: false
                });

                const { uploaded, report: plansReport } = await this.batchUploadPlans(
                    plansToUpload,
                    onProgress,
                    abortController
                );
                uploadedPlans = uploaded;
                report.plans.push(...plansReport);
            } else {
                report.plans.push(...localPlans.map(plan => ({
                    item: plan,
                    action: 'skipped' as const,
                    reason: '计划已存在于云端'
                })));
            }

            checkCancelled();

            // 批量上传知识点
            if (knowledgeToUpload.length > 0) {
                onProgress?.({
                    current: 3,
                    total: 4,
                    currentItem: `正在批量上传 ${knowledgeToUpload.length} 条知识点...`,
                    stage: 'uploading-knowledge',
                    isPaused: false,
                    isCancelled: false
                });

                try {
                    const { uploaded, report: knowledgeReport } = await this.batchUploadKnowledge(
                        knowledgeToUpload,
                        onProgress,
                        abortController
                    );
                    uploadedKnowledge = uploaded;
                    report.knowledge.push(...knowledgeReport);
                } catch (error) {
                    console.error('知识点批量上传失败，尝试逐个上传:', error);
                    // 如果批量上传失败，尝试逐个上传
                    onProgress?.({
                        current: 3,
                        total: 4,
                        currentItem: '批量上传失败，尝试逐个上传知识点...',
                        stage: 'uploading-knowledge',
                        isPaused: false,
                        isCancelled: false
                    });

                    let individualUploaded = 0;
                    for (const knowledge of knowledgeToUpload) {
                        checkCancelled();

                        // 验证知识点数据
                        if (!knowledge.type || !knowledge.note) {
                            console.warn('跳过无效的知识点:', {
                                id: knowledge.id,
                                type: knowledge.type,
                                note: knowledge.note
                            });
                            report.knowledge.push({
                                item: knowledge,
                                action: 'failed',
                                reason: '知识点数据无效（type或note字段为空）'
                            });
                            continue;
                        }

                        try {
                            await knowledgeService.addKnowledge({
                                module: knowledge.module,
                                type: knowledge.type,
                                note: knowledge.note,
                                subCategory: knowledge.subCategory,
                                date: knowledge.date,
                                source: knowledge.source,
                                imagePath: knowledge.imagePath
                            });
                            individualUploaded++;
                            report.knowledge.push({ item: knowledge, action: 'uploaded' });
                        } catch (individualError) {
                            console.error('单个知识点上传失败:', individualError);

                            let reason = '未知错误';
                            if (individualError instanceof Error) {
                                if (individualError.message.includes('not-null constraint') || individualError.message.includes('23502')) {
                                    reason = '知识点数据无效（type或note字段为空）';
                                } else {
                                    reason = individualError.message;
                                }
                            }

                            report.knowledge.push({
                                item: knowledge,
                                action: 'failed',
                                reason: reason
                            });
                        }
                    }
                    uploadedKnowledge = individualUploaded;
                }
            }

            checkCancelled();

            // 上传设置
            onProgress?.({
                current: 4,
                total: 4,
                currentItem: '正在上传设置...',
                stage: 'uploading-settings',
                isPaused: false,
                isCancelled: false
            });

            try {
                await settingsService.saveSettings(localSettings);
                settingsUploaded = true;
            } catch (error) {
                console.error('设置上传失败:', error);
            }

            onProgress?.({
                current: 4,
                total: 4,
                currentItem: '上传完成',
                stage: 'complete',
                isPaused: false,
                isCancelled: false
            });

            const skippedRecords = report.records.filter(r => r.action === 'skipped').length;
            const skippedPlans = report.plans.filter(p => p.action === 'skipped').length;
            const skippedKnowledge = report.knowledge.filter(k => k.action === 'skipped').length;

            console.log('上传完成统计:', {
                uploadedRecords,
                uploadedPlans,
                uploadedKnowledge,
                skippedRecords,
                skippedPlans,
                skippedKnowledge
            });

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
            console.error('云端上传失败:', error);
            if (error instanceof Error && error.message === '上传已取消') {
                const skippedRecords = report.records.filter(r => r.action === 'skipped').length;
                const skippedPlans = report.plans.filter(p => p.action === 'skipped').length;
                const skippedKnowledge = report.knowledge.filter(k => k.action === 'skipped').length;

                return {
                    success: false,
                    message: '上传已取消',
                    details: {
                        records: { uploaded: uploadedRecords, downloaded: 0, skipped: skippedRecords },
                        plans: { uploaded: uploadedPlans, downloaded: 0, skipped: skippedPlans },
                        knowledge: { uploaded: uploadedKnowledge, downloaded: 0, skipped: skippedKnowledge },
                        settings: { uploaded: settingsUploaded, downloaded: false }
                    },
                    report
                };
            }
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

            // 下载刷题历史
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
            console.log('开始获取云端数据概览');

            // 分别处理每个服务，避免一个失败影响其他
            let cloudRecords: RecordItem[] = [];
            let cloudPlans: StudyPlan[] = [];
            let cloudKnowledge: KnowledgeItem[] = [];
            let cloudSettings: UserSettings = {};

            try {
                cloudRecords = await recordService.getRecords();
                console.log('记录获取成功:', cloudRecords.length);
            } catch (error) {
                console.error('记录获取失败:', error);
                cloudRecords = [];
            }

            try {
                cloudPlans = await planService.getPlans();
                console.log('计划获取成功:', cloudPlans.length);
            } catch (error) {
                console.error('计划获取失败:', error);
                cloudPlans = [];
            }

            try {
                cloudKnowledge = await knowledgeService.getKnowledge();
                console.log('知识点获取成功:', cloudKnowledge.length);
            } catch (error) {
                console.error('知识点获取失败:', error);
                cloudKnowledge = [];
            }

            try {
                cloudSettings = await settingsService.getSettings();
                console.log('设置获取成功:', Object.keys(cloudSettings).length);
            } catch (error) {
                console.error('设置获取失败:', error);
                cloudSettings = {};
            }

            const result = {
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

            console.log('云端数据概览获取完成:', result);
            return result;
        } catch (error) {
            console.error('获取云端数据概览失败:', error);
            // 返回空数据而不是抛出错误
            return {
                records: { count: 0, recent: [] },
                plans: { count: 0, recent: [] },
                knowledge: { count: 0, recent: [] },
                settings: { hasSettings: false }
            };
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
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;
            if (!userId) {
                return {
                    success: false,
                    message: '未登录，无法清空云端数据',
                    clearedCount: { records: 0, plans: 0, knowledge: 0, settings: false }
                };
            }
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

            const totalSteps = 4;
            let currentStep = 0;

            // 清空记录
            onProgress?.({
                current: ++currentStep,
                total: totalSteps,
                currentItem: '正在清空刷题历史...'
            });
            const deleteRecords = await supabase.from('exercise_records').delete().eq('user_id', userId);
            if (deleteRecords.error) {
                console.error('清空刷题历史失败:', deleteRecords.error);
                throw new Error(`清空刷题历史失败: ${deleteRecords.error.message}`);
            }

            // 清空计划
            onProgress?.({
                current: ++currentStep,
                total: totalSteps,
                currentItem: '正在清空学习计划...'
            });
            const deletePlans = await supabase.from('plans').delete().eq('user_id', userId);
            if (deletePlans.error) {
                console.error('清空学习计划失败:', deletePlans.error);
                throw new Error(`清空学习计划失败: ${deletePlans.error.message}`);
            }

            // 清空知识点
            onProgress?.({
                current: ++currentStep,
                total: totalSteps,
                currentItem: '正在清空知识点...'
            });
            const deleteKnowledge = await supabase.from('knowledge').delete().eq('user_id', userId);
            if (deleteKnowledge.error) {
                console.error('清空知识点失败:', deleteKnowledge.error);
                throw new Error(`清空知识点失败: ${deleteKnowledge.error.message}`);
            }

            // 清空设置
            onProgress?.({
                current: ++currentStep,
                total: totalSteps,
                currentItem: '正在清空设置...'
            });
            const deleteSettings = await supabase.from('user_settings').delete().eq('user_id', userId);
            if (deleteSettings.error) {
                console.error('清空设置失败:', deleteSettings.error);
                throw new Error(`清空设置失败: ${deleteSettings.error.message}`);
            }

            // 验证删除结果
            const [remainingRecords, remainingPlans, remainingKnowledge] = await Promise.all([
                recordService.getRecords().catch(() => []),
                planService.getPlans().catch(() => []),
                knowledgeService.getKnowledge().catch(() => [])
            ]);

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