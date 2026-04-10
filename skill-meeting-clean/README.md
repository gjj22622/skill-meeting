# 🏛️ Skill Meeting

AI 多角色圓桌討論平台 — 讓多位 AI 專家角色針對任意主題進行多輪辯論，最後自動產出結構化報告。

## 功能

- 自訂 AI 專家角色（Skill），每個角色有獨立的人設、專長與 Prompt
- 支援匯入 JSON / Markdown 格式的 Skill 定義
- 多輪討論引擎（開場 → 多輪辯論 → 總結 → 簽署）
- 自動產出 Markdown 格式討論報告
- 管理員後台（Token 用量 / 費用追蹤）
- 資料存於瀏覽器 localStorage，無需後端資料庫

## 技術棧

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Google Gemini API (`@google/genai`)
- localStorage 持久化

## 快速開始

```bash
# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env
# 編輯 .env，填入你的 GEMINI_API_KEY

# 啟動開發伺服器
npm run dev
```

## 部署到 Zeabur

1. 將程式碼推到 GitHub
2. 在 [Zeabur](https://zeabur.com) 建立新專案，連結你的 GitHub repo
3. 在 Zeabur 的環境變數設定中加入 `GEMINI_API_KEY`
4. Zeabur 會自動偵測 Dockerfile 並部署

## 環境變數

| 變數名 | 說明 | 必填 |
|--------|------|------|
| `GEMINI_API_KEY` | Google Gemini API 金鑰 | 是 |

## 專案結構

```
src/
├── App.tsx                    # 主應用（路由 + 認證）
├── components/
│   └── ErrorBoundary.tsx      # 錯誤邊界
├── constants.ts               # 預設 Skill 定義
├── lib/
│   ├── auth-context.tsx       # 簡易認證（localStorage）
│   ├── discussion-engine.ts   # 多輪討論引擎（Gemini API）
│   ├── error-handler.ts       # 錯誤處理
│   ├── store.ts               # 資料層（localStorage）
│   └── utils.ts               # 工具函式
├── pages/
│   ├── AdminPage.tsx          # 管理員後台
│   ├── HomePage.tsx           # 會議列表
│   ├── MeetingRoomPage.tsx    # 會議室（即時討論）
│   ├── NewMeetingPage.tsx     # 建立新會議
│   ├── ReportPage.tsx         # 報告頁面
│   └── SkillsPage.tsx         # Skill 管理
└── types.ts                   # TypeScript 型別定義
```
