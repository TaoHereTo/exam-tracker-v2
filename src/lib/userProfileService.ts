import { supabase } from '../supabaseClient';
import type { UserProfile, UpdateUserProfileParams } from '../types/user';

export class UserProfileService {
    // 获取用户资料
    static async getUserProfile(): Promise<UserProfile | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // 用户资料不存在，返回null
                    return null;
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('获取用户资料失败:', error);
            throw error;
        }
    }

    // 创建或更新用户资料
    static async upsertUserProfile(profile: UpdateUserProfileParams): Promise<UserProfile> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('用户未登录');

            const { data, error } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: user.id,
                    ...profile
                }, {
                    onConflict: 'user_id'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('更新用户资料失败:', error);
            throw error;
        }
    }

    // 更新用户名
    static async updateUsername(username: string): Promise<UserProfile> {
        return this.upsertUserProfile({ username });
    }

    // 更新头像
    static async updateAvatar(avatarUrl: string): Promise<UserProfile> {
        return this.upsertUserProfile({ avatar_url: avatarUrl });
    }

    // 更新显示名称
    static async updateDisplayName(displayName: string): Promise<UserProfile> {
        return this.upsertUserProfile({ display_name: displayName });
    }

    // 更新个人简介
    static async updateBio(bio: string): Promise<UserProfile> {
        return this.upsertUserProfile({ bio });
    }

    // 删除用户资料
    static async deleteUserProfile(): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('用户未登录');

            const { error } = await supabase
                .from('user_profiles')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (error) {
            console.error('删除用户资料失败:', error);
            throw error;
        }
    }
} 