import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface UsernameCheckResult {
    available: boolean;
    message: string;
}

export class UsernameService {
    // 管理员邮箱列表
    private static readonly ADMIN_EMAILS = [
        '1623260701@qq.com',  // 您的主邮箱
        // 可以添加更多管理员邮箱
    ];

    // 检查是否为管理员邮箱
    static isAdminEmail(email: string): boolean {
        return this.ADMIN_EMAILS.includes(email.toLowerCase());
    }

    // 检查用户名是否可用
    static async checkUsernameAvailability(username: string, userEmail?: string): Promise<UsernameCheckResult> {
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
            const reservedUsernames = ['admin', 'administrator', 'root', 'system'];
            if (reservedUsernames.includes(username.toLowerCase())) {
                return {
                    available: false,
                    message: '该用户名已被保留，请选择其他用户名'
                };
            }

            // 特殊处理：管理员邮箱可以使用"Tao"用户名
            if (username.toLowerCase() === 'tao' && userEmail && this.isAdminEmail(userEmail)) {
                return {
                    available: true,
                    message: '欢迎你，Tao'
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

    // 检查是否为管理员用户名（保留兼容性，但基于邮箱判断）
    static isAdminUsername(username: string, userEmail?: string): boolean {
        // 如果提供了邮箱，优先使用邮箱判断
        if (userEmail && this.isAdminEmail(userEmail)) {
            return true;
        }
        // 保留原有的用户名检查作为备用
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