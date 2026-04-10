import { streamChat } from './ai-router';
import { Skill, Meeting, MeetingMessage, DiscussionEvent, DiscussionPhase, MeetingReport } from './types';
import { v4 as uuidv4 } from 'uuid';

function buildSkillContext(skill: Skill): string {
  let context = `你現在是 ${skill.name}。\n你的背景：${skill.personality}\n你的專長：${skill.expertise.join('、')}`;
  // Inject methodology knowledge when prompt is substantial (>100 chars)
  if (skill.prompt && skill.prompt.length > 100) {
    context += `\n\n你的專業知識與方法論：\n${skill.prompt}`;
  } else if (skill.prompt) {
    context += `\n\n${skill.prompt}`;
  }
  return context;
}

function buildSystemPrompt(skill: Skill, phase: DiscussionPhase, meeting: Meeting): string {
  const goalDescriptions = {
    consensus: '達成共識——找到所有人都能接受的結論',
    explore: '探索問題——深入發掘議題的各個面向',
    brainstorm: '腦力激盪——產生盡可能多的創意想法',
  };

  const skillContext = buildSkillContext(skill);

  return `${skillContext}

你正在參加一場多人圓桌討論會議。
- 主題：${meeting.topic}
- 你的角色：${skill.name}（${skill.personality}）
- 你的專長：${skill.expertise.join('、')}
- 討論目標：${goalDescriptions[meeting.goalType]}
${meeting.sourceData ? `\n參考資料：\n${meeting.sourceData}` : ''}

規則：
- 保持你的角色特色和專業觀點
- 運用你的專業知識與方法論來分析討論議題
- 回應要簡潔有力（150-300字），不要冗長
- 引用其他人的觀點時請指名
- 提出具體且有建設性的意見
- 用繁體中文回答`;
}

function buildOpeningPrompt(skill: Skill): string {
  return `這是圓桌討論的開場階段。請以 ${skill.name} 的身份，針對討論主題提出你的初始觀點和看法。包含：
1. 你對這個主題的核心觀點
2. 從你的專業角度看到的關鍵問題
3. 你認為需要深入討論的方向`;
}

function buildDiscussionPrompt(skill: Skill, round: number, previousMessages: MeetingMessage[]): string {
  const recentMessages = previousMessages.slice(-10);
  const context = recentMessages
    .map((m) => `[${m.skillAvatar} ${m.skillName}]：${m.content}`)
    .join('\n\n');

  return `這是第 ${round} 輪討論。以下是目前的討論內容：

${context}

請以 ${skill.name} 的身份回應：
1. 回應其他人的觀點（同意或提出不同看法）
2. 補充你的專業見解
3. 如果發現問題或盲點，請指出
4. 提出一個讓討論更深入的問題`;
}

function buildSummaryPrompt(messages: MeetingMessage[], meeting: Meeting): string {
  const transcript = messages
    .map((m) => `[${m.skillAvatar} ${m.skillName} - ${m.phase}${m.round ? ` R${m.round}` : ''}]：${m.content}`)
    .join('\n\n');

  return `以下是完整的圓桌討論記錄：

${transcript}

請根據以上討論，產出結構化的總結報告。

⚠️ 格式要求（務必嚴格遵守，不得更改標題文字）：

## 共識結論
（在此列出所有參與者達成共識的觀點和結論，用條列式）

## 分歧觀點
（在此列出參與者之間的不同意見和爭議點，用條列式）

## 待釐清問題
（在此列出需要更多資訊或進一步討論的問題，用條列式）

## 行動建議
（在此根據討論結果，提出具體的下一步建議，用條列式）

重要：每個段落標題必須完全使用「## 共識結論」「## 分歧觀點」「## 待釐清問題」「## 行動建議」，不可加入編號、emoji 或任何修改。每個段落至少要有一項內容，不可留空。`;
}

