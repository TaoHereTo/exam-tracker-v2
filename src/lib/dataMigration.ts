import { recordService, planService, knowledgeService, settingsService } from './databaseService'
import { UserSettings } from '../types/common'

// 从localStorage读取数据的辅助函数
const getLocalStorageData = (key: string) => {
    if (typeof window === 'undefined') return null
    try {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : null
    } catch (error) {
        console.error(`Error reading localStorage key ${key}:`, error)
        return null
    }
}

// 迁移刷题记录
export const migrateRecords = async () => {
    const records = getLocalStorageData('exam-tracker-records-v2')
    if (!records || !Array.isArray(records)) {
        // No records to migrate
        return { success: true, count: 0 }
    }

    try {
        let successCount = 0
        for (const record of records) {
            // 移除id字段，让数据库自动生成
            const { id, ...recordData } = record
            await recordService.addRecord(recordData)
            successCount++
        }

        // Successfully migrated records
        return { success: true, count: successCount }
    } catch (error) {
        console.error('Error migrating records:', error)
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) }
    }
}

// 迁移学习计划
export const migratePlans = async () => {
    const plans = getLocalStorageData('exam-tracker-plans-v2')
    if (!plans || !Array.isArray(plans)) {
        // No plans to migrate
        return { success: true, count: 0 }
    }

    try {
        let successCount = 0
        for (const plan of plans) {
            // 移除id字段，让数据库自动生成
            const { id, ...planData } = plan
            await planService.addPlan(planData)
            successCount++
        }

        // Successfully migrated plans
        return { success: true, count: successCount }
    } catch (error) {
        console.error('Error migrating plans:', error)
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) }
    }
}

// 迁移知识点
export const migrateKnowledge = async () => {
    const knowledge = getLocalStorageData('exam-tracker-knowledge-v2')
    if (!knowledge || !Array.isArray(knowledge)) {
        // No knowledge to migrate
        return { success: true, count: 0 }
    }

    try {
        let successCount = 0
        for (const item of knowledge) {
            // 移除id字段，让数据库自动生成
            const { id, ...itemData } = item
            await knowledgeService.addKnowledge(itemData)
            successCount++
        }

        // Successfully migrated knowledge items
        return { success: true, count: successCount }
    } catch (error) {
        console.error('Error migrating knowledge:', error)
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) }
    }
}

// 迁移用户设置
export const migrateSettings = async () => {
    // 收集所有可能的设置键
    const settingKeys = [
        'exam-tracker-nav-mode',
        'exam-tracker-page-size',
        'exam-tracker-theme',
        'exam-tracker-reduce-motion',
        // 添加其他设置键
    ]

    const settings: UserSettings = {}

    for (const key of settingKeys) {
        const value = getLocalStorageData(key)
        if (value !== null) {
            settings[key] = value
        }
    }

    if (Object.keys(settings).length === 0) {
        // No settings to migrate
        return { success: true, count: 0 }
    }

    try {
        await settingsService.saveSettings(settings)
        // Successfully migrated settings
        return { success: true, count: Object.keys(settings).length }
    } catch (error) {
        console.error('Error migrating settings:', error)
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) }
    }
}

// 执行完整的数据迁移
export const migrateAllData = async () => {
    // Starting data migration...

    const results = {
        records: await migrateRecords(),
        plans: await migratePlans(),
        knowledge: await migrateKnowledge(),
        settings: await migrateSettings()
    }

    const totalMigrated = Object.values(results).reduce((sum, result) => {
        return sum + (result.success ? (result.count || 0) : 0)
    }, 0)

    const hasErrors = Object.values(results).some(result => !result.success)

    // Migration completed
    console.log('Migration completed', {
        totalMigrated,
        hasErrors,
        results
    });

    return {
        success: !hasErrors,
        totalMigrated,
        results
    };
}

// 清理localStorage数据（可选）
export const clearLocalStorageData = () => {
    if (typeof window === 'undefined') return

    const keysToRemove = [
        'exam-tracker-records-v2',
        'exam-tracker-plans-v2',
        'exam-tracker-knowledge-v2',
        'exam-tracker-nav-mode',
        'exam-tracker-page-size',
        'exam-tracker-theme',
        'exam-tracker-reduce-motion'
    ]

    keysToRemove.forEach(key => {
        localStorage.removeItem(key)
    })

    // LocalStorage data cleared
} 