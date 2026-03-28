import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest, requireAuth, AuthError } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request);

    const db = getDb();
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as any;

    if (!meeting) {
      return NextResponse.json(
        { error: '找不到此會議' },
        { status: 404 }
      );
    }

    // Check ownership or admin
    if (user && (user.sub === meeting.user_id || user.role === 'admin')) {
      const parsed = {
        ...meeting,
        skill_ids: JSON.parse(meeting.skill_ids || '[]'),
        messages: JSON.parse(meeting.messages || '[]'),
        report: meeting.report ? JSON.parse(meeting.report) : null,
      };
      return NextResponse.json(parsed, { status: 200 });
    }

    return NextResponse.json(
      { error: '無權限存取此會議' },
      { status: 403 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request);
    const body = await request.json();

    const db = getDb();
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as any;

    if (!meeting) {
      return NextResponse.json(
        { error: '找不到此會議' },
        { status: 404 }
      );
    }

    // Check ownership or admin
    if (!user || (user.sub !== meeting.user_id && user.role !== 'admin')) {
      return NextResponse.json(
        { error: '無權限修改此會議' },
        { status: 403 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = ['status', 'messages', 'report', 'token_usage'];

    for (const field of allowedFields) {
      if (field in body) {
        updates.push(`${field} = ?`);
        if (field === 'messages' || field === 'report') {
          values.push(JSON.stringify(body[field]));
        } else {
          values.push(body[field]);
        }
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      db.prepare(`UPDATE meetings SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as any;

    const parsed = {
      ...updated,
      skill_ids: JSON.parse(updated.skill_ids || '[]'),
      messages: JSON.parse(updated.messages || '[]'),
      report: updated.report ? JSON.parse(updated.report) : null,
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
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as any;

    if (!meeting) {
      return NextResponse.json(
        { error: '找不到此會議' },
        { status: 404 }
      );
    }

    // Check ownership or admin
    if (user.sub !== meeting.user_id && user.role !== 'admin') {
      return NextResponse.json(
        { error: '無權限刪除此會議' },
        { status: 403 }
      );
    }

    db.prepare('UPDATE meetings SET deleted_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      id
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
