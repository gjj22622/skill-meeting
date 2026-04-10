## ADDED Requirements

### Requirement: 上傳文件到會議
系統 SHALL 提供 `POST /api/meetings/[id]/documents` 端點，接受 multipart/form-data 格式的文件上傳。支援 PDF、DOCX、TXT、MD 格式，單檔上限 10MB。

#### Scenario: 成功上傳 PDF 文件
- **WHEN** 使用者上傳一個 5MB 的 PDF 檔案到會議
- **THEN** 系統儲存檔案至 `data/uploads/{meeting_id}/`，在 `meeting_documents` 表建立記錄，回傳 `{ id, originalName, mimeType, sizeBytes }` HTTP 201

#### Scenario: 檔案格式不支援
- **WHEN** 使用者上傳 .exe 檔案
- **THEN** 系統回傳 HTTP 400 並提示僅支援 PDF、DOCX、TXT、MD 格式

#### Scenario: 檔案超過大小限制
- **WHEN** 使用者上傳超過 10MB 的檔案
- **THEN** 系統回傳 HTTP 400 並提示檔案大小超過限制

#### Scenario: 會議文件數量達上限
- **WHEN** 會議已有 5 個文件，使用者嘗試上傳第 6 個
- **THEN** 系統回傳 HTTP 400 並提示每場會議最多 5 個文件

### Requirement: 查詢會議的文件列表
系統 SHALL 提供 `GET /api/meetings/[id]/documents` 端點，回傳該會議所有已上傳文件的 metadata。

#### Scenario: 取得文件列表
- **WHEN** 使用者請求會議的文件列表
- **THEN** 系統回傳 `[{ id, originalName, mimeType, sizeBytes, createdAt }]`

#### Scenario: 無任何文件
- **WHEN** 會議無上傳文件
- **THEN** 系統回傳空陣列 `[]`

### Requirement: 下載文件
系統 SHALL 提供 `GET /api/meetings/[id]/documents/[docId]/download` 端點，回傳文件的二進位內容，設定正確的 Content-Type 和 Content-Disposition header。

#### Scenario: 成功下載文件
- **WHEN** 使用者請求下載某文件
- **THEN** 系統回傳文件內容，Content-Type 為原始 MIME type，Content-Disposition 為 `attachment; filename="原始檔名"`

#### Scenario: 文件不存在
- **WHEN** 使用者請求下載不存在的文件 ID
- **THEN** 系統回傳 HTTP 404

### Requirement: 刪除文件
系統 SHALL 提供 `DELETE /api/meetings/[id]/documents/[docId]` 端點，刪除文件記錄與實體檔案。僅文件所屬會議的擁有者或管理員可執行。

#### Scenario: 成功刪除文件
- **WHEN** 會議擁有者請求刪除文件
- **THEN** 系統刪除 `meeting_documents` 記錄與 `data/uploads/` 中的實體檔案，回傳 HTTP 200

#### Scenario: 非擁有者嘗試刪除
- **WHEN** 非會議擁有者且非管理員嘗試刪除文件
- **THEN** 系統回傳 HTTP 403

### Requirement: 會議建立頁面的文件上傳 UI
會議建立頁面 SHALL 提供文件上傳區域，支援拖放與點擊選擇。顯示已選擇的文件列表（檔名、大小、格式圖示），可在送出前移除。

#### Scenario: 拖放上傳文件
- **WHEN** 使用者將 PDF 檔案拖放到上傳區域
- **THEN** 檔案出現在已選擇列表中，顯示檔名與大小

#### Scenario: 移除已選擇的文件
- **WHEN** 使用者點擊某文件旁的移除按鈕
- **THEN** 該文件從已選擇列表中移除
