/**
 * 解析 Markdown 檔案為 Skill 欄位
 *
 * 支援三種格式：
 *
 * 1. YAML Frontmatter:
 * ---
 * name: 市場分析師
 * avatar: 📊
 * expertise: 市場趨勢、競品分析
 * personality: 數據驅動、注重量化指標
 * signature: 📊 {name} | 數據驅動 · {expertise}
 * ---
 * （下面的內容自動成為 prompt）
 *
 * 2. Claude Skill 格式（自動提取 expertise / personality）:
 * ---
 * name: shuangyun-jacky-agent
 * description: "双云行銷創辦人 Agent — 鐘基啟（Jacky）的双云營運分身..."
 * ---
 * 觸發條件（以下任一即啟動）：...
 *
 * 3. Section-based（用 # 標題區分）:
 * # 名稱
 * 市場分析師
 * # 專長
 * 市場趨勢、競品分析
 * # 個性
 * 數據驅動、注重量化指標
 * # 提示詞
 * 你是一位市場分析師...
 */

export interface ParsedSkillFields {
  name?: string;
  avatar?: string;
  expertise?: string;    // 逗號或頓號分隔的字串
  personality?: string;
  prompt?: string;
  signature?: string;
}

// 欄位名稱映射（支援中英文 + Claude Skill 格式）
const FIELD_ALIASES: Record<string, keyof ParsedSkillFields> = {
  // name
  'name': 'name',
  '名稱': 'name',
  '名字': 'name',
  '角色名稱': 'name',
  // avatar
  'avatar': 'avatar',
  '頭像': 'avatar',
  'emoji': 'avatar',
  '圖示': 'avatar',
  // expertise
  'expertise': 'expertise',
  '專長': 'expertise',
  '專業': 'expertise',
  '技能': 'expertise',
  'skills': 'expertise',
  'tags': 'expertise',
  '標籤': 'expertise',
  '關鍵字': 'expertise',
  // personality
  'personality': 'personality',
  '個性': 'personality',
  '個性描述': 'personality',
  '性格': 'personality',
  '風格': 'personality',
  'description': 'personality',  // Claude Skill 格式
  '描述': 'personality',
  '說明': 'personality',
  '簡介': 'personality',
  // prompt
  'prompt': 'prompt',
  '提示詞': 'prompt',
  '角色提示詞': 'prompt',
  '系統提示': 'prompt',
  '背景': 'prompt',
  '角色描述': 'prompt',
  'instructions': 'prompt',
  // signature
  'signature': 'signature',
  '簽名': 'signature',
  '簽名樣式': 'signature',
};

// 無意義的常見詞（不應出現在 expertise 中）
const STOP_WORDS = new Set([
  '提到', '使用', '需要', '任何', '以下', '即啟動', '無需', '確認',
  '即立', '立即', '啟動', '一律', '當使', '用者', '或任何', '時使用',
  '此技能', '觸發條件', '情境', '本技能',
]);

/**
 * 從文字內容中智慧提取專長關鍵字
 */
function extractExpertiseFromText(text: string): string {
  const keywords = new Set<string>();

  // 1. 提取「」引號內的關鍵字（觸發條件與包括列舉中最常見）
  const quoted = text.match(/「([^」]{2,8})」/g);
  if (quoted) {
    quoted.forEach(q => {
      const word = q.replace(/[「」]/g, '');
      if (word.length >= 2 && word.length <= 8 && !STOP_WORDS.has(word)) {
        keywords.add(word);
      }
    });
  }

  // 2. 提取「包括：」「涉及」後的中文頓號列舉
  const listMatches = text.matchAll(/(?:包括|包含|涉及)[：:]\s*([^。\n]+)/g);
  for (const m of listMatches) {
    const items = m[1].split(/[、，,]/).map(s => s.trim()).filter(s => s.length >= 2 && s.length <= 8);
    items.forEach(w => { if (!STOP_WORDS.has(w)) keywords.add(w); });
  }

  // 3. 如果引號關鍵字不夠，從「—」後的角色摘要提取頓號分隔詞
  if (keywords.size < 3) {
    const dashMatch = text.match(/[—–]\s*(.+?)(?:[。．\n]|$)/);
    if (dashMatch) {
      const commaItems = dashMatch[1].split(/[、，,]/).map(s => s.trim()).filter(s => /^[\u4e00-\u9fffA-Za-z\s]{2,10}$/.test(s));
      commaItems.slice(0, 3).forEach(c => keywords.add(c));
    }
  }

  // 去重、過濾、取前 5 個
  return [...keywords].slice(0, 5).join('、');
}

/**
 * 從 description 中提取簡潔的個性/角色描述
 * 優先取「—」後到第一個句號的摘要
 */
