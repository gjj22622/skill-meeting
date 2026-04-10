## ADDED Requirements

### Requirement: 管理後台顯示 API Key 使用狀況長條圖
管理後台 SHALL 在儀表板頁面顯示一個「API 使用狀況」區塊，以水平長條圖呈現每個 Gemini API Key 的當日用量與剩餘額度。

#### Scenario: 顯示多個 key 的用量
- **WHEN** 管理員進入管理後台儀表板
- **THEN** 頁面顯示每個 Gemini key 一列長條圖，包含：key 編號（如 "Key #1"）、已使用 token 數、剩餘 token 數、用量百分比數字

#### Scenario: 依用量比例顯示顏色
- **WHEN** key 用量低於 60%
- **THEN** 長條圖為綠色
- **WHEN** key 用量介於 60%-85%
- **THEN** 長條圖為黃色（警告）
- **WHEN** key 用量超過 85%
- **THEN** 長條圖為紅色（危險）

#### Scenario: 無用量資料
- **WHEN** 當天尚未有任何 AI 呼叫
- **THEN** 顯示全部 key 皆為空（0%），長條圖為綠色

### Requirement: 長條圖以純 CSS 實作
長條圖 SHALL 使用 div + CSS 實作，不引入外部圖表套件。

#### Scenario: 不依賴外部套件
- **WHEN** 渲染 API 使用狀況長條圖
- **THEN** 不 import 任何 chart 套件（如 recharts, chart.js），僅使用 HTML div 元素搭配 inline style 或 CSS class

### Requirement: 自動刷新用量資料
管理後台 SHALL 每 30 秒自動重新載入 API 用量資料。

#### Scenario: 定時刷新
- **WHEN** 管理員在儀表板頁面停留超過 30 秒
- **THEN** 頁面自動重新取得最新的 API 用量資料並更新長條圖，不需手動重整頁面
