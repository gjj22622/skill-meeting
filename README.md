# 🏛️ Skill Meeting — AI 多角色圓桌討論平台

讓多個 AI 角色（Skill）針對一個主題進行多輪結構化圓桌討論，自動產出共識結論、分歧觀點和行動建議。

## 功能特色

- **Skill 管理**：4 個預設角色 + 自訂角色（建立/編輯/刪除/JSON 匯入）
- **討論引擎**：開場陳述 → 多輪辯論（1~5 輪）→ 總結報告
- **即時串流**：SSE 即時顯示 AI 回應，搭配發言指示燈
- **結構化報告**：共識結論 / 分歧觀點 / 待釐清問題 + 角色簽名
- **Markdown 下載**：一鍵匯出完整討論報告

## 預設角色

| 角色 | 專長 |
|------|------|
| 🎯 產品經理 | 用戶需求、產品規劃、商業模式 |
| 🏗️ 技術架構師 | 系統設計、效能優化、技術選型 |
| 😈 魔鬼代言人 | 邏輯推理、反向思考、風險評估 |
| 🧑‍🎨 UX 研究員 | 使用者體驗、易用性測試、設計思維 |

## 快速開始

```bash
# 1. 安裝依賴
npm install

# 2. 設定環境變數
cp .env.example .env.local
# 編輯 .env.local，填入 Anthropic API Key

# 3. 啟動開發伺服器
npm run dev
```

瀏覽器開啟 [http://localhost:3000](http://localhost:3000)

## 技術架構

- **框架**：Next.js 16 (App Router)
- **語言**：TypeScript
- **樣式**：Tailwind CSS v4
- **AI**：Claude API (claude-sonnet-4-20250514)
- **串流**：Server-Sent Events (SSE)
- **儲存**：localStorage（客戶端）

## 專案結構

```
src/
├── app/                           # 頁面
│   ├── page.tsx                   # 首頁（會議列表）
│   ├── skills/page.tsx            # Skill 管理
│   ├── meeting/new/page.tsx       # 建立新會議
│   ├── meeting/[id]/page.tsx      # 會議室
│   ├── reports/[id]/page.tsx      # 報告檢視
│   └── api/meeting/[id]/discuss/  # 討論 SSE API
├── components/                    # UI 元件
│   ├── meeting-room.tsx           # 會議室主元件
│   ├── chat-bubble.tsx            # 對話氣泡
│   ├── skill-card.tsx             # Skill 卡片
│   ├── skill-form.tsx             # Skill 表單
│   └── report-viewer.tsx          # 報告檢視器
├── lib/                           # 核心邏輯
│   ├── types.ts                   # 型別定義
│   ├── discussion-engine.ts       # 討論引擎
│   ├── report-generator.ts        # 報告產生器
│   └── skill-store.ts             # 資料管理
└── data/
    └── default-skills.json        # 預設角色
```

## 使用流程

1. **管理 Skill** — 在「Skill 管理」頁面檢視/新增/匯入角色
2. **建立會議** — 設定主題、貼上參考資料、選擇角色（2~6 位）、選擇討論輪數和目標
3. **開始討論** — 按下「開始討論」，即時觀看 AI 角色辯論
4. **查看報告** — 討論結束後自動產出結構化報告，可下載 Markdown

## 環境需求

- Node.js 20+
- 有效的 Anthropic API Key
