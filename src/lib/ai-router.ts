/**
 * AI Router — 多模型路由器
 *
 * 支援 OpenRouter、Google Gemini、Anthropic 三種 provider
 * Gemini 支援多組 API key 輪替（Round-Robin），限速時自動換下一個
 * 可針對不同討論階段使用不同模型，自動 fallback
 */

import OpenAI from 'openai';
import { recordApiUsage } from './db';

// ── 型別定義 ──

export type ProviderType = 'openrouter' | 'gemini' | 'anthropic';

export interface ModelConfig {
  provider: ProviderType;
  model: string;
  label?: string;         // 顯示用標籤，例如 "Gemini Flash (免費)"
}

export interface AIStreamChunk {
  type: 'text' | 'done';
  text?: string;
}

export interface AIStreamResponse {
  stream: AsyncGenerator<AIStreamChunk>;
  getUsage: () => Promise<{ inputTokens: number; outputTokens: number }>;
  model: string;
  provider: ProviderType;
}

// ── Provider 設定 ──

const PROVIDER_CONFIGS: Record<ProviderType, { baseURL: string; keyEnv: string }> = {
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    keyEnv: 'OPENROUTER_API_KEY',
  },
  gemini: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    keyEnv: 'GEMINI_API_KEY',
  },
  anthropic: {
    baseURL: 'https://api.anthropic.com/v1/',
    keyEnv: 'ANTHROPIC_API_KEY',
  },
};

// ── 預設模型配置（每階段可獨立設定）──

