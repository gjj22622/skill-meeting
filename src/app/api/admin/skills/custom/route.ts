import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';

/**
 * GET /api/admin/skills/custom
 * Admin-only: Returns ALL users' custom skills with user info (read-only audit view)
 */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const db = getDb();

    const customSkills = db
      .prepare(`
        SELECT cs.*, u.email as user_email, u.name as user_name
        FROM custom_skills cs
        JOIN users u ON cs.user_id = u.id
        ORDER BY cs.created_at DESC
      `)
      .all() as any[];

    const parsed = customSkills.map((s) => ({
      id: s.id,
      userId: s.user_id,
      userName: s.user_name,
      userEmail: s.user_email,
      name: s.name,
      avatar: s.avatar,
      expertise: JSON.parse(s.expertise || '[]'),
      personality: s.personality,
      prompt: s.prompt,
      signature: JSON.parse(s.signature || '{}'),
      isActive: s.is_active !== 0,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return NextResponse.json(parsed);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Admin custom skills error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch custom skills' },
      { status: 500 }
    );
  }
}
