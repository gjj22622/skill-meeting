# 整合指南：系統 Skill 管理 + SOSTAC® 6 Skills

## 變更總覽

| 檔案 | 位置 | 變更類型 | 說明 |
|------|------|----------|------|
| `schema.prisma` | prisma/ | 修改 | Skill model 新增 `isActive` 欄位 |
| `skill.service.ts` | server/services/ | 全面改寫 | Admin CRUD + toggle + SOSTAC seed |
| `admin.routes.ts` | server/routes/ | 全面改寫 | 新增 Skill CRUD + toggle API |
| `discussion.service.ts` | server/services/ | 修改 | prompt 欄位注入 Gemini |
| `api.ts` | src/lib/ | 新建 | 統一 API client |
| `AdminSkillManager.tsx` | src/components/ | 新建 | Skill 管理 UI 元件 |

---

## 部署步驟

### Step 1: Prisma Schema 修改

在 `prisma/schema.prisma` 的 Skill model 中加入：

```prisma
isActive    Boolean  @default(true)
```

並加索引：
```prisma
@@index([isActive])
```

完整參考見 `prisma/migration-note.md`。

### Step 2: 執行 Migration

```bash
npx prisma migrate dev --name add-skill-isActive
```

### Step 3: 替換後端檔案

直接覆蓋：
- `server/services/skill.service.ts`（已寫好）
- `server/routes/admin.routes.ts`（已寫好）
- `server/services/discussion.service.ts`（已寫好）

### Step 4: 加入前端檔案

- 複製 `src/lib/api.ts` 到專案對應位置
- 複製 `src/components/AdminSkillManager.tsx`

### Step 5: AdminPage.tsx 整合

在現有的 AdminPage.tsx 中：

```tsx
// 1. 新增 import
import AdminSkillManager from '../components/AdminSkillManager';

// 2. 在 skills tab 區塊中替換為：
{activeTab === 'skills' && <AdminSkillManager />}
```

### Step 6: types.ts 更新

在 Skill type 中加入 `isActive`：

```tsx
export interface Skill {
  id: string;
  name: string;
  avatar: string;
  expertise: string[];
  personality: string;
  prompt: string;
  signature: { style: string };
  ownerId?: string;
  isDefault: boolean;
  isActive: boolean;    // ← 新增
  createdAt: string;
}
```

### Step 7: 重新部署

```bash
git add -A && git commit -m "feat: Admin Skill管理 + SOSTAC 6 Skills + prompt注入"
git push origin main
```

Zeabur 會自動觸發部署。

---

## 新增的 API Endpoints

| Method | Path | 說明 |
|--------|------|------|
| POST | /api/admin/skills | 新增系統預設 Skill |
| PUT | /api/admin/skills/:id | 編輯系統預設 Skill |
| PATCH | /api/admin/skills/:id/toggle | 啟用/停用 Skill |
| DELETE | /api/admin/skills/:id | 刪除 Skill |

---

## SOSTAC® 6 Skills 清單

| ID | 名稱 | Avatar | SOSTAC 階段 |
|----|------|--------|------------|
| sostac-s1 | SOSTAC 現況分析師 | 📊 | S — Situation |
| sostac-o | SOSTAC 目標策略師 | 🎯 | O — Objectives |
| sostac-s2 | SOSTAC 行銷策略師 | 🎪 | S — Strategy |
| sostac-t | SOSTAC 戰術設計師 | 🎨 | T — Tactics |
| sostac-a | SOSTAC 行動規劃師 | 📋 | A — Action |
| sostac-c | SOSTAC 績效管理師 | 📈 | C — Control |

每個 Skill 的 `prompt` 欄位都包含完整的 SOSTAC 方法論知識（從 reference 文件萃取），會在 AI 討論時自動注入 Gemini。