const DEFAULT_MODELS: Record<string, ModelConfig[]> = {
  opening: [
    { provider: 'gemini', model: 'gemini-2.0-flash', label: 'Gemini Flash (免費)' },
    { provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free', label: 'Gemini Flash via OpenRouter (免費)' },
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (fallback)' },
  ],
  discussion: [
    { provider: 'gemini', model: 'gemini-2.0-flash', label: 'Gemini Flash (免費)' },
    { provider: 'openrouter', model: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash ($0.15/M)' },
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (fallback)' },
  ],
  summary: [
    { provider: 'gemini', model: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { provider: 'openrouter', model: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash via OpenRouter' },
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (fallback)' },
  ],
};

// ── 環境變數解析 ──

function getPhaseModels(phase: string): ModelConfig[] {
  const envKey = `AI_MODEL_${phase.toUpperCase()}`;
  const envValue = process.env[envKey];

  if (envValue) {
    return envValue.split(',').map(entry => {
      const [provider, model] = entry.trim().split(':') as [ProviderType, string];
      return { provider, model };
    });
  }

  return DEFAULT_MODELS[phase] || DEFAULT_MODELS.discussion;
}

// ── Gemini 多 Key 輪替管理 ──

class GeminiKeyPool {
  private keys: string[] = [];
  private currentIndex = 0;
  private cooldowns = new Map<number, number>(); // key index → 冷卻到期時間

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    // 支援 GEMINI_API_KEY=key1,key2,key3 或分開設定
    const mainKey = process.env.GEMINI_API_KEY || '';
    const keys = mainKey.split(',').map(k => k.trim()).filter(Boolean);

    // 也支援 GEMINI_API_KEY_2, GEMINI_API_KEY_3 格式
    for (let i = 2; i <= 10; i++) {
      const extra = process.env[`GEMINI_API_KEY_${i}`];
      if (extra) keys.push(extra.trim());
    }

    this.keys = keys;
    if (keys.length > 0) {
      console.error(`[ai-router] Gemini key pool: ${keys.length} 組 key 已載入`);
    }
  }

  /** 取得下一個可用的 key（Round-Robin，跳過冷卻中的） */
  getNextKey(): string | null {
    if (this.keys.length === 0) return null;

    const now = Date.now();
    const totalKeys = this.keys.length;

    // 嘗試所有 key，從 currentIndex 開始
    for (let attempt = 0; attempt < totalKeys; attempt++) {
      const idx = (this.currentIndex + attempt) % totalKeys;
      const cooldownUntil = this.cooldowns.get(idx) || 0;

      if (now >= cooldownUntil) {
        this.currentIndex = (idx + 1) % totalKeys; // 下次從下一個開始
        return this.keys[idx];
      }
    }

    // 全部都在冷卻中，找最快解除的
    let soonestIdx = 0;
    let soonestTime = Infinity;
    for (const [idx, until] of this.cooldowns) {
      if (until < soonestTime) {
        soonestTime = until;
        soonestIdx = idx;
      }
    }
    this.currentIndex = (soonestIdx + 1) % totalKeys;
    return this.keys[soonestIdx];
  }

  /** 標記某個 key 被限速，冷卻 60 秒 */
  markRateLimited(apiKey: string) {
    const idx = this.keys.indexOf(apiKey);
    if (idx >= 0) {
      this.cooldowns.set(idx, Date.now() + 60_000);
      const remaining = this.keys.filter((_, i) => {
        const cd = this.cooldowns.get(i) || 0;
        return Date.now() >= cd;
      }).length;
      console.error(`[ai-router] Gemini key #${idx + 1} 被限速，冷卻 60s（剩餘可用: ${remaining}/${this.keys.length}）`);
    }
  }

  get size() { return this.keys.length; }

  /** 取得某個 API key 的 index */
  getKeyIndex(apiKey: string): number {
    return this.keys.indexOf(apiKey);
  }
}

const geminiPool = new GeminiKeyPool();

// ── OpenAI Client 建立 ──

function createClient(provider: ProviderType, apiKey: string): OpenAI {
  const config = PROVIDER_CONFIGS[provider];
  return new OpenAI({
    baseURL: config.baseURL,
    apiKey,
    defaultHeaders: provider === 'openrouter' ? {
      'HTTP-Referer': process.env.SITE_URL || 'https://skill-meeting.zeabur.app',
      'X-Title': 'Skill Meeting',
    } : undefined,
  });
}

// 非 Gemini provider 的 client 快取（只有一個 key）
const singleKeyCache = new Map<string, OpenAI>();

function getClient(provider: ProviderType): { client: OpenAI; apiKey: string } | null {
  if (provider === 'gemini') {
    const key = geminiPool.getNextKey();
    if (!key) return null;
    // Gemini 每次可能用不同 key，不快取
    return { client: createClient('gemini', key), apiKey: key };
  }

  const config = PROVIDER_CONFIGS[provider];
  const apiKey = process.env[config.keyEnv];
  if (!apiKey) return null;

  const cacheKey = `${provider}:${apiKey}`;
  if (!singleKeyCache.has(cacheKey)) {
    singleKeyCache.set(cacheKey, createClient(provider, apiKey));
  }
  return { client: singleKeyCache.get(cacheKey)!, apiKey };
}

// ── 判斷是否為限速錯誤 ──

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('rate limit') ||
           msg.includes('429') ||
           msg.includes('quota') ||
           msg.includes('resource exhausted') ||
           msg.includes('too many requests');
  }
  return false;
}

// ── 核心：Streaming 呼叫（帶多 key 輪替 + 自動 fallback）──

export async function streamChat(
  phase: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 1024,
): Promise<AIStreamResponse> {
  const models = getPhaseModels(phase);
  let lastError: Error | null = null;

  for (const modelConfig of models) {
    // Gemini 有多個 key，限速時要重試其他 key
    const maxRetries = modelConfig.provider === 'gemini' ? geminiPool.size : 1;

    for (let retry = 0; retry < maxRetries; retry++) {
      const clientInfo = getClient(modelConfig.provider);
      if (!clientInfo) {
        console.error(`[ai-router] ${modelConfig.provider} 無 API key，跳過`);
        break;
      }

      const { client, apiKey } = clientInfo;

      try {
        const stream = await client.chat.completions.create({
          model: modelConfig.model,
          max_tokens: maxTokens,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });

        let inputTokens = 0;
        let outputTokens = 0;
        let resolved = false;
        let resolveUsage: (value: { inputTokens: number; outputTokens: number }) => void;
        const usagePromise = new Promise<{ inputTokens: number; outputTokens: number }>((resolve) => {
          resolveUsage = resolve;
        });

        async function* generateChunks(): AsyncGenerator<AIStreamChunk> {
          try {
            for await (const chunk of stream) {
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) {
                yield { type: 'text', text: delta };
              }
              if (chunk.usage) {
                inputTokens = chunk.usage.prompt_tokens || 0;
                outputTokens = chunk.usage.completion_tokens || 0;
              }
            }
          } finally {
            if (!resolved) {
              resolved = true;
              resolveUsage!({ inputTokens, outputTokens });
            }
          }
          yield { type: 'done' };
        }

        const keyIndex = modelConfig.provider === 'gemini' ? geminiPool.getKeyIndex(apiKey) : 0;
        const keyLabel = modelConfig.provider === 'gemini' && geminiPool.size > 1
          ? ` [key #${keyIndex + 1}/${geminiPool.size}]`
          : '';
        console.error(`[ai-router] ${phase} → ${modelConfig.provider}:${modelConfig.model}${keyLabel} ${modelConfig.label ? `(${modelConfig.label})` : ''}`);

        // 用量記錄：在 usage resolve 後自動寫入 DB
        const trackedUsagePromise = usagePromise.then((usage) => {
          if (usage.inputTokens > 0 || usage.outputTokens > 0) {
            try {
              recordApiUsage(
                modelConfig.provider,
                modelConfig.model,
                keyIndex,
                usage.inputTokens,
                usage.outputTokens,
              );
            } catch (e) {
              console.error('[ai-router] 記錄 API 用量失敗:', e);
            }
          }
          return usage;
        });

        return {
          stream: generateChunks(),
          getUsage: () => trackedUsagePromise,
          model: modelConfig.model,
          provider: modelConfig.provider,
        };

      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        // Gemini 限速：標記這個 key，嘗試下一個
        if (modelConfig.provider === 'gemini' && isRateLimitError(err)) {
          geminiPool.markRateLimited(apiKey);
          console.error(`[ai-router] Gemini key 限速，嘗試下一個 key (${retry + 1}/${maxRetries})`);
          continue;
        }

        console.error(`[ai-router] ${modelConfig.provider}:${modelConfig.model} 失敗: ${errorMsg}`);
        lastError = err instanceof Error ? err : new Error(errorMsg);
        break; // 非限速錯誤，換下一個 provider
      }
    }
  }

  throw lastError || new Error(`[ai-router] 所有 provider 都無法使用 (phase: ${phase})`);
}

// ── 取得目前使用的模型資訊（用於前端顯示）──

export function getActiveModels(): Record<string, ModelConfig[]> {
  return {
    opening: getPhaseModels('opening'),
    discussion: getPhaseModels('discussion'),
    summary: getPhaseModels('summary'),
  };
}

// ── 取得 Gemini key pool 狀態 ──

export function getKeyPoolStatus(): { total: number; available: number } {
  const now = Date.now();
  let available = 0;
  for (let i = 0; i < geminiPool.size; i++) {
    const cd = (geminiPool as any).cooldowns?.get(i) || 0;
    if (now >= cd) available++;
  }
  return { total: geminiPool.size, available };
}
