import { recordService, planService, knowledgeService } from './databaseService';
import { RecordItem, StudyPlan, KnowledgeItem } from '../types/record';
import { useNotification } from '@/components/magicui/NotificationProvider';

export class AutoCloudSync {
    /**
     * 自动保存刷题记录到云端
     */
    static async autoSaveRecord(record: RecordItem, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            await recordService.addRecord({
                date: record.date,
                module: record.module,
                total: record.total,
                correct: record.correct,
                duration: record.duration
            });

            notify({
                type: 'success',
                message: '记录已保存到云端',
                description: `${record.date} ${record.module} 做题记录已自动同步到云端`
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
            console.error('自动保存计划到云端失败:', error);
            notify({
                type: 'error',
                message: '云端保存失败',
                description: '计划已保存到本地，但云端同步失败，请稍后重试'
            });
        }
    }

    /**
     * 自动保存知识点到云端
     */
    static async autoSaveKnowledge(knowledge: KnowledgeItem, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            const knowledgeRecord = knowledge as Record<string, unknown>;
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

            await knowledgeService.addKnowledge(knowledgeData);

            notify({
                type: 'success',
                message: '知识点已保存到云端',
                description: '新的知识点已自动同步到云端'
            });
        } catch (error) {
            console.error('自动保存知识点到云端失败:', error);
            notify({
                type: 'error',
                message: '云端保存失败',
                description: '知识点已保存到本地，但云端同步失败，请稍后重试'
            });
        }
    }

    /**
     * 自动更新学习计划到云端
     */
    static async autoUpdatePlan(plan: StudyPlan, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            await planService.updatePlan(plan.id, {
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
            notify({
                type: 'error',
                message: '云端更新失败',
                description: '计划已更新到本地，但云端同步失败，请稍后重试'
            });
        }
    }

    /**
     * 自动更新知识点到云端
     */
    static async autoUpdateKnowledge(knowledge: KnowledgeItem, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            const knowledgeRecord = knowledge as Record<string, unknown>;
            const updateData: Record<string, unknown> = {
                module: knowledge.module,
                imagePath: knowledgeRecord.imagePath
            };

            // 根据不同模块添加相应字段
            if ('type' in knowledgeRecord) updateData.type = knowledgeRecord.type;
            if ('note' in knowledgeRecord) updateData.note = knowledgeRecord.note;
            if ('subCategory' in knowledgeRecord) updateData.subCategory = knowledgeRecord.subCategory;
            if ('date' in knowledgeRecord) updateData.date = knowledgeRecord.date;
            if ('source' in knowledgeRecord) updateData.source = knowledgeRecord.source;
            if ('idiom' in knowledgeRecord) updateData.idiom = knowledgeRecord.idiom;
            if ('meaning' in knowledgeRecord) updateData.meaning = knowledgeRecord.meaning;

            await knowledgeService.updateKnowledge(knowledge.id, updateData as Partial<KnowledgeItem>);

            notify({
                type: 'success',
                message: '知识点已更新到云端',
                description: '知识点已自动同步更新到云端'
            });
        } catch (error) {
            console.error('自动更新知识点到云端失败:', error);
            notify({
                type: 'error',
                message: '云端更新失败',
                description: '知识点已更新到本地，但云端同步失败，请稍后重试'
            });
        }
    }

    /**
     * 自动删除记录从云端
     */
    static async autoDeleteRecord(recordId: number, notify: ReturnType<typeof useNotification>['notify']) {
        try {
            await recordService.deleteRecord(recordId);
            notify({
                type: 'success',
                message: '记录已从云端删除',
                description: '记录已从云端同步删除'
            });
        } catch (error) {
            console.error('自动删除记录从云端失败:', error);
            notify({
                type: 'error',
                message: '云端删除失败',
                description: '记录已从本地删除，但云端同步失败，请稍后重试'
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
            console.error('自动删除计划从云端失败:', error);
            notify({
                type: 'error',
                message: '云端删除失败',
                description: '计划已从本地删除，但云端同步失败，请稍后重试'
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
            console.error('自动删除知识点从云端失败:', error);
            notify({
                type: 'error',
                message: '云端删除失败',
                description: '知识点已从本地删除，但云端同步失败，请稍后重试'
            });
        }
    }
} 