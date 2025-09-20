import { recordService, planService, knowledgeService, countdownService } from './databaseService';
import { RecordItem, StudyPlan, KnowledgeItem, ExamCountdown } from '../types/record';
import { useNotification } from '@/components/magicui/NotificationProvider';
import { normalizeModuleName } from '@/config/exam';

// Define the extended notification interface
interface ExtendedNotificationContext {
    notify: (n: Omit<import('@/components/magicui/NotificationProvider').Notification, "id">) => void;
    notifyLoading?: (message: string, description?: string) => string;
    updateToSuccess?: (id: string, message: string, description?: string) => void;
    updateToError?: (id: string, message: string, description?: string) => void;
}

export class AutoCloudSync {
    /**
     * 自动保存刷题历史到云端
     */
    static async autoSaveRecord(record: RecordItem, notify: ExtendedNotificationContext) {
        // Create loading notification
        const toastId = notify.notifyLoading ? notify.notifyLoading('正在保存记录到云端...', `${record.date} ${normalizeModuleName(record.module)} 做题记录正在同步到云端`) : null;

        try {
            await recordService.addRecord({
                id: record.id,
                date: record.date,
                module: record.module,
                total: record.total,
                correct: record.correct,
                duration: record.duration
            });

            // Update to success
            if (toastId && notify.updateToSuccess) {
                notify.updateToSuccess(toastId, '记录已保存到云端', `${record.date} ${normalizeModuleName(record.module)} 做题记录已自动同步到云端`);
            } else {
                // Fallback to regular notification
                notify.notify({
                    type: 'success',
                    message: '记录已保存到云端',
                    description: `${record.date} ${normalizeModuleName(record.module)} 做题记录已自动同步到云端`
                });
            }
        } catch (error) {
            console.error('自动保存记录到云端失败:', error);

            // Update to error
            if (toastId && notify.updateToError) {
                notify.updateToError(toastId, '云端保存失败', '记录已保存到本地，但云端同步失败，请稍后重试');
            } else {
                // Fallback to regular notification
                notify.notify({
                    type: 'error',
                    message: '云端保存失败',
                    description: '记录已保存到本地，但云端同步失败，请稍后重试'
                });
            }
        }
    }

    /**
     * 自动更新刷题历史到云端
     */
    static async autoUpdateRecord(record: RecordItem, notify: ExtendedNotificationContext) {
        // Create loading notification
        const toastId = notify.notifyLoading ? notify.notifyLoading('正在更新记录到云端...', '刷题记录正在同步到云端') : null;

        try {
            await recordService.updateRecord(record.id, {
                date: record.date,
                module: record.module,
                total: record.total,
                correct: record.correct,
                duration: record.duration
            });

            // Update to success
            if (toastId && notify.updateToSuccess) {
                notify.updateToSuccess(toastId, '记录已更新到云端', '刷题记录已自动同步到云端');
            } else {
                notify.notify({
                    type: 'success',
                    message: '记录已更新到云端',
                    description: '刷题记录已自动同步到云端'
                });
            }
        } catch (error) {
            // 改进错误日志，提供更详细的错误信息
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '未知错误';
            console.error('自动更新记录到云端失败:', error);

            // Update to error
            if (toastId && notify.updateToError) {
                notify.updateToError(toastId, '云端更新失败', `记录已保存到本地，但云端同步失败: ${errorMessage}`);
            } else {
                notify.notify({
                    type: 'error',
                    message: '云端更新失败',
                    description: `记录已保存到本地，但云端同步失败: ${errorMessage}`
                });
            }
        }
    }

