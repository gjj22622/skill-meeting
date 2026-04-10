## 1. 資料庫遷移

- [ ] 1.1 在 `src/lib/db.ts` 新增 `topic_groups` 資料表（id, user_id, name, description, created_at, updated_at）
- [ ] 1.2 在 `src/lib/db.ts` 新增 `meeting_documents` 資料表（id, meeting_id, original_name, stored_name, mime_type, size_bytes, created_at）
- [ ] 1.3 在 `src/lib/db.ts` 對 `meetings` 表新增 `topic_group_id` 欄位（ALTER TABLE，可為 NULL）
- [ ] 1.4 驗證本地 `npm run dev` 啟動時遷移正確執行，既有資料不受影響

## 2. 主題群組 API

- [ ] 2.1 建立 `src/app/api/topic-groups/route.ts`：GET（列表含 meeting_count）和 POST（建立群組）
- [ ] 2.2 建立 `src/app/api/topic-groups/[id]/route.ts`：GET（群組詳情）、PATCH（更新）、DELETE
- [ ] 2.3 建立 `src/app/api/topic-groups/[id]/meetings/route.ts`：GET（群組下所有會議，含報告摘要與文件數量）
- [ ] 2.4 修改 `src/app/api/meetings/route.ts` POST：支援 `topicGroupId` 和 `newTopicGroup` 參數

## 3. 文件上傳 API

- [ ] 3.1 建立 `src/app/api/meetings/[id]/documents/route.ts`：POST（multipart 上傳，格式與大小驗證）和 GET（文件列表）
- [ ] 3.2 建立 `src/app/api/meetings/[id]/documents/[docId]/route.ts`：DELETE（刪除文件記錄與實體檔）
- [ ] 3.3 建立 `src/app/api/meetings/[id]/documents/[docId]/download/route.ts`：GET（回傳文件二進位內容）
- [ ] 3.4 確保 `data/uploads/` 目錄在應用啟動時自動建立，Dockerfile 中包含該目錄

## 4. 討論引擎整合

- [ ] 4.1 修改 `src/lib/discussion-engine.ts`：接受可選的 `previousReport` 參數，注入到 AI 角色 system prompt
- [ ] 4.2 修改 `src/app/api/meeting/[id]/discuss/route.ts`：發起討論前查詢同群組最近一場已完成會議的報告，傳入 discussion engine

## 5. TypeScript 型別更新

- [ ] 5.1 在 `src/lib/types.ts` 新增 `TopicGroup`、`MeetingDocument` 介面
- [ ] 5.2 修改 `Meeting` 介面，新增 `topicGroupId?` 和 `documents?` 欄位

## 6. 前端 — 會議建立頁面

- [ ] 6.1 修改 `src/app/meeting/new/page.tsx`：新增主題群組選擇器（下拉選單：「建立新主題」或選擇既有群組）
- [ ] 6.2 修改 `src/app/meeting/new/page.tsx`：新增文件上傳區（拖放 + 點擊選擇，顯示已選文件列表，支援移除）
- [ ] 6.3 修改表單送出邏輯：先建立會議，再逐一上傳文件

## 7. 前端 — 主題歷程頁面

- [ ] 7.1 建立 `src/app/topic/[id]/page.tsx`：主題歷程時間軸頁面，按時間倒序顯示群組下所有會議
- [ ] 7.2 每張會議卡片顯示：主題、日期、狀態徽章、參與角色頭像、報告摘要前 100 字（已完成時）
- [ ] 7.3 新增「發起新一輪討論」按鈕，跳轉到建立頁面並自動帶入 topicGroupId

## 8. 前端 — 首頁與會議室

- [ ] 8.1 修改首頁 `src/app/page.tsx`：將同群組會議摺疊為群組卡片（顯示群組名、會議數、最新日期），獨立會議照常顯示
- [ ] 8.2 修改會議室 `src/components/meeting-room.tsx`：在討論區上方顯示附件文件列表（檔名、格式圖示、大小、下載連結）
