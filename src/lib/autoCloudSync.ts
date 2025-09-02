import { recordService, planService, knowledgeService, countdownService } from './databaseService';
import { RecordItem, StudyPlan, KnowledgeItem, ExamCountdown } from '../types/record';
import { useNotification } from '@/components/magicui/NotificationProvider';
import { normalizeModuleName } from '@/config/exam';

export class AutoCloudSync {
    /**
     * 自动保存刷题历史到云端
     */
    static async autoSaveRecord(record: RecordItem, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            await recordService.addRecord({
                id: record.id,
                date: record.date,
                module: record.module,
                total: record.total,
                correct: record.correct,
                duration: record.duration
            });

            notify({
                type: 'success',
                message: '记录已保存到云端',
                description: `${record.date} ${normalizeModuleName(record.module)} 做题记录已自动同步到云端`
            });
        } catch (error) {
            console.error('自动保存记录到云端失败:', error);
            notify({
                type: 'error',
                message: '云端保存失败',
                description: '记录已保存到本地，但云端同步失败，请稍后重试'
            });
        }
    }

    /**
     * 自动保存学习计划到云端
     */
    static async autoSavePlan(plan: StudyPlan, notify: ReturnType<typeof useNotification>['notify']) {
        try {
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

            notify({
                type: 'success',
                message: '计划已保存到云端',
                description: `学习计划"${plan.name}"已自动同步到云端`
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '无详细信息';

            console.error('自动保存计划到云端失败:', error);

            notify({
                type: 'error',
                message: '云端保存失败',
                description: `计划已保存到本地，但云端同步失败: ${errorMessage}`
            });
        }
    }

    /**
     * 自动保存考试倒计时到云端
     */
    static async autoSaveCountdown(countdown: ExamCountdown, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            await countdownService.addCountdown({
                name: countdown.name,
                examDate: countdown.examDate,
                description: countdown.description
            });

            notify({
                type: 'success',
                message: '倒计时已保存到云端',
                description: `考试倒计时"${countdown.name}"已自动同步到云端`
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '无详细信息';

            console.error('自动保存倒计时到云端失败:', error);

            notify({
                type: 'error',
                message: '云端保存失败',
                description: `倒计时已保存到本地，但云端同步失败: ${errorMessage}`
            });
        }
    }

    /**
     * 自动保存知识点到云端
     */
    static async autoSaveKnowledge(knowledge: KnowledgeItem, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            const knowledgeRecord = knowledge as Record<string, unknown>;

            // 数据清理函数
            const cleanValue = (value: unknown): unknown => {
                if (typeof value === 'string') {
                    // 移除 null 字符和其他控制字符，但保留文本格式化标记
                    // 保留 * (U+002A), { (U+007B), } (U+007D) 用于文本格式化
                    return value.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, '').trim();
                }
                return value;
            };

            const knowledgeData: Record<string, unknown> = {
                module: knowledge.module
            };

            // 处理不同类型的知识点字段，并进行数据清理
            // 确保 type 字段始终存在（对于 politics 模块，使用 source 作为 type）
            if ('type' in knowledgeRecord && knowledgeRecord.type) {
                knowledgeData.type = cleanValue(knowledgeRecord.type);
            } else if (knowledge.module === 'politics' && 'source' in knowledgeRecord && knowledgeRecord.source) {
                // 对于 politics 模块，如果 type 不存在但 source 存在，使用 source 作为 type
                knowledgeData.type = cleanValue(knowledgeRecord.source);
            } else if ('source' in knowledgeRecord && knowledgeRecord.source) {
                // 其他情况下，如果 type 不存在但 source 存在，使用 source 作为 type
                knowledgeData.type = cleanValue(knowledgeRecord.source);
            } else {
                // 如果都没有，使用默认值
                knowledgeData.type = '未分类';
            }

            // 确保 note 字段始终存在
            if ('note' in knowledgeRecord && knowledgeRecord.note) {
                knowledgeData.note = cleanValue(knowledgeRecord.note);
            } else {
                // 如果 note 不存在，使用默认值
                knowledgeData.note = '无内容';
            }

            // 处理其他字段 - 使用原始字段名
            if ('subCategory' in knowledgeRecord && knowledgeRecord.subCategory) {
                knowledgeData.subCategory = cleanValue(knowledgeRecord.subCategory);
            }
            if ('date' in knowledgeRecord && knowledgeRecord.date) {
                knowledgeData.date = cleanValue(knowledgeRecord.date);
            }
            if ('source' in knowledgeRecord && knowledgeRecord.source) {
                knowledgeData.source = cleanValue(knowledgeRecord.source);
            }
            if ('imagePath' in knowledgeRecord && knowledgeRecord.imagePath) {
                knowledgeData.imagePath = cleanValue(knowledgeRecord.imagePath);
            }

            await knowledgeService.addKnowledge(knowledgeData);

            notify({
                type: 'success',
                message: '知识点已保存到云端',
                description: '新的知识点已自动同步到云端'
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '无详细信息';

            console.error('自动保存知识点到云端失败:', error);

            notify({
                type: 'error',
                message: '云端保存失败',
                description: `知识点已保存到本地，但云端同步失败: ${errorMessage}`
            });
        }
    }

    /**
     * 自动更新学习计划到云端
     */
    static async autoUpdatePlan(plan: StudyPlan, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            // 检查计划ID是否为UUID格式
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(plan.id);

            if (!isUUID) {

                notify({
                    type: 'warning',
                    message: '本地更新成功',
                    description: `计划"${plan.name}"已更新到本地，但云端同步跳过（旧格式ID）`
                });
                return;
            }



            // 直接更新，不进行查重检查
            const result = await planService.updatePlan(plan.id, {
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



            notify({
                type: 'success',
                message: '计划已更新到云端',
                description: `学习计划"${plan.name}"已自动同步更新到云端`
            });
        } catch (error) {
            console.error('自动更新计划到云端失败:', error);

            const errorMessage = error instanceof Error ? error.message : String(error);

            notify({
                type: 'error',
                message: '云端更新失败',
                description: `计划已更新到本地，但云端同步失败: ${errorMessage}`
            });
        }
    }

    /**
     * 自动更新考试倒计时到云端
     */
    static async autoUpdateCountdown(countdown: ExamCountdown, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            // 检查倒计时ID是否为UUID格式
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(countdown.id);

            if (!isUUID) {

                notify({
                    type: 'warning',
                    message: '本地更新成功',
                    description: `倒计时"${countdown.name}"已更新到本地，但云端同步跳过（旧格式ID）`
                });
                return;
            }



            // 直接更新，不进行查重检查
            const result = await countdownService.updateCountdown(countdown.id, {
                name: countdown.name,
                examDate: countdown.examDate,
                description: countdown.description
            });



            notify({
                type: 'success',
                message: '倒计时已更新到云端',
                description: `考试倒计时"${countdown.name}"已自动同步更新到云端`
            });
        } catch (error) {
            console.error('自动更新倒计时到云端失败:', error);

            const errorMessage = error instanceof Error ? error.message : String(error);

            notify({
                type: 'error',
                message: '云端更新失败',
                description: `倒计时已更新到本地，但云端同步失败: ${errorMessage}`
            });
        }
    }

    /**
     * 自动更新知识点到云端
     */
    static async autoUpdateKnowledge(knowledge: KnowledgeItem, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            // 直接更新，不进行查重检查
            const knowledgeRecord = knowledge as Record<string, unknown>;

            // 数据清理函数
            const cleanValue = (value: unknown): unknown => {
                if (typeof value === 'string') {
                    // 移除 null 字符和其他控制字符，但保留文本格式化标记
                    // 保留 * (U+002A), { (U+007B), } (U+007D) 用于文本格式化
                    return value.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, '').trim();
                }
                return value;
            };

            const updateData: Record<string, unknown> = {
                module: knowledge.module
            };

            // 处理不同类型的知识点字段，并进行数据清理
            // 确保 type 字段始终存在（对于 politics 模块，使用 source 作为 type）
            if ('type' in knowledgeRecord && knowledgeRecord.type) {
                updateData.type = cleanValue(knowledgeRecord.type);
            } else if (knowledge.module === 'politics' && 'source' in knowledgeRecord && knowledgeRecord.source) {
                // 对于 politics 模块，如果 type 不存在但 source 存在，使用 source 作为 type
                updateData.type = cleanValue(knowledgeRecord.source);
            } else if ('source' in knowledgeRecord && knowledgeRecord.source) {
                // 其他情况下，如果 type 不存在但 source 存在，使用 source 作为 type
                updateData.type = cleanValue(knowledgeRecord.source);
            } else {
                // 如果都没有，使用默认值
                updateData.type = '未分类';
            }

            // 确保 note 字段始终存在
            if ('note' in knowledgeRecord && knowledgeRecord.note) {
                updateData.note = cleanValue(knowledgeRecord.note);
            } else {
                // 如果 note 不存在，使用默认值
                updateData.note = '无内容';
            }

            // 处理其他字段 - 使用原始字段名
            if ('subCategory' in knowledgeRecord && knowledgeRecord.subCategory) {
                updateData.subCategory = cleanValue(knowledgeRecord.subCategory);
            }
            if ('date' in knowledgeRecord && knowledgeRecord.date) {
                updateData.date = cleanValue(knowledgeRecord.date);
            }
            if ('source' in knowledgeRecord && knowledgeRecord.source) {
                updateData.source = cleanValue(knowledgeRecord.source);
            }
            if ('imagePath' in knowledgeRecord && knowledgeRecord.imagePath) {
                updateData.imagePath = cleanValue(knowledgeRecord.imagePath);
            }

            await knowledgeService.updateKnowledge(knowledge.id, updateData as Partial<KnowledgeItem>);

            notify({
                type: 'success',
                message: '知识点已更新到云端',
                description: '知识点已自动同步更新到云端'
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '无详细信息';

            console.error('自动更新知识点到云端失败:', error);

            notify({
                type: 'error',
                message: '云端更新失败',
                description: `知识点已更新到本地，但云端同步失败: ${errorMessage}`
            });
        }
    }

    /**
     * 自动删除记录从云端
     */
    static async autoDeleteRecord(recordId: string | number, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            // 只有UUID格式的ID才尝试从云端删除
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(recordId));

            if (!isUUID) {
                // 对于旧格式ID，不尝试云端删除，只通知用户
                console.log('跳过云端删除（旧格式ID）:', recordId);
                return;
            }

            await recordService.deleteRecord(recordId);
            notify({
                type: 'success',
                message: '记录已从云端删除',
                description: '记录已从云端同步删除'
            });
        } catch (error) {
            // 改进错误日志，提供更详细的错误信息
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '无详细信息';

            console.error('自动删除记录从云端失败:', {
                recordId,
                error: errorMessage,
                details: errorDetails
            });

            notify({
                type: 'error',
                message: '云端删除失败',
                description: `记录已从本地删除，但云端同步失败: ${errorMessage}`
            });
        }
    }

    /**
     * 自动删除计划从云端
     */
    static async autoDeletePlan(planId: string, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            await planService.deletePlan(planId);
            notify({
                type: 'success',
                message: '计划已从云端删除',
                description: '学习计划已从云端同步删除'
            });
        } catch (error) {
            // 改进错误日志，提供更详细的错误信息
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '未知错误';
            console.error('自动删除计划从云端失败:', error);

            notify({
                type: 'error',
                message: '云端删除失败',
                description: `计划已从本地删除，但云端同步失败: ${errorMessage}`
            });
        }
    }

    /**
     * 自动删除考试倒计时从云端
     */
    static async autoDeleteCountdown(countdownId: string, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            await countdownService.deleteCountdown(countdownId);
            notify({
                type: 'success',
                message: '倒计时已从云端删除',
                description: '考试倒计时已从云端同步删除'
            });
        } catch (error) {
            // 改进错误日志，提供更详细的错误信息
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('自动删除倒计时从云端失败:', error);

            notify({
                type: 'error',
                message: '云端删除失败',
                description: `倒计时已从本地删除，但云端同步失败: ${errorMessage}`
            });
        }
    }

    /**
     * 自动删除知识点从云端
     */
    static async autoDeleteKnowledge(knowledgeId: string, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            await knowledgeService.deleteKnowledge(knowledgeId);
            notify({
                type: 'success',
                message: '知识点已从云端删除',
                description: '知识点已从云端同步删除'
            });
        } catch (error) {
            // 改进错误日志，提供更详细的错误信息
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('自动删除知识点从云端失败:', error);

            notify({
                type: 'error',
                message: '云端删除失败',
                description: `知识点已从本地删除，但云端同步失败: ${errorMessage}`
            });
        }
    }
}