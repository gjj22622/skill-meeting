# PRD: 双云 Skill 市集 (Shuangyun Skill Marketplace)

## 1. 產品概述

**双云 Skill 市集** 是 Skill Meeting 平台的擴展功能，提供一個社群驅動的 AI 討論角色（Skill）交易生態系統。用戶可以在市集中發佈、瀏覽、搜尋、安裝、評價及購買高品質的 AI 討論角色，形成一個活躍的 Skill 經濟體。

### 核心價值
- **創作者**：將自己精心設計的 AI 角色發佈到市集，獲得下載量、評價和收益
- **使用者**：快速發現並安裝高品質的專業 AI 角色，豐富討論陣容
- **平台（双云）**：透過交易抽成和生態繁榮獲得商業價值

### 參考專案

| 專案 | 特點 | 借鑒 |
|------|------|------|
| [LobeHub lobe-chat-agents](https://github.com/lobehub/lobe-chat-agents) | JSON 定義 Agent、index.json 索引、PR 審核上架、i18n 自動生成 | Agent 定義格式、市集索引架構、審核上架流程 |
| [LobeHub Plugin System](https://github.com/lobehub/lobe-chat/wiki/Architecture) | Manifest 描述、Gateway 服務、SDK 開發套件、分階段演進 | 插件架構設計、分階段開發策略 |
| [PromptUp](https://github.com/DevHassann/PromptUp) | Next.js 13 + Prisma + MongoDB + Clerk + TypeScript 的 Prompt 交易市集 | 完整市集 CRUD、管理後台、認證方案 |
| [AI Agent Marketplace](https://github.com/akmenon1996/ai-agent-marketplace) | React + FastAPI + PostgreSQL、Token 計費、JWT 認證 | Agent 交易模型、Token 經濟 |
| [unft-marketplace](https://github.com/cosmicjs/unft-marketplace) | Next.js + Stripe + Cosmic CMS 數位商品市集 | Stripe 支付整合、Serverless 部署 |
| [Stelace Marketplace](https://github.com/stelace/marketplace-demo) | Vue + Serverless、進階搜尋、自動化工作流、Stripe 付款 | Serverless 市集架構、評分系統、PRPL 效能模式 |
| [YourNextStore](https://github.com/yournextstore/yournextstore) | AI-Native Next.js 電商、Stripe 驅動、App Router | Next.js + Stripe 最佳實踐、Server Actions |
| [next-saas-stripe-starter](https://github.com/mickasmt/next-saas-stripe-starter) | Next.js 14 + Prisma + Auth.js v5 + Stripe | SaaS 付費模板、角色權限、Admin Panel |

### 產業趨勢參考
- **OpenClaw ClawHub**：5,700+ 社群 Skills，AI Agent Skill 已成為新的軟體範式
- **obra/superpowers**：一週內獲得 7,000+ stars，Skills 生態從個人實驗升級為框架基礎設施
- **PromptBase**：AI Prompt 交易市場龍頭，驗證了 Prompt 交易的商業模式
- **FlowGPT**：免費社群驅動平台，驗證了社群分享模式的可行性

---

## 2. 架構設計

### 2.1 系統架構

```
┌──────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                           │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│   │ 市集首頁  │ │ 搜尋頁   │ │ 詳情頁   │ │ 發佈/儀表板  │   │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│   ┌──────────────────────────────────────────────────────┐   │
│   │         現有功能（會議/Skill 管理/報告）               │   │
│   └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────┘
                             │ API Routes
┌────────────────────────────▼─────────────────────────────────┐
│                  Next.js API Layer                            │
│   /api/marketplace/skills    (CRUD + 搜尋)                   │
│   /api/marketplace/reviews   (評論)                           │
│   /api/marketplace/auth      (認證)     ← Phase 2            │
│   /api/marketplace/payments  (支付)     ← Phase 3            │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│              Serverless Backend (AWS)                         │
│                                                              │
│  Phase 1: JSON/SQLite (MVP 驗證)                              │
│  Phase 2: ┌──────────┐ ┌────────────┐                        │
│           │ DynamoDB  │ │ Cognito    │                        │
│           │ (資料庫)   │ │ (認證)     │                        │
│           └──────────┘ └────────────┘                        │
│  Phase 3: ┌────────────────┐ ┌─────────────────┐            │
│           │ Stripe Connect │ │ S3 (資產存儲)    │            │
│           │ (支付平台)      │ │                  │            │
│           └────────────────┘ └─────────────────┘            │
│           ┌─────────────────────────────┐                    │
│           │ OpenSearch (全文搜尋)         │                    │
│           └─────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 技術選型

| 層級 | Phase 1 (MVP) | Phase 2 | Phase 3 |
|------|---------------|---------|---------|
| **前端** | Next.js 16 + Tailwind CSS 4 | + NextAuth.js | + Stripe Elements |
| **API** | Next.js API Routes | + Rate Limiting | + Webhook Handlers |
| **資料庫** | JSON 檔案 / better-sqlite3 | AWS DynamoDB | + 交易表、收益表 |
| **認證** | 無（匿名發佈/安裝） | NextAuth.js (GitHub/Google OAuth) | + Stripe Connect 帳戶 |
| **搜尋** | 前端 filter + 簡單 API 篩選 | DynamoDB Query + GSI | AWS OpenSearch |
| **支付** | — | — | Stripe Connect |
| **存儲** | 本地檔案系統 | AWS S3 | + CDN (CloudFront) |
| **部署** | Vercel / 本地 | Vercel + AWS | Vercel + AWS 完整棧 |

---

## 3. 資料模型

### 3.1 市集 Skill（擴展現有 Skill）

```typescript
// 參考 LobeHub Agent Schema 設計
interface MarketplaceSkill {
  // === 基礎欄位（繼承自現有 Skill） ===
  id: string;
  name: string;
  avatar: string;              // emoji
  expertise: string[];
  personality: string;
  prompt: string;              // system prompt
  signature: SkillSignature;

  // === 市集擴展欄位 ===
  // 作者資訊
  authorId: string;
  authorName: string;
  authorAvatar?: string;

  // 市集描述
  description: string;         // 詳細描述（Markdown）
  category: SkillCategory;
  tags: string[];
  locale: string;              // 'zh-TW' | 'zh-CN' | 'en-US' | ...
  version: string;             // semver: '1.0.0'

  // 統計數據
  downloads: number;
  rating: number;              // 平均評分 0-5
  reviewCount: number;

  // 商業資訊
  price: number;               // 0 = 免費
  currency: 'TWD' | 'USD';

  // 狀態管理
  status: 'draft' | 'pending' | 'published' | 'archived';
  featured: boolean;           // 精選推薦
  publishedAt: string;         // ISO date
  updatedAt: string;
}

type SkillCategory =
  | 'business'    // 商業分析
  | 'tech'        // 技術開發
  | 'creative'    // 創意設計
  | 'education'   // 教育培訓
  | 'consulting'  // 諮詢顧問
  | 'research'    // 學術研究
  | 'other';      // 其他
```

### 3.2 用戶模型（Phase 2）

```typescript
interface MarketplaceUser {
  id: string;
  displayName: string;
  email: string;
  avatar: string;
  bio: string;
  website?: string;

  // 統計
  publishedSkills: number;
  totalDownloads: number;
  averageRating: number;

  // 商業（Phase 3）
  stripeConnectId?: string;
  totalEarnings: number;

  // 時間
  joinedAt: string;
  lastActiveAt: string;
}
```

### 3.3 評論模型（Phase 2）

```typescript
interface SkillReview {
  id: string;
  skillId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;              // 1-5 星
  title: string;
  comment: string;
  helpful: number;             // 「有用」票數
  createdAt: string;
  updatedAt: string;
}
```

### 3.4 交易模型（Phase 3）

```typescript
interface Transaction {
  id: string;
  skillId: string;
  skillName: string;
  buyerId: string;
  sellerId: string;

  // 金額
  amount: number;
  currency: 'TWD' | 'USD';
  platformFee: number;         // 双云抽成（建議 20%）
  sellerPayout: number;

  // 狀態
  status: 'pending' | 'completed' | 'refunded' | 'disputed';
  stripePaymentId: string;

  createdAt: string;
  completedAt?: string;
}
```

---

## 4. API 設計

### 4.1 市集 Skills API

```
GET    /api/marketplace/skills
       ?q=搜尋關鍵字
       &category=tech
       &sort=downloads|rating|newest|price
       &order=asc|desc
       &page=1
       &limit=20
       &minRating=4
       &priceRange=free|paid|all

GET    /api/marketplace/skills/:id
POST   /api/marketplace/skills              (發佈新 Skill)
PUT    /api/marketplace/skills/:id          (更新 Skill)
DELETE /api/marketplace/skills/:id          (下架 Skill)

POST   /api/marketplace/skills/:id/install  (安裝到本地)
GET    /api/marketplace/skills/:id/export   (匯出 JSON)
```

### 4.2 評論 API（Phase 2）

```
GET    /api/marketplace/skills/:id/reviews
       ?sort=newest|helpful
       &page=1
POST   /api/marketplace/skills/:id/reviews  (新增評論)
PUT    /api/marketplace/reviews/:id         (編輯評論)
DELETE /api/marketplace/reviews/:id         (刪除評論)
POST   /api/marketplace/reviews/:id/helpful (標記有用)
```

### 4.3 用戶 API（Phase 2）

```
POST   /api/marketplace/auth/register
POST   /api/marketplace/auth/login
GET    /api/marketplace/auth/me
GET    /api/marketplace/users/:id           (作者公開資料)
GET    /api/marketplace/users/:id/skills    (作者的 Skills)
PUT    /api/marketplace/users/:id           (編輯個人資料)
```

### 4.4 交易 API（Phase 3）

```
POST   /api/marketplace/payments/checkout   (建立結帳)
POST   /api/marketplace/payments/webhook    (Stripe Webhook)
GET    /api/marketplace/payments/history     (交易歷史)
GET    /api/marketplace/dashboard/earnings   (收益統計)
GET    /api/marketplace/dashboard/analytics  (下載/評分統計)
```

---

## 5. 前端頁面設計

### 5.1 新增頁面

| 頁面路徑 | 說明 | Phase |
|----------|------|-------|
| `/marketplace` | 市集首頁 — 精選輪播、分類導覽、熱門/最新排行 | 1 |
| `/marketplace/search` | 搜尋結果 — 篩選側欄、排序、分頁 | 1 |
| `/marketplace/skill/[id]` | Skill 詳情 — 完整介紹、Prompt 預覽、安裝按鈕、評論區 | 1 |
| `/marketplace/publish` | 發佈 Skill — 表單填寫、預覽、提交 | 1 |
| `/marketplace/author/[id]` | 作者個人頁 — 已發佈 Skills、統計、個人簡介 | 2 |
| `/marketplace/dashboard` | 作者儀表板 — 收益圖表、下載趨勢、評論管理 | 3 |

### 5.2 新增元件

| 元件 | 說明 | Phase |
|------|------|-------|
| `marketplace-skill-card.tsx` | 市集卡片（評分星星、下載數、價格標籤） | 1 |
| `skill-detail-view.tsx` | 詳情展示（Markdown 描述、System Prompt 預覽） | 1 |
| `publish-form.tsx` | 發佈表單（擴展現有 SkillForm，增加市集欄位） | 1 |
| `category-filter.tsx` | 分類篩選側欄 | 1 |
| `search-bar.tsx` | 搜尋列（含自動完成建議） | 1 |
| `install-button.tsx` | 一鍵安裝按鈕 | 1 |
| `star-rating.tsx` | 星級評分顯示 / 互動元件 | 1 (顯示) / 2 (互動) |
| `review-list.tsx` | 評論列表 | 2 |
| `review-form.tsx` | 撰寫評論表單 | 2 |
| `author-card.tsx` | 作者資訊卡片 | 2 |
| `earnings-chart.tsx` | 收益圖表 | 3 |
| `price-tag.tsx` | 價格標籤（免費/付費） | 3 |
| `checkout-modal.tsx` | 結帳彈窗 | 3 |

### 5.3 修改現有檔案

| 檔案 | 變更 |
|------|------|
| `src/lib/types.ts` | 新增 `MarketplaceSkill`, `SkillCategory` 等型別 |
| `src/lib/skill-store.ts` | 新增 `installFromMarketplace()`, `publishToMarketplace()` |
| `src/app/layout.tsx` | 導覽列新增 🏪 市集 連結 |
| `src/app/skills/page.tsx` | 新增「從市集安裝」入口按鈕 |
| `src/components/skill-card.tsx` | Custom skill 新增「發佈到市集」選項 |

---

## 6. 檔案結構

```
src/
├── app/
│   ├── marketplace/                        # 🆕 市集頁面
│   │   ├── page.tsx                        # 市集首頁
│   │   ├── search/page.tsx                 # 搜尋頁
│   │   ├── skill/[id]/page.tsx             # Skill 詳情
│   │   ├── publish/page.tsx                # 發佈頁
│   │   ├── author/[id]/page.tsx            # 作者頁 (Phase 2)
│   │   └── dashboard/page.tsx              # 儀表板 (Phase 3)
│   └── api/
│       └── marketplace/                    # 🆕 市集 API
│           ├── skills/
│           │   ├── route.ts                # GET(列表+搜尋) / POST(發佈)
│           │   └── [id]/
│           │       ├── route.ts            # GET(詳情) / PUT(更新) / DELETE(下架)
│           │       ├── install/route.ts    # POST(安裝)
│           │       └── reviews/route.ts    # GET / POST 評論 (Phase 2)
│           ├── auth/                       # Phase 2
│           │   └── [...nextauth]/route.ts
│           ├── payments/                   # Phase 3
│           │   ├── checkout/route.ts
│           │   └── webhook/route.ts
│           └── users/
│               └── [id]/route.ts           # Phase 2
├── components/
│   └── marketplace/                        # 🆕 市集元件
│       ├── marketplace-skill-card.tsx
│       ├── skill-detail-view.tsx
│       ├── publish-form.tsx
│       ├── category-filter.tsx
│       ├── search-bar.tsx
│       ├── install-button.tsx
│       ├── star-rating.tsx
│       ├── review-list.tsx                 # Phase 2
│       ├── review-form.tsx                 # Phase 2
│       ├── author-card.tsx                 # Phase 2
│       ├── earnings-chart.tsx              # Phase 3
│       ├── price-tag.tsx                   # Phase 3
│       └── checkout-modal.tsx              # Phase 3
├── lib/
│   ├── marketplace-types.ts                # 🆕 市集型別定義
│   └── marketplace-store.ts                # 🆕 市集資料存取層
└── data/
    └── marketplace-seed.json               # 🆕 市集種子資料
```

---

## 7. 分階段實作計畫

### Phase 1：基礎市集（免費分享）— 2-3 週

**目標**：用戶可以發佈 Skill 到市集、瀏覽搜尋、一鍵安裝到本地使用

| 步驟 | 任務 | 預估 |
|------|------|------|
| 1 | 定義市集型別 `marketplace-types.ts` | 0.5 天 |
| 2 | 建立市集資料層 `marketplace-store.ts`（JSON 檔案 MVP） | 1 天 |
| 3 | 建立種子資料 `marketplace-seed.json`（15+ 範例 Skills） | 0.5 天 |
| 4 | 建立 API Routes — Skills CRUD + 搜尋 + 安裝 | 2 天 |
| 5 | 建立市集首頁 `/marketplace` | 1.5 天 |
| 6 | 建立搜尋頁 `/marketplace/search` | 1 天 |
| 7 | 建立 Skill 詳情頁 `/marketplace/skill/[id]` | 1.5 天 |
| 8 | 建立發佈頁 `/marketplace/publish` | 1 天 |
| 9 | 建立共用元件（卡片、評分、搜尋列、安裝按鈕） | 1.5 天 |
| 10 | 整合現有系統（導覽列、Skill 管理頁、安裝功能） | 1 天 |
| 11 | 測試與修正 | 1 天 |

### Phase 2：用戶系統與評論 — 2-3 週

**目標**：完整的用戶認證、評論評分、作者頁面

| 步驟 | 任務 |
|------|------|
| 1 | 整合 NextAuth.js（GitHub + Google OAuth） |
| 2 | 遷移資料層到 AWS DynamoDB |
| 3 | 建立用戶註冊/登入流程 |
| 4 | 建立評論系統（撰寫、顯示、「有用」投票） |
| 5 | 建立作者個人頁 `/marketplace/author/[id]` |
| 6 | 加入權限控制（僅作者可編輯/下架自己的 Skill） |
| 7 | Skill 版本管理（更新並保留歷史版本） |

### Phase 3：付費交易與收益 — 3-4 週

**目標**：完整的商業化交易系統

| 步驟 | 任務 |
|------|------|
| 1 | 整合 Stripe Connect（賣家帳戶連結） |
| 2 | 建立結帳流程（Stripe Checkout / Payment Elements） |
| 3 | 實作 Webhook 處理（付款成功、退款等） |
| 4 | 建立作者儀表板（收益圖表、下載趨勢） |
| 5 | 設定平台抽成機制（建議 20%） |
| 6 | 建立自動月結打款系統 |
| 7 | 加入 Skill 試用機制（免費預覽部分 prompt） |
| 8 | 推薦系統（根據使用記錄推薦 Skills） |

---

## 8. MVP 驗證方式

### 功能驗證清單

- [ ] **瀏覽市集**：訪問 `/marketplace`，看到種子 Skills，可按分類/熱門/最新排序
- [ ] **搜尋功能**：輸入關鍵字，篩選結果正確
- [ ] **Skill 詳情**：點擊卡片，詳情頁展示完整資訊
- [ ] **安裝 Skill**：點擊「安裝」，Skill 出現在本地 Skill 管理頁
- [ ] **發佈 Skill**：建立新 Skill 並發佈，出現在市集列表
- [ ] **使用已安裝 Skill**：新會議中可選擇市集安裝的 Skill 參與討論
- [ ] **導覽整合**：導覽列「市集」連結正常

### 效能指標

- 市集首頁載入 < 2 秒
- 搜尋結果回應 < 500ms
- Skill 安裝 < 1 秒

---

## 9. 風險評估

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| Phase 1 JSON 存儲效能瓶頸 | Skill 數量成長後搜尋變慢 | 設定 500 筆上限，超過後遷移 DynamoDB |
| Prompt 品質參差不齊 | 影響用戶體驗 | Phase 1 先人工審核，Phase 2 加入社群評分機制 |
| 付費功能法規合規 | 可能需要額外許可 | Phase 3 前諮詢法律意見，先從免費模式驗證 |
| Prompt 被抄襲 | 創作者缺乏保護 | 免費 Skill 公開 prompt，付費 Skill 混淆/加密 prompt |
| 惡意 Prompt 注入 | 安全風險 | 建立 prompt 審查機制，限制特定指令 |

---

## 10. 未來展望

- **Skill 組合包**：多個 Skills 打包成主題套組（如「產品團隊套組」）
- **Skill 訂閱制**：月費制無限使用所有付費 Skills
- **API 開放平台**：第三方應用可透過 API 存取市集
- **Skill 競賽**：定期舉辦 Skill 設計大賽，激勵社群創作
- **AI 輔助創建**：用 AI 協助用戶快速生成高品質 Skill
- **多語言市集**：支援繁體中文、簡體中文、英文、日文等多語言 Skill
