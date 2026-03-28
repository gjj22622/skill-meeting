import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin, AuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)

    const db = getDb()

    // Get all users with their meeting counts
    const users = db
      .prepare(
        `
        SELECT
          u.id,
          u.email,
          u.name,
          u.role,
          u.created_at,
          COUNT(m.id) as meeting_count
        FROM users u
        LEFT JOIN meetings m ON u.id = m.user_id AND m.deleted_at IS NULL
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `
      )
      .all()

    return NextResponse.json(users)
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('Users list error:', e)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