function extractPersonalitySummary(description: string): string {
  // 去掉 name 部分（如 "双云行銷創辦人 Agent — ..."），取「—」後面
  const dashMatch = description.match(/[—–]\s*([\s\S]+)/);
  const mainText = dashMatch ? dashMatch[1] : description;

  // 取到第一個句號
  const firstSentence = mainText.match(/^(.+?[。．])/);
  if (firstSentence) {
    const s = firstSentence[1].trim();
    return s.length <= 80 ? s : s.substring(0, 77) + '...';
  }

  // 沒有句號 → 取前 80 字、到第一個換行
  return mainText.trim().split('\n')[0].substring(0, 80).trim();
}

/**
 * 嘗試解析 YAML frontmatter
 * 支援多行 description（用引號包住的跨行文字）
 */
function parseFrontmatter(content: string): { fields: ParsedSkillFields; body: string } | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return null;

  const yamlBlock = match[1];
  const body = match[2].trim();
  const fields: ParsedSkillFields = {};

  // 處理多行值：先把跨行的引號字串合併回一行
  const mergedLines: string[] = [];
  let accumulator = '';
  let inQuote = false;

  for (const line of yamlBlock.split('\n')) {
    if (!inQuote) {
      // 檢查是否開啟了引號但沒關閉
      const quoteMatch = line.match(/^\s*[^:]+:\s*"(.*)$/);
      if (quoteMatch && !line.match(/^\s*[^:]+:\s*".*"\s*$/)) {
        inQuote = true;
        accumulator = line;
        continue;
      }
      mergedLines.push(line);
    } else {
      accumulator += ' ' + line.trim();
      if (line.includes('"')) {
        inQuote = false;
        mergedLines.push(accumulator);
        accumulator = '';
      }
    }
  }
  if (accumulator) mergedLines.push(accumulator);

  for (const line of mergedLines) {
    const kv = line.match(/^\s*([^:]+?)\s*:\s*(.+?)\s*$/);
    if (!kv) continue;

    const rawKey = kv[1].toLowerCase().trim();
    let value = kv[2].trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Remove [] for array-like values
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).trim();
    }

    const fieldKey = FIELD_ALIASES[rawKey];
    if (fieldKey) {
      fields[fieldKey] = value;
    }
  }

  // Body becomes prompt if prompt not set in frontmatter
  if (!fields.prompt && body) {
    fields.prompt = body;
  }

  return { fields, body };
}

/**
 * 嘗試解析 section-based 格式
 */
function parseSections(content: string): ParsedSkillFields {
  const fields: ParsedSkillFields = {};
  const lines = content.split('\n');

  let currentField: keyof ParsedSkillFields | null = null;
  let currentLines: string[] = [];

  function flush() {
    if (currentField && currentLines.length > 0) {
      fields[currentField] = currentLines.join('\n').trim();
    }
    currentLines = [];
  }

  for (const line of lines) {
    // Check if this is a heading: # 名稱 or ## 名稱
    const headingMatch = line.match(/^#{1,4}\s+(.+?)\s*$/);
    if (headingMatch) {
      flush();
      const headingText = headingMatch[1].replace(/\*\*/g, '').trim();
      const fieldKey = FIELD_ALIASES[headingText.toLowerCase()] || FIELD_ALIASES[headingText];
      currentField = fieldKey || null;
      continue;
    }

    if (currentField !== null) {
      currentLines.push(line);
    }
  }
  flush();

  return fields;
}

/**
 * 主解析函式：自動偵測格式並解析
 * 當 expertise 或 personality 缺失時，從 description/prompt 智慧提取
 */
export function parseMdSkill(content: string, fileName?: string): ParsedSkillFields {
  let fields: ParsedSkillFields = {};

  // 1. Try YAML frontmatter
  const frontmatter = parseFrontmatter(content);
  if (frontmatter && Object.keys(frontmatter.fields).length > 0) {
    fields = frontmatter.fields;
  } else {
    // 2. Try section-based
    const sectionFields = parseSections(content);
    if (Object.keys(sectionFields).length > 0) {
      fields = sectionFields;
    }
  }

  // 3. Fallback: if no structured fields found, use entire content as prompt
  if (!fields.prompt && !fields.name && !fields.expertise) {
    fields.prompt = content;
  }

  // 4. Derive name from filename if not set
  if (!fields.name && fileName) {
    fields.name = fileName.replace(/\.md$/i, '');
  }

  // 5. 智慧提取 expertise（如果缺失但有 personality 或 prompt）
  if (!fields.expertise) {
    const source = fields.personality || fields.prompt || '';
    if (source.length > 20) {
      const extracted = extractExpertiseFromText(source);
      if (extracted) fields.expertise = extracted;
    }
  }

  // 6. 縮短 personality — 如果太長（>100 字），取摘要
  //    常見情況：Claude Skill 的 description 很長，適合截取第一句
  if (fields.personality && fields.personality.length > 100) {
    // 保留原始 description 到 prompt（如果 prompt 為空）
    if (!fields.prompt) {
      fields.prompt = fields.personality;
    }
    fields.personality = extractPersonalitySummary(fields.personality);
  }

  // 7. Name 美化 — 把 kebab-case 轉成可讀名稱
  if (fields.name && /^[a-z0-9-]+$/i.test(fields.name)) {
    fields.name = fields.name
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return fields;
}