export async function* runDiscussion(
  meeting: Meeting,
  skills: Skill[]
): AsyncGenerator<DiscussionEvent> {
  const messages: MeetingMessage[] = [];
  const startTime = Date.now();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Phase 1: Opening
  yield { type: 'phase', phase: 'opening' };

  for (const skill of skills) {
    const systemPrompt = buildSystemPrompt(skill, 'opening', meeting);
    const userPrompt = buildOpeningPrompt(skill);

    const msgId = uuidv4();
    yield {
      type: 'message_start',
      skillId: skill.id,
      skillName: skill.name,
      skillAvatar: skill.avatar,
    };

    let fullContent = '';
    const aiStream = await streamChat('opening', systemPrompt, userPrompt, 1024);

    for await (const chunk of aiStream.stream) {
      if (chunk.type === 'text' && chunk.text) {
        fullContent += chunk.text;
        yield {
          type: 'message_delta',
          skillId: skill.id,
          content: chunk.text,
        };
      }
    }

    // Track token usage
    const usage = await aiStream.getUsage();
    totalInputTokens += usage.inputTokens;
    totalOutputTokens += usage.outputTokens;

    const msg: MeetingMessage = {
      id: msgId,
      skillId: skill.id,
      skillName: skill.name,
      skillAvatar: skill.avatar,
      phase: 'opening',
      content: fullContent,
      timestamp: new Date().toISOString(),
    };
    messages.push(msg);
    yield { type: 'message_end', skillId: skill.id };
  }

  // Phase 2: Discussion rounds
  yield { type: 'phase', phase: 'discussion' };

  for (let round = 1; round <= meeting.rounds; round++) {
    for (const skill of skills) {
      const systemPrompt = buildSystemPrompt(skill, 'discussion', meeting);
      const userPrompt = buildDiscussionPrompt(skill, round, messages);

      const msgId = uuidv4();
      yield {
        type: 'message_start',
        skillId: skill.id,
        skillName: skill.name,
        skillAvatar: skill.avatar,
        round,
      };

      let fullContent = '';
      const aiStream = await streamChat('discussion', systemPrompt, userPrompt, 1024);

      for await (const chunk of aiStream.stream) {
        if (chunk.type === 'text' && chunk.text) {
          fullContent += chunk.text;
          yield {
            type: 'message_delta',
            skillId: skill.id,
            content: chunk.text,
          };
        }
      }

      // Track token usage
      const usage = await aiStream.getUsage();
      totalInputTokens += usage.inputTokens;
      totalOutputTokens += usage.outputTokens;

      const msg: MeetingMessage = {
        id: msgId,
        skillId: skill.id,
        skillName: skill.name,
        skillAvatar: skill.avatar,
        phase: 'discussion',
        round,
        content: fullContent,
        timestamp: new Date().toISOString(),
      };
      messages.push(msg);
      yield { type: 'message_end', skillId: skill.id };
    }
  }

  // Phase 3: Summary
  yield { type: 'phase', phase: 'summary' };

  const summaryPrompt = buildSummaryPrompt(messages, meeting);
  let summaryContent = '';

  yield {
    type: 'message_start',
    skillId: 'system',
    skillName: '會議主持人',
    skillAvatar: '🏛️',
  };

  const summaryAiStream = await streamChat(
    'summary',
    '你是一位專業的會議主持人，負責彙整討論結果並產出結構化報告。請用繁體中文回答。',
    summaryPrompt,
    2048,
  );

  for await (const chunk of summaryAiStream.stream) {
    if (chunk.type === 'text' && chunk.text) {
      summaryContent += chunk.text;
      yield {
        type: 'message_delta',
        skillId: 'system',
        content: chunk.text,
      };
    }
  }

  // Track token usage from summary stream
  const summaryUsage = await summaryAiStream.getUsage();
  totalInputTokens += summaryUsage.inputTokens;
  totalOutputTokens += summaryUsage.outputTokens;

  yield { type: 'message_end', skillId: 'system' };

  // Calculate duration
  const endTime = Date.now();
  const durationMs = endTime - startTime;

  // Generate signatures
  const signatures = skills.map((skill) => {
    return skill.signature.style
      .replace('{name}', skill.name)
      .replace('{expertise}', skill.expertise.join('、'));
  });

  // Log full summary for debugging
  console.error(`[runDiscussion] Full summaryContent (${summaryContent.length} chars):\n${summaryContent}`);

  // Build report
  const report: MeetingReport = {
    topic: meeting.topic,
    date: new Date().toISOString(),
    participants: skills.map((s) => ({ name: s.name, avatar: s.avatar })),
    totalRounds: meeting.rounds,
    consensus: extractSection(summaryContent, '共識結論'),
    disagreements: extractSection(summaryContent, '分歧觀點'),
    openQuestions: extractSection(summaryContent, '待釐清問題'),
    actionItems: extractSection(summaryContent, '行動建議'),
    signatures,
    fullTranscript: messages,
  };

  const totalTokens = totalInputTokens + totalOutputTokens;
  console.error(`[runDiscussion] Summary: input_tokens=${totalInputTokens}, output_tokens=${totalOutputTokens}, total=${totalTokens}, duration=${durationMs}ms`);

  yield {
    type: 'report',
    report,
    tokenUsage: { input: totalInputTokens, output: totalOutputTokens, total: totalTokens },
    durationMs,
  };
  yield { type: 'done' };
}

