import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest, requireAuth, AuthError } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = requireAuth(request);
    const body = await request.json();

    const db = getDb();
    const skill = db.prepare('SELECT * FROM custom_skills WHERE id = ?').get(id) as any;

    if (!skill) {
      return NextResponse.json(
        { error: '找不到此 Skill' },
        { status: 404 }
      );
    }

    // Check ownership
    if (user.sub !== skill.user_id) {
      return NextResponse.json(
        { error: '無權限修改此 Skill' },
        { status: 403 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = ['name', 'avatar', 'expertise', 'personality', 'prompt', 'signature', 'is_active'];

    for (const field of allowedFields) {
      if (field in body) {
        updates.push(`${field} = ?`);
        if (field === 'expertise' || field === 'signature') {
          values.push(JSON.stringify(body[field]));
        } else if (field === 'is_active') {
          values.push(body[field] ? 1 : 0);
        } else {
          values.push(body[field]);
        }
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      db.prepare(`UPDATE custom_skills SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM custom_skills WHERE id = ?').get(id) as any;

    const parsed = {
      ...updated,
      expertise: JSON.parse(updated.expertise || '[]'),
      signature: JSON.parse(updated.signature || '{}'),
      isDefault: false,
      isActive: updated.is_active !== 0,
    };

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = requireAuth(request);

    const db = getDb();
    const skill = db.prepare('SELECT * FROM custom_skills WHERE id = ?').get(id) as any;

    if (!skill) {
      return NextResponse.json(
        { error: '找不到此 Skill' },
        { status: 404 }
      );
    }

    // Check ownership
    if (user.sub !== skill.user_id) {
      return NextResponse.json(
        { error: '無權限刪除此 Skill' },
        { status: 403 }
      );
    }

    db.prepare('DELETE FROM custom_skills WHERE id = ?').run(id);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
