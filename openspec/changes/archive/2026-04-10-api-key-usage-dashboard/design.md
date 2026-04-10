## Context

系統已有 `ai-router.ts` 支援 Gemini 多 key 輪替（GeminiKeyPool），但 token 用量只在 console.error 輸出，沒有持久化。管理後台 (`/admin`) 有 StatCard 和 meetingsPerDay 圖表，但無 API 使用監控。

Gemini 免費額度：gemini-2.0-flash 每天 1,500 requests / 100 萬 tokens（per key）。

## Goals / Non-Goals

**Goals:**
- 每次 AI 呼叫後記錄 token 用量到 SQLite
- 管理後台顯示各 key 的用量長條圖（已用 vs 剩餘額度）
- 用顏色區分安全（綠）/ 警告（黃）/ 危險（紅）狀態

**Non-Goals:**
- 不實作即時 Gemini API 查詢（Google 無此 API）
- 不實作 per-user 費用分攤
- 不實作自動購買或升級 API plan

## Decisions

### 1. Token 用量記錄在 SQLite（不用外部服務）

在 `db.ts` 新增 `api_usage` 表：

```sql
CREATE TABLE IF NOT EXISTS api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,        -- 'gemini' | 'openrouter' | 'anthropic'
  model TEXT NOT NULL,
  key_index INTEGER NOT NULL,    -- 第幾個 key（0-based）
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  meeting_id TEXT,               -- 關聯的 meeting（可為 null）
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Why:** 與現有 SQLite 架構一致，不增加外部依賴。用量數據不大，SQLite 足以應付。

### 2. 在 ai-router 中 callback 記錄（不改 discussion-engine）

在 `streamChat()` 的 `getUsage()` resolve 後，自動呼叫記錄函式。這樣所有使用 ai-router 的程式碼都會自動被追蹤。

**Why:** 單一記錄點，不需修改每個呼叫端。

### 3. 免費額度以環境變數設定

```env
GEMINI_DAILY_TOKEN_LIMIT=1000000   # 每個 key 每天的 token 上限
GEMINI_DAILY_REQUEST_LIMIT=1500     # 每個 key 每天的 request 上限
```

**Why:** Gemini 的免費額度可能調整，硬編碼不靈活。預設值對應目前的免費方案。

### 4. 純 CSS 長條圖（不引入 chart 套件）

用 `div` + CSS `width` 百分比 + 漸變色實作長條圖。

**Why:** 避免引入 recharts/chart.js 等重型依賴。長條圖結構簡單，CSS 足矣。

## Risks / Trade-offs

- **[Token 計數不精確]** → Gemini OpenAI 相容 API 的 streaming response 不一定回傳 usage。Mitigation: 在沒有 usage 數據時，用 response 長度估算。
- **[每日重置時區]** → 免費額度重置時間可能是 UTC 或 Pacific。Mitigation: 預設 UTC，可透過環境變數調整。
- **[SQLite 寫入競爭]** → 多個同時進行的 meeting 可能同時寫入。Mitigation: SQLite WAL mode 已在 db.ts 中啟用，可承受。
