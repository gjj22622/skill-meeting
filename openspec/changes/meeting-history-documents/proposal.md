## Why

目前每場會議（Meeting）都是獨立的，即使使用者反覆討論同一個主題，也無法將歷次會議串聯在一起。這造成兩個問題：
1. **缺乏討論脈絡延續** — 使用者無法追蹤同一主題的演進歷程，也無法讓 AI 參考上次討論結果
2. **無法附帶真實文件** — `source_data` 僅支援純文字貼上，無法上傳 PDF、Word 等文件檔作為會議背景資料

新增「主題會議歷程」與「文件上傳」功能，讓使用者能在同一主題下堆疊多次會議紀錄，並附帶真實會議文件，形成完整的決策追蹤鏈。

## What Changes

- **新增主題群組（Topic Group）概念**：引入 `topic_groups` 資料表，將多場同主題會議串聯為一個群組。建立會議時可選擇「延續既有主題」或「建立新主題」
- **會議歷程檢視**：新增主題歷程頁面，按時間軸顯示同主題下所有會議紀錄與報告摘要，一目了然討論演進
- **文件上傳功能**：新增 `meeting_documents` 資料表與檔案上傳 API，支援 PDF、DOCX、TXT、MD 格式。檔案儲存於 `data/uploads/` 目錄
- **討論引擎整合**：發起新一輪討論時，AI 角色可自動參考同主題前次會議的報告摘要作為背景脈絡

## Capabilities

### New Capabilities
- `topic-group`: 主題群組管理，將多場會議歸屬於同一主題群組，支援建立、查詢、歷程瀏覽
- `document-upload`: 會議文件上傳與管理，支援多種格式文件的上傳、儲存、列表、下載與刪除
- `meeting-history`: 主題歷程檢視，按時間軸顯示同主題下的所有會議紀錄與報告演進

### Modified Capabilities
<!-- 無需修改既有規格 -->

## Impact

- **資料庫**：新增 `topic_groups` 和 `meeting_documents` 兩張資料表，`meetings` 表新增 `topic_group_id` 欄位
- **後端 API**：
  - 新增 `/api/topic-groups` — 主題群組 CRUD
  - 新增 `/api/upload` — 文件上傳端點
  - 新增 `/api/meetings/[id]/documents` — 會議文件管理
  - 修改 `/api/meetings` POST — 支援指定 topic_group_id
  - 修改 `/api/meeting/[id]/discuss` — 注入前次會議報告作為脈絡
- **前端**：
  - 修改 `src/app/meeting/new/page.tsx` — 新增主題選擇器與文件上傳區
  - 新增 `src/app/topic/[id]/page.tsx` — 主題歷程頁面
  - 修改首頁 — 按主題群組顯示會議列表
- **檔案系統**：`data/uploads/` 目錄用於儲存上傳文件
- **Dockerfile**：確保 `data/uploads/` 包含在持久化卷掛載中
