import { NextRequest, NextResponse } from 'next/server';
import { v4 } from 'uuid';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterBody;
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '缺少必要欄位：email, password, name' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '請輸入有效的電郵地址' },
        { status: 400 }
      );
    }

    // Password minimum length validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密碼至少需要6個字符' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Get database
    const db = getDb();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json(
        { error: '此電郵已被註冊' },
        { status: 409 }
      );
    }

    // Create user
    const userId = v4();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, 'user')
    `);
    stmt.run(userId, email, passwordHash, name);

    // Fetch and return user data (excluding password_hash)
    const user = db.prepare(`
      SELECT id, email, name, role, created_at
      FROM users
      WHERE id = ?
    `).get(userId) as {
      id: string;
      email: string;
      name: string;
      role: string;
      created_at: string;
    };

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '註冊失敗' },
      { status: 500 }
    );
  }
}
