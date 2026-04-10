## ADDED Requirements

### Requirement: 系統記錄每次 AI 呼叫的 token 用量
系統 SHALL 在每次 AI 呼叫完成後，將 token 用量記錄到 `api_usage` 資料表，包含 provider、model、key 編號、input/output tokens 和時間戳。

#### Scenario: 成功記錄 Gemini 呼叫
- **WHEN** ai-router 完成一次 Gemini streaming 呼叫且取得 usage 數據
- **THEN** 系統寫入一筆記錄：provider='gemini', model='gemini-2.0-flash', key_index=使用的 key 編號, input_tokens=實際值, output_tokens=實際值

#### Scenario: 無 usage 數據時的估算記錄
- **WHEN** ai-router 完成呼叫但 provider 未回傳 usage 數據（input_tokens 和 output_tokens 皆為 0）
- **THEN** 系統仍寫入記錄，input_tokens 和 output_tokens 為 0，不進行估算

#### Scenario: 呼叫失敗不記錄
- **WHEN** AI 呼叫拋出錯誤（如 429 限速、網路錯誤）
- **THEN** 系統不寫入 api_usage 記錄

### Requirement: API 用量查詢端點
系統 SHALL 提供 `GET /api/admin/api-usage` 端點，回傳各 key 的當日累計用量。

#### Scenario: 查詢當日各 key 用量
- **WHEN** 管理員呼叫 `GET /api/admin/api-usage`
- **THEN** 回傳 JSON 包含每個 Gemini key 的 `key_index`、`total_input_tokens`、`total_output_tokens`、`total_requests`、`daily_token_limit`、`daily_request_limit`

#### Scenario: 需要管理員權限
- **WHEN** 未登入或非管理員呼叫此端點
- **THEN** 回傳 403 Forbidden

### Requirement: 資料庫 schema 初始化
系統 SHALL 在資料庫初始化時自動建立 `api_usage` 資料表。

#### Scenario: 首次啟動建立資料表
- **WHEN** 應用程式首次啟動且 `api_usage` 表不存在
- **THEN** 系統自動建立 `api_usage` 表，包含 id, provider, model, key_index, input_tokens, output_tokens, meeting_id, created_at 欄位
