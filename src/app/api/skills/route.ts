import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest, requireAuth, AuthError } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const db = getDb();

    // Get default skills (always visible)
    const defaultSkills = db
      .prepare('SELECT * FROM default_skills WHERE is_visible = 1 ORDER BY sort_order ASC')
      .all() as any[];

    const parsed = defaultSkills.map((s) => ({
      ...s,
      expertise: JSON.parse(s.expertise || '[]'),
      signature: JSON.parse(s.signature || '{}'),
      isDefault: true,
    }));

    // If authenticated, also get custom skills
    if (user) {
      const customSkills = db
        .prepare('SELECT * FROM custom_skills WHERE user_id = ? ORDER BY created_at DESC')
        .all(user.sub) as any[];

      const customParsed = customSkills.map((s) => ({
        ...s,
        expertise: JSON.parse(s.expertise || '[]'),
        signature: JSON.parse(s.signature || '{}'),
        isDefault: false,
      }));

      return NextResponse.json([...parsed, ...customParsed], { status: 200 });
    }

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

    const { name, avatar, expertise, personality, prompt, signature } = body;

    if (!name) {
      return NextResponse.json(
        { error: '缺少必要欄位：name' },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO custom_skills (
        id, user_id, name, avatar, expertise, personality, prompt, signature,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      user.sub,
      name,
      avatar || '🧠',
      JSON.stringify(expertise || []),
      personality || '',
      prompt || '',
      JSON.stringify(signature || {}),
      now,
      now
    );

    const skill = db.prepare('SELECT * FROM custom_skills WHERE id = ?').get(id) as any;

    const parsed = {
      ...skill,
      expertise: JSON.parse(skill.expertise || '[]'),
      signature: JSON.parse(skill.signature || '{}'),
      isDefault: false,
    };

    return NextResponse.json(parsed, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
