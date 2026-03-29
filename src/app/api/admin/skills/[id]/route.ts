import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin, AuthError, getUser } from '@/lib/auth'

export async function PATCH(
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

    const body = await request.json()
    const { is_visible, name, avatar, expertise, personality, prompt, signature } =
      body

    const db = getDb()

    // Check if skill exists
    const skill = db.prepare('SELECT * FROM default_skills WHERE id = ?').get(id)
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    const action = is_visible !== undefined ? 'skill_toggle' : 'skill_update'

    if (is_visible !== undefined) {
      updates.push('is_visible = ?')
      values.push(is_visible ? 1 : 0)
    }
    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?')
      values.push(avatar)
    }
    if (expertise !== undefined) {
      updates.push('expertise = ?')
      values.push(JSON.stringify(expertise))
    }
    if (personality !== undefined) {
      updates.push('personality = ?')
      values.push(JSON.stringify(personality))
    }
    if (prompt !== undefined) {
      updates.push('prompt = ?')
      values.push(prompt)
    }
    if (signature !== undefined) {
      updates.push('signature = ?')
      values.push(signature)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    values.push(id)

    const query = `UPDATE default_skills SET ${updates.join(', ')} WHERE id = ?`
    db.prepare(query).run(...values)

    // Log to audit_log
    db.prepare(
      `
      INSERT INTO audit_log (admin_id, action, resource_type, resource_id, details)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      currentUser.sub,
      action,
      'skill',
      id,
      JSON.stringify(body)
    )

    const updatedSkill: any = db
      .prepare('SELECT * FROM default_skills WHERE id = ?')
      .get(id)

    let parsedExpertise = updatedSkill.expertise
    try {
      if (typeof parsedExpertise === 'string') parsedExpertise = JSON.parse(parsedExpertise)
    } catch { /* keep as-is */ }

    let parsedPersonality: any = updatedSkill.personality
    try {
      if (typeof parsedPersonality === 'string') parsedPersonality = JSON.parse(parsedPersonality)
    } catch { /* plain text personality — keep as-is */ }

    const parsed = {
      ...updatedSkill,
      expertise: parsedExpertise,
      personality: parsedPersonality,
    }

    return NextResponse.json(parsed)
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('Skill update error:', e)
    return NextResponse.json(
      { error: 'Failed to update skill' },
      { status: 500 }
    )
  }
}

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

    // Check if skill exists
    const skill: any = db.prepare('SELECT * FROM default_skills WHERE id = ?').get(id)
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    // Delete skill
    db.prepare('DELETE FROM default_skills WHERE id = ?').run(id)

    // Log to audit_log
    db.prepare(
      `
      INSERT INTO audit_log (admin_id, action, resource_type, resource_id, details)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      currentUser.sub,
      'skill_delete',
      'skill',
      id,
      JSON.stringify({ name: skill.name })
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('Skill delete error:', e)
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    )
  }
}
