# Skill Meeting — AI 多角色圓桌討論平台

## 專案概述
讓多個 AI Skill（角色）圍繞特定主題進行多輪圓桌討論，支援共識達成、深度探索、腦力激盪三種模式。

## 技術架構
- **前端**: React 19 + Vite 6 + Tailwind CSS 4 + React Router 7
- **後端**: Express 5 (ESM) + TypeScript 5.8 + Prisma 5 + SQLite
- **AI**: Google Gemini 2.5 Flash Preview (`@google/genai`, model: `gemini-2.5-flash`)
- **認證**: JWT (jsonwebtoken + bcryptjs)
- **模組系統**: 全部使用 ESM (`"type": "module"`, `"module": "Node16"`)
- **部署**: Zeabur (Docker multi-stage build) + GitHub Actions CI

## 目錄結構
```
server/index.ts          — Express 主入口
server/config.ts         — 環境變數設定
server/routes/           — API 路由 (auth, meetings, skills, admin)
server/services/         — 業務邏輯 (discussion.service.ts 為核心)
server/middleware/        — auth + error middleware
server/lib/              — prisma client + gemini client
prisma/schema.prisma     — 資料模型 (User, Meeting, Message, Report, Skill)
src/pages/               — React 頁面（含 AdminPage.tsx 管理後台）
src/lib/api.ts           — 統一 API client
src/lib/auth-context.tsx — JWT 認證 context
Dockerfile               — Multi-stage Docker build (Alpine)
.github/workflows/       — CI/CD workflow
```

## 重要技術注意事項

### ESM 相關
- 所有 import 必須加 `.js` 副檔名（Node16 module resolution）
- 不能使用 `__dirname`，改用 `fileURLToPath(import.meta.url)`
- Express 5 wildcard route 語法：`'/{*path}'` 而非 `'*'`

### Docker / 部署
- Builder stage 必須設 `ENV NODE_ENV=development` 才能安裝 devDependencies
- Alpine Linux 需要 `apk add --no-cache openssl` 給 Prisma 用
- 用 `npm run build:server` 而非 `npx tsc`（npx 會抓到錯誤的 `tsc@2.0.4` 套件）
- SQLite 資料庫存放在 `/app/data/app.db`，已掛載 Zeabur 持久化硬碟
- DATABASE_URL 格式：`file:/app/data/app.db`

### Gemini API
- 使用 `@google/genai` SDK（不是舊版 `@google-cloud/aiplatform`）
- Model name: `gemini-2.5-flash`
- 定價：Input $0.075/1M tokens, Output $0.30/1M tokens

## 部署資訊
- **線上網站**: https://skill-meeting.zeabur.app
- **管理後台**: https://skill-meeting.zeabur.app/admin
- **GitHub**: https://github.com/gjj22622/skill-meeting
- **Zeabur Dashboard**: https://zeabur.com/projects/69c6203882fb34707a9f4f7a
- 推送到 main 會自動觸發 Zeabur Docker build + deploy（約 2-3 分鐘）

## 環境變數（Zeabur 設定）
- `DATABASE_URL` — SQLite 路徑
- `JWT_SECRET` — JWT 簽名密鑰
- `GEMINI_API_KEY` — Google Gemini API Key
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — 管理員帳號
- `NODE_ENV` / `PORT`

## 開發指令
```bash
npm run dev          # 前端 + 後端同時開發
npm run build        # Vite 前端 build
npm run build:server # TypeScript 後端 build
npx prisma migrate deploy  # 執行資料庫 migration
npx prisma generate        # 產生 Prisma client
```
