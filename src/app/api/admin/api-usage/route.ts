import { NextRequest, NextResponse } from 'next/server'
import { getDailyApiUsage } from '@/lib/db'
import { requireAdmin, AuthError } from '@/lib/auth'
import { getKeyPoolStatus } from '@/lib/ai-router'
import { calculateCost, PROVIDER_DEFAULT_MODEL } from '@/lib/pricing'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)

    const usage = getDailyApiUsage()
    const geminiPool = getKeyPoolStatus()
    const dailyTokenLimit = parseInt(process.env.GEMINI_DAILY_TOKEN_LIMIT || '1000000', 10)
    const dailyRequestLimit = parseInt(process.env.GEMINI_DAILY_REQUEST_LIMIT || '1500', 10)

    // 建立所有 provider 的 key 清單
    const keys: Array<{
      provider: string;
      key_index: number;
      label: string;
      total_input_tokens: number;
      total_output_tokens: number;
      total_requests: number;
      daily_token_limit: number | null;
      daily_request_limit: number | null;
    }> = []

    // Gemini keys（有免費額度上限）
    for (let i = 0; i < geminiPool.total; i++) {
      const existing = usage.find(u => u.provider === 'gemini' && u.key_index === i)
      keys.push({
        provider: 'gemini',
        key_index: i,
        label: `Gemini Key #${i + 1}`,
        total_input_tokens: existing?.total_input_tokens || 0,
        total_output_tokens: existing?.total_output_tokens || 0,
        total_requests: existing?.total_requests || 0,
        daily_token_limit: dailyTokenLimit,
        daily_request_limit: dailyRequestLimit,
      })
    }

    // OpenRouter（有 key 就顯示，無固定免費額度）
    if (process.env.OPENROUTER_API_KEY) {
      const existing = usage.find(u => u.provider === 'openrouter')
      keys.push({
        provider: 'openrouter',
        key_index: 0,
        label: 'OpenRouter',
        total_input_tokens: existing?.total_input_tokens || 0,
        total_output_tokens: existing?.total_output_tokens || 0,
        total_requests: existing?.total_requests || 0,
        daily_token_limit: null, // 按用量計費，無固定上限
        daily_request_limit: null,
      })
    }

    // Anthropic（有 key 就顯示，無固定免費額度）
    if (process.env.ANTHROPIC_API_KEY) {
      const existing = usage.find(u => u.provider === 'anthropic')
      keys.push({
        provider: 'anthropic',
        key_index: 0,
        label: 'Anthropic',
        total_input_tokens: existing?.total_input_tokens || 0,
        total_output_tokens: existing?.total_output_tokens || 0,
        total_requests: existing?.total_requests || 0,
        daily_token_limit: null, // 按用量計費
        daily_request_limit: null,
      })
    }

    // 計算各 key 和總計花費
    let totalCost = 0
    const keysWithCost = keys.map(k => {
      const model = PROVIDER_DEFAULT_MODEL[k.provider] || 'gemini-2.5-flash'
      const cost = calculateCost(k.total_input_tokens, k.total_output_tokens, model)
      totalCost += cost
      return { ...k, estimated_cost: cost }
    })

    return NextResponse.json({
      keys: keysWithCost,
      pool: { gemini: geminiPool },
      total_cost: totalCost,
    })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('API usage error:', e)
    return NextResponse.json({ error: '取得 API 用量失敗' }, { status: 500 })
  }
}
