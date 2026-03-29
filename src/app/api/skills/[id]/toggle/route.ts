import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * PATCH /api/skills/[id]/toggle
 * Toggle a default skill's is_visible field (1 ↔ 0).
 * Returns the updated skill with parsed JSON fields.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const skill = db.prepare('SELECT * FROM default_skills WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!skill) {
      return NextResponse.json({ error: 'Skill 不存在' }, { status: 404 });
    }

    const newVisible = skill.is_visible === 1 ? 0 : 1;
    db.prepare('UPDATE default_skills SET is_visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newVisible, id);

    const updated = db.prepare('SELECT * FROM default_skills WHERE id = ?').get(id) as Record<string, unknown>;

    // Parse JSON fields, keep personality as string
    let expertise: string[] = [];
    let signature: Record<string, unknown> = {};
    try { expertise = JSON.parse(updated.expertise as string); } catch { /* keep default */ }
    try { signature = JSON.parse(updated.signature as string); } catch { /* keep default */ }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      avatar: updated.avatar,
      expertise,
      personality: updated.personality,
      prompt: updated.prompt,
      signature,
      is_visible: updated.is_visible,
      isActive: updated.is_visible === 1,
      isDefault: true,
    });
  } catch (err: unknown) {
    console.error('[toggle] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
