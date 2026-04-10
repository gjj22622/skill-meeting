import Anthropic from '@anthropic-ai/sdk';
import { Skill, Meeting, MeetingMessage, DiscussionEvent, DiscussionPhase, MeetingReport } from './types';
import { v4 as uuidv4 } from 'uuid';

const client = new Anthropic();

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

請根據以上討論，產出結構化的總結報告，格式如下：

## 共識結論
（列出所有參與者達成共識的觀點和結論）

## 分歧觀點
（列出參與者之間的不同意見和爭議點）

## 待釐清問題
（列出需要更多資訊或進一步討論的問題）

## 行動建議
（根據討論結果，提出具體的下一步建議）`;
}

export async function* runDiscussion(
  meeting: Meeting,
  skills: Skill[]
): AsyncGenerator<DiscussionEvent> {
  const messages: MeetingMessage[] = [];

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
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullContent += event.delta.text;
        yield {
          type: 'message_delta',
          skillId: skill.id,
          content: event.delta.text,
        };
      }
    }

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
      const stream = client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullContent += event.delta.text;
          yield {
            type: 'message_delta',
            skillId: skill.id,
            content: event.delta.text,
          };
        }
      }

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

  const summaryStream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: '你是一位專業的會議主持人，負責彙整討論結果並產出結構化報告。請用繁體中文回答。',
    messages: [{ role: 'user', content: summaryPrompt }],
  });

  for await (const event of summaryStream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      summaryContent += event.delta.text;
      yield {
        type: 'message_delta',
        skillId: 'system',
        content: event.delta.text,
      };
    }
  }

  yield { type: 'message_end', skillId: 'system' };

  // Generate signatures
  const signatures = skills.map((skill) => {
    return skill.signature.style
      .replace('{name}', skill.name)
      .replace('{expertise}', skill.expertise.join('、'));
  });

  // Build report
  const report: MeetingReport = {
    topic: meeting.topic,
    date: new Date().toISOString(),
    participants: skills.map((s) => ({ name: s.name, avatar: s.avatar })),
    totalRounds: meeting.rounds,
    consensus: extractSection(summaryContent, '共識結論'),
    disagreements: extractSection(summaryContent, '分歧觀點'),
    openQuestions: extractSection(summaryContent, '待釐清問題'),
    signatures,
    fullTranscript: messages,
  };

  yield { type: 'report', report };
  yield { type: 'done' };
}

function extractSection(content: string, sectionName: string): string {
  const regex = new RegExp(`##\\s*${sectionName}[\\s\\S]*?(?=##|$)`, 'g');
  const match = content.match(regex);
  if (!match) return '';
  return match[0].replace(new RegExp(`##\\s*${sectionName}\\s*`), '').trim();
}
