/**
 * 解析 Markdown 檔案為 Skill 欄位
 *
 * 支援兩種格式：
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
 * 2. Section-based（用 # 標題區分）:
 * # 名稱
 * 市場分析師
 *
 * # 頭像
 * 📊
 *
 * # 專長
 * 市場趨勢、競品分析
 *
 * # 個性
 * 數據驅動、注重量化指標
 *
 * # 提示詞
 * 你是一位市場分析師...
 *
 * # 簽名
 * 📊 {name} | 數據驅動
 */

export interface ParsedSkillFields {
  name?: string;
  avatar?: string;
  expertise?: string;    // 逗號或頓號分隔的字串
  personality?: string;
  prompt?: string;
  signature?: string;
}

// 欄位名稱映射（支援中英文）
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
  // personality
  'personality': 'personality',
  '個性': 'personality',
  '個性描述': 'personality',
  '性格': 'personality',
  '風格': 'personality',
  // prompt
  'prompt': 'prompt',
  '提示詞': 'prompt',
  '角色提示詞': 'prompt',
  '系統提示': 'prompt',
  '背景': 'prompt',
  '角色描述': 'prompt',
  // signature
  'signature': 'signature',
  '簽名': 'signature',
  '簽名樣式': 'signature',
};

/**
 * 嘗試解析 YAML frontmatter
 */
function parseFrontmatter(content: string): { fields: ParsedSkillFields; body: string } | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return null;

  const yamlBlock = match[1];
  const body = match[2].trim();
  const fields: ParsedSkillFields = {};

  for (const line of yamlBlock.split('\n')) {
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

  return fields;
}
