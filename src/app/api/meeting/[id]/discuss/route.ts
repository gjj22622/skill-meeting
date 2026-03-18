import { NextRequest } from 'next/server';
import { runDiscussion } from '@/lib/discussion-engine';
import { Meeting, Skill } from '@/lib/types';
import defaultSkills from '@/data/default-skills.json';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  const body = await request.json();
  const { meeting, customSkills = [] } = body as { meeting: Meeting; customSkills?: Skill[] };

  const allSkills = [...(defaultSkills as Skill[]), ...customSkills];
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
