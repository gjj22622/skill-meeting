## Context

管理面板目前的儀表板（`src/app/admin/page.tsx`）顯示 4 張統計卡片（使用者數、會議數、已完成、Token 用量）、7 日會議數柱狀圖、近期會議表格（顯示 user_id）、Top 5 使用者排行。

資料庫 meetings 表已有 `token_input`、`token_output`、`token_usage`、`duration_ms` 欄位，且 `user_id` 已關聯 users 表。後端 dashboard API 已回傳 `totalTokenInput`、`totalTokenOutput` 但前端未充分利用。

## Goals / Non-Goals

**Goals:**
- 在儀表板加入 API 費用預估，讓管理員掌握成本
- 近期會議與會議管理頁面以使用者名稱/email 取代 user_id
- 提供更豐富的儀表板指標：費用趨勢、活躍度、平均數據

**Non-Goals:**
- 不建立即時定價更新機制（使用硬編碼定價常數，手動更新即可）
- 不修改資料庫 schema（所有資料已存在）
- 不做多幣別支援（統一顯示 USD）
- 不做會議詳情頁面改版

## Decisions

### 1. 費用計算方式 — 前端計算 vs 後端計算

**選擇：後端計算，前端顯示**

將費用計算邏輯放在 `src/lib/pricing.ts` 工具函式中，由 dashboard API 呼叫後回傳已計算好的費用數字。

**理由：**
- 定價邏輯集中管理，避免前後端不一致
- 未來若需切換模型（不同定價），只需改一處
- API 回傳的數字可直接用於報表匯出

**替代方案：** 前端根據 token 數自行計算 — 缺點是定價常數分散、難以維護

### 2. 定價模型 — Claude Sonnet 4 定價

**選擇：以 Claude Sonnet 4 定價為預設**

| 項目 | 費率 |
|------|------|
| Input tokens | $3.00 / 1M tokens |
| Output tokens | $15.00 / 1M tokens |

定價常數放在 `src/lib/pricing.ts`，含匯出的計算函式 `estimateCost(inputTokens, outputTokens)`。

**理由：** 專案使用 Anthropic SDK，目前主流模型為 Sonnet 4，定價透明且穩定。

### 3. 儀表板佈局 — 分區塊設計

**選擇：四區塊佈局**

1. **統計卡片列**（頂部）：6 張卡片 — 總使用者、總會議、已完成會議、總費用(USD)、本月費用、平均每場費用
2. **圖表區**（中部）：左側 7 日會議數趨勢 + 右側 7 日費用趨勢（雙圖並排）
3. **近期會議表格**（下部）：加入發起人（名稱+email）、費用欄位
4. **排行榜**（底部）：Top 5 使用者加入費用與平均費用欄位

### 4. 發起人顯示 — SQL JOIN

**選擇：在 dashboard API 的 SQL 查詢中 JOIN users 表**

近期會議查詢改為 `LEFT JOIN users ON m.user_id = u.id`，回傳 `user_name` 和 `user_email`。

Dashboard API 已有部分 JOIN 邏輯（topUsers），擴展到 recentMeetings 即可。

## Risks / Trade-offs

- **[定價過時]** → 定價常數硬編碼，Claude 調價後需手動更新 `pricing.ts`。緩解：加註釋標明更新日期與來源。
- **[大量資料效能]** → 月度費用匯總需掃描當月所有會議。緩解：SQLite 在千級記錄量下效能足夠，當前規模不成問題。
- **[幣別混淆]** → 僅顯示 USD，台灣使用者可能不直觀。緩解：卡片加上 "USD" 標示，未來可加匯率換算。
