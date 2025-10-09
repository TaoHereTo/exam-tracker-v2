import { recordService, planService, knowledgeService, settingsService } from './databaseService';
import { RecordItem, StudyPlan, KnowledgeItem } from '../types/record';
import { supabase } from '../supabaseClient';
import { SyncReportItem, CloudDataOverview } from '../types/common';
import { UserSettings } from '../types/record';

// 获取当前用户ID
const getCurrentUserId = async () => {
    try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            console.warn('获取用户信息失败:', error.message);
            return null;
        }

        return data.user?.id || null;
    } catch (error) {
        console.warn('获取用户信息异常:', error);
        return null;
    }
};

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
        if (localKnowledge.module !== cloudKnowledge.module) {
            // 知识点模块不匹配
            return false;
        }

        // 全面比较所有字段
        const isDuplicate = localKnowledge.type === cloudKnowledge.type &&
            localKnowledge.note === cloudKnowledge.note &&
            localKnowledge.subCategory === cloudKnowledge.subCategory &&
            localKnowledge.date === cloudKnowledge.date &&
            localKnowledge.source === cloudKnowledge.source &&
            localKnowledge.imagePath === cloudKnowledge.imagePath;

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
        // 置顶状态不保存到云端，只保存在本地
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

        // 验证和清理数据
        const validKnowledgeItems: KnowledgeItem[] = [];
        const invalidItems: { item: KnowledgeItem; reason: string }[] = [];

        for (const item of knowledgeToUpload) {
            // 验证必需字段
            if (!item.id || !item.module) {
                invalidItems.push({
                    item,
                    reason: '缺少必需字段（id或module）'
                });
                continue;
            }

            // 确保type和note字段不为空
            const validatedItem: KnowledgeItem = {
                ...item,
                type: item.type || '未分类',
                note: item.note || '无内容'
            };

            validKnowledgeItems.push(validatedItem);
        }

        console.log(`知识点批量上传：总共${knowledgeToUpload.length}条，有效${validKnowledgeItems.length}条，无效${invalidItems.length}条`);

        if (validKnowledgeItems.length === 0) {
            const report = knowledgeToUpload.map(knowledge => ({
                item: knowledge,
                action: 'failed' as const,
                reason: '所有知识点数据无效'
            }));
            return { uploaded: 0, report };
        }

        // Prepare data for batch upload
        const uploadData = validKnowledgeItems.map(item => ({
            id: item.id,
            user_id: userId,
            module: item.module,
            type: item.type,
            note: item.note,
            "subCategory": item.subCategory || '',
            "date": item.date || null,
            "source": item.source || '',
            "imagePath": item.imagePath || null,
            created_at: item.createdAt || new Date().toISOString(),
            updated_at: item.updatedAt || new Date().toISOString()
        }));

        console.log('准备上传的知识点数据示例:', uploadData.slice(0, 2));

        try {
            // Perform batch upload
            const { data, error } = await supabase
                .from('knowledge')
                .upsert(uploadData, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                })
                .select();

            if (error) {
                console.error('知识点批量上传失败，详细错误信息:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw new Error(`知识点批量上传失败: ${error.message || '未知错误'}`);
            }

            console.log(`知识点批量上传成功，上传了${data?.length || 0}条数据`);

            const report = [
                ...validKnowledgeItems.map(knowledge => ({
                    item: knowledge,
                    action: 'uploaded' as const
                })),
                ...invalidItems.map(({ item, reason }) => ({
                    item,
                    action: 'failed' as const,
                    reason
                }))
            ];

            return { uploaded: data?.length || 0, report };
        } catch (error) {
            console.error('知识点批量上传异常:', error);
            throw error;
        }
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

            // 调试日志：记录知识点上传信息
            console.log('知识点上传分析:', {
                本地知识点总数: localKnowledge.length,
                云端知识点总数: cloudKnowledge.length,
                需要上传的知识点数量: knowledgeToUpload.length,
                需要上传的知识点示例: knowledgeToUpload.slice(0, 3).map(k => ({
                    id: k.id,
                    module: k.module,
                    type: k.type,
                    note: k.note?.substring(0, 50) + '...',
                    hasImage: !!k.imagePath
                }))
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
                    let individualFailed = 0;

                    for (const knowledge of knowledgeToUpload) {
                        checkCancelled();

                        // 验证知识点数据
                        if (!knowledge.id || !knowledge.module) {
                            console.warn('跳过无效的知识点（缺少必需字段）:', {
                                id: knowledge.id,
                                module: knowledge.module
                            });
                            report.knowledge.push({
                                item: knowledge,
                                action: 'failed',
                                reason: '知识点数据无效（缺少id或module字段）'
                            });
                            individualFailed++;
                            continue;
                        }

                        // 确保type和note字段不为空
                        const validatedKnowledge = {
                            ...knowledge,
                            type: knowledge.type || '未分类',
                            note: knowledge.note || '无内容'
                        };

                        try {
                            await knowledgeService.addKnowledge({
                                module: validatedKnowledge.module,
                                type: validatedKnowledge.type,
                                note: validatedKnowledge.note,
                                subCategory: validatedKnowledge.subCategory,
                                date: validatedKnowledge.date,
                                source: validatedKnowledge.source,
                                imagePath: validatedKnowledge.imagePath
                            });
                            individualUploaded++;
                            report.knowledge.push({ item: knowledge, action: 'uploaded' });
                            console.log(`单个知识点上传成功: ${knowledge.id}`);
                        } catch (individualError) {
                            console.error('单个知识点上传失败:', {
                                knowledgeId: knowledge.id,
                                error: individualError
                            });

                            let reason = '未知错误';
                            if (individualError instanceof Error) {
                                if (individualError.message.includes('not-null constraint') || individualError.message.includes('23502')) {
                                    reason = '知识点数据无效（数据库约束失败）';
                                } else if (individualError.message.includes('duplicate key') || individualError.message.includes('23505')) {
                                    reason = '知识点已存在（重复ID）';
                                } else if (individualError.message.includes('foreign key') || individualError.message.includes('23503')) {
                                    reason = '知识点数据关联失败';
                                } else if (individualError.message.includes('permission') || individualError.message.includes('unauthorized')) {
                                    reason = '权限不足，请重新登录';
                                } else if (individualError.message.includes('network') || individualError.message.includes('fetch')) {
                                    reason = '网络连接失败';
                                } else {
                                    reason = individualError.message;
                                }
                            }

                            report.knowledge.push({
                                item: knowledge,
                                action: 'failed',
                                reason: reason
                            });
                            individualFailed++;
                        }
                    }

                    uploadedKnowledge = individualUploaded;
                    console.log(`知识点逐个上传完成：成功${individualUploaded}条，失败${individualFailed}条`);
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
    static async downloadFromCloud(
        onProgress?: (progress: { current: number; total: number; currentItem: string }) => void
    ): Promise<SyncResult> {
        try {
            let downloadedRecords: RecordItem[] = [];
            let downloadedPlans: StudyPlan[] = [];
            let downloadedKnowledge: KnowledgeItem[] = [];
            let settingsDownloaded: UserSettings | null = null;

            // Report initial progress
            onProgress?.({ current: 0, total: 4, currentItem: "开始下载数据..." });

            // 下载刷题历史
            try {
                onProgress?.({ current: 1, total: 4, currentItem: "正在下载刷题历史..." });
                downloadedRecords = await recordService.getRecords();
            } catch (error) {
                console.error('下载记录失败:', error);
            }

            // 下载学习计划
            try {
                onProgress?.({ current: 2, total: 4, currentItem: "正在下载学习计划..." });
                downloadedPlans = await planService.getPlans();
            } catch (error) {
                console.error('下载计划失败:', error);
            }

            // 下载知识点
            try {
                onProgress?.({ current: 3, total: 4, currentItem: "正在下载知识点..." });
                downloadedKnowledge = await knowledgeService.getKnowledge();
            } catch (error) {
                console.error('下载知识点失败:', error);
            }

            // 下载设置
            try {
                onProgress?.({ current: 4, total: 4, currentItem: "正在下载设置..." });
                settingsDownloaded = await settingsService.getSettings();
            } catch (error) {
                console.error('下载设置失败:', error);
            }

            // Report completion
            onProgress?.({ current: 4, total: 4, currentItem: "下载完成" });

            return {
                success: true,
                message: `成功下载 ${downloadedRecords.length} 条记录、${downloadedPlans.length} 个计划、${downloadedKnowledge.length} 条知识点`,
                details: {
                    records: { uploaded: 0, downloaded: downloadedRecords.length, skipped: 0 },
                    plans: { uploaded: 0, downloaded: downloadedPlans.length, skipped: 0 },
                    knowledge: { uploaded: 0, downloaded: downloadedKnowledge.length, skipped: 0 },
                    settings: { uploaded: false, downloaded: !!settingsDownloaded }
                },
                report: {
                    records: downloadedRecords.map(record => ({ item: record, action: 'uploaded' as const })),
                    plans: downloadedPlans.map(plan => ({ item: plan, action: 'uploaded' as const })),
                    knowledge: downloadedKnowledge.map(knowledge => ({ item: knowledge, action: 'uploaded' as const }))
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

    // 获取云端数据概览
    static async getCloudDataOverview(): Promise<CloudDataOverview> {
        const userId = await getCurrentUserId();
        if (!userId) {
            throw new Error('用户未登录');
        }

        const [recordsCount, plansCount, knowledgeCount, countdownsCount, notesCount] = await Promise.all([
            this.getRecordsCount(userId),
            this.getPlansCount(userId),
            this.getKnowledgeCount(userId),
            this.getCountdownsCount(userId),
            this.getNotesCount(userId)
        ]);

        // 简化设置检查，如果失败就默认为 false
        const hasSettings = await this.hasUserSettings(userId).catch(() => false);

        return {
            records: { count: recordsCount, recent: [], lastUpdated: await this.getLastUpdatedTime('exercise_records', userId) },
            plans: { count: plansCount, recent: [], lastUpdated: await this.getLastUpdatedTime('plans', userId) },
            knowledge: { count: knowledgeCount, recent: [], lastUpdated: await this.getLastUpdatedTime('knowledge', userId) },
            countdowns: { count: countdownsCount, recent: [], lastUpdated: await this.getLastUpdatedTime('exam_countdowns', userId) },
            notes: { count: notesCount, recent: [], lastUpdated: await this.getLastUpdatedTime('notes', userId) },
            settings: { hasSettings, lastUpdated: hasSettings ? await this.getLastUpdatedTime('user_settings', userId) : undefined }
        };
    }

    // 获取记录数量
    private static async getRecordsCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('exercise_records')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (error) {
                console.warn('获取记录数量失败:', error);
                return 0;
            }
            return count || 0;
        } catch (error) {
            console.warn('获取记录数量异常:', error);
            return 0;
        }
    }

    // 获取计划数量
    private static async getPlansCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('plans')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (error) {
                console.warn('获取计划数量失败:', error);
                return 0;
            }
            return count || 0;
        } catch (error) {
            console.warn('获取计划数量异常:', error);
            return 0;
        }
    }

    // 获取知识点数量
    private static async getKnowledgeCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('knowledge')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (error) {
                console.warn('获取知识点数量失败:', error);
                return 0;
            }
            return count || 0;
        } catch (error) {
            console.warn('获取知识点数量异常:', error);
            return 0;
        }
    }

    // 获取倒计时数量
    private static async getCountdownsCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('exam_countdowns')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (error) {
                console.warn('获取倒计时数量失败:', error);
                return 0;
            }
            return count || 0;
        } catch (error) {
            console.warn('获取倒计时数量异常:', error);
            return 0;
        }
    }

    // 获取笔记数量
    private static async getNotesCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('notes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_archived', false);

            if (error) {
                console.warn('获取笔记数量失败:', error);
                return 0;
            }
            return count || 0;
        } catch (error) {
            console.warn('获取笔记数量异常:', error);
            return 0;
        }
    }

    // 获取表最后更新时间
    private static async getLastUpdatedTime(tableName: string, userId: string): Promise<string | undefined> {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('updated_at')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (error) {
                console.warn(`获取${tableName}最后更新时间失败:`, error);
                return undefined;
            }

            return data && data.length > 0 ? data[0].updated_at : undefined;
        } catch (error) {
            console.warn(`获取${tableName}最后更新时间异常:`, error);
            return undefined;
        }
    }

    // 检查是否有用户设置
    private static async hasUserSettings(userId: string): Promise<boolean> {
        try {
            const { count, error } = await supabase
                .from('user_settings')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (error) {
                // 如果表不存在或查询失败，直接返回 false
                return false;
            }
            return (count || 0) > 0;
        } catch (error) {
            // 如果出现任何异常，返回 false
            return false;
        }
    }

    // 删除特定模块的云端数据
    static async clearSpecificCloudData(
        dataType: 'records' | 'plans' | 'knowledge' | 'countdowns' | 'settings',
        onProgress?: (progress: { current: number; total: number; currentItem: string }) => void
    ): Promise<{
        success: boolean;
        message: string;
        clearedCount: number;
    }> {
        try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;
            if (!userId) {
                return {
                    success: false,
                    message: '未登录，无法删除云端数据',
                    clearedCount: 0
                };
            }

            let clearedCount = 0;
            let tableName = '';
            let dataName = '';

            // 根据数据类型设置参数
            switch (dataType) {
                case 'records':
                    tableName = 'exercise_records';
                    dataName = '刷题历史';
                    const cloudRecords = await recordService.getRecords().catch(() => []);
                    clearedCount = cloudRecords.length;
                    break;
                case 'plans':
                    tableName = 'plans';
                    dataName = '学习计划';
                    const cloudPlans = await planService.getPlans().catch(() => []);
                    clearedCount = cloudPlans.length;
                    break;
                case 'knowledge':
                    tableName = 'knowledge';
                    dataName = '知识点';
                    const cloudKnowledge = await knowledgeService.getKnowledge().catch(() => []);
                    clearedCount = cloudKnowledge.length;
                    break;
                case 'countdowns':
                    tableName = 'exam_countdowns';
                    dataName = '考试倒计时';
                    // 倒计时数据可能没有单独的服务，需要直接查询
                    const { data: countdowns } = await supabase
                        .from('exam_countdowns')
                        .select('*')
                        .eq('user_id', userId);
                    clearedCount = countdowns?.length || 0;
                    break;
                case 'settings':
                    tableName = 'user_settings';
                    dataName = '设置';
                    const { data: settings } = await supabase
                        .from('user_settings')
                        .select('*')
                        .eq('user_id', userId);
                    clearedCount = settings?.length || 0;
                    break;
                default:
                    return {
                        success: false,
                        message: '不支持的数据类型',
                        clearedCount: 0
                    };
            }

            if (clearedCount === 0) {
                return {
                    success: true,
                    message: `${dataName}没有云端数据需要删除`,
                    clearedCount: 0
                };
            }

            onProgress?.({
                current: 1,
                total: 2,
                currentItem: `正在删除${dataName}...`
            });

            // 删除数据
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('user_id', userId);

            if (error) {
                console.error(`删除${dataName}失败:`, error);
                throw new Error(`删除${dataName}失败: ${error.message}`);
            }

            onProgress?.({
                current: 2,
                total: 2,
                currentItem: `${dataName}删除完成`
            });

            return {
                success: true,
                message: `成功删除 ${clearedCount} 条${dataName}数据`,
                clearedCount
            };

        } catch (error) {
            console.error(`删除特定模块数据失败:`, error);
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            return {
                success: false,
                message: `删除失败: ${errorMessage}`,
                clearedCount: 0
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

    // 保存设置到云端
    static async saveSettingsToCloud(settings: UserSettings): Promise<{ success: boolean; message: string }> {
        try {
            const userId = await getCurrentUserId();
            if (!userId) {
                return {
                    success: false,
                    message: '用户未登录，无法保存设置到云端'
                };
            }

            // 使用settingsService保存设置
            await settingsService.saveSettings(settings);

            return {
                success: true,
                message: '设置已成功保存到云端'
            };
        } catch (error) {
            console.error('保存设置到云端失败:', error);
            return {
                success: false,
                message: `保存设置失败: ${error instanceof Error ? error.message : '未知错误'}`
            };
        }
    }
} 