# PRD: Skill Meeting - AI 多角色圓桌討論應用

## 1. 產品概述

**Skill Meeting** 是一個 AI 多角色圓桌討論平台，使用者可以上傳自訂的「Skill」（AI 角色/專家），輸入討論主題或來源資料，讓多個 Skill 針對議題進行多輪結構化討論，最終產出具有各 Skill 獨特簽名的討論報告。

### 靈感來源

| 專案 | 特點 | 借鑒 |
|------|------|------|
| [yorak/airoundtable](https://github.com/yorak/airoundtable) | JSON 定義角色、圓桌討論流程 | 角色定義格式、討論流程控制 |
| [wladpaiva/aibitat](https://github.com/wladpaiva/aibitat) | TypeScript 多 Agent 頻道對話框架 | 頻道架構、事件生命週期 |
| [source-data/debatebox](https://github.com/source-data/debatebox) | 自我批評→修正→回應的討論機制 | 多輪精煉機制 |
| [Microsoft AutoGen](https://microsoft.github.io/autogen/stable//user-guide/core-user-guide/design-patterns/multi-agent-debate.html) | Solver + Aggregator 模式 | 討論與總結分離架構 |
| [composable-models/llm_multiagent_debate](https://github.com/composable-models/llm_multiagent_debate) | 多輪交換改善事實性 | 多輪迭代收斂機制 |

---

## 2. 核心功能

### 2.1 Skill 管理

- **Skill 定義格式（JSON）**：
  ```json
  {
    "name": "市場分析師",
    "avatar": "📊",
    "expertise": ["市場趨勢", "競品分析", "用戶研究"],
    "personality": "數據驅動、注重量化指標、善於發現市場機會",
    "prompt": "你是一位資深市場分析師，擅長用數據說話...",
    "signature": {
      "style": "---\n📊 {name} | 數據不會說謊\n🔍 專長：{expertise}"
    }
  }
  ```
- **上傳方式**：使用者可透過 UI 上傳 JSON 檔，或在介面上直接填表建立
- **預設 Skill 庫**：系統內建數個常用 Skill（如：魔鬼代言人、技術架構師、產品經理、UX 研究員）

### 2.2 會議建立

- **主題輸入**：使用者輸入討論主題（文字）
- **來源資料**：可上傳參考資料（文字、URL、檔案），作為討論的背景知識
- **選擇 Skill**：從已上傳的 Skill 中選擇 2~6 位參與者
- **會議設定**：
  - 討論輪數（預設 3 輪）
  - 目標類型：達成共識 / 探索問題 / 腦力激盪
  - 語言設定

### 2.3 討論引擎

討論流程分為三個階段：

```
┌─────────────────────────────────────────────┐
│              Phase 1: 開場陳述               │
│  每個 Skill 針對主題給出初始觀點              │
├─────────────────────────────────────────────┤
│              Phase 2: 多輪討論               │
│  Round N:                                    │
│   ├─ 每個 Skill 閱讀其他人的觀點             │
│   ├─ 自我反思 (self-critique)                │
│   ├─ 提出修正後的觀點或反駁                  │
│   └─ 提出追問或補充問題                      │
│  重複 N 輪直到收斂或達到上限                  │
├─────────────────────────────────────────────┤
│              Phase 3: 總結階段               │
│   ├─ 彙整共識點                              │
│   ├─ 列出分歧點                              │
│   ├─ 整理待釐清問題                          │
│   └─ 各 Skill 簽署報告                       │
└─────────────────────────────────────────────┘
```

### 2.4 即時呈現

- **會議室 UI**：模擬 Zoom 會議介面，每個 Skill 以頭像 + 名稱顯示
- **對話串流**：每個 Skill 的發言即時串流顯示（SSE）
- **輪次指示**：清楚顯示目前是第幾輪討論
- **進度條**：顯示整體討論進度

### 2.5 討論報告

討論結束後自動產生結構化報告：

```markdown
# 🏛️ Skill Meeting 討論報告

## 📋 會議資訊
- 主題：[主題名稱]
- 日期：[日期]
- 參與者：[Skill 列表]
- 討論輪數：[N 輪]

## 💡 共識結論
[多輪討論後的共同結論]

## ⚔️ 分歧觀點
[各方無法達成共識的觀點]

## ❓ 待釐清問題
[需要補充資訊才能進一步討論的問題]

## 📝 完整對話記錄
[可展開的完整討論內容]

## ✍️ 簽署
---
📊 市場分析師 | 數據不會說謊
🔍 專長：市場趨勢、競品分析
---
🏗️ 技術架構師 | 穩定可靠是第一要務
🔧 專長：系統設計、效能優化
---
😈 魔鬼代言人 | 質疑一切假設
🎯 專長：邏輯推理、反向思考
```

---

## 3. 技術架構

### 3.1 技術選型

| 層級 | 技術 | 理由 |
|------|------|------|
| 前端 | Next.js 14 + TypeScript | App Router、SSE 支援、React Server Components |
| UI 框架 | Tailwind CSS + shadcn/ui | 快速建構美觀 UI |
| 後端 API | Next.js API Routes | 全棧整合，無需額外後端 |
| AI 引擎 | Anthropic Claude API | 長上下文支援、推理能力強 |
| 資料儲存 | 本地 JSON 檔 + localStorage | MVP 階段簡化、無需資料庫 |
| 串流 | Server-Sent Events (SSE) | 即時顯示 AI 回應 |

### 3.2 專案結構

```
skill-meeting/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # 首頁：會議列表
│   │   ├── meeting/
│   │   │   ├── new/page.tsx         # 建立新會議
│   │   │   └── [id]/page.tsx        # 會議室（即時討論）
│   │   ├── skills/
│   │   │   ├── page.tsx             # Skill 管理頁面
│   │   │   └── [id]/page.tsx        # Skill 編輯頁面
│   │   ├── reports/
│   │   │   └── [id]/page.tsx        # 討論報告頁面
│   │   └── api/
│   │       ├── meeting/
│   │       │   ├── route.ts         # 建立/取得會議
│   │       │   └── [id]/
│   │       │       ├── route.ts     # 會議詳情
│   │       │       └── discuss/
│   │       │           └── route.ts # 討論引擎 (SSE)
│   │       └── skills/
│   │           └── route.ts         # Skill CRUD
│   ├── components/
│   │   ├── meeting-room.tsx         # 會議室主元件
│   │   ├── skill-card.tsx           # Skill 卡片
│   │   ├── skill-avatar.tsx         # Skill 頭像
│   │   ├── chat-bubble.tsx          # 對話氣泡
│   │   ├── report-viewer.tsx        # 報告檢視器
│   │   └── skill-form.tsx           # Skill 建立/編輯表單
│   ├── lib/
│   │   ├── discussion-engine.ts     # 核心討論引擎
│   │   ├── report-generator.ts      # 報告產生器
│   │   ├── skill-store.ts           # Skill 儲存管理
│   │   └── types.ts                 # TypeScript 型別定義
│   └── data/
│       └── default-skills.json      # 預設 Skill 定義
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

### 3.3 討論引擎核心邏輯

```typescript
// 簡化的討論引擎流程
async function runDiscussion(meeting: Meeting): AsyncGenerator<DiscussionEvent> {
  const { skills, topic, sourceData, rounds, goalType } = meeting;

  // Phase 1: 開場陳述
  for (const skill of skills) {
    yield* generateResponse(skill, {
      phase: 'opening',
      topic,
      sourceData,
    });
  }

  // Phase 2: 多輪討論
  for (let round = 1; round <= rounds; round++) {
    for (const skill of skills) {
      yield* generateResponse(skill, {
        phase: 'discussion',
        round,
        topic,
        previousMessages: getConversationHistory(),
      });
    }
  }

  // Phase 3: 總結
  yield* generateSummary(skills, {
    goalType,
    conversationHistory: getConversationHistory(),
  });

  // 簽署報告
  yield* generateSignatures(skills);
}
```

---

## 4. 使用者流程

```
1. 進入首頁 → 查看過往會議記錄
2. 點擊「新會議」
3. 管理 Skill
   ├─ 從預設庫選擇
   ├─ 上傳 JSON 定義新 Skill
   └─ 在 UI 上建立新 Skill
4. 設定會議
   ├─ 輸入主題
   ├─ 上傳來源資料（可選）
   ├─ 選擇參與的 Skill（2~6 位）
   └─ 設定討論輪數和目標
5. 開始討論 → 即時觀看各 Skill 對談
6. 討論結束 → 查看/下載討論報告
```

---

## 5. MVP 範圍（Phase 1）

### 包含
- [x] Skill 定義（JSON 格式）與管理（CRUD）
- [x] 4 個預設 Skill
- [x] 會議建立（主題 + 文字來源資料）
- [x] 3 階段討論引擎（開場→多輪→總結）
- [x] 即時串流 UI（SSE）
- [x] Zoom 風格會議室介面
- [x] 結構化討論報告 + Skill 簽名
- [x] 報告下載（Markdown）

### 不包含（未來擴展）
- [ ] 使用者登入/帳號系統
- [ ] 檔案上傳（PDF、圖片等）
- [ ] 會議中人類即時介入發言
- [ ] 多語言 AI 模型切換
- [ ] 會議範本/快速開始
- [ ] 協作分享連結
- [ ] 資料庫持久化

---

## 6. 預設 Skill 定義

### Skill 1: 產品經理
```json
{
  "id": "pm",
  "name": "產品經理",
  "avatar": "🎯",
  "expertise": ["用戶需求", "產品規劃", "商業模式"],
  "personality": "以用戶為中心，注重可行性與商業價值的平衡",
  "prompt": "你是一位經驗豐富的產品經理。你擅長從用戶需求出發，評估功能的優先級和可行性。你會考慮商業價值、開發成本和時程。你的回答務實且有條理。",
  "signature": {
    "style": "🎯 {name} | 用戶至上，價值為先\n📋 專長：{expertise}"
  }
}
```

### Skill 2: 技術架構師
```json
{
  "id": "architect",
  "name": "技術架構師",
  "avatar": "🏗️",
  "expertise": ["系統設計", "效能優化", "技術選型"],
  "personality": "嚴謹務實，重視系統穩定性和可擴展性",
  "prompt": "你是一位資深技術架構師。你擅長評估技術方案的可行性、效能瓶頸和維護成本。你會從系統全局角度思考問題。",
  "signature": {
    "style": "🏗️ {name} | 穩定可靠是第一要務\n🔧 專長：{expertise}"
  }
}
```

### Skill 3: 魔鬼代言人
```json
{
  "id": "devil",
  "name": "魔鬼代言人",
  "avatar": "😈",
  "expertise": ["邏輯推理", "反向思考", "風險評估"],
  "personality": "善於質疑假設、挑戰既有觀點，但出發點是幫助團隊避免盲點",
  "prompt": "你是魔鬼代言人。你的任務是質疑每一個假設，找出論點中的漏洞和風險。你不是為了反對而反對，而是為了讓討論更深入、結論更可靠。",
  "signature": {
    "style": "😈 {name} | 質疑一切假設\n🎯 專長：{expertise}"
  }
}
```

### Skill 4: UX 研究員
```json
{
  "id": "ux",
  "name": "UX 研究員",
  "avatar": "🧑‍🎨",
  "expertise": ["使用者體驗", "易用性測試", "設計思維"],
  "personality": "同理心強，善於站在使用者角度思考問題",
  "prompt": "你是一位 UX 研究員。你從使用者體驗的角度出發，關注操作流程是否直覺、資訊呈現是否清晰、互動設計是否友好。",
  "signature": {
    "style": "🧑‍🎨 {name} | 讓每一次互動都令人愉悅\n✨ 專長：{expertise}"
  }
}
```

---

## 7. API 設計

### Skill API
| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/skills` | 取得所有 Skill |
| POST | `/api/skills` | 建立新 Skill |
| PUT | `/api/skills/:id` | 更新 Skill |
| DELETE | `/api/skills/:id` | 刪除 Skill |

### Meeting API
| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/meeting` | 取得所有會議 |
| POST | `/api/meeting` | 建立新會議 |
| GET | `/api/meeting/:id` | 取得會議詳情 |
| GET | `/api/meeting/:id/discuss` | 開始討論（SSE 串流） |
| GET | `/api/meeting/:id/report` | 取得討論報告 |

---

## 8. 設計參考

### 會議室 UI 概念

```
┌─────────────────────────────────────────────────┐
│  🏛️ Skill Meeting    主題：如何提升用戶留存率     │
│  ─────────────────────────────────────────────── │
│  Round 2 / 3                    [■■■■■■░░░] 67%  │
│  ─────────────────────────────────────────────── │
│                                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │  🎯  │ │  🏗️  │ │  😈  │ │ 🧑‍🎨 │            │
│  │ 產品  │ │ 架構  │ │ 魔鬼  │ │  UX  │            │
│  │ 經理  │ │  師   │ │ 代言  │ │ 研究  │            │
│  │🟢發言│ │⚪等待 │ │⚪等待 │ │⚪等待 │            │
│  └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │ 🎯 產品經理 (Round 2)                      │   │
│  │                                            │   │
│  │ 我同意架構師提到的技術限制，但從數據來看，  │   │
│  │ 推送通知的開啟率仍有 35%，不應完全放棄。    │   │
│  │ 我建議我們分兩階段：...                     │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │ 🏗️ 技術架構師 (Round 1)                    │   │
│  │                                            │   │
│  │ 從技術角度看，推送系統需要考慮...           │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## 9. 風險與注意事項

1. **API 成本**：多 Skill × 多輪 = 大量 API 呼叫，MVP 階段建議限制 Skill 數量和輪數
2. **回應品質**：需要精心設計 prompt 確保各 Skill 保持角色一致性
3. **討論收斂**：多輪討論可能陷入重複，需要設計收斂檢測機制
4. **串流複雜度**：多個 AI 回應串流需要良好的前端狀態管理
