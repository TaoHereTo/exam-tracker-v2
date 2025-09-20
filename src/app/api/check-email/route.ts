import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')?.trim()

        if (!email) {
            return NextResponse.json({ error: '缺少邮箱参数' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: '服务端环境变量未配置' }, { status: 500 })
        }

        const admin = createClient(supabaseUrl, serviceRoleKey)

        // 遍历分页查询匹配邮箱（SDK暂无 getUserByEmail）
        const pageSize = 1000
        let page = 1
        let found = false

        while (!found) {
            const { data, error } = await admin.auth.admin.listUsers({ page, perPage: pageSize })
            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
            const users = data?.users || []
            if (users.length === 0) break
            if (users.some((u) => (u.email || '').toLowerCase() === email.toLowerCase())) {
                found = true
                break
            }
            if (users.length < pageSize) break
            page += 1
            // 安全阈值，避免极端情况下的无限分页
            if (page > 50) break
        }

        return NextResponse.json({ exists: found })
    } catch (err: unknown) {
        // Type guard to check if err is an Error object
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message || '内部错误' }, { status: 500 })
        }
        return NextResponse.json({ error: '内部错误' }, { status: 500 })
    }
}