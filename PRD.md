# Skill Meeting — 產品需求文件 (PRD)

> **版本**: 1.0.0
> **最後更新**: 2026-03-24
> **狀態**: MVP 已完成，Phase 2 規劃中

---

## 1. 產品概述

### 1.1 產品定義
**Skill Meeting** 是一個 AI 多角色圓桌討論平台。使用者可建立具有不同專業背景與人格的 AI 角色（Skill），讓它們針對指定主題進行多輪即時串流討論，最終自動產出結構化報告。

### 1.2 核心價值
- **多元觀點碰撞**：讓不同專業背景的 AI 角色從各自視角分析問題
- **結構化輸出**：自動整理共識、分歧、待釐清問題，產出可下載報告
- **可擴展角色庫**：內建 19 種預設角色 + 自訂角色 + 市集生態

### 1.3 目標使用者
- 產品經理、技術團隊、策略規劃者
- 需要多角度分析決策的個人與團隊
- 想快速獲得跨領域專家意見的使用者

---

## 2. 技術架構

### 2.1 技術堆疊

| 層級 | 技術 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.1.7 |
| 前端 | React | 19.2.4 |
| 語言 | TypeScript (Strict) | 5.9.3 |
| 樣式 | Tailwind CSS + Custom CSS Variables | 4.2.1 |
| AI 引擎 | Anthropic Claude API (Sonnet) | SDK 0.79.0 |
| ID 產生 | uuid | 13.0.0 |
| 部署 | Zeabur (standalone output) | — |

### 2.2 儲存架構（MVP）

| 資料類型 | 儲存方式 | localStorage Key |
|----------|----------|------------------|
| 預設 Skill | JSON 靜態檔案（bundled） | — |
| 自訂 Skill | localStorage | `skill-meeting-skills` |
| 會議資料 | localStorage | `skill-meeting-meetings` |
| 市集發佈 | localStorage | `skill-meeting-marketplace` |
| 市集種子資料 | JSON 靜態檔案（bundled） | — |

### 2.3 環境變數

| 變數 | 必要性 | 用途 |
|------|--------|------|
| `ANTHROPIC_API_KEY` | 必要 | Claude API 金鑰，用於 AI 討論引擎 |

---

## 3. 功能規格

### 3.1 首頁 — 會議列表

**路由**: `/`

| 項目 | 說明 |
|------|------|
| 功能 | 顯示所有會議，含主題、日期、參與者數、輪數、狀態 |
| 狀態標籤 | 草稿（灰）、進行中（黃）、已完成（綠） |
| 點擊行為 | 已完成 → `/reports/[id]`；其他 → `/meeting/[id]` |
| 空狀態 | 顯示引導建立第一場會議 |

---

### 3.2 Skill 管理

**路由**: `/skills`

#### 3.2.1 預設 Skill（19 個）

| # | 角色 | Emoji | 專長領域 |
|---|------|-------|----------|
| 1 | 產品經理 | 🎯 | 產品策略、需求分析、優先級排序、用戶痛點 |
| 2 | 技術架構師 | 🏗️ | 系統設計、技術選型、擴展性、效能優化 |
| 3 | 魔鬼代言人 | 😈 | 邏輯謬誤、風險識別、反向思考、壓力測試 |
| 4 | UX 研究員 | 🧑‍🎨 | 用戶研究、易用性測試、設計思維、行為分析 |
| 5 | 策略顧問 | 🎯 | 商業策略、市場分析、競爭情報、長期規劃 |
| 6 | 前端架構師 | ⚛️ | React 生態系、效能優化、設計系統、前端工程 |
| 7 | 品牌設計師 | 🎨 | 品牌定位、視覺識別、設計語言、品牌敘事 |
| 8 | 資安專家 | 🔒 | 網路安全、滲透測試、合規要求、風險評估 |
| 9 | 數據科學家 | 📊 | 數據分析、機器學習、統計建模、數據視覺化 |
| 10 | 教學設計師 | 📚 | 課程設計、學習理論、教育科技、評量設計 |
| 11 | 法務顧問 | ⚖️ | 合約審查、智慧財產權、隱私法規、勞動法 |
| 12 | 成長駭客 | 🚀 | 增長策略、轉換優化、A/B 測試、用戶獲取 |
| 13 | DevOps 工程師 | 🔧 | CI/CD、容器化、監控告警、基礎設施即代碼 |
| 14 | 文案大師 | ✍️ | 品牌文案、SEO 寫作、故事行銷、社群內容 |
| 15 | 後端架構師 | 🏗️ | API 設計、資料庫優化、微服務、分散式系統 |
| 16 | 心理學顧問 | 🧠 | 行為心理學、認知偏誤、動機理論、決策心理 |
| 17 | 財務分析師 | 💰 | 財務建模、投資分析、成本效益、風險量化 |
| 18 | 敏捷教練 | 🏃 | Scrum、看板、持續改善、團隊協作、敏捷轉型 |
| 19 | AI 產品經理 | 🤖 | AI/ML 產品策略、模型評估、AI 倫理、提示工程 |