    /**
     * 自动保存学习计划到云端
     */
    static async autoSavePlan(plan: StudyPlan, notify: ExtendedNotificationContext): Promise<StudyPlan | null> {
        // Create loading notification
        const toastId = notify.notifyLoading ? notify.notifyLoading('正在保存计划到云端...', `学习计划"${plan.name}"正在同步到云端`) : null;

        try {
            const savedPlan = await planService.addPlan({
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

            // Update to success
            if (toastId && notify.updateToSuccess) {
                notify.updateToSuccess(toastId, '计划已保存到云端', `学习计划"${plan.name}"已自动同步到云端`);
            } else {
                notify.notify({
                    type: 'success',
                    message: '计划已保存到云端',
                    description: `学习计划"${plan.name}"已自动同步到云端`
                });
            }

            return savedPlan;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '无详细信息';

            console.error('自动保存计划到云端失败:', error);

            // Update to error
            if (toastId && notify.updateToError) {
                notify.updateToError(toastId, '云端保存失败', `计划已保存到本地，但云端同步失败: ${errorMessage}`);
            } else {
                notify.notify({
                    type: 'error',
                    message: '云端保存失败',
                    description: `计划已保存到本地，但云端同步失败: ${errorMessage}`
                });
            }

            return null;
        }
    }

    /**
     * 自动保存考试倒计时到云端
     */
    static async autoSaveCountdown(countdown: ExamCountdown, notify: ExtendedNotificationContext): Promise<ExamCountdown | null> {
        // Create loading notification
        const toastId = notify.notifyLoading ? notify.notifyLoading('正在保存倒计时到云端...', `考试倒计时"${countdown.name}"正在同步到云端`) : null;

        try {
            const savedCountdown = await countdownService.addCountdown({
                name: countdown.name,
                examDate: countdown.examDate,
                description: countdown.description
            });

            // Update to success
            if (toastId && notify.updateToSuccess) {
                notify.updateToSuccess(toastId, '倒计时已保存到云端', `考试倒计时"${countdown.name}"已自动同步到云端`);
            } else {
                notify.notify({
                    type: 'success',
                    message: '倒计时已保存到云端',
                    description: `考试倒计时"${countdown.name}"已自动同步到云端`
                });
            }

            return savedCountdown;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '无详细信息';

            console.error('自动保存倒计时到云端失败:', error);

            // Update to error
            if (toastId && notify.updateToError) {
                notify.updateToError(toastId, '云端保存失败', `倒计时已保存到本地，但云端同步失败: ${errorMessage}`);
            } else {
                notify.notify({
                    type: 'error',
                    message: '云端保存失败',
                    description: `倒计时已保存到本地，但云端同步失败: ${errorMessage}`
                });
            }

            return null;
        }
    }

    /**
     * 自动保存知识点到云端
     */
    static async autoSaveKnowledge(knowledge: KnowledgeItem, notify: ExtendedNotificationContext, showNotifications: boolean = true) {
        // Create loading notification only if notifications should be shown
        const toastId = showNotifications && notify.notifyLoading ? notify.notifyLoading('正在保存知识点到云端...', '新的知识点正在同步到云端') : null;

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

            // Update to success only if notifications should be shown
            if (showNotifications) {
                if (toastId && notify.updateToSuccess) {
                    notify.updateToSuccess(toastId, '知识点已保存到云端', '新的知识点已自动同步到云端');
                } else {
                    // Restored per user request - show cloud sync status when saving knowledge
                    notify.notify({
                        type: 'success',
                        message: '知识点已保存到云端',
                        description: '新的知识点已自动同步到云端'
                    });
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '无详细信息';

            console.error('自动保存知识点到云端失败:', error);

            // Update to error only if notifications should be shown
            if (showNotifications) {
                if (toastId && notify.updateToError) {
                    notify.updateToError(toastId, '云端保存失败', `知识点已保存到本地，但云端同步失败: ${errorMessage}`);
                } else {
                    // Restored per user request - show cloud sync status when saving knowledge
                    notify.notify({
                        type: 'error',
                        message: '云端保存失败',
                        description: `知识点已保存到本地，但云端同步失败: ${errorMessage}`
                    });
                }
            }
        }
    }

    /**
     * 自动更新学习计划到云端
     */
    static async autoUpdatePlan(plan: StudyPlan, notify: ExtendedNotificationContext): Promise<StudyPlan | null> {
        try {
            // 检查计划ID是否为UUID格式
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(plan.id);

            if (!isUUID) {
                // Removed per user request - only show notification on knowledge save
                // notify.notify({
                //     type: 'warning',
                //     message: '本地更新成功',
                //     description: `计划"${plan.name}"已更新到本地，但云端同步跳过（旧格式ID）`
                // });
                return null;
            }

            // Create loading notification
            const toastId = notify.notifyLoading ? notify.notifyLoading('正在更新计划到云端...', `学习计划"${plan.name}"正在同步到云端`) : null;

            // 自动更新到云端
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

            // Update to success
            if (toastId && notify.updateToSuccess) {
                notify.updateToSuccess(toastId, '计划已更新到云端', `学习计划"${plan.name}"已自动同步到云端`);
            } else {
                notify.notify({
                    type: 'success',
                    message: '计划已更新到云端',
                    description: `学习计划"${plan.name}"已自动同步到云端`
                });
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '无详细信息';

            console.error('自动更新计划到云端失败:', error);

            // 如果错误是记录不存在，尝试重新创建
            if (errorMessage.includes('学习计划记录不存在') || errorMessage.includes('没有权限访问该记录')) {
                console.log('记录不存在，尝试重新创建学习计划到云端...');

                try {
                    const savedPlan = await planService.addPlan({
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

                    notify.notify({
                        type: 'success',
                        message: '计划已重新创建到云端',
                        description: `学习计划"${plan.name}"已重新同步到云端`
                    });

                    return savedPlan;
                } catch (createError) {
                    console.error('重新创建学习计划失败:', createError);
                    const createErrorMessage = createError instanceof Error ? createError.message : String(createError);

                    notify.notify({
                        type: 'error',
                        message: '云端同步失败',
                        description: `计划已保存到本地，但云端同步失败: ${createErrorMessage}`
                    });
                }
            } else {
                // Update to error
                if (notify.notifyLoading) {
                    // If we have the extended notification system, try to show error
                    const toastId = notify.notifyLoading('正在更新计划到云端...', `学习计划"${plan.name}"正在同步到云端`);
                    if (toastId && notify.updateToError) {
                        notify.updateToError(toastId, '云端更新失败', `计划已保存到本地，但云端同步失败: ${errorMessage}`);
                    } else {
                        notify.notify({
                            type: 'error',
                            message: '云端更新失败',
                            description: `计划已保存到本地，但云端同步失败: ${errorMessage}`
                        });
                    }
                } else {
                    // Fallback to regular notification
                    notify.notify({
                        type: 'error',
                        message: '云端更新失败',
                        description: `计划已保存到本地，但云端同步失败: ${errorMessage}`
                    });
                }
            }

            return null;
        }
    }

    /**
     * 自动更新考试倒计时到云端
     */
    static async autoUpdateCountdown(countdown: ExamCountdown, notify: ExtendedNotificationContext): Promise<ExamCountdown | null> {
        try {
            // 检查倒计时ID是否为UUID格式
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(countdown.id);

            if (!isUUID) {
                // Removed per user request - only show notification on knowledge save
                // notify({
                //     type: 'warning',
                //     message: '本地更新成功',
                //     description: `倒计时"${countdown.name}"已更新到本地，但云端同步跳过（旧格式ID）`
                // });
                return null;
            }

            // Directly update without duplicate checking
            const result = await countdownService.updateCountdown(countdown.id, {
                name: countdown.name,
                examDate: countdown.examDate,
                description: countdown.description
            });

            // Restored per user request - keep countdown update notifications
            notify.notify({
                type: 'success',
                message: '倒计时已更新到云端',
                description: `考试倒计时"${countdown.name}"已自动同步更新到云端`
            });

            return result;
        } catch (error) {
            console.error('自动更新倒计时到云端失败:', error);

            const errorMessage = error instanceof Error ? error.message : String(error);

            // 如果错误是记录不存在，尝试重新创建
            if (errorMessage.includes('倒计时记录不存在') || errorMessage.includes('没有权限访问该记录')) {
                console.log('记录不存在，尝试重新创建倒计时到云端...');

                try {
                    const savedCountdown = await countdownService.addCountdown({
                        name: countdown.name,
                        examDate: countdown.examDate,
                        description: countdown.description
                    });

                    notify.notify({
                        type: 'success',
                        message: '倒计时已重新创建到云端',
                        description: `考试倒计时"${countdown.name}"已重新同步到云端`
                    });

                    return savedCountdown;
                } catch (createError) {
                    console.error('重新创建倒计时失败:', createError);
                    const createErrorMessage = createError instanceof Error ? createError.message : String(createError);

                    notify.notify({
                        type: 'error',
                        message: '云端同步失败',
                        description: `倒计时已更新到本地，但云端同步失败: ${createErrorMessage}`
                    });
                }
            } else {
                // Restored per user request - keep countdown update notifications
                notify.notify({
                    type: 'error',
                    message: '云端更新失败',
                    description: `倒计时已更新到本地，但云端同步失败: ${errorMessage}`
                });
            }

            return null;
        }
    }

    /**
     * 自动更新知识点到云端
     */
    static async autoUpdateKnowledge(knowledge: KnowledgeItem, notify: ExtendedNotificationContext) {
        // Create loading notification
        const toastId = notify.notifyLoading ? notify.notifyLoading('正在更新知识点到云端...', '知识点正在同步到云端') : null;

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

            await knowledgeService.updateKnowledge(knowledge.id, knowledgeData);

            // Update to success
            if (toastId && notify.updateToSuccess) {
                notify.updateToSuccess(toastId, '知识点已更新到云端', '知识点已自动同步到云端');
            } else {
                notify.notify({
                    type: 'success',
                    message: '知识点已更新到云端',
                    description: '知识点已自动同步到云端'
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '无详细信息';

            console.error('自动更新知识点到云端失败:', error);

            // Update to error
            if (toastId && notify.updateToError) {
                notify.updateToError(toastId, '云端更新失败', `知识点已保存到本地，但云端同步失败: ${errorMessage}`);
            } else {
                notify.notify({
                    type: 'error',
                    message: '云端更新失败',
                    description: `知识点已保存到本地，但云端同步失败: ${errorMessage}`
                });
            }
        }
    }

    /**
     * 自动删除刷题历史从云端
     */
    static async autoDeleteRecord(recordId: string, notify: ExtendedNotificationContext) {
        // Create loading notification only if notifyLoading is provided
        const toastId = notify.notifyLoading ? notify.notifyLoading('正在从云端删除记录...', '刷题记录正在从云端同步删除') : null;

        try {
            await recordService.deleteRecord(recordId);

            // Update to success only if updateToSuccess is provided
            if (toastId && notify.updateToSuccess) {
                notify.updateToSuccess(toastId, '记录已从云端删除', '刷题记录已从云端同步删除');
            } else if (!toastId && notify.notify) {
                // Only show notification if no toastId was created (meaning notifyLoading was not provided)
                notify.notify({
                    type: 'success',
                    message: '记录已从云端删除',
                    description: '刷题记录已从云端同步删除'
                });
            }
        } catch (error) {
            // 改进错误日志，提供更详细的错误信息
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('自动删除记录从云端失败:', error);

            // Update to error only if updateToError is provided
            if (toastId && notify.updateToError) {
                notify.updateToError(toastId, '云端删除失败', `记录已从本地删除，但云端同步失败: ${errorMessage}`);
            } else if (!toastId && notify.notify) {
                // Only show notification if no toastId was created (meaning notifyLoading was not provided)
                notify.notify({
                    type: 'error',
                    message: '云端删除失败',
                    description: `记录已从本地删除，但云端同步失败: ${errorMessage}`
                });
            }
        }
    }

    /**
     * 自动删除学习计划从云端
     */
    static async autoDeletePlan(planId: string, notify: ExtendedNotificationContext) {
        // Create loading notification
        const toastId = notify.notifyLoading ? notify.notifyLoading('正在从云端删除计划...', '学习计划正在从云端同步删除') : null;

        try {
            await planService.deletePlan(planId);

            // Update to success
            if (toastId && notify.updateToSuccess) {
                notify.updateToSuccess(toastId, '计划已从云端删除', '学习计划已从云端同步删除');
            } else {
                notify.notify({
                    type: 'success',
                    message: '计划已从云端删除',
                    description: '学习计划已从云端同步删除'
                });
            }
        } catch (error) {
            // 改进错误日志，提供更详细的错误信息
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof Error ? error.stack : '未知错误';
            console.error('自动删除计划从云端失败:', error);

            // Update to error
            if (toastId && notify.updateToError) {
                notify.updateToError(toastId, '云端删除失败', `计划已从本地删除，但云端同步失败: ${errorMessage}`);
            } else {
                // Restored per user request - keep plan delete notifications
                notify.notify({
                    type: 'error',
                    message: '云端删除失败',
                    description: `计划已从本地删除，但云端同步失败: ${errorMessage}`
                });
            }
        }
    }

    /**
     * 自动删除考试倒计时从云端
     */
    static async autoDeleteCountdown(countdownId: string, notify: ExtendedNotificationContext) {
        // Create loading notification
        const toastId = notify.notifyLoading ? notify.notifyLoading('正在从云端删除倒计时...', '考试倒计时正在从云端同步删除') : null;

        try {
            await countdownService.deleteCountdown(countdownId);

            // Update to success
            if (toastId && notify.updateToSuccess) {
                notify.updateToSuccess(toastId, '倒计时已从云端删除', '考试倒计时已从云端同步删除');
            } else {
                // Restored per user request - keep countdown delete notifications
                notify.notify({
                    type: 'success',
                    message: '倒计时已从云端删除',
                    description: '考试倒计时已从云端同步删除'
                });
            }
        } catch (error) {
            // 改进错误日志，提供更详细的错误信息
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('自动删除倒计时从云端失败:', error);

            // Update to error
            if (toastId && notify.updateToError) {
                notify.updateToError(toastId, '云端删除失败', `倒计时已从本地删除，但云端同步失败: ${errorMessage}`);
            } else {
                // Restored per user request - keep countdown delete notifications
                notify.notify({
                    type: 'error',
                    message: '云端删除失败',
                    description: `倒计时已从本地删除，但云端同步失败: ${errorMessage}`
                });
            }
        }
    }

    /**
     * 自动删除知识点从云端
     */
    static async autoDeleteKnowledge(knowledgeId: string, notify: ExtendedNotificationContext) {
        // Create loading notification
        const toastId = notify.notifyLoading ? notify.notifyLoading('正在从云端删除知识点...', '知识点正在从云端同步删除') : null;

        try {
            await knowledgeService.deleteKnowledge(knowledgeId);

            // Update to success
            if (toastId && notify.updateToSuccess) {
                notify.updateToSuccess(toastId, '知识点已从云端删除', '知识点已从云端同步删除');
            } else {
                // Restored per user request - keep notifications in knowledge summary view
                notify.notify({
                    type: 'success',
                    message: '知识点已从云端删除',
                    description: '知识点已从云端同步删除'
                });
            }
        } catch (error) {
            // 改进错误日志，提供更详细的错误信息
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('自动删除知识点从云端失败:', error);

            // Update to error
            if (toastId && notify.updateToError) {
                notify.updateToError(toastId, '云端删除失败', `知识点已从本地删除，但云端同步失败: ${errorMessage}`);
            } else {
                // Restored per user request - keep notifications in knowledge summary view
                notify.notify({
                    type: 'error',
                    message: '云端删除失败',
                    description: `知识点已从本地删除，但云端同步失败: ${errorMessage}`
                });
            }
        }
    }
}
