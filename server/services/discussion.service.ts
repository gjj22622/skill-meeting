import { getGeminiClient } from '../lib/gemini.js';
import { prisma } from '../lib/prisma.js';
import * as meetingService from './meeting.service.js';
import { Skill as PrismaSkill } from '@prisma/client';
import { EventEmitter } from 'events';

export interface DiscussionEvent {
  type: 'phase_change' | 'message' | 'round_change' | 'summary' | 'complete' | 'error';
  phase?: string;
  round?: number;
  message?: any;
  content?: string;
  error?: string;
}

interface ParsedSkill {
  id: string;
  name: string;
  avatar: string;
  expertise: string[];
  personality: string;
  prompt: string;
  signature: { style: string };
}

// In-memory event bus for active discussions
const activeDiscussions = new Map<string, EventEmitter>();

function parseSkill(s: PrismaSkill): ParsedSkill {
  return {
    id: s.id,
    name: s.name,
    avatar: s.avatar,
    expertise: JSON.parse(s.expertise),
    personality: s.personality,
    prompt: s.prompt,
    signature: JSON.parse(s.signature),
  };
}

function formatSignature(skill: ParsedSkill) {
  return skill.signature.style
    .replace('{name}', skill.name)
    .replace('{expertise}', skill.expertise.join('、'));
}

/**
 * Build the system context for a skill, injecting the prompt field
 * as domain knowledge when it contains substantial content.
 */
function buildSkillContext(skill: ParsedSkill): string {
  let context = `你現在是 ${skill.name}。
你的背景：${skill.personality}
你的專長：${skill.expertise.join(', ')}`;

  // Inject prompt as domain knowledge if it has substantial content (> 100 chars)
  if (skill.prompt && skill.prompt.length > 100) {
    context += `\n\n你的專業知識與方法論：\n${skill.prompt}`;
  }

  return context;
}

export function subscribe(meetingId: string, cb: (event: DiscussionEvent) => void): () => void {
  let emitter = activeDiscussions.get(meetingId);
  if (!emitter) {
    emitter = new EventEmitter();
    activeDiscussions.set(meetingId, emitter);
  }

  const handler = (event: DiscussionEvent) => cb(event);
  emitter.on('event', handler);

  return () => {
    emitter!.off('event', handler);
    if (emitter!.listenerCount('event') === 0) {
      activeDiscussions.delete(meetingId);
    }
  };
}

function emit(meetingId: string, event: DiscussionEvent) {
  const emitter = activeDiscussions.get(meetingId);
  if (emitter) {
    emitter.emit('event', event);
  }
}

