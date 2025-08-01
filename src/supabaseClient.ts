import { createClient } from '@supabase/supabase-js'

// 在下面粘贴您从 Supabase 后台 API 设置中复制的 URL 和 anon public key
const supabaseUrl = 'https://zhzldnhddtukqseqgdtj.supabase.co' // 替换成您自己的 Project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoemxkbmhkZHR1a3FzZXFnZHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTczNzUsImV4cCI6MjA2OTMzMzM3NX0.iAyP1BF-Aaq6dAmDpgek36DrcKG4sRngiAp_nuJ0094' // 替换成您自己的 anon public Key

// 创建并导出 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseKey)

