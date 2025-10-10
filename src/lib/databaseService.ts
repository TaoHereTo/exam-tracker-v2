import { supabase } from '../supabaseClient'
import { RecordItem, StudyPlan, KnowledgeItem, ExamCountdown } from '../types/record'
import { generateUUID } from './utils'
import { UserSettings } from '../types/record'

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
}

// 刷题历史相关操作
export const recordService = {
    // 获取用户的所有刷题历史
    async getRecords(): Promise<RecordItem[]> {
        try {
            const userId = await getCurrentUserId()
            if (!userId) {
                console.warn('用户未登录，返回空记录列表');
                return [];
            }

            console.log('开始查询用户记录，用户ID:', userId);
            const startTime = Date.now();

            const { data, error } = await supabase
                .from('exercise_records')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(1000) // 限制查询数量，避免查询过多数据

            const endTime = Date.now();
            console.log(`记录查询完成，耗时: ${endTime - startTime}ms`);

            if (error) {
                console.error('获取记录失败:', error);
                throw new Error(`获取记录失败: ${error.message || '未知错误'}`);
            }

            console.log(`成功获取 ${data?.length || 0} 条记录`);
            return data || []
        } catch (error) {
            console.error('记录查询异常:', error);

            // 提供更具体的错误信息
            if (error instanceof Error) {
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    throw new Error('网络连接失败，请检查网络连接后重试');
                } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
                    throw new Error('权限不足，请重新登录');
                } else if (error.message.includes('timeout')) {
                    throw new Error('请求超时，请稍后重试');
                }
            }

            throw new Error(`获取记录失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    },

    // 添加新的刷题历史（携带 UUID 写入）
    async addRecord(record: Omit<RecordItem, 'id'> & { id?: string }): Promise<RecordItem> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        // 验证输入数据
        if (!record.date || !record.module || record.total <= 0 || record.correct < 0) {
            throw new Error('刷题记录数据不完整或无效');
        }

        if (record.correct > record.total) {
            throw new Error('正确题数不能超过总题数');
        }

        // 构建正确的数据对象，确保字段名与数据库表匹配
        const finalId = record.id && typeof record.id === 'string' && record.id ? record.id : generateUUID()
        const recordData = {
            id: finalId,
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

    // 更新刷题历史
    async updateRecord(id: string, updates: Partial<RecordItem>): Promise<RecordItem> {
        try {
            const userId = await getCurrentUserId()
            if (!userId) throw new Error('用户未登录')

            const updateData: Record<string, unknown> = { ...updates };

            const { data, error } = await supabase
                .from('exercise_records')
                .update(updateData)
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single()

            if (error) {
                throw new Error(`刷题记录更新失败: ${error.message || '未知错误'}`);
            }

            return data
        } catch (error) {
            throw error;
        }
    },

    // 删除刷题历史
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
        try {
            const userId = await getCurrentUserId()
            if (!userId) {
                console.warn('用户未登录，返回空计划列表');
                return [];
            }

            console.log('开始查询用户计划，用户ID:', userId);
            const startTime = Date.now();

            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(500) // 限制查询数量

            const endTime = Date.now();
            console.log(`计划查询完成，耗时: ${endTime - startTime}ms`);

            if (error) {
                console.error('获取计划失败:', error);
                throw new Error(`获取计划失败: ${error.message || '未知错误'}`);
            }

            console.log(`成功获取 ${data?.length || 0} 个计划`);
            return data || []
        } catch (error) {
            console.error('计划查询异常:', error);

            // 提供更具体的错误信息
            if (error instanceof Error) {
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    throw new Error('网络连接失败，请检查网络连接后重试');
                } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
                    throw new Error('权限不足，请重新登录');
                } else if (error.message.includes('timeout')) {
                    throw new Error('请求超时，请稍后重试');
                }
            }

            throw new Error(`获取计划失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    },

    // 添加新的学习计划
    async addPlan(plan: Omit<StudyPlan, 'id'>): Promise<StudyPlan> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        // 验证输入数据
        if (!plan.name || !plan.module || !plan.type || !plan.startDate || !plan.endDate) {
            throw new Error('学习计划数据不完整');
        }

        if (plan.target <= 0) {
            throw new Error('目标值必须大于0');
        }

        if (new Date(plan.startDate) > new Date(plan.endDate)) {
            throw new Error('开始日期不能晚于结束日期');
        }

        // 构建正确的数据对象，确保字段名与数据库表匹配
        // 注意：数据库表中使用了双引号包围的camelCase字段名
        // 置顶状态不保存到云端，只保存在本地
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
            console.error('学习计划上传错误:', error);

            // 检查是否是重复记录错误
            if (error.code === '23505') {
                throw new Error(`学习计划上传失败: 已存在相同的学习计划记录`);
            }

            throw new Error(`学习计划上传失败: ${error.message || '未知错误'}`);
        }

        if (!data) {
            throw new Error(`上传后未返回数据`);
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

            // 首先检查记录是否存在，并检查是否有重复记录
            const { data: existingData, error: checkError } = await supabase
                .from('plans')
                .select('id, name, "startDate", "endDate"')
                .eq('id', id)
                .eq('user_id', userId);

            if (checkError) {
                throw new Error(`检查学习计划记录失败: ${checkError.message || '未知错误'}`);
            }

            if (!existingData || existingData.length === 0) {
                throw new Error(`学习计划记录不存在或您没有权限访问该记录`);
            }

            // 如果发现多条记录，说明有重复记录，需要清理
            if (existingData.length > 1) {
                console.warn(`发现重复的学习计划记录，ID: ${id}，用户: ${userId}，记录数: ${existingData.length}`);

                // 保留第一条记录，删除其他重复记录
                const recordsToDelete = existingData.slice(1);
                for (const record of recordsToDelete) {
                    await supabase
                        .from('plans')
                        .delete()
                        .eq('id', record.id)
                        .eq('user_id', userId);
                }

                console.log(`已清理 ${recordsToDelete.length} 条重复记录`);
            }

            // 执行更新操作
            const { data, error } = await supabase
                .from('plans')
                .update(updateData)
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single()

            if (error) {
                console.error('更新学习计划详细错误:', {
                    error,
                    id,
                    userId,
                    updateData,
                    existingData
                });

                // 检查是否是重复记录错误
                if (error.code === '23505') {
                    throw new Error(`学习计划更新失败: 已存在相同的学习计划记录`);
                }

                // 检查是否是406错误（多行或无行返回）
                if (error.message && error.message.includes('JSON object requested, multiple (or no) rows returned')) {
                    throw new Error(`学习计划更新失败: 数据库中存在重复记录或记录不存在`);
                }

                throw new Error(`学习计划更新失败: ${error.message || '未知错误'}`);
            }

            if (!data) {
                throw new Error(`更新后未返回数据`);
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

// 考试倒计时相关操作
export const countdownService = {
    // 获取用户的所有考试倒计时
    async getCountdowns(): Promise<ExamCountdown[]> {
        const userId = await getCurrentUserId()
        if (!userId) {
            console.warn('用户未登录，返回空倒计时列表');
            return [];
        }

        const { data, error } = await supabase
            .from('exam_countdowns')
            .select('*')
            .eq('user_id', userId)
            .order('examDate', { ascending: true })

        if (error) {
            console.error('获取倒计时失败:', error);
            return [];
        }
        return data || []
    },

    // 添加新的考试倒计时
    async addCountdown(countdown: Omit<ExamCountdown, 'id'>): Promise<ExamCountdown> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        // 验证输入数据
        if (!countdown.name || !countdown.examDate) {
            throw new Error('考试倒计时数据不完整');
        }

        if (new Date(countdown.examDate) < new Date()) {
            throw new Error('考试日期不能是过去的日期');
        }

        // 构建正确的数据对象，确保字段名与数据库表匹配
        // 置顶状态不保存到云端，只保存在本地
        const countdownData = {
            user_id: userId,
            name: countdown.name,
            "examDate": countdown.examDate,
            description: countdown.description
        }

        const { data, error } = await supabase
            .from('exam_countdowns')
            .insert([countdownData])
            .select()
            .single()

        if (error) {
            console.error('考试倒计时上传错误:', error);

            // 检查是否是重复记录错误
            if (error.code === '23505') {
                throw new Error(`考试倒计时上传失败: 已存在相同的倒计时记录`);
            }

            throw new Error(`考试倒计时上传失败: ${error.message || '未知错误'}`);
        }

        if (!data) {
            throw new Error(`上传后未返回数据`);
        }

        return data
    },

    // 更新考试倒计时
    async updateCountdown(id: string, updates: Partial<ExamCountdown>): Promise<ExamCountdown> {
        try {
            const userId = await getCurrentUserId()
            if (!userId) throw new Error('用户未登录')

            // 处理带有双引号的字段名
            const updateData: Record<string, unknown> = { ...updates };
            if ('examDate' in updateData) {
                updateData["examDate"] = updateData.examDate;
                delete updateData.examDate;
            }

            // 首先检查记录是否存在，并检查是否有重复记录
            const { data: existingData, error: checkError } = await supabase
                .from('exam_countdowns')
                .select('id, name, "examDate"')
                .eq('id', id)
                .eq('user_id', userId);

            if (checkError) {
                throw new Error(`检查倒计时记录失败: ${checkError.message || '未知错误'}`);
            }

            if (!existingData || existingData.length === 0) {
                throw new Error(`倒计时记录不存在或您没有权限访问该记录`);
            }

            // 如果发现多条记录，说明有重复记录，需要清理
            if (existingData.length > 1) {
                console.warn(`发现重复的倒计时记录，ID: ${id}，用户: ${userId}，记录数: ${existingData.length}`);

                // 保留第一条记录，删除其他重复记录
                const recordsToDelete = existingData.slice(1);
                for (const record of recordsToDelete) {
                    await supabase
                        .from('exam_countdowns')
                        .delete()
                        .eq('id', record.id)
                        .eq('user_id', userId);
                }

                console.log(`已清理 ${recordsToDelete.length} 条重复记录`);
            }

            // 执行更新操作
            const { data, error } = await supabase
                .from('exam_countdowns')
                .update(updateData)
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single()

            if (error) {
                console.error('更新倒计时详细错误:', {
                    error,
                    id,
                    userId,
                    updateData,
                    existingData
                });

                // 检查是否是重复记录错误
                if (error.code === '23505') {
                    throw new Error(`考试倒计时更新失败: 已存在相同的倒计时记录`);
                }

                // 检查是否是406错误（多行或无行返回）
                if (error.message && error.message.includes('JSON object requested, multiple (or no) rows returned')) {
                    throw new Error(`考试倒计时更新失败: 数据库中存在重复记录或记录不存在`);
                }

                throw new Error(`考试倒计时更新失败: ${error.message || '未知错误'}`);
            }

            if (!data) {
                throw new Error(`更新后未返回数据`);
            }

            return data
        } catch (error) {
            throw error;
        }
    },

    // 删除考试倒计时
    async deleteCountdown(id: string): Promise<void> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        const { error } = await supabase
            .from('exam_countdowns')
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
                return false;
            }

            const exists = data && data.length > 0;
            return exists;
        } catch (error) {
            console.error('检查知识点存在性异常:', error);
            return false;
        }
    },
    // 获取用户的所有知识点
    async getKnowledge(): Promise<KnowledgeItem[]> {
        const userId = await getCurrentUserId()
        if (!userId) {
            console.warn('用户未登录，返回空知识点列表');
            return [];
        }

        try {
            console.log('开始查询用户知识点，用户ID:', userId);
            const startTime = Date.now();

            const { data, error } = await supabase
                .from('knowledge')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1000) // 限制查询数量

            const endTime = Date.now();
            console.log(`知识点查询完成，耗时: ${endTime - startTime}ms`);

            if (error) {
                console.error('获取知识点失败:', error);
                throw new Error(`获取知识点失败: ${error.message || '未知错误'}`);
            }

            const result = data?.map(item => ({
                id: item.id,
                module: item.module,
                type: item.type || '',
                note: item.note || '',
                subCategory: item.subCategory || '',
                date: item.date || '',
                source: item.source || '',
                created_at: item.created_at,
                updated_at: item.updated_at
            })) || [];

            console.log(`成功获取 ${result.length} 个知识点`);
            return result;
        } catch (error) {
            console.error('获取知识点异常:', error);

            // 提供更具体的错误信息
            if (error instanceof Error) {
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    throw new Error('网络连接失败，请检查网络连接后重试');
                } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
                    throw new Error('权限不足，请重新登录');
                } else if (error.message.includes('timeout')) {
                    throw new Error('请求超时，请稍后重试');
                }
            }

            throw new Error(`获取知识点失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
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

        // 确保 type 字段始终存在（对于 politics 模块，使用 source 作为 type）
        if ('type' in knowledge && knowledge.type) {
            knowledgeData.type = knowledge.type;
        } else if (knowledge.module === 'politics' && 'source' in knowledge && knowledge.source) {
            // 对于 politics 模块，如果 type 不存在但 source 存在，使用 source 作为 type
            knowledgeData.type = knowledge.source;
        } else if ('source' in knowledge && knowledge.source) {
            // 其他情况下，如果 type 不存在但 source 存在，使用 source 作为 type
            knowledgeData.type = knowledge.source;
        } else {
            // 如果都没有，使用默认值
            knowledgeData.type = '未分类';
        }

        // 确保 note 字段始终存在
        if ('note' in knowledge && knowledge.note) {
            knowledgeData.note = knowledge.note;
        } else {
            // 如果 note 不存在，使用默认值
            knowledgeData.note = '无内容';
        }

        // 处理其他字段 - 使用原始字段名
        if ('subCategory' in knowledge) knowledgeData.subCategory = knowledge.subCategory;
        if ('date' in knowledge) knowledgeData.date = knowledge.date;
        if ('source' in knowledge) knowledgeData.source = knowledge.source;

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

                // 确保 type 字段始终存在（对于 politics 模块，使用 source 作为 type）
                if ('type' in updates && updates.type) {
                    knowledgeData.type = updates.type;
                } else if (updates.module === 'politics' && 'source' in updates && updates.source) {
                    // 对于 politics 模块，如果 type 不存在但 source 存在，使用 source 作为 type
                    knowledgeData.type = updates.source;
                } else if ('source' in updates && updates.source) {
                    // 其他情况下，如果 type 不存在但 source 存在，使用 source 作为 type
                    knowledgeData.type = updates.source;
                } else {
                    // 如果都没有，使用默认值
                    knowledgeData.type = '未分类';
                }

                // 确保 note 字段始终存在
                if ('note' in updates && updates.note) {
                    knowledgeData.note = updates.note;
                } else {
                    // 如果 note 不存在，使用默认值
                    knowledgeData.note = '无内容';
                }

                // 处理其他字段 - 使用原始字段名
                if ('subCategory' in updates) knowledgeData.subCategory = updates.subCategory;
                if ('date' in updates) knowledgeData.date = updates.date;
                if ('source' in updates) knowledgeData.source = updates.source;

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
                // 移除 null 字符和其他控制字符，但保留文本格式化标记
                // 保留 * (U+002A), { (U+007B), } (U+007D) 用于文本格式化
                return value.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, '').trim();
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

        // 方法1：先检查记录是否存在

        const { data: existingRecords, error: checkError } = await supabase
            .from('knowledge')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)

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
        if (!userId) {
            console.warn('用户未登录，返回空设置');
            return {};
        }

        try {
            console.log('开始查询用户设置，用户ID:', userId);
            const startTime = Date.now();

            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle()

            const endTime = Date.now();
            console.log(`设置查询完成，耗时: ${endTime - startTime}ms`);

            if (error) {
                // 如果是没有找到记录的错误，返回空对象
                if (error.code === 'PGRST116') {
                    console.log('用户设置不存在，返回空对象');
                    return {};
                }

                // 处理 400 错误
                if (error.message.includes('400') || error.message.includes('Bad Request')) {
                    console.warn('用户设置获取遇到400错误（请求格式问题），返回空对象');
                    return {};
                }

                // 处理 406 错误或其他 HTTP 错误
                if (error.message.includes('406') || error.message.includes('Not Acceptable')) {
                    console.warn('用户设置获取遇到406错误（首次使用或数据格式问题），返回空对象');
                    return {};
                }

                // 处理其他常见错误
                if (error.code === 'PGRST301' || error.message.includes('permission denied')) {
                    console.warn('权限不足，返回空对象');
                    return {};
                }

                // 如果是其他错误，也返回空对象而不是抛出异常
                console.warn('获取设置遇到错误，返回空对象:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                return {};
            }

            console.log('成功获取用户设置');
            return data?.settings || {};
        } catch (error) {
            // 处理网络错误或其他异常
            const errorMessage = error instanceof Error ? error.message : String(error);

            // 特别处理 400 错误
            if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
                console.warn('用户设置获取遇到网络级400错误（请求格式问题），返回空对象');
                return {};
            }

            // 特别处理 406 错误
            if (errorMessage.includes('406') || errorMessage.includes('Not Acceptable')) {
                console.warn('用户设置获取遇到网络级406错误（首次使用或API版本问题），返回空对象');
                return {};
            }

            // 处理其他网络错误
            if (errorMessage.includes('Failed to load resource') || errorMessage.includes('fetch')) {
                console.warn('用户设置获取遇到网络错误，返回空对象:', errorMessage);
                return {};
            }

            console.warn('设置查询异常:', {
                error: error,
                errorType: typeof error,
                errorMessage: errorMessage
            });
            // 返回空对象而不是抛出异常
            console.warn('获取设置遇到异常，返回空对象');
            return {};
        }
    },

    // 保存用户设置
    async saveSettings(settings: UserSettings): Promise<void> {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('用户未登录')

        try {
            const { error } = await supabase
                .from('user_settings')
                .upsert({ user_id: userId, settings }, { onConflict: 'user_id' })

            if (error) {
                console.error('设置保存失败:', error);
                throw error;
            }

        } catch (error) {
            console.error('设置保存异常:', error);
            throw error;
        }
    }
}