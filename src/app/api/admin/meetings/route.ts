import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin, AuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)

    const db = getDb()
    const url = new URL(request.url)
    const includeDeleted = url.searchParams.get('include_deleted') === 'true'

    let query = `
      SELECT
        m.id,
        m.title,
        m.status,
        m.token_usage,
        m.created_at,
        m.updated_at,
        m.deleted_at,
        u.id as user_id,
        u.email,
        u.name as user_name,
        m.context,
        m.objectives,
        m.strategy,
        m.tactics,
        m.actions,
        m.control
      FROM meetings m
      LEFT JOIN users u ON m.user_id = u.id
    `

    if (!includeDeleted) {
      query += ' WHERE m.deleted_at IS NULL'
    }

    query += ' ORDER BY m.created_at DESC'

    const meetings = db.prepare(query).all()

    // Parse JSON fields
    const parsed = (meetings as any[]).map((meeting) => ({
      ...meeting,
      context:
        meeting.context && typeof meeting.context === 'string'
          ? JSON.parse(meeting.context)
          : meeting.context,
      objectives:
        meeting.objectives && typeof meeting.objectives === 'string'
          ? JSON.parse(meeting.objectives)
          : meeting.objectives,
      strategy:
        meeting.strategy && typeof meeting.strategy === 'string'
          ? JSON.parse(meeting.strategy)
          : meeting.strategy,
      tactics:
        meeting.tactics && typeof meeting.tactics === 'string'
          ? JSON.parse(meeting.tactics)
          : meeting.tactics,
      actions:
        meeting.actions && typeof meeting.actions === 'string'
          ? JSON.parse(meeting.actions)
          : meeting.actions,
      control:
        meeting.control && typeof meeting.control === 'string'
          ? JSON.parse(meeting.control)
          : meeting.control,
    }))

    return NextResponse.json(parsed)
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('Meetings list error:', e)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}
