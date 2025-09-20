import { createClient } from '@supabase/supabase-js'

// 从环境变量中读取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 验证环境变量是否存在
if (!supabaseUrl || !supabaseKey) {
  console.warn('缺少 Supabase 环境变量，请检查 .env.local 文件。云端功能将不可用。');
}

// 创建并导出 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

