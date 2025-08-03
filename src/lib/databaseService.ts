import { supabase } from '../supabaseClient'
import { RecordItem, StudyPlan, KnowledgeItem } from '../types/record'
import { UserSettings } from '../types/common'

// 获取当前用户ID
const getCurrentUserId = () => {
    const user = supabase.auth.getUser()
    return user.then(({ data }) => data.user?.id)
}

// 刷题记录相关操作
export const recordService = {
    // 获取用户的所有刷题记录
    async getRecords(): Promise<RecordItem[]> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        const { data, error } = await supabase
            .from('exercise_records')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })

        if (error) throw error
        return data || []
    },

    // 添加新的刷题记录
    async addRecord(record: Omit<RecordItem, 'id'>): Promise<RecordItem> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        // 构建正确的数据对象，确保字段名与数据库表匹配
        const recordData = {
            user_id: userId,
            date: record.date,
            module: record.module,
            total: record.total,
            correct: record.correct,
            duration: record.duration
        }

        const { data, error } = await supabase
            .from('exercise_records')
            .insert([recordData])
            .select()
            .single()

        if (error) {
            console.error('刷题记录上传错误:', error)
            throw error
        }
        return data
    },

    // 更新刷题记录
    async updateRecord(id: number, updates: Partial<RecordItem>): Promise<RecordItem> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        const { data, error } = await supabase
            .from('exercise_records')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // 删除刷题记录
    async deleteRecord(id: number): Promise<void> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        const { error } = await supabase
            .from('exercise_records')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) throw error
    }
}

// 学习计划相关操作
export const planService = {
    // 获取用户的所有学习计划
    async getPlans(): Promise<StudyPlan[]> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    },

    // 添加新的学习计划
    async addPlan(plan: Omit<StudyPlan, 'id'>): Promise<StudyPlan> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        // 构建正确的数据对象，确保字段名与数据库表匹配
        // 注意：数据库表中使用了双引号包围的camelCase字段名
        const planData = {
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
        }

        const { data, error } = await supabase
            .from('plans')
            .insert([planData])
            .select()
            .single()

        if (error) {
            console.error('学习计划上传错误:', error)
            throw error
        }
        return data
    },

    // 更新学习计划
    async updatePlan(id: string, updates: Partial<StudyPlan>): Promise<StudyPlan> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        // 处理带有双引号的字段名
        const updateData: Record<string, unknown> = { ...updates };
        if ('startDate' in updateData) {
            updateData["startDate"] = updateData.startDate;
            delete updateData.startDate;
        }
        if ('endDate' in updateData) {
            updateData["endDate"] = updateData.endDate;
            delete updateData.endDate;
        }

        const { data, error } = await supabase
            .from('plans')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // 删除学习计划
    async deletePlan(id: string): Promise<void> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        const { error } = await supabase
            .from('plans')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) throw error
    }
}

// 知识点相关操作
export const knowledgeService = {
    // 获取用户的所有知识点
    async getKnowledge(): Promise<KnowledgeItem[]> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        const { data, error } = await supabase
            .from('knowledge')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    },

    // 添加新的知识点
    async addKnowledge(knowledge: Record<string, unknown>): Promise<KnowledgeItem> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        // 构建正确的数据对象，确保字段名与数据库表匹配
        // 注意：数据库表中使用了双引号包围的camelCase字段名
        const knowledgeData: Record<string, unknown> = {
            user_id: userId,
            module: knowledge.module,
            "imagePath": knowledge.imagePath
        };

        // 根据不同模块添加相应字段
        if ('type' in knowledge) knowledgeData.type = knowledge.type;
        if ('note' in knowledge) knowledgeData.note = knowledge.note;
        if ('subCategory' in knowledge) knowledgeData["subCategory"] = knowledge.subCategory;
        if ('date' in knowledge) knowledgeData.date = knowledge.date;
        if ('source' in knowledge) knowledgeData.source = knowledge.source;
        if ('idiom' in knowledge) knowledgeData.idiom = knowledge.idiom;
        if ('meaning' in knowledge) knowledgeData.meaning = knowledge.meaning;

        const { data, error } = await supabase
            .from('knowledge')
            .insert([knowledgeData])
            .select()
            .single()

        if (error) {
            console.error('知识点上传错误:', error)
            throw error
        }
        return data
    },

    // 更新知识点
    async updateKnowledge(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        // 处理带有双引号的字段名
        const updateData: Record<string, unknown> = { ...updates };
        if ('imagePath' in updateData) {
            updateData["imagePath"] = updateData.imagePath;
            delete updateData.imagePath;
        }
        if ('subCategory' in updateData) {
            updateData["subCategory"] = updateData.subCategory;
            delete updateData.subCategory;
        }

        const { data, error } = await supabase
            .from('knowledge')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // 删除知识点
    async deleteKnowledge(id: string): Promise<void> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        const { error } = await supabase
            .from('knowledge')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) throw error
    }
}

// 用户设置相关操作
export const settingsService = {
    // 获取用户设置
    async getSettings(): Promise<UserSettings> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        const { data, error } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116 表示没有找到记录
        return data?.settings || {}
    },

    // 保存用户设置
    async saveSettings(settings: UserSettings): Promise<void> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        const { error } = await supabase
            .from('user_settings')
            .upsert({ user_id: userId, settings }, { onConflict: 'user_id' })

        if (error) throw error
    }
} 