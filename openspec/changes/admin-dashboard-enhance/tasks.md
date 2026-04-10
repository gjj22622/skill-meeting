## 1. 費用計算基礎建設

- [ ] 1.1 建立 `src/lib/pricing.ts`，定義 Claude Sonnet 4 定價常數（input: $3/1M, output: $15/1M）與 `estimateCost(inputTokens, outputTokens)` 函式
- [ ] 1.2 匯出 `formatCostUSD(cost: number): string` 格式化函式，輸出 "$X.XX" 格式

## 2. Dashboard API 擴充

- [ ] 2.1 修改 `src/app/api/admin/dashboard/route.ts`，新增費用匯總查詢：`totalCostUSD`、`monthCostUSD`、`avgCostPerMeeting`
- [ ] 2.2 新增近 7 日每日費用查詢 `costPerDay`，回傳 `[{ date, cost }]` 陣列
- [ ] 2.3 修改 `recentMeetings` SQL 查詢，JOIN users 表取得 `user_name` 和 `user_email`
- [ ] 2.4 修改 `topUsers` 查詢，新增 `total_cost` 和 `avg_cost` 欄位（基於 token_input/token_output 計算）

## 3. 會議管理 API 擴充

- [ ] 3.1 修改 `src/app/api/admin/meetings/route.ts`，每筆會議新增 `estimatedCostUSD` 計算欄位

## 4. 儀表板前端重構

- [ ] 4.1 修改 `src/app/admin/page.tsx` 統計卡片區：從 4 張擴充為 6 張（新增總費用、本月費用、平均每場費用），費用卡片顯示 "$X.XX USD" 格式
- [ ] 4.2 新增費用趨勢圖表：在既有會議數圖表右側新增 7 日費用柱狀圖
- [ ] 4.3 修改近期會議表格：user_id 替換為「發起人」欄位（顯示名稱 + email），新增「預估費用」欄位
- [ ] 4.4 修改使用者排行榜：新增「總費用」與「平均費用」欄位

## 5. 會議管理頁面更新

- [ ] 5.1 修改 `src/app/admin/meetings/page.tsx`，會議列表加入預估費用欄位顯示
