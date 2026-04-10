## Why

管理面板目前的儀表板資訊過於簡略，無法讓管理員一目了然系統運作狀況。主要缺失：
1. **缺少費用預估** — 系統已追蹤 token_input / token_output，但儀表板未將其換算為實際 API 費用，管理員無法掌握成本
2. **發起人顯示不完整** — 近期會議列表僅顯示 user_id，無法直觀辨識是哪位使用者發起
3. **儀表板數據不足** — 僅有 4 張統計卡片和簡易圖表，缺少成本趨勢、系統健康度、使用者活躍度等關鍵運營指標

## What Changes

- **新增費用預估功能**：根據 Claude API 定價，將 token_input / token_output 換算為預估費用（USD），顯示於儀表板統計卡片與會議列表中
- **發起人帳號顯示**：近期會議與會議管理頁面中，將 user_id 替換為使用者名稱與 email 顯示
- **儀表板全面優化**：
  - 增加費用相關統計卡片（總費用、本月費用、平均每場費用）
  - 增加 7 日費用趨勢圖表
  - 增加系統概覽區塊（活躍使用者數、今日會議數、平均討論時間）
  - 優化近期會議表格，加入費用欄位與發起人帳號
  - 增加使用者排行榜的費用資訊

## Capabilities

### New Capabilities
- `cost-estimation`: API 費用預估計算與顯示，包含定價模型設定、token 費用換算邏輯、各層級費用匯總
- `dashboard-overview`: 強化儀表板概覽，包含多維度統計卡片、趨勢圖表、系統健康度指標

### Modified Capabilities
<!-- 無需修改既有規格 -->

## Impact

- **前端**：`src/app/admin/page.tsx` — 儀表板頁面大幅重構
- **前端**：`src/app/admin/meetings/page.tsx` — 會議列表加入費用與發起人
- **後端**：`src/app/api/admin/dashboard/route.ts` — API 回傳更多統計數據（費用匯總、趨勢、活躍度）
- **後端**：`src/app/api/admin/meetings/route.ts` — 會議列表 JOIN 使用者資訊
- **新增**：費用計算工具函式（定價常數 + 換算邏輯）
- **無破壞性變更**：不影響現有資料庫 schema，僅基於既有 token 欄位做計算