export async function start(meetingId: string) {
  const ai = getGeminiClient();
  const meeting = await meetingService.get(meetingId);
  const skillIds: string[] = JSON.parse(meeting.skillIds);

  const skillRecords = await prisma.skill.findMany({
    where: { id: { in: skillIds } },
  });

  // Maintain order from skillIds
  const skills: ParsedSkill[] = skillIds
    .map(id => skillRecords.find(s => s.id === id))
    .filter(Boolean)
    .map(s => parseSkill(s!));

  if (skills.length === 0) {
    emit(meetingId, { type: 'error', error: '找不到任何參與 Skill' });
    return;
  }

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const messages: Array<{ skillName: string; content: string }> = [];
  const startTime = Date.now();

  try {
    await meetingService.update(meetingId, {
      status: 'running',
      startTime: new Date(),
      currentPhase: 'opening',
    });

    // Phase 1: Opening
    emit(meetingId, { type: 'phase_change', phase: 'opening' });

    for (const skill of skills) {
      const skillContext = buildSkillContext(skill);
      const prompt = `
${skillContext}

會議主題：${meeting.topic}
參考資料：${meeting.sourceData || '無'}
會議目標：${meeting.goalType}

這是會議的開場階段。請針對主題給出你的初始觀點。
請保持你的角色設定，並運用你的專業知識與方法論來分析。
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      if (response.usageMetadata) {
        totalInputTokens += response.usageMetadata.promptTokenCount || 0;
        totalOutputTokens += response.usageMetadata.candidatesTokenCount || 0;
      }

      const content = response.text || '';
      messages.push({ skillName: skill.name, content });

      const msg = await meetingService.addMessage(meetingId, {
        skillId: skill.id,
        skillName: skill.name,
        skillAvatar: skill.avatar,
        round: 0,
        phase: 'opening',
        content,
      });

      await meetingService.update(meetingId, { totalInputTokens, totalOutputTokens });
      emit(meetingId, { type: 'message', message: msg });
    }

    // Phase 2: Discussion rounds
    emit(meetingId, { type: 'phase_change', phase: 'discussion' });
    await meetingService.update(meetingId, { currentPhase: 'discussion' });

    for (let round = 1; round <= meeting.rounds; round++) {
      emit(meetingId, { type: 'round_change', round });
      await meetingService.update(meetingId, { currentRound: round });

      for (const skill of skills) {
        const skillContext = buildSkillContext(skill);
        const history = messages.map(m => `[${m.skillName}]: ${m.content}`).join('\n\n');

        const prompt = `
${skillContext}

會議主題：${meeting.topic}
會議目標：${meeting.goalType}

目前是第 ${round} 輪討論（總共 ${meeting.rounds} 輪）。

以下是之前的討論記錄：
${history}

請閱讀其他人的觀點，運用你的專業知識與方法論，進行自我反思 (self-critique)，提出修正後的觀點或反駁，並提出追問或補充問題。
請保持你的角色設定，並試圖朝著會議目標（${meeting.goalType}）推進。
        `.trim();

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });

        if (response.usageMetadata) {
          totalInputTokens += response.usageMetadata.promptTokenCount || 0;
          totalOutputTokens += response.usageMetadata.candidatesTokenCount || 0;
        }

        const content = response.text || '';
        messages.push({ skillName: skill.name, content });

        const msg = await meetingService.addMessage(meetingId, {
          skillId: skill.id,
          skillName: skill.name,
          skillAvatar: skill.avatar,
          round,
          phase: 'discussion',
          content,
        });

        await meetingService.update(meetingId, { totalInputTokens, totalOutputTokens });
        emit(meetingId, { type: 'message', message: msg });
      }
    }

    // Phase 3: Summary
    emit(meetingId, { type: 'phase_change', phase: 'summary' });
    await meetingService.update(meetingId, { currentPhase: 'summary' });

    const historyText = messages.map(m => `[${m.skillName}]: ${m.content}`).join('\n\n');
    const summaryPrompt = `
你是一位專業的會議記錄員。請根據以下多輪討論的內容，整理出一份結構化的會議報告。

討論內容：
${historyText}

報告應包含：
1. 共識結論
2. 分歧觀點
3. 待釐清問題

請以 Markdown 格式輸出。
    `.trim();

    const summaryResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: summaryPrompt,
    });

    if (summaryResponse.usageMetadata) {
      totalInputTokens += summaryResponse.usageMetadata.promptTokenCount || 0;
      totalOutputTokens += summaryResponse.usageMetadata.candidatesTokenCount || 0;
    }

    const summaryContent = summaryResponse.text || '';
    emit(meetingId, { type: 'summary', content: summaryContent });

    // Build full report with signatures
    let fullReport = `# 🏛️ Skill Meeting 討論報告\n\n## 📋 會議資訊\n- 主題：${meeting.topic}\n- 日期：${new Date().toLocaleDateString()}\n- 參與者：${skills.map(s => s.name).join(', ')}\n- 討論輪數：${meeting.rounds} 輪\n\n${summaryContent}\n\n## ✍️ 簽署\n`;

    for (const skill of skills) {
      const signature = formatSignature(skill);
      fullReport += `\n---\n${signature}\n---`;
    }

    await meetingService.addReport(meetingId, fullReport);

    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

    await meetingService.update(meetingId, {
      status: 'completed',
      endTime: new Date(),
      durationSeconds,
      totalInputTokens,
      totalOutputTokens,
    });

    emit(meetingId, { type: 'complete', content: fullReport });
  } catch (error: any) {
    console.error('[Discussion Error]', error);
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

    await meetingService.update(meetingId, {
      status: 'failed',
      endTime: new Date(),
      durationSeconds,
    });

    emit(meetingId, { type: 'error', error: error.message });
  }
}