#### 3.2.2 自訂 Skill 操作

| 操作 | 說明 |
|------|------|
| 建立 | 填寫名稱、Emoji 頭像、專長領域（標籤式）、人格描述、系統提示詞、簽名風格 |
| 匯入 JSON | 支援批次匯入自訂 Skill |
| 刪除 | 僅自訂 Skill 可刪除（預設不可） |
| 發佈到市集 | 僅自訂 Skill 可發佈 |

#### 3.2.3 Skill 資料結構

```typescript
interface Skill {
  id: string;
  name: string;
  avatar: string;           // Emoji
  expertise: string[];      // 專長標籤
  personality: string;      // 人格描述
  prompt: string;           // 系統提示詞
  signature: SkillSignature; // 簽名模板，支援 {name}, {expertise} 佔位符
  isDefault: boolean;
}
```

---

### 3.3 建立會議

**路由**: `/meeting/new`

| 欄位 | 類型 | 必要 | 說明 |
|------|------|------|------|
| 主題 (topic) | 文字 | 是 | 討論的核心問題 |
| 背景資料 (sourceData) | 長文字 | 否 | 提供給 AI 的參考資料 |
| 討論目標 (goalType) | 選擇 | 是 | `consensus`（達成共識）/ `explore`（探索觀點）/ `brainstorm`（腦力激盪） |
| 討論輪數 (rounds) | 數字 | 是 | 1-5 輪（預設 3） |
| 參與角色 (skillIds) | 多選 | 是 | 至少選 2 個 Skill |

---

### 3.4 會議室 — 即時討論

**路由**: `/meeting/[id]`

#### 3.4.1 討論流程（三階段）

```
Opening（開場）→ Discussion（多輪討論）→ Summary（總結）
```

| 階段 | 行為 |
|------|------|
| Opening | 每個 Skill 依序發表對主題的初始觀點 |
| Discussion | 多輪對話，每個 Skill 基於前面的討論內容回應 |
| Summary | AI 綜合所有討論，產出結構化報告 |

#### 3.4.2 即時串流機制

- **協議**: Server-Sent Events (SSE)
- **API**: `POST /api/meeting/[id]/discuss`
- **事件類型**:

| 事件 | 說明 |
|------|------|
| `phase` | 階段切換通知 |
| `message_start` | 某 Skill 開始發言（顯示頭像、脈動動畫） |
| `message_delta` | 串流文字片段（即時顯示） |
| `message_end` | 某 Skill 發言結束 |
| `report` | 報告產生完成 |
| `done` | 整場討論結束 |
| `error` | 錯誤通知 |

#### 3.4.3 UI 元素

- 進度條（顯示當前輪數 / 總輪數）
- 參與者頭像列（發言中顯示脈動動畫）
- 聊天氣泡（含角色名、階段標籤、輪數）
- 自動捲動到最新訊息

#### 3.4.4 狀態持久化

- 開始討論時：會議狀態更新為 `in_progress`
- 討論完成時：會議狀態更新為 `completed`，報告存入 localStorage

---

### 3.5 報告系統

**路由**: `/reports/[id]`

#### 3.5.1 報告結構

```typescript
interface MeetingReport {
  topic: string;
  date: string;
  participants: { name: string; avatar: string; expertise: string[] }[];
  totalRounds: number;
  consensus: string;        // 共識結論
  disagreements: string;    // 分歧觀點
  openQuestions: string;    // 待釐清問題
  signatures: string[];     // 各角色簽名
  fullTranscript: MeetingMessage[];  // 完整討論記錄
}
```

#### 3.5.2 報告區塊

| 區塊 | 說明 |
|------|------|
| 📋 會議資訊 | 主題、日期、參與者、輪數 |
| 💡 共識結論 | AI 彙整的共識觀點 |
| ⚔️ 分歧觀點 | 角色之間的不同看法 |
| ❓ 待釐清問題 | 討論中未能解決的問題 |
| ✍️ 簽署 | 每個角色的個人總結與簽名 |

#### 3.5.3 匯出

