import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get user from JWT token in request
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: '未登入' },
        { status: 401 }
      );
    }

    // Get database
    const db = getDb();

    // Query full user data (excluding password_hash)
    const userData = db.prepare(`
      SELECT id, email, name, role, created_at
      FROM users
      WHERE id = ?
    `).get(user.sub) as {
      id: string;
      email: string;
      name: string;
      role: string;
      created_at: string;
    } | undefined;

    if (!userData) {
      return NextResponse.json(
        { error: '用戶不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: '獲取用戶信息失敗' },
      { status: 500 }
    );
  }
}
