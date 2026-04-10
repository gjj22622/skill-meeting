# Skill Meeting — 系統架構設計書 v2.0

> 設計日期：2026-03-27
> 定位：中小型正式產品（10-50 人使用，可對外開放）
> 技術棧：React 19 + Node.js Express + SQLite Prisma

---

## 一、系統架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                        使用者瀏覽器                              │
│  ┌──────────────────────────────────────────────────────┐       │
│  │          React 19 SPA（Vite 建置）                    │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │       │
│  │  │ 登入頁面  │ │ 會議列表  │ │  會議室   │ │ 報告頁 │  │       │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘  │       │
│  │  ┌──────────┐ ┌──────────┐                          │       │
│  │  │Skill 管理 │ │ 管理後台  │                          │       │
│  │  └──────────┘ └──────────┘                          │       │
│  └─────────────────────┬────────────────────────────────┘       │
│                        │ HTTP (JSON)                            │
└────────────────────────┼────────────────────────────────────────┘
                         │
            ┌────────────▼────────────┐
            │    Nginx / serve        │
            │  (靜態檔案 + 反向代理)   │
            └────────────┬────────────┘
                         │ /api/*
            ┌────────────▼────────────┐
            │   Node.js Express       │
            │   (API Server)          │
            │                         │
            │  ┌───────────────────┐  │
            │  │  Auth Middleware   │  │  ← JWT 驗證
            │  ├───────────────────┤  │
            │  │  Route Handlers   │  │  ← RESTful API
            │  ├───────────────────┤  │
            │  │  Gemini Proxy     │  │  ← API Key 安全代理
            │  ├───────────────────┤  │
            │  │  SSE Stream       │  │  ← 即時討論串流
            │  ├───────────────────┤  │
            │  │  Prisma ORM       │  │
            │  └────────┬──────────┘  │
            │           │             │
            └───────────┼─────────────┘
                        │
            ┌───────────▼───────────┐
            │   SQLite Database     │
            │   (data/app.db)       │
            └───────────────────────┘
```

---

## 二、目錄結構（重構後）

```
skill-meeting/
├── prisma/
│   ├── schema.prisma          # 資料庫 Schema 定義
│   └── seed.ts                # 預設 Skill 種子資料
│
├── server/                    # ★ 新增：後端
│   ├── index.ts               # Express 入口
│   ├── config.ts              # 環境變數管理
│   ├── middleware/
│   │   ├── auth.ts            # JWT 驗證中間件
│   │   ├── admin.ts           # 管理員權限中間件
│   │   └── error.ts           # 統一錯誤處理
│   ├── routes/
│   │   ├── auth.routes.ts     # 登入/登出/註冊
│   │   ├── meetings.routes.ts # 會議 CRUD
│   │   ├── skills.routes.ts   # Skill CRUD
│   │   ├── discussion.routes.ts # 討論引擎（SSE 串流）
│   │   └── admin.routes.ts    # 管理後台 API
│   ├── services/
│   │   ├── auth.service.ts    # 認證邏輯
│   │   ├── meeting.service.ts # 會議業務邏輯
│   │   ├── discussion.service.ts # 討論引擎（Gemini 呼叫）
│   │   └── skill.service.ts   # Skill 業務邏輯
│   └── lib/
│       ├── prisma.ts          # Prisma Client 單例
│       └── gemini.ts          # Gemini API 封裝
│
├── src/                       # 前端（精簡化）
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── types.ts               # 前後端共享型別
│   ├── lib/
│   │   ├── api.ts             # ★ 新增：統一 API 呼叫層
│   │   ├── auth-context.tsx   # ★ 改寫：JWT 認證
│   │   ├── utils.ts
│   │   └── error-handler.ts
│   ├── components/
│   │   └── ErrorBoundary.tsx
│   └── pages/
│       ├── HomePage.tsx
│       ├── NewMeetingPage.tsx
│       ├── MeetingRoomPage.tsx # ★ 改寫：SSE 接收即時訊息
│       ├── SkillsPage.tsx
│       ├── ReportPage.tsx
│       └── AdminPage.tsx      # ★ 改寫：需管理員登入
│
├── Dockerfile                 # ★ 改寫：前後端一體
├── package.json
├── tsconfig.json
├── tsconfig.server.json       # 後端 TS 設定
└── vite.config.ts             # ★ 改寫：加 proxy
```

---

## 三、資料庫設計（Prisma Schema）

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../data/app.db"
}

// ─── 使用者 ───────────────────────────────────────

model User {
  id           String    @id @default(uuid())
  displayName  String
  email        String    @unique
  passwordHash String                        // bcrypt 雜湊
  role         String    @default("user")    // "user" | "admin"
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  meetings     Meeting[]
  skills       Skill[]

  @@index([email])
}

// ─── 會議 ───────────────────────────────────────

model Meeting {
  id                String   @id @default(uuid())
  topic             String
  sourceData        String?                  // 背景資料（長文本）
  rounds            Int      @default(3)
  goalType          String   @default("consensus")  // consensus|exploration|brainstorming
  status            String   @default("pending")    // pending|running|completed|failed
  currentRound      Int      @default(0)
  currentPhase      String   @default("opening")    // opening|discussion|summary|signature
  totalInputTokens  Int      @default(0)
  totalOutputTokens Int      @default(0)
  durationSeconds   Int?
  startTime         DateTime?
  endTime           DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  ownerId           String
  owner             User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  skillIds          String                   // JSON 陣列：["skill-id-1", "skill-id-2"]
  messages          Message[]
  reports           Report[]

  @@index([ownerId])
  @@index([status])
}

// ─── 訊息 ───────────────────────────────────────

model Message {
  id          String   @id @default(uuid())
  meetingId   String
  meeting     Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  skillId     String
  skillName   String
  skillAvatar String
  round       Int
  phase       String
  content     String
  signature   String?
  createdAt   DateTime @default(now())

  @@index([meetingId, createdAt])
}

// ─── 報告 ───────────────────────────────────────

model Report {
  id        String   @id @default(uuid())
  meetingId String
  meeting   Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  content   String
  createdAt DateTime @default(now())

  @@index([meetingId])
}

// ─── Skill（AI 角色）───────────────────────────

model Skill {
  id          String   @id @default(uuid())
  name        String
  avatar      String
  expertise   String               // JSON 陣列：["專長1", "專長2"]
  personality String
  prompt      String
  signature   String               // JSON：{ "style": "..." }
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  ownerId     String?
  owner       User?    @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  @@index([ownerId])
  @@index([isDefault])
}
```

### 關鍵設計決策

| 決策 | 選擇 | 原因 |
|------|------|------|
| expertise / skillIds 存 JSON 字串 | `String` 而非 relation | SQLite 不支援原生 JSON 型別但夠用，Prisma 可用 `Json` typing 搭配 |
| Meeting → Skill 用 skillIds 欄位 | 非 many-to-many | 避免多對多 join table 的複雜度，會議的 skill 順序重要 |
| onDelete: Cascade | 刪使用者→連帶刪會議→連帶刪訊息 | 符合 GDPR 風格的資料清理 |
| SQLite 單檔 | `data/app.db` | Docker volume 掛載即可持久化，Zeabur 支援 persistent storage |

---

## 四、API 設計

### 4.1 認證 API

| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| POST | `/api/auth/register` | 註冊新帳號 | 公開 |
| POST | `/api/auth/login` | 登入取得 JWT | 公開 |
| POST | `/api/auth/logout` | 登出（前端清 token） | 公開 |
| GET  | `/api/auth/me` | 取得當前使用者資訊 | 登入 |

**認證流程：**
```
1. POST /api/auth/register { displayName, email, password }
   → 回傳 { user, token }

2. POST /api/auth/login { email, password }
   → 回傳 { user, token }

3. 後續請求帶 Header:
   Authorization: Bearer <jwt-token>
```

**JWT Payload：**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1711500000,
  "exp": 1711586400
}
```

### 4.2 會議 API

| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| GET    | `/api/meetings` | 取得我的會議列表 | 登入（僅自己的） |
| POST   | `/api/meetings` | 建立新會議 | 登入 |
| GET    | `/api/meetings/:id` | 取得單一會議 | 登入（擁有者） |
| DELETE | `/api/meetings/:id` | 刪除會議 | 登入（擁有者） |
| POST   | `/api/meetings/:id/start` | 啟動討論 | 登入（擁有者） |
| GET    | `/api/meetings/:id/stream` | SSE 串流討論過程 | 登入（擁有者） |
| GET    | `/api/meetings/:id/messages` | 取得會議訊息 | 登入（擁有者） |
| GET    | `/api/meetings/:id/reports` | 取得會議報告 | 登入（擁有者） |

### 4.3 Skill API

| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| GET    | `/api/skills` | 取得 Skill 列表（預設+自己的） | 登入 |
| POST   | `/api/skills` | 建立自訂 Skill | 登入 |
| PUT    | `/api/skills/:id` | 更新 Skill | 登入（擁有者） |
| DELETE | `/api/skills/:id` | 刪除 Skill | 登入（擁有者） |

### 4.4 管理員 API

| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| GET    | `/api/admin/meetings` | 取得所有會議 | 管理員 |
| DELETE | `/api/admin/meetings/:id` | 刪除任意會議 | 管理員 |
| GET    | `/api/admin/skills` | 取得所有 Skill | 管理員 |
| DELETE | `/api/admin/skills/:id` | 刪除任意 Skill | 管理員 |
| GET    | `/api/admin/stats` | 系統統計數據 | 管理員 |
| GET    | `/api/admin/users` | 使用者列表 | 管理員 |

---

## 五、權限設計

### 5.1 三層權限模型

```
┌─────────────────────────────────────────────────┐
│                   管理員 (admin)                  │
│  可存取所有資料、管理後台、刪除任意內容           │
│  ┌─────────────────────────────────────────┐     │
│  │         一般使用者 (user)                │     │
│  │  可建立/管理自己的會議與 Skill            │     │
│  │  ┌─────────────────────────────────┐    │     │
│  │  │      訪客 (未登入)               │    │     │
│  │  │  僅可存取 登入/註冊 頁面          │    │     │
│  │  └─────────────────────────────────┘    │     │
│  └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

### 5.2 Middleware 鏈

```typescript
// 1. 公開路由 — 不需認證
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// 2. 一般使用者路由 — 需登入
app.use('/api/meetings', authMiddleware);    // 驗證 JWT
app.use('/api/skills', authMiddleware);

// 3. 管理員路由 — 需登入 + admin 角色
app.use('/api/admin', authMiddleware, adminMiddleware);
```

### 5.3 資源擁有權檢查（關鍵）

```typescript
// server/middleware/auth.ts

// 驗證 JWT Token
export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登入' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;  // { sub, email, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Token 無效或已過期' });
  }
}

// 驗證管理員
export function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理員權限' });
  }
  next();
}

// 驗證資源擁有者（在 route handler 中使用）
export function assertOwner(resourceOwnerId: string, userId: string) {
  if (resourceOwnerId !== userId) {
    throw new ForbiddenError('無權操作此資源');
  }
}
```

### 5.4 管理員帳號建立方式

```bash
# 方式一：環境變數自動建立（推薦，首次啟動時）
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password

# 方式二：CLI 指令
npx ts-node server/scripts/create-admin.ts --email admin@example.com
```

---

## 六、即時討論串流設計（SSE）

目前 `DiscussionEngine` 使用 `AsyncGenerator` 在瀏覽器端直接呼叫 Gemini。
重構後改為伺服器端執行，透過 **Server-Sent Events (SSE)** 串流到前端。

### 伺服器端

```typescript
// server/routes/discussion.routes.ts

router.post('/meetings/:id/start', async (req, res) => {
  const meeting = await meetingService.get(req.params.id);
  assertOwner(meeting.ownerId, req.user.sub);

  // 啟動背景討論任務
  discussionService.start(meeting.id);
  res.json({ status: 'started' });
});

router.get('/meetings/:id/stream', async (req, res) => {
  const meeting = await meetingService.get(req.params.id);
  assertOwner(meeting.ownerId, req.user.sub);

  // SSE 設定
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // 訂閱討論事件
  const unsubscribe = discussionService.subscribe(meeting.id, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);

    if (event.type === 'complete' || event.type === 'error') {
      res.end();
    }
  });

  req.on('close', unsubscribe);
});
```

### 前端接收

```typescript
// src/lib/api.ts

export function streamDiscussion(meetingId: string, onEvent: (e: DiscussionEvent) => void) {
  const source = new EventSource(`/api/meetings/${meetingId}/stream`, {
    // 注意：標準 EventSource 不支援自定義 Header
    // 改用 URL query param 傳 token 或使用 fetch + ReadableStream
  });

  // 因為 SSE 不支援自訂 Header，採用 fetch streaming 替代方案：
  const response = await fetch(`/api/meetings/${meetingId}/stream`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    // 解析 SSE 格式
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.slice(6));
        onEvent(event);
      }
    }
  }
}
```

---

## 七、前端 API 層設計

新增統一 API Client，取代 localStorage 直接操作：

```typescript
// src/lib/api.ts

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, error.error || '未知錯誤');
  }

  return res.json();
}

// 會議
export const meetings = {
  list: ()              => request<Meeting[]>('/meetings'),
  get: (id: string)     => request<Meeting>(`/meetings/${id}`),
  create: (data: CreateMeetingDto) => request<Meeting>('/meetings', {
    method: 'POST', body: JSON.stringify(data)
  }),
  delete: (id: string)  => request(`/meetings/${id}`, { method: 'DELETE' }),
  start: (id: string)   => request(`/meetings/${id}/start`, { method: 'POST' }),
  messages: (id: string) => request<Message[]>(`/meetings/${id}/messages`),
  reports: (id: string)  => request<Report[]>(`/meetings/${id}/reports`),
};

// Skills
export const skills = {
  list: ()              => request<Skill[]>('/skills'),
  create: (data: CreateSkillDto) => request<Skill>('/skills', {
    method: 'POST', body: JSON.stringify(data)
  }),
  delete: (id: string)  => request(`/skills/${id}`, { method: 'DELETE' }),
};

// Auth
export const auth = {
  register: (data: RegisterDto) => request<AuthResponse>('/auth/register', {
    method: 'POST', body: JSON.stringify(data)
  }),
  login: (data: LoginDto) => request<AuthResponse>('/auth/login', {
    method: 'POST', body: JSON.stringify(data)
  }),
  me: () => request<User>('/auth/me'),
};
```

---

## 八、部署架構（Zeabur）

### Docker 改為前後端一體

```dockerfile
# ── Build 階段 ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build          # Vite 建置前端
RUN npm run build:server   # tsc 編譯後端

# ── Production 階段 ─────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# 只複製必要檔案
COPY --from=builder /app/dist ./dist              # 前端靜態檔
COPY --from=builder /app/dist-server ./server     # 後端編譯結果
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# 資料目錄（需掛載 persistent volume）
RUN mkdir -p /app/data

# Prisma migrate on start
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node server/index.js"]
```

### Zeabur 環境變數

```
GEMINI_API_KEY=your-gemini-key     # Gemini API（僅後端可見）
JWT_SECRET=your-jwt-secret-key     # JWT 簽名密鑰
ADMIN_EMAIL=admin@example.com      # 首次啟動自動建立管理員
ADMIN_PASSWORD=secure-password     # 管理員密碼
DATABASE_URL=file:./data/app.db    # SQLite 路徑
```

### Zeabur 持久化儲存

```
Zeabur Persistent Volume:
  掛載路徑: /app/data
  容量: 1 GB（SQLite 單檔 + 備份）
```

---

## 九、遷移策略（由現有版本漸進升級）

### Phase 1：加後端 + API Key 保護（最優先）
```
時間：1-2 天
變更：
  ✅ 建立 server/ 目錄結構
  ✅ 實作 Gemini Proxy API（/api/chat）
  ✅ discussion-engine 搬到 server 端
  ✅ 前端呼叫 /api/chat 取代直接呼叫 Gemini
  ✅ Vite dev server 設定 proxy
結果：API Key 不再暴露在前端
```

### Phase 2：加認證系統
```
時間：1-2 天
變更：
  ✅ 安裝 bcrypt + jsonwebtoken
  ✅ 實作 /api/auth/register 和 /api/auth/login
  ✅ 實作 JWT middleware
  ✅ 前端 auth-context 改用 JWT
  ✅ 登入頁面加上 email + password 表單
結果：使用者需註冊登入，有真正的帳號系統
```

### Phase 3：資料庫遷移（localStorage → SQLite）
```
時間：2-3 天
變更：
  ✅ 安裝 Prisma + SQLite
  ✅ 建立 schema.prisma
  ✅ 刪除 store.ts（localStorage）
  ✅ 所有 CRUD 改走 API → Prisma
  ✅ 即時更新改用 SSE 串流
  ✅ 加入 prisma/seed.ts 預設 Skill
結果：資料持久化在伺服器，支援多人共用
```

### Phase 4：管理員權限 + 安全加固
```
時間：1 天
變更：
  ✅ 加入 role 欄位和 admin middleware
  ✅ Admin API 加權限保護
  ✅ 資源擁有權檢查
  ✅ Rate limiting（express-rate-limit）
  ✅ CORS 設定
  ✅ Helmet 安全 headers
結果：正式可對外開放的安全等級
```

---

## 十、Trade-off 分析

| 決策 | 優點 | 缺點 | 替代方案 |
|------|------|------|---------|
| SQLite 而非 PostgreSQL | 零外部依賴、單檔部署簡單、免費 | 不支援真正的併發寫入、無法水平擴展 | 未來用量超過需求時，Prisma 只需改 provider 即可遷移到 PostgreSQL |
| 前後端 monorepo | 開發簡單、一次部署、共享型別 | 無法獨立擴展前後端 | 若需微服務化，拆成兩個 repo + API gateway |
| JWT 而非 Session | 無狀態、不需 Redis、擴展方便 | Token 無法主動失效（需 blacklist） | 加 refresh token 機制，短效 access token (15min) + 長效 refresh token (7d) |
| SSE 而非 WebSocket | 單向串流夠用、實作簡單、自動重連 | 不支援雙向通訊 | 討論場景是伺服器→客戶端單向推送，SSE 完全滿足 |
| bcrypt 密碼雜湊 | 業界標準、內建 salt、計算成本可調 | 比 argon2 略舊 | argon2 更現代但 bcrypt 在 Node.js 生態更成熟 |

---

## 十一、未來可擴展點

1. **OAuth 登入**：加 Google/GitHub 第三方登入（passport.js）
2. **會議分享**：產生唯讀分享連結，無需登入即可查看報告
3. **多人即時觀看**：多個使用者同時觀看同一場討論（SSE 已支援）
4. **匯出 PDF**：報告頁面加 PDF 匯出功能
5. **用量限制**：每日/每月 Token 用量上限，防止 API 費用失控
6. **PostgreSQL 遷移**：當使用者量 > 50 或需要更強的併發，改用 PG（Prisma 只需一行改動）
