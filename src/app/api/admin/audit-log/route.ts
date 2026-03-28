import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin, AuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const db = getDb()

    const logs = db
      .prepare(
        `
        SELECT
          al.id,
          al.admin_id,
          al.action,
          al.resource_type,
          al.resource_id,
          al.details,
          al.created_at,
          u.email as admin_email,
          u.name as admin_name
        FROM audit_log al
        LEFT JOIN users u ON al.admin_id = u.id
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?
      `
      )
      .all(limit, offset)

    // Get total count
    const countResult = db
      .prepare('SELECT COUNT(*) as count FROM audit_log')
      .get() as { count: number }

    return NextResponse.json({
      logs,
      total: countResult.count,
      limit,
      offset,
    })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('Audit log error:', e)
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    )
  }
}
