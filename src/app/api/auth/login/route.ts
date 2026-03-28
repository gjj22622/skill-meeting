import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody;
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: '缺少必要欄位：email, password' },
        { status: 400 }
      );
    }

    // Get database
    const db = getDb();

    // Query user by email
    const user = db.prepare(`
      SELECT id, email, name, role, password_hash
      FROM users
      WHERE email = ?
    `).get(email) as {
      id: string;
      email: string;
      name: string;
      role: string;
      password_hash: string;
    } | undefined;

    if (!user) {
      return NextResponse.json(
        { error: '電郵或密碼錯誤' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: '電郵或密碼錯誤' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = createToken({
      sub: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin',
    });

    // Set auth cookie
    await setAuthCookie(token);

    // Create response with user object wrapper
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登入失敗' },
      { status: 500 }
    );
  }
}
