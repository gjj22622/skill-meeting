import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest, requireAuth, AuthError } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const db = getDb();
    const meetings = db
      .prepare(`
        SELECT * FROM meetings
        WHERE user_id = ? AND deleted_at IS NULL
        ORDER BY created_at DESC
      `)
      .all(user.sub) as any[];

    const parsed = meetings.map((m) => ({
      ...m,
      skill_ids: JSON.parse(m.skill_ids || '[]'),
      messages: JSON.parse(m.messages || '[]'),
      report: m.report ? JSON.parse(m.report) : null,
    }));

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const body = await request.json();

    const { topic, sourceData, skillIds, rounds, goalType } = body;

    if (!topic) {
      return NextResponse.json(
        { error: '缺少必要欄位：topic' },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO meetings (
        id, user_id, topic, source_data, skill_ids, rounds, goal_type,
        status, messages, report, token_usage, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      user.sub,
      topic,
      sourceData || '',
      JSON.stringify(skillIds || []),
      rounds || 3,
      goalType || 'consensus',
      'draft',
      '[]',
      null,
      0,
      now,
      now
    );

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as any;

    const parsed = {
      ...meeting,
      skill_ids: JSON.parse(meeting.skill_ids || '[]'),
      messages: JSON.parse(meeting.messages || '[]'),
      report: meeting.report ? JSON.parse(meeting.report) : null,
    };

    return NextResponse.json(parsed, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
