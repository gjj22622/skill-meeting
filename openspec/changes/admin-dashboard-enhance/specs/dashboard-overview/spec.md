## ADDED Requirements

### Requirement: 統計卡片擴充為六張
儀表板頂部 SHALL 顯示 6 張統計卡片：
1. 總使用者數
2. 總會議數
3. 已完成會議數
4. 總費用 (USD)
5. 本月費用 (USD)
6. 平均每場費用 (USD)

#### Scenario: 顯示完整統計卡片
- **WHEN** 管理員進入儀表板頁面
- **THEN** 頁面頂部顯示 6 張統計卡片，費用相關卡片標示 "USD" 單位

#### Scenario: 費用卡片格式化
- **WHEN** 總費用為 1.23456 USD
- **THEN** 卡片顯示為 "$1.23" 格式（保留兩位小數）

### Requirement: 雙趨勢圖表
儀表板中部 SHALL 顯示兩張並排圖表：
- 左側：近 7 日會議數趨勢（既有柱狀圖）
- 右側：近 7 日費用趨勢（新增柱狀圖，顯示每日 USD 費用）

#### Scenario: 費用趨勢圖表顯示
- **WHEN** 管理員查看儀表板
- **THEN** 右側圖表顯示近 7 日每日費用柱狀圖，Y 軸為 USD 金額，X 軸為日期

#### Scenario: 無資料日期
- **WHEN** 某日無任何會議
- **THEN** 該日柱狀圖高度為 0

### Requirement: 近期會議表格顯示發起人帳號
近期會議表格 SHALL 將原本的 user_id 替換為發起人的名稱與 email 顯示。格式為「名稱 (email)」。

#### Scenario: 顯示發起人資訊
- **WHEN** 會議由使用者 "Alice" (alice@example.com) 發起
- **THEN** 表格「發起人」欄位顯示 "Alice (alice@example.com)"

#### Scenario: 使用者已刪除
- **WHEN** 發起人帳號已被刪除
- **THEN** 表格顯示 "已刪除的使用者" 或類似佔位文字

### Requirement: 近期會議表格增加費用欄位
近期會議表格 SHALL 新增「預估費用」欄位，顯示該場會議的 USD 費用。

#### Scenario: 表格費用欄位
- **WHEN** 會議 token_input=50000, token_output=20000
- **THEN** 費用欄位顯示計算後的 USD 金額，格式為 "$X.XX"

### Requirement: 使用者排行榜增加費用資訊
Top 5 使用者排行榜 SHALL 在現有的名稱、email、會議數之外，新增「總費用」與「平均費用」欄位。

#### Scenario: 排行榜費用欄位
- **WHEN** 管理員查看使用者排行榜
- **THEN** 每位使用者顯示其所有會議的總費用與平均每場費用

### Requirement: Dashboard API 回傳發起人資訊
`GET /api/admin/dashboard` 的 `recentMeetings` 陣列中每筆會議 SHALL 包含 `user_name` 和 `user_email` 欄位（透過 JOIN users 表取得）。

#### Scenario: 近期會議包含使用者資訊
- **WHEN** 管理員請求 dashboard API
- **THEN** `recentMeetings` 每筆包含 `user_name`（字串）與 `user_email`（字串）

### Requirement: Dashboard API 回傳使用者排行費用
`GET /api/admin/dashboard` 的 `topUsers` 陣列 SHALL 新增 `total_cost` 和 `avg_cost` 欄位。

#### Scenario: 使用者排行含費用
- **WHEN** 管理員請求 dashboard API
- **THEN** `topUsers` 每筆包含 `total_cost`（USD 浮點數）與 `avg_cost`（USD 浮點數）
