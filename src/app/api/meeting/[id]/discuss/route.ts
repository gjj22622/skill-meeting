import { NextRequest } from 'next/server';
import { runDiscussion } from '@/lib/discussion-engine';
import { Meeting, Skill } from '@/lib/types';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import defaultSkills from '@/data/default-skills.json';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  const body = await request.json();
  const { meeting, customSkills = [] } = body as { meeting: Meeting; customSkills?: Skill[] };

  // 合併所有 skill 來源：JSON 預設 + 前端傳入的自建 + DB 中的自建
  const allSkills: Skill[] = [...(defaultSkills as Skill[])];

  // 加入前端傳來的 custom skills
  for (const cs of customSkills) {
    if (!allSkills.find(s => s.id === cs.id)) {
      allSkills.push(cs);
    }
  }

  // 也從 DB 查自建 skill（確保已登入用戶的 DB skill 不遺漏）
  try {
    const user = getUserFromRequest(request);
    if (user) {
      const db = getDb();
      const dbCustom = db
        .prepare('SELECT * FROM custom_skills WHERE user_id = ?')
        .all(user.sub) as any[];
      for (const row of dbCustom) {
        if (!allSkills.find(s => s.id === row.id)) {
          allSkills.push({
            id: row.id,
            name: row.name,
            avatar: row.avatar || '🧠',
            expertise: JSON.parse(row.expertise || '[]'),
            personality: row.personality || '',
            prompt: row.prompt || '',
            signature: JSON.parse(row.signature || '{}'),
          });
        }
      }
    }
  } catch {
    // 未登入也能用（靠前端傳入的 customSkills）
  }

  const selectedSkills = meeting.skillIds
    .map((id: string) => allSkills.find((s) => s.id === id))
    .filter(Boolean) as Skill[];

  if (selectedSkills.length < 2) {
    return new Response(JSON.stringify({ error: '至少需要選擇 2 個 Skill' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runDiscussion(meeting, selectedSkills)) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch (error) {
        const errorEvent = {
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
