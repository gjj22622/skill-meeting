import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin, AuthError, getUser } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)

    const db = getDb()

    const skills = db
      .prepare('SELECT * FROM default_skills ORDER BY sort_order')
      .all()

    // Parse JSON fields
    const parsed = (skills as any[]).map((skill) => ({
      ...skill,
      expertise:
        typeof skill.expertise === 'string'
          ? JSON.parse(skill.expertise)
          : skill.expertise,
      personality:
        typeof skill.personality === 'string'
          ? (() => { try { return JSON.parse(skill.personality); } catch { return skill.personality; } })()
          : skill.personality,
      prompt: skill.prompt || '',
    }))

    return NextResponse.json(parsed)
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('Skills list error:', e)
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request)

    const currentUser = getUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, avatar, expertise, personality, prompt, signature } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const db = getDb()
    const id = uuidv4()

    db.prepare(
      `
      INSERT INTO default_skills (id, name, avatar, expertise, personality, prompt, signature, is_visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `
    ).run(
      id,
      name,
      avatar || '',
      JSON.stringify(expertise || []),
      JSON.stringify(personality || {}),
      prompt || '',
      signature || ''
    )

    // Log to audit_log
    db.prepare(
      `
      INSERT INTO audit_log (admin_id, action, resource_type, resource_id, details)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      currentUser.sub,
      'skill_create',
      'skill',
      id,
      JSON.stringify({ name })
    )

    const newSkill: any = db.prepare('SELECT * FROM default_skills WHERE id = ?').get(id)

    const parsed = {
      ...newSkill,
      expertise:
        typeof newSkill.expertise === 'string'
          ? JSON.parse(newSkill.expertise)
          : newSkill.expertise,
      personality:
        typeof newSkill.personality === 'string'
          ? JSON.parse(newSkill.personality)
          : newSkill.personality,
    }

    return NextResponse.json(parsed, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('Skill create error:', e)
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    )
  }
}