// Fuzzy keyword patterns for each section (handles AI rephrasing)
const SECTION_PATTERNS: Record<string, RegExp> = {
  '共識結論': /共識|consensus|一致同意|達成.{0,4}共識|共同結論/i,
  '分歧觀點': /分歧|歧見|不同意見|爭議|disagreement|觀點差異|意見不同/i,
  '待釐清問題': /待釐清|釐清|未解|open.?question|待討論|需要.{0,4}討論|進一步/i,
  '行動建議': /行動建議|action|下一步|建議行動|具體建議|行動方案|後續/i,
};


function looksLikeHeader(line: string): boolean {
  const trimmed = line.trim();
  // Markdown heading, bold heading, or numbered heading prefix
  return (
    /^#{1,6}\s+/.test(trimmed) ||
    /^\*\*[^*]+\*\*\s*$/.test(trimmed) ||
    /^[\d一二三四五六七八九十]+[.、：:\s]/.test(trimmed)
  );
}

function looksLikeHeaderLoose(line: string): boolean {
  // Looser check: also counts short standalone lines (for target section detection)
  return looksLikeHeader(line) || line.trim().length <= 60;
}

function matchesSection(line: string, sectionName: string): boolean {
  const trimmed = line.trim();
  // Exact match first
  if (trimmed.includes(sectionName)) return true;
  // Fuzzy match via patterns
  const pattern = SECTION_PATTERNS[sectionName];
  return pattern ? pattern.test(trimmed) : false;
}

function matchesAnyOtherSection(line: string, currentSection: string): boolean {
  const trimmed = line.trim();
  for (const [name, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (name === currentSection) continue;
    if (trimmed.includes(name) || pattern.test(trimmed)) return true;
  }
  return false;
}

function extractSection(content: string, sectionName: string): string {
  const lines = content.split('\n');
  let inSection = false;
  const sectionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inSection) sectionLines.push('');
      continue;
    }

    const isCurrentSection = matchesSection(line, sectionName);
    const isOtherSection = matchesAnyOtherSection(line, sectionName);

    // Detect header for our target section (use loose check, only when not already inside)
    if (!inSection && isCurrentSection && looksLikeHeaderLoose(line)) {
      inSection = true;
      continue; // Skip the header line itself
    }

    // If we're in our section and hit another section's header, stop
    // Use strict check for boundaries to avoid false positives in content
    if (inSection && isOtherSection && looksLikeHeader(line)) {
      break;
    }

    // Also stop on any markdown heading that doesn't match our section
    if (inSection && /^#{1,6}\s+/.test(line) && !isCurrentSection) {
      break;
    }

    if (inSection) {
      sectionLines.push(line);
    }
  }

  // Trim trailing empty lines
  while (sectionLines.length > 0 && sectionLines[sectionLines.length - 1].trim() === '') {
    sectionLines.pop();
  }

  const result = sectionLines.join('\n').trim();
  console.error(`[extractSection] "${sectionName}" => ${result.length} chars: "${result.substring(0, 200)}${result.length > 200 ? '...' : ''}"`);
  return result;
}
