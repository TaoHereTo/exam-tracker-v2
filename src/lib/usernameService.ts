import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface UsernameCheckResult {
    available: boolean;
    message: string;
}

export class UsernameService {
    // 检查用户名是否可用
    static async checkUsernameAvailability(username: string): Promise<UsernameCheckResult> {
        try {
            // 基本验证
            if (!username || username.trim().length === 0) {
                return {
                    available: false,
                    message: '用户名不能为空'
                };
            }

            if (username.length < 3) {
                return {
                    available: false,
                    message: '用户名至少需要3个字符'
                };
            }

            if (username.length > 20) {
                return {
                    available: false,
                    message: '用户名不能超过20个字符'
                };
            }

            // 检查特殊字符
            const validUsernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
            if (!validUsernameRegex.test(username)) {
                return {
                    available: false,
                    message: '用户名只能包含字母、数字、下划线和中文'
                };
            }

            // 检查是否为保留用户名
            const reservedUsernames = ['admin', 'administrator', 'root', 'system', 'tao', 'Tao'];
            if (reservedUsernames.includes(username.toLowerCase())) {
                return {
                    available: false,
                    message: '该用户名已被保留，请选择其他用户名'
                };
            }

            // 从数据库检查用户名是否已存在
            const { data, error } = await supabase
                .from('user_profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 表示没有找到记录
                console.error('检查用户名时出错:', error);
                return {
                    available: false,
                    message: '检查用户名时出错，请稍后重试'
                };
            }

            if (data) {
                return {
                    available: false,
                    message: '该用户名已被使用，请选择其他用户名'
                };
            }

            return {
                available: true,
                message: '用户名可用'
            };
        } catch (error) {
            console.error('检查用户名可用性时出错:', error);
            return {
                available: false,
                message: '检查用户名时出错，请稍后重试'
            };
        }
    }

    // 检查是否为管理员用户名
    static isAdminUsername(username: string): boolean {
        return username.toLowerCase() === 'tao';
    }

    // 获取用户名建议
    static getUsernameSuggestions(baseUsername: string): string[] {
        const suggestions: string[] = [];

        // 添加数字后缀
        for (let i = 1; i <= 5; i++) {
            suggestions.push(`${baseUsername}${i}`);
        }

        // 添加年份后缀
        const currentYear = new Date().getFullYear();
        suggestions.push(`${baseUsername}${currentYear}`);

        // 添加下划线后缀
        suggestions.push(`${baseUsername}_user`);
        suggestions.push(`${baseUsername}_2024`);

        return suggestions.slice(0, 8); // 最多返回8个建议
    }
} 