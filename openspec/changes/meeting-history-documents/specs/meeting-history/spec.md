## ADDED Requirements

### Requirement: 主題歷程時間軸頁面
系統 SHALL 提供 `/topic/[id]` 頁面，以時間軸形式顯示同一主題群組下所有會議的紀錄。每場會議顯示主題、日期、狀態、參與角色、報告摘要（若已完成）。

#### Scenario: 檢視有多場會議的主題歷程
- **WHEN** 使用者進入某主題群組頁面，群組下有 3 場會議
- **THEN** 頁面以時間軸（由新到舊）顯示 3 場會議卡片，每張包含主題、日期、狀態徽章、參與角色頭像

#### Scenario: 已完成會議顯示報告摘要
- **WHEN** 時間軸中某場會議 status=completed
- **THEN** 該會議卡片額外顯示 consensus 摘要前 100 字，點擊可展開完整報告或跳轉到報告頁

#### Scenario: 從歷程頁發起新會議
- **WHEN** 使用者在主題歷程頁點擊「發起新一輪討論」按鈕
- **THEN** 跳轉到會議建立頁面，自動帶入 topicGroupId 與上次會議的主題名稱

### Requirement: 主題歷程 API
系統 SHALL 提供 `GET /api/topic-groups/[id]/meetings` 端點，回傳該群組下所有會議（按 created_at 倒序），包含基本資訊與報告摘要。

#### Scenario: 取得群組會議列表
- **WHEN** 使用者請求 `GET /api/topic-groups/group-123/meetings`
- **THEN** 系統回傳 `[{ id, topic, status, goalType, rounds, skillIds, createdAt, reportSummary?, documentCount }]`

#### Scenario: 群組不存在
- **WHEN** 請求不存在的群組 ID
- **THEN** 系統回傳 HTTP 404

### Requirement: 首頁按主題群組顯示
首頁的會議列表 SHALL 將屬於同一主題群組的會議摺疊為一個群組卡片，顯示群組名稱、會議數量、最新會議日期。獨立會議（無群組）照常顯示為個別卡片。

#### Scenario: 混合顯示群組與獨立會議
- **WHEN** 使用者有 2 個主題群組（各含 2 場會議）和 1 場獨立會議
- **THEN** 首頁顯示 2 張群組卡片 + 1 張獨立會議卡片，共 3 張

#### Scenario: 展開群組卡片
- **WHEN** 使用者點擊群組卡片
- **THEN** 跳轉到 `/topic/[id]` 主題歷程頁面

### Requirement: 會議文件在會議室中顯示
會議室頁面 SHALL 在討論區上方或側欄顯示該場會議的附件文件列表，每筆包含檔名、格式圖示、大小，點擊可下載。

#### Scenario: 會議有附件
- **WHEN** 使用者進入有 2 個附件的會議室
- **THEN** 頁面顯示文件列表，每筆可點擊下載

#### Scenario: 會議無附件
- **WHEN** 使用者進入無附件的會議室
- **THEN** 不顯示文件區域（不佔空間）
