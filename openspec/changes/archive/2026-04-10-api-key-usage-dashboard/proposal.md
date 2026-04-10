## Why

目前管理後台無法看到各 Gemini API Key 的使用狀況和剩餘免費額度。系統已支援多 key 輪替（ai-router.ts），但管理員無法得知哪個 key 快要耗盡配額、何時需要切換或補充，容易在用戶使用中途突然觸發 fallback 到付費的 Anthropic API。

## What Changes

- 新增 API Key 使用狀況 API 端點，回傳各 key 的累計 token 用量與預估剩餘額度
- 在管理後台新增「API 使用狀況」區塊，以水平長條圖顯示每個 key 的已用量 vs 免費額度上限
- 在 ai-router 中記錄每次呼叫的 token 用量到資料庫
- 長條圖顯示：key 編號、已用 token 數、剩餘額度、用量百分比，以顏色區分安全/警告/危險

## Capabilities

### New Capabilities
- `api-usage-tracking`: 記錄每次 AI 呼叫的 token 用量（provider、model、key 編號、input/output tokens）到資料庫
- `api-usage-chart`: 管理後台的 API Key 使用狀況長條圖元件，顯示各 key 的剩餘額度

### Modified Capabilities

## Impact

- `src/lib/ai-router.ts` — 呼叫完成後寫入 token 使用記錄
- `src/lib/db.ts` — 新增 `api_usage` 資料表
- `src/app/api/admin/api-usage/route.ts` — 新增 API 端點
- `src/app/admin/page.tsx` — 新增長條圖區塊
- 無 breaking change，純新增功能
