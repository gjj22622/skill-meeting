/**
 * AI 模型定價表（美元 / 1M tokens）
 * 來源：各 provider 官方定價頁面，2025-05 更新
 */

export interface ModelPricing {
  inputPerMillion: number;   // $/1M input tokens
  outputPerMillion: number;  // $/1M output tokens
}

// 模型名稱 → 定價（支援模糊匹配）
const PRICING_TABLE: Record<string, ModelPricing> = {
  // Gemini
  'gemini-2.5-flash':       { inputPerMillion: 0.15,  outputPerMillion: 0.60 },
  'gemini-2.5-pro':         { inputPerMillion: 1.25,  outputPerMillion: 10.00 },
  'gemini-2.0-flash':       { inputPerMillion: 0.10,  outputPerMillion: 0.40 },
  'gemini-2.0-flash-lite':  { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-1.5-flash':       { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-1.5-pro':         { inputPerMillion: 1.25,  outputPerMillion: 5.00 },

  // Anthropic
  'claude-sonnet-4-20250514':  { inputPerMillion: 3.00,  outputPerMillion: 15.00 },
  'claude-opus-4-20250514':    { inputPerMillion: 15.00, outputPerMillion: 75.00 },
  'claude-haiku-3-5':          { inputPerMillion: 0.80,  outputPerMillion: 4.00 },

  // OpenRouter 免費模型
  'google/gemini-2.0-flash-exp:free':  { inputPerMillion: 0, outputPerMillion: 0 },
  'google/gemini-2.5-flash':           { inputPerMillion: 0.15, outputPerMillion: 0.60 },
};

/** 取得模型定價，找不到時用 Gemini 2.5 Flash 預設值 */
export function getModelPricing(model: string): ModelPricing {
  // 精確匹配
  if (PRICING_TABLE[model]) return PRICING_TABLE[model];

  // 模糊匹配（模型名可能有前綴如 google/）
  for (const [key, pricing] of Object.entries(PRICING_TABLE)) {
    if (model.includes(key) || key.includes(model)) return pricing;
  }

  // 預設：Gemini 2.5 Flash
  return { inputPerMillion: 0.15, outputPerMillion: 0.60 };
}

/** 計算花費（美元） */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string = 'gemini-2.5-flash',
): number {
  const pricing = getModelPricing(model);
  return (inputTokens / 1_000_000) * pricing.inputPerMillion
       + (outputTokens / 1_000_000) * pricing.outputPerMillion;
}

/** Provider 預設模型（用於花費估算） */
export const PROVIDER_DEFAULT_MODEL: Record<string, string> = {
  gemini: 'gemini-2.5-flash',
  openrouter: 'google/gemini-2.5-flash',
  anthropic: 'claude-sonnet-4-20250514',
};