- **格式**: Markdown (.md)
- **檔名**: `skill-meeting-{topic}-{date}.md`
- **內容**: 完整報告含討論記錄

---

### 3.6 Skill 市集

#### 3.6.1 市集首頁

**路由**: `/marketplace`

| 區塊 | 說明 |
|------|------|
| 精選推薦 | `featured: true` 的 Skill，依下載數排序 |
| 最受歡迎 | 依下載數排序，前 8 個 |
| 最新上架 | 依發佈時間排序，前 8 個 |

#### 3.6.2 搜尋與篩選

**路由**: `/marketplace/search`

| 篩選項 | 選項 |
|--------|------|
| 關鍵字搜尋 | 比對名稱、描述、標籤、專長 |
| 分類 | 商業策略、技術開發、創意設計、教育訓練、專業顧問、學術研究、其他 |
| 排序 | 最新 / 最受歡迎 / 評分最高 / 名稱 |
| 分頁 | 每頁 12 筆 |

#### 3.6.3 Skill 詳情

**路由**: `/marketplace/skill/[id]`

| 資訊 | 說明 |
|------|------|
| 基本資訊 | 名稱、頭像、作者、分類、描述 |
| 統計 | 下載數、評分（星級）、評論數 |
| 專長標籤 | 專長領域標籤列表 |
| 系統提示詞 | 完整的 prompt 內容 |
| 安裝按鈕 | 一鍵安裝到本地 Skill 庫 |

#### 3.6.4 市集 Skill 資料結構

```typescript
interface MarketplaceSkill extends Skill {
  author: { name: string; avatar: string };
  description: string;
  category: SkillCategory;
  tags: string[];
  locale: string;
  version: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  publishedAt: string;
  updatedAt: string;
}
```

#### 3.6.5 分類定義

| Key | 中文名稱 |
|-----|----------|
| `business` | 商業策略 |
| `tech` | 技術開發 |
| `creative` | 創意設計 |
| `education` | 教育訓練 |
| `consulting` | 專業顧問 |
| `research` | 學術研究 |
| `other` | 其他 |

#### 3.6.6 發佈到市集

**路由**: `/marketplace/publish`

- 選擇一個自訂 Skill → 補充市集資訊（描述、分類、標籤）→ 發佈
- 發佈後存入 localStorage，在市集中可被搜尋到

---

## 4. API 端點規格

### 4.1 討論 API

```
POST /api/meeting/[id]/discuss
Content-Type: application/json
Response: text/event-stream (SSE)
```

**Request Body:**
```json
{
  "meeting": { "Meeting 物件" },
  "customSkills": [ "非預設的 Skill 陣列" ]
}
```

**驗證**: 至少需要 2 個 Skill

### 4.2 市集 API（Server-side，Phase 2 備用）

| 方法 | 端點 | 說明 |
|------|------|------|
| `GET` | `/api/marketplace/skills` | 搜尋市集 Skill（支援 query params） |
| `POST` | `/api/marketplace/skills` | 發佈新 Skill |
| `GET` | `/api/marketplace/skills/[id]` | 取得 Skill 詳情 |
| `PUT` | `/api/marketplace/skills/[id]` | 更新 Skill |
| `DELETE` | `/api/marketplace/skills/[id]` | 封存 Skill |
| `POST` | `/api/marketplace/skills/[id]/install` | 安裝 Skill（計數+1） |

> **注意**: MVP 階段市集前端使用 `marketplace-client-store.ts` 純前端實作，不依賴以上 API。API 保留供 Phase 2 接入資料庫後使用。

---

## 5. UI / UX 設計

### 5.1 設計系統

**主題**: 深色模式（Dark Theme）

| 變數 | 色碼 | 用途 |
|------|------|------|
| `--bg-primary` | `#0f172a` | 頁面背景 |
| `--bg-secondary` | `#1e293b` | 卡片背景 |
| `--bg-card` | `#334155` | 輸入框、Badge 背景 |
| `--text-primary` | `#f8fafc` | 主要文字 |
| `--text-secondary` | `#94a3b8` | 次要文字 |
| `--accent` | `#3b82f6` | 主色（藍） |
| `--success` | `#22c55e` | 成功（綠） |
| `--warning` | `#f59e0b` | 警告（黃） |
| `--danger` | `#ef4444` | 危險（紅） |
| `--border` | `#475569` | 邊框 |

### 5.2 元件庫

