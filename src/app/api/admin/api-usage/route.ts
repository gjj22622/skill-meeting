import { NextRequest, NextResponse } from 'next/server'
import { getDailyApiUsage } from '@/lib/db'
import { requireAdmin, AuthError } from '@/lib/auth'
import { getKeyPoolStatus } from '@/lib/ai-router'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)

    const usage = getDailyApiUsage()
    const pool = getKeyPoolStatus()
    const dailyTokenLimit = parseInt(process.env.GEMINI_DAILY_TOKEN_LIMIT || '1000000', 10)
    const dailyRequestLimit = parseInt(process.env.GEMINI_DAILY_REQUEST_LIMIT || '1500', 10)

    // 補齊沒有用量紀錄的 key（填入零值）
    const keys = []
    for (let i = 0; i < pool.total; i++) {
      const existing = usage.find(u => u.key_index === i)
      keys.push({
        key_index: i,
        total_input_tokens: existing?.total_input_tokens || 0,
        total_output_tokens: existing?.total_output_tokens || 0,
        total_requests: existing?.total_requests || 0,
        daily_token_limit: dailyTokenLimit,
        daily_request_limit: dailyRequestLimit,
      })
    }

    return NextResponse.json({ keys, pool })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('API usage error:', e)
    return NextResponse.json({ error: '取得 API 用量失敗' }, { status: 500 })
  }
}
