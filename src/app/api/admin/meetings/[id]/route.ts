import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin, AuthError, getUser } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireAdmin(request)

    const currentUser = getUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = getDb()

    // Check if meeting exists
    const meeting = db.prepare('SELECT id FROM meetings WHERE id = ?').get(id)
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Soft delete: set deleted_at
    db.prepare(
      "UPDATE meetings SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(id)

    // Log to audit_log
    db.prepare(
      `
      INSERT INTO audit_log (admin_id, action, resource_type, resource_id, details)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      currentUser.sub,
      'meeting_delete',
      'meeting',
      id,
      JSON.stringify({ method: 'soft_delete' })
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('Meeting delete error:', e)
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    )
  }
}