| 元件 | CSS Class | 說明 |
|------|-----------|------|
| 主按鈕 | `.btn-primary` | 藍色填滿按鈕 |
| 次按鈕 | `.btn-secondary` | 邊框按鈕 |
| 卡片 | `.card` | 圓角邊框容器，hover 效果 |
| 輸入框 | `.input-field` | 深色輸入框，focus 高亮 |
| 標籤 | `.badge` | 小型標籤/分類 |
| 聊天氣泡 | `.chat-bubble` | 淡入動畫訊息框 |
| 頭像 | `.skill-avatar` | Emoji 頭像（含 `.active`、`.selected` 狀態） |
| 進度條 | `.progress-bar` | 討論進度指示 |
| 脈動動畫 | `.speaking-indicator` | 發言中脈動效果 |

### 5.3 導航列

固定頂部導航，包含：
- Logo: 🏛️ Skill Meeting
- 連結: 會議列表 (`/`) | Skill 管理 (`/skills`) | 🏪 市集 (`/marketplace`) | + 新會議 (`/meeting/new`)

---

## 6. 檔案結構

```
skill-meeting/
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # 全域佈局 + 導航列
│   │   ├── globals.css                         # 全域樣式 + CSS 變數
│   │   ├── page.tsx                            # 首頁（會議列表）
│   │   ├── skills/page.tsx                     # Skill 管理頁
│   │   ├── meeting/
│   │   │   ├── new/page.tsx                    # 建立會議
│   │   │   └── [id]/page.tsx                   # 會議室
│   │   ├── reports/[id]/page.tsx               # 報告檢視
│   │   ├── marketplace/
│   │   │   ├── page.tsx                        # 市集首頁
│   │   │   ├── search/page.tsx                 # 市集搜尋
│   │   │   ├── publish/page.tsx                # 發佈 Skill
│   │   │   └── skill/[id]/page.tsx             # Skill 詳情
│   │   └── api/
│   │       ├── meeting/[id]/discuss/route.ts   # 討論 SSE API
│   │       └── marketplace/skills/             # 市集 REST API
│   ├── components/
│   │   ├── skill-form.tsx                      # Skill 建立/編輯表單
│   │   ├── skill-card.tsx                      # Skill 卡片
│   │   ├── meeting-room.tsx                    # 會議室主元件
│   │   ├── chat-bubble.tsx                     # 聊天氣泡
│   │   ├── report-viewer.tsx                   # 報告檢視器
│   │   └── marketplace/
│   │       ├── marketplace-skill-card.tsx       # 市集 Skill 卡片
│   │       ├── search-bar.tsx                  # 搜尋列
│   │       ├── category-filter.tsx             # 分類篩選
│   │       ├── star-rating.tsx                 # 星級評分
│   │       └── install-button.tsx              # 安裝按鈕
│   ├── lib/
│   │   ├── types.ts                            # 核心型別定義
│   │   ├── skill-store.ts                      # Skill & Meeting localStorage 操作
│   │   ├── discussion-engine.ts                # AI 討論引擎（Claude API）
│   │   ├── report-generator.ts                 # Markdown 報告產生器
│   │   ├── marketplace-types.ts                # 市集型別定義
│   │   ├── marketplace-store.ts                # 市集 Server-side 操作
│   │   └── marketplace-client-store.ts         # 市集 Client-side 操作
│   └── data/
│       ├── default-skills.json                 # 19 個預設 Skill
│       └── marketplace-seed.json               # 15 個市集種子 Skill
├── package.json
├── tsconfig.json
├── next.config.js                              # standalone output
└── PRD.md                                      # 本文件
```

---

## 7. Phase 2 規劃（未實作）

| 功能 | 說明 |
|------|------|
| 資料庫整合 | 市集資料遷移至 DynamoDB / PostgreSQL |
| 使用者系統 | 註冊 / 登入 / 個人頁面 |
| 評論系統 | Skill 評分與文字評論（`SkillReview` 型別已定義） |
| 付費 Skill | 市集支付整合（`price`, `currency` 欄位已預留） |
| 多語系 | i18n 支援（`locale` 欄位已預留） |
| Skill 版本管理 | 版本更新通知（`version` 欄位已預留） |
| 即時協作 | 多人同時觀看討論 |
| 討論範本 | 預設討論情境快速開始 |

---

## 8. 已知限制

1. **localStorage 限制**: 瀏覽器 localStorage 通常限制 5-10MB，大量會議記錄可能接近上限
2. **無跨裝置同步**: MVP 資料僅存在單一瀏覽器
3. **API Key 暴露風險**: 討論 API 無身份驗證，部署後需確保不被濫用
4. **無錯誤重試**: 討論中斷後無法恢復，需重新開始
5. **單一 AI 模型**: 目前僅支援 Claude Sonnet，未來可擴展支援其他模型
