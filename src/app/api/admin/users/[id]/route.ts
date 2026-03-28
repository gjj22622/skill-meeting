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

    // Don't allow deleting self
    if (currentUser.sub === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if user exists
    const user: any = db.prepare('SELECT id, email FROM users WHERE id = ?').get(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user (CASCADE will handle meetings and custom_skills)
    db.prepare('DELETE FROM users WHERE id = ?').run(id)

    // Log to audit_log
    db.prepare(
      `
      INSERT INTO audit_log (admin_id, action, resource_type, resource_id, details)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      currentUser.sub,
      'user_delete',
      'user',
      id,
      JSON.stringify({ email: user.email })
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('User delete error:', e)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
