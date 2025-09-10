import { supabase } from '../supabaseClient';
import type { UserProfile, UserProfileInput } from '../types/user';

export class UserProfileService {
    // 获取当前用户的资料
    static async getUserProfile(): Promise<UserProfile | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return null;
            }

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                // 如果用户资料不存在，返回null而不是抛出错误
                if (error.code === 'PGRST116') {
                    return null;
                }
                console.error('getUserProfile: 获取用户资料失败:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('getUserProfile: 获取用户资料时出错:', error);
            return null;
        }
    }

    // 创建或更新用户资料
    static async upsertUserProfile(profileData: UserProfileInput): Promise<UserProfile | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // 在未登录状态下静默返回，避免在登出流程中造成误报
                console.warn('upsertUserProfile: 用户未登录');
                return null;
            }

            // 准备要插入的数据，包含email字段
            const insertData = {
                user_id: user.id,
                email: user.email, // 添加email字段
                ...profileData
            };

            const { data, error } = await supabase
                .from('user_profiles')
                .upsert(insertData, {
                    onConflict: 'user_id' // 指定冲突处理策略
                })
                .select()
                .single();

            if (error) {
                console.error('upsertUserProfile: 更新用户资料失败:', error);

                // 处理特定的数据库错误
                if (error.code === '23505') {
                    // 唯一约束冲突
                    if (error.message.includes('username')) {
                        throw new Error('用户名已被其他用户使用，请选择其他用户名');
                    } else if (error.message.includes('email')) {
                        throw new Error('邮箱已被其他用户使用');
                    } else {
                        throw new Error('数据冲突：' + error.message);
                    }
                } else if (error.code === '23514') {
                    // 检查约束失败
                    throw new Error('数据格式不正确：' + error.message);
                } else if (error.code === '23503') {
                    // 外键约束失败
                    throw new Error('关联数据不存在：' + error.message);
                } else {
                    throw new Error('更新用户资料失败：' + error.message);
                }
            }

            return data;
        } catch (error) {
            console.error('upsertUserProfile: 更新用户资料时出错:', error);
            throw error;
        }
    }

    // 删除用户资料
    static async deleteUserProfile(): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { error } = await supabase
                .from('user_profiles')
                .delete()
                .eq('user_id', user.id);

            if (error) {
                console.error('删除用户资料失败:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('删除用户资料时出错:', error);
            return false;
        }
    }

    // 检查用户资料是否存在
    static async profileExists(): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data, error } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('检查用户资料时出错:', error);
                return false;
            }

            return !!data;
        } catch (error) {
            console.error('检查用户资料时出错:', error);
            return false;
        }
    }

    // 确保用户资料存在，如果不存在则创建默认资料
    static async ensureUserProfile(): Promise<UserProfile | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return null;
            }

            // 先尝试获取现有资料
            let profile = await this.getUserProfile();

            // 如果资料不存在，创建默认资料
            if (!profile) {
                // 再次确认当前仍为登录态，避免登出时竞态触发
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (!currentUser) {
                    return null;
                }

                profile = await this.upsertUserProfile({
                    username: null,
                    bio: null
                });

                // If upsertUserProfile returned null (user not logged in), return null
                if (!profile) {
                    return null;
                }
            }

            return profile;
        } catch (error) {
            console.error('ensureUserProfile: 确保用户资料存在时出错:', error);
            return null;
        }
    }

    // 创建新用户资料（用于注册后自动创建）
    static async createUserProfile(): Promise<UserProfile | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // 检查是否已存在
            const exists = await this.profileExists();
            if (exists) {
                return await this.getUserProfile();
            }

            // 创建新用户资料
            const { data, error } = await supabase
                .from('user_profiles')
                .insert({
                    user_id: user.id,
                    email: user.email,
                    username: null,
                    bio: null
                })
                .select()
                .single();

            if (error) {
                console.error('创建用户资料失败:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('创建用户资料时出错:', error);
            return null;
        }
    }
}