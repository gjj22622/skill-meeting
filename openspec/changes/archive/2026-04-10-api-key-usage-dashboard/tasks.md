## 1. 資料庫 Schema

- [x] 1.1 在 `src/lib/db.ts` 的 `initDb()` 中新增 `api_usage` 資料表（id, provider, model, key_index, input_tokens, output_tokens, meeting_id, created_at）
- [x] 1.2 新增 `recordApiUsage()` 函式，寫入一筆用量記錄
- [x] 1.3 新增 `getDailyApiUsage()` 函式，查詢當日各 key 的累計用量

## 2. AI Router 整合

- [x] 2.1 修改 `src/lib/ai-router.ts` 的 `streamChat()`，在 getUsage() resolve 後呼叫 `recordApiUsage()` 記錄用量
- [x] 2.2 將 key_index 資訊傳入記錄函式（從 GeminiKeyPool 取得目前使用的 key 編號）
- [x] 2.3 在 `.env.example` 新增 `GEMINI_DAILY_TOKEN_LIMIT` 和 `GEMINI_DAILY_REQUEST_LIMIT` 環境變數說明

## 3. API 端點

- [x] 3.1 建立 `src/app/api/admin/api-usage/route.ts`，實作 GET handler
- [x] 3.2 回傳各 key 的 key_index、total_input_tokens、total_output_tokens、total_requests、daily_token_limit、daily_request_limit
- [x] 3.3 加入 requireAdmin 權限檢查

## 4. 前端長條圖元件

- [x] 4.1 在 `src/app/admin/page.tsx` 新增 `ApiUsageChart` 元件，使用 div + CSS 繪製水平長條圖
- [x] 4.2 實作顏色分級：綠色（<60%）、黃色（60-85%）、紅色（>85%）
- [x] 4.3 顯示 key 編號、已用 token 數（格式化）、剩餘 token 數、百分比
- [x] 4.4 實作 30 秒自動刷新（useEffect + setInterval）

## 5. 驗證

- [x] 5.1 本地啟動 dev server，確認頁面正常載入（200 OK）
- [x] 5.2 確認 API 端點權限檢查正常（未登入回傳 403）
- [x] 5.3 確認 TypeScript 編譯零錯誤
