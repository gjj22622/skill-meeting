# Skill Meeting — 專案概述

## 專案簡介

Skill Meeting 是一個 AI 多角色圓桌討論平台，讓多個 AI 專家角色（Skill）針對使用者提出的主題進行多輪辯論，並自動產出結構化報告。

## 核心功能

- **AI 圓桌討論**：4~6 個 AI 角色針對主題進行開場 → 多輪辯論 → 總結報告
- **三種討論目標**：達成共識（consensus）、探索問題（explore）、腦力激盪（brainstorm）
- **內建 AI 角色**：產品經理、技術架構師、魔鬼代言人、UX 研究員
- **自訂角色**：使用者可建立自訂 Skill，支援 Markdown 匯入與 JSON 手動輸入
- **即時串流**：透過 SSE 即時顯示 AI 角色發言
- **結構化報告**：自動產出共識結論、分歧觀點、待釐清問題、行動項目
- **使用者系統**：JWT 認證、角色分為 user / admin
- **管理後台**：管理使用者、技能、稽核日誌

## 技術堆疊

| 層級 | 技術 |
|------|------|
| 前端框架 | Next.js 16 (App Router) + React 19 |
| 樣式 | Tailwind CSS 4 |
| 語言 | TypeScript 5 (ES2017 target) |
| AI 模型 | Anthropic Claude API (@anthropic-ai/sdk) |
| 資料庫 | SQLite (better-sqlite3)，檔案式儲存於 `data/skill-meeting.db` |
| 認證 | bcryptjs + jsonwebtoken (JWT)，httpOnly cookie |
| 部署 | Docker 多階段建置 (Node 22-slim)，部署於 Zeabur |
| 輸出模式 | Next.js standalone |

## 專案結構

```
src/
├── app/                    # Next.js App Router 頁面與 API
│   ├── api/
│   │   ├── auth/           # 登入、註冊、使用者資料
│   │   ├── meetings/       # 會議 CRUD + 討論引擎
│   │   ├── skills/         # 技能管理
│   │   ├── admin/          # 管理後台 API
│   │   └── marketplace/    # 技能市集（開發中）
│   ├── admin/              # 管理後台頁面
│   ├── auth/               # 登入/註冊頁面
│   └── meeting/            # 會議室與建立會議頁面
├── components/             # React 元件
│   ├── meeting-room.tsx    # 即時討論顯示
│   ├── skill-form.tsx      # 技能建立/編輯表單
│   ├── report-viewer.tsx   # 報告檢視器
│   └── marketplace/        # 市集相關元件
├── lib/                    # 核心邏輯與工具
│   ├── db.ts               # SQLite 初始化與 schema
│   ├── discussion-engine.ts # 討論引擎（Claude 串流）
│   ├── auth.ts             # 密碼雜湊與 JWT
│   ├── auth-context.tsx    # React Context 認證狀態
│   ├── skill-store.ts      # 技能操作
│   ├── parse-md-skill.ts   # Markdown → Skill JSON 解析
│   └── types.ts            # TypeScript 型別定義
└── data/                   # 靜態資料
    ├── default-skills.json # 預設 AI 角色
    └── marketplace-seed.json
```

## 資料庫結構

- **users**：使用者帳號（email, password_hash, name, role）
- **meetings**：討論會議（topic, skill_ids, rounds, goal_type, status, messages, report）
- **default_skills**：內建 AI 角色
- **custom_skills**：使用者自訂角色
- **audit_log**：管理員操作紀錄

## 部署配置

- **平台**：Zeabur（Docker 建置）
- **容器**：Node 22-slim 多階段建置，512MB 記憶體限制
- **持久化**：SQLite 檔案掛載於 `/app/data`
- **環境變數**：`ANTHROPIC_API_KEY`（必要）

## 目前開發狀態

- 核心討論功能：已完成
- 使用者認證系統：已完成
- 管理後台：已完成
- 技能市集（Marketplace）：規劃中（PRD 已撰寫）
- Prisma ORM：已放棄，改用 better-sqlite3 直接操作 SQL

## 約束與慣例

- 所有使用者介面與文件使用繁體中文
- 建置時忽略 TypeScript 與 ESLint 錯誤（next.config.js 設定）
- JSON 欄位以 TEXT 型別儲存於 SQLite
- 第一位註冊使用者自動成為管理員
- Token 使用量追蹤（input/output）用於成本監控
