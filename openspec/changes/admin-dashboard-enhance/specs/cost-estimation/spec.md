## ADDED Requirements

### Requirement: 費用計算工具函式
系統 SHALL 提供 `src/lib/pricing.ts` 模組，包含 Claude API 定價常數與費用計算函式 `estimateCost(inputTokens: number, outputTokens: number): number`，回傳預估費用（USD）。

#### Scenario: 計算單場會議費用
- **WHEN** 傳入 inputTokens=10000, outputTokens=5000
- **THEN** 回傳 `(10000 * 3.00 / 1000000) + (5000 * 15.00 / 1000000)` = 0.105 (USD)

#### Scenario: 零 token 費用
- **WHEN** 傳入 inputTokens=0, outputTokens=0
- **THEN** 回傳 0

### Requirement: Dashboard API 回傳費用匯總
`GET /api/admin/dashboard` SHALL 在回應中增加以下費用相關欄位：
- `totalCostUSD`: 所有已完成會議的總預估費用
- `monthCostUSD`: 當月已完成會議的預估費用
- `avgCostPerMeeting`: 平均每場會議費用
- `costPerDay`: 近 7 日每日費用陣列 `[{ date, cost }]`

#### Scenario: 取得儀表板費用數據
- **WHEN** 管理員請求 `GET /api/admin/dashboard`
- **THEN** 回應 JSON 包含 `totalCostUSD`、`monthCostUSD`、`avgCostPerMeeting`、`costPerDay` 欄位，數值為 USD 浮點數

#### Scenario: 無已完成會議時的費用
- **WHEN** 系統中無任何已完成會議
- **THEN** `totalCostUSD`、`monthCostUSD`、`avgCostPerMeeting` 均為 0，`costPerDay` 為空陣列或全部為 0

### Requirement: 會議列表包含費用欄位
`GET /api/admin/meetings` 回傳的每場會議 SHALL 包含 `estimatedCostUSD` 欄位，為該場會議的預估費用。

#### Scenario: 會議列表含費用
- **WHEN** 管理員請求 `GET /api/admin/meetings`
- **THEN** 每筆會議資料包含 `estimatedCostUSD` 數值欄位

#### Scenario: 未完成會議的費用
- **WHEN** 會議狀態為 draft 或 in_progress，token_usage 為 0
- **THEN** `estimatedCostUSD` 為 0
