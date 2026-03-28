import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin, AuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)

    const db = getDb()

    // Get total users
    const totalUsersResult = db
      .prepare('SELECT COUNT(*) as count FROM users')
      .get() as { count: number }
    const totalUsers = totalUsersResult.count

    // Get total meetings
    const totalMeetingsResult = db
      .prepare("SELECT COUNT(*) as count FROM meetings WHERE deleted_at IS NULL")
      .get() as { count: number }
    const totalMeetings = totalMeetingsResult.count

    // Get completed meetings
    const completedMeetingsResult = db
      .prepare(
        "SELECT COUNT(*) as count FROM meetings WHERE status = 'completed' AND deleted_at IS NULL"
      )
      .get() as { count: number }
    const completedMeetings = completedMeetingsResult.count

    // Get total token usage (combined)
    const totalTokensResult = db
      .prepare('SELECT COALESCE(SUM(token_usage), 0) as total, COALESCE(SUM(token_input), 0) as total_input, COALESCE(SUM(token_output), 0) as total_output, COALESCE(SUM(duration_ms), 0) as total_duration FROM meetings')
      .get() as { total: number; total_input: number; total_output: number; total_duration: number }
    const totalTokenUsage = totalTokensResult.total
    const totalTokenInput = totalTokensResult.total_input
    const totalTokenOutput = totalTokensResult.total_output
    const totalDurationMs = totalTokensResult.total_duration

    // Get recent meetings (last 7)
    const recentMeetings = db
      .prepare(
        "SELECT m.id, m.topic, m.user_id, m.status, m.created_at, u.name as user_name FROM meetings m LEFT JOIN users u ON m.user_id = u.id WHERE m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 7"
      )
      .all()

    // Get meetings per day (last 7 days)
    const meetingsPerDay = db
      .prepare(
        "SELECT DATE(created_at) as date, COUNT(*) as count FROM meetings WHERE created_at >= datetime('now', '-7 days') AND deleted_at IS NULL GROUP BY DATE(created_at)"
      )
      .all()

    // Get top users by meetings
    const topUsers = db
      .prepare(
        "SELECT u.name, u.email, COUNT(m.id) as meeting_count FROM users u LEFT JOIN meetings m ON u.id = m.user_id AND m.deleted_at IS NULL GROUP BY u.id ORDER BY meeting_count DESC LIMIT 5"
      )
      .all()

    return NextResponse.json({
      totalUsers,
      totalMeetings,
      completedMeetings,
      totalTokenUsage,
      totalTokenInput,
      totalTokenOutput,
      totalDurationMs,
      recentMeetings,
      meetingsPerDay,
      topUsers,
    })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('Dashboard error:', e)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
