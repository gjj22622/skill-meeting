## ADDED Requirements

### Requirement: 建立主題群組
系統 SHALL 提供 `POST /api/topic-groups` 端點，接受 `{ name, description? }` 建立新的主題群組，回傳群組 ID。群組歸屬於當前登入使用者。

#### Scenario: 成功建立主題群組
- **WHEN** 使用者送出 `POST /api/topic-groups` 附帶 `{ name: "用戶留存策略" }`
- **THEN** 系統建立新群組並回傳 `{ id, name, description, created_at }`，HTTP 201

#### Scenario: 名稱為空
- **WHEN** 使用者送出 `POST /api/topic-groups` 附帶 `{ name: "" }`
- **THEN** 系統回傳 HTTP 400 並提示名稱不可為空

### Requirement: 查詢使用者的主題群組列表
系統 SHALL 提供 `GET /api/topic-groups` 端點，回傳當前使用者的所有主題群組，按更新時間倒序排列，每筆包含群組資訊與所屬會議數量。

#### Scenario: 取得主題群組列表
- **WHEN** 使用者請求 `GET /api/topic-groups`
- **THEN** 系統回傳 `[{ id, name, description, meeting_count, latest_meeting_date, created_at }]`

#### Scenario: 無任何群組
- **WHEN** 使用者無任何主題群組
- **THEN** 系統回傳空陣列 `[]`

### Requirement: 建立會議時可指定主題群組
`POST /api/meetings` SHALL 支援選填的 `topicGroupId` 參數。若提供，會議將歸屬於該主題群組。若不提供，行為與現有相同（獨立會議）。

#### Scenario: 建立會議並指定群組
- **WHEN** 使用者送出 `POST /api/meetings` 附帶 `{ topic, skillIds, rounds, goalType, topicGroupId: "group-123" }`
- **THEN** 會議建立成功，`topic_group_id` 設為 "group-123"

#### Scenario: 建立會議不指定群組
- **WHEN** 使用者送出 `POST /api/meetings` 不含 `topicGroupId`
- **THEN** 會議建立成功，`topic_group_id` 為 NULL（向後相容）

#### Scenario: 指定不存在的群組
- **WHEN** 使用者送出 `POST /api/meetings` 附帶不存在的 `topicGroupId`
- **THEN** 系統回傳 HTTP 400 並提示群組不存在

### Requirement: 建立會議時可一併建立新群組
`POST /api/meetings` SHALL 支援 `newTopicGroup` 參數（`{ name, description? }`）。若提供，系統先建立群組再將會議歸入。`topicGroupId` 與 `newTopicGroup` 不可同時提供。

#### Scenario: 建立會議並同時建立新群組
- **WHEN** 使用者送出 `POST /api/meetings` 附帶 `{ topic, skillIds, newTopicGroup: { name: "AI 導入評估" } }`
- **THEN** 系統先建立主題群組，再建立會議並歸入該群組

### Requirement: 討論引擎注入前次會議脈絡
當會議屬於某主題群組時，`POST /api/meeting/[id]/discuss` SHALL 自動查詢同群組最近一場已完成會議的報告，將 `consensus`、`disagreements`、`openQuestions` 注入到 AI 角色的 system prompt 中。

#### Scenario: 有前次會議紀錄
- **WHEN** 同群組已有一場 status=completed 的會議
- **THEN** 討論引擎的 system prompt 包含前次會議報告摘要，AI 角色能參考先前結論

#### Scenario: 群組首場會議
- **WHEN** 會議是群組中的第一場（無前次紀錄）
- **THEN** 討論引擎行為與現有相同，不注入額外脈絡

#### Scenario: 獨立會議（無群組）
- **WHEN** 會議的 topic_group_id 為 NULL
- **THEN** 討論引擎行為與現有相同
