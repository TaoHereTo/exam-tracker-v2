import { supabase } from '../supabaseClient'
import { RecordItem, StudyPlan, KnowledgeItem } from '../types/record'
import { UserSettings } from '../types/record'

// 获取当前用户ID
const getCurrentUserId = async () => {
    try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            throw error;
        }

        return data.user?.id;
    } catch (error) {
        throw error;
    }
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
            throw error
        }
        return data
    },



    // 删除刷题记录
    async deleteRecord(id: string | number): Promise<void> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        const { error } = await supabase
            .from('exercise_records')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            throw error;
        }
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
            console.error('学习计划上传错误:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                planData: planData,
                userId: userId,
                fullError: error
            });
            throw new Error(`学习计划上传失败: ${error.message || '未知错误'}`);
        }
        return data
    },

    // 更新学习计划
    async updatePlan(id: string, updates: Partial<StudyPlan>): Promise<StudyPlan> {
        try {
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

            if (error) {
                throw new Error(`学习计划更新失败: ${error.message || '未知错误'}`);
            }

            return data
        } catch (error) {
            throw error;
        }
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

        if (error) {
            throw error;
        }
    }
}

// 知识点相关操作
export const knowledgeService = {
    // 测试数据库连接
    async testConnection(): Promise<boolean> {
        try {
            const userId = await getCurrentUserId()
            if (!userId) return false

            const { data, error } = await supabase
                .from('knowledge')
                .select('id')
                .limit(1)

            if (error) {
                console.error('数据库连接测试失败:', error);
                return false;
            }


            return true;
        } catch (error) {
            console.error('数据库连接测试异常:', error);
            return false;
        }
    },

    // 检查知识点是否存在
    async checkKnowledgeExists(id: string): Promise<boolean> {
        try {
            const userId = await getCurrentUserId()
            if (!userId) return false

            const { data, error } = await supabase
                .from('knowledge')
                .select('id')
                .eq('id', id)
                .eq('user_id', userId)

            if (error) {
                console.log('检查知识点存在性失败:', {
                    knowledgeId: id,
                    userId: userId,
                    error: error.message,
                    code: error.code
                });
                return false;
            }

            const exists = data && data.length > 0;
            console.log('知识点存在:', {
                knowledgeId: id,
                userId: userId,
                hasData: exists,
                count: data?.length || 0
            });
            return exists;
        } catch (error) {
            console.error('检查知识点存在性异常:', error);
            return false;
        }
    },
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
        const knowledgeData: Record<string, unknown> = {
            user_id: userId,
            module: knowledge.module
        };

        // 处理不同类型的知识点字段
        // 处理知识点字段
        if ('type' in knowledge) knowledgeData.type = knowledge.type;
        if ('note' in knowledge) knowledgeData.note = knowledge.note;

        // 处理其他字段 - 使用原始字段名
        if ('subCategory' in knowledge) knowledgeData.subCategory = knowledge.subCategory;
        if ('date' in knowledge) knowledgeData.date = knowledge.date;
        if ('source' in knowledge) knowledgeData.source = knowledge.source;
        if ('imagePath' in knowledge) knowledgeData.imagePath = knowledge.imagePath;

        const { data, error } = await supabase
            .from('knowledge')
            .insert([knowledgeData])
            .select()
            .single()

        if (error) {
            throw new Error(`知识点上传失败: ${error.message || '未知错误'}`)
        }
        return data
    },

    // 更新知识点
    async updateKnowledge(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        // 先测试数据库连接
        const connectionOk = await this.testConnection();
        if (!connectionOk) {
            throw new Error('数据库连接失败，请检查网络连接');
        }

        // 检查知识点是否存在
        const knowledgeExists = await this.checkKnowledgeExists(id);
        if (!knowledgeExists) {


            // 如果知识点不存在，尝试创建新记录
            try {
                const knowledgeData: Record<string, unknown> = {
                    id: id, // 使用提供的ID
                    user_id: userId,
                    module: updates.module
                };

                // 处理不同类型的知识点字段
                if ('type' in updates) knowledgeData.type = updates.type;
                if ('note' in updates) knowledgeData.note = updates.note;
                if ('subCategory' in updates) knowledgeData.subCategory = updates.subCategory;
                if ('date' in updates) knowledgeData.date = updates.date;
                if ('source' in updates) knowledgeData.source = updates.source;
                if ('imagePath' in updates) knowledgeData.imagePath = updates.imagePath;

                const { data, error } = await supabase
                    .from('knowledge')
                    .insert([knowledgeData])
                    .select()
                    .single()

                if (error) {
                    throw new Error(`创建知识点失败: ${error.message}`);
                }
                return data;
            } catch (error) {
                throw new Error(`知识点不存在且无法创建: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // 数据清理函数
        const cleanValue = (value: unknown): unknown => {
            if (typeof value === 'string') {
                // 移除 null 字符和其他控制字符
                return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
            }
            return value;
        };

        // 确保字段名使用正确的格式
        const updateData: Record<string, unknown> = { ...updates };

        // 清理所有字符串值
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && updateData[key] !== null) {
                updateData[key] = cleanValue(updateData[key]);
            }
        });

        // 确保数据类型正确
        if ('date' in updateData && updateData.date) {
            // 确保日期格式正确
            if (typeof updateData.date === 'string') {
                const dateValue = new Date(updateData.date);
                if (!isNaN(dateValue.getTime())) {
                    updateData.date = dateValue.toISOString().split('T')[0]; // YYYY-MM-DD 格式
                } else {

                    delete updateData.date;
                }
            }
        }

        // 移除空字符串
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === '') {
                delete updateData[key];
            }
        });

        // 简化字段处理 - 直接使用原始字段名
        // 如果数据库表使用带引号的字段名，这里不做转换
        // 让 Supabase 客户端自己处理字段映射

        // 添加详细的调试信息
        console.log('databaseService.updateKnowledge - 开始更新知识点:', {
            knowledgeId: id,
            userId: userId,
            originalUpdates: updates,
            processedUpdateData: updateData,
            updateDataKeys: Object.keys(updateData),
            updateDataValues: Object.values(updateData)
        });

        // 检查数据中是否有特殊字符或无效值
        const invalidValues = Object.entries(updateData).filter(([key, value]) => {
            if (value === undefined || value === null) return false;
            if (typeof value === 'string' && value.includes('\u0000')) return true;
            if (typeof value === 'string' && value.length > 10000) return true;
            return false;
        });

        if (invalidValues.length > 0) {
            console.warn('databaseService.updateKnowledge - 发现可能的问题数据:', invalidValues);
        }

        // 尝试不同的方法来避免 406 错误
        console.log('databaseService.updateKnowledge - 发送请求到 Supabase:', {
            table: 'knowledge',
            updateData: updateData,
            id: id,
            userId: userId
        });

        // 方法1：先检查记录是否存在
        console.log('databaseService.updateKnowledge - 检查记录是否存在:', {
            knowledgeId: id,
            userId: userId
        });

        const { data: existingRecords, error: checkError } = await supabase
            .from('knowledge')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)

        console.log('databaseService.updateKnowledge - 记录检查结果:', {
            hasData: existingRecords && existingRecords.length > 0,
            dataKeys: existingRecords && existingRecords.length > 0 ? Object.keys(existingRecords[0]) : null,
            hasError: !!checkError,
            errorCode: checkError?.code,
            errorMessage: checkError?.message,
            count: existingRecords?.length || 0
        });

        if (checkError) {
            throw new Error(`检查知识点失败: ${checkError.message}`);
        }

        if (!existingRecords || existingRecords.length === 0) {
            throw new Error(`知识点不存在或不属于当前用户。ID: ${id}`);
        }

        // 如果记录存在，进行更新
        let { data, error } = await supabase
            .from('knowledge')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        // 如果方法1失败，尝试方法2：使用更简单的查询
        if (error && error.code === '406') {
            // 先检查记录是否存在
            const { data: existingData, error: checkError } = await supabase
                .from('knowledge')
                .select('id')
                .eq('id', id)
                .eq('user_id', userId)

            if (checkError) {
                throw new Error(`知识点不存在或无法访问: ${checkError.message}`);
            }

            if (!existingData || existingData.length === 0) {
                throw new Error(`知识点不存在或无法访问: ID ${id}`);
            }

            // 如果记录存在，再次尝试更新
            const result = await supabase
                .from('knowledge')
                .update(updateData)
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single()

            data = result.data;
            error = result.error;
        }

        if (error) {
            throw new Error(`知识点更新失败: ${error.message || '未知错误'}`);
        }
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

        if (error) {
            throw error;
        }
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