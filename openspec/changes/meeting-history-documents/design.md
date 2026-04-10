## Context

目前 Skill Meeting 的每場會議（Meeting）都是獨立實體，以 UUID 為 primary key，透過 `topic` 字串欄位描述討論主題。使用者若重複討論同一主題，必須從頭建立新會議，且無法參考前次討論結果。`source_data` 欄位僅支援純文字貼上，無法上傳文件檔。

資料庫使用 SQLite（better-sqlite3），檔案式儲存於 `data/skill-meeting.db`。部署於 Zeabur，`/app/data` 為持久化卷掛載點。

## Goals / Non-Goals

**Goals:**
- 讓同一主題的多場會議能串聯為群組，形成可追蹤的討論歷程
- 支援上傳 PDF、DOCX、TXT、MD 文件作為會議背景資料
- 新一輪討論時，AI 可自動參考同主題前次會議報告
- 提供主題歷程時間軸頁面

**Non-Goals:**
- 不做文件內容解析（如 OCR、PDF 文字提取）— 文件僅作為附件存取
- 不做即時協作編輯
- 不做文件版本控制
- 不做雲端儲存整合（S3 等）— 使用本地檔案系統

## Decisions

### 1. 主題群組資料模型 — 獨立表 vs 自關聯

**選擇：新增 `topic_groups` 獨立表**

```sql
topic_groups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

`meetings` 表新增 `topic_group_id TEXT REFERENCES topic_groups(id)`（可為 NULL，向後相容）。

**理由：**
- 群組有獨立的名稱和描述，不應綁定在任何一場會議上
- 允許先建群組再逐步新增會議
- NULL 值保持向後相容，既有會議不受影響

**替代方案：** meetings 表加 `parent_meeting_id` 自關聯 — 缺點是只能形成鏈狀結構，無法自由組合

### 2. 文件儲存 — 本地檔案系統

**選擇：儲存於 `data/uploads/{meeting_id}/` 目錄**

```sql
meeting_documents (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

檔案以 `{uuid}.{ext}` 格式儲存，避免檔名衝突。metadata 存資料庫，實體檔存檔案系統。

**理由：**
- 與現有 SQLite + 本地檔案架構一致
- `data/` 已為 Zeabur 持久化卷，文件自動持久化
- 無需引入外部依賴（S3 SDK 等）

**替代方案：** 存入 SQLite BLOB — 缺點是大檔會膨脹資料庫，影響備份與效能

### 3. 文件大小限制 — 10MB 單檔

**選擇：單檔上限 10MB，每場會議最多 5 個文件**

**理由：** PDF/DOCX 文件通常在 10MB 以內，足以涵蓋大多數會議文件。限制數量避免儲存空間失控。

### 4. 前次會議脈絡注入 — 討論引擎整合

**選擇：在 discussion-engine 的 system prompt 中注入前次會議報告摘要**

發起新討論時，若該會議屬於某 topic_group，自動查詢同群組最近一場已完成會議的 report，提取 `consensus` + `disagreements` + `openQuestions` 作為額外脈絡，附加到每位 AI 角色的 system prompt。

**理由：**
- 不改變 streaming 架構，僅擴充 prompt 內容
- 使用報告摘要（而非完整 transcript）控制 token 用量
- AI 角色能延續上次討論的結論與未解問題

### 5. 向後相容遷移

**選擇：使用 ALTER TABLE 增量遷移**

在 `db.ts` 的 migration 區塊中：
- `ALTER TABLE meetings ADD COLUMN topic_group_id TEXT REFERENCES topic_groups(id)`
- 建立 `topic_groups` 和 `meeting_documents` 表

既有會議的 `topic_group_id` 為 NULL，功能正常不受影響。

## Risks / Trade-offs

- **[檔案系統依賴]** → 文件儲存依賴本地檔案系統，無法水平擴展。緩解：當前為單實例部署，規模足夠。未來可遷移到 S3。
- **[大量文件儲存]** → 持久化卷空間有限。緩解：10MB 單檔限制 + 每會議 5 檔上限。
- **[脈絡 token 增加]** → 注入前次報告會增加每次 API 呼叫的 token 用量。緩解：僅注入摘要欄位，約 500-1000 tokens。
- **[遷移風險]** → ALTER TABLE 在 SQLite 中是安全操作，不會遺失資料。現有欄位不受影響。
