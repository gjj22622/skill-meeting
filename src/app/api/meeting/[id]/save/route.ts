import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * POST /api/meeting/[id]/save
 * Saves completed meeting data from the client (localStorage) into the SQLite database
 * so the admin dashboard can display accurate stats.
 *
 * This bridges the gap between client-side localStorage and server-side SQLite.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      topic,
      sourceData,
      skillIds,
      rounds,
      goalType,
      status,
      messages,
      report,
      tokenUsage,
      durationMs,
    } = body;

    const db = getDb();

    // Check if meeting already exists in DB
    const existing = db.prepare('SELECT id FROM meetings WHERE id = ?').get(id) as { id: string } | undefined;

    if (existing) {
      // Update existing meeting
      db.prepare(`
        UPDATE meetings SET
          status = ?,
          messages = ?,
          report = ?,
          token_usage = ?,
          token_input = ?,
          token_output = ?,
          duration_ms = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        status || 'completed',
        JSON.stringify(messages || []),
        JSON.stringify(report || null),
        tokenUsage?.total || 0,
        tokenUsage?.input || 0,
        tokenUsage?.output || 0,
        durationMs || 0,
        id
      );
    } else {
      // Insert new meeting — use a placeholder user_id since client doesn't always have auth
      // Try to get the first user; if none, use 'anonymous'
      const firstUser = db.prepare("SELECT id FROM users LIMIT 1").get() as { id: string } | undefined;
      const userId = firstUser?.id || 'anonymous';

      db.prepare(`
        INSERT INTO meetings (id, user_id, topic, source_data, skill_ids, rounds, goal_type, status, messages, report, token_usage, token_input, token_output, duration_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        topic || '',
        sourceData || '',
        JSON.stringify(skillIds || []),
        rounds || 3,
        goalType || 'consensus',
        status || 'completed',
        JSON.stringify(messages || []),
        JSON.stringify(report || null),
        tokenUsage?.total || 0,
        tokenUsage?.input || 0,
        tokenUsage?.output || 0,
        durationMs || 0
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[meeting/save] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save meeting' },
      { status: 500 }
    );
  }
}
