'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function NavAuth() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <a
          href="/auth/login"
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          登入
        </a>
        <a
          href="/auth/register"
          className="btn-primary"
          style={{
            textDecoration: 'none',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
          }}
        >
          註冊
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        {user.name}
      </span>
      {user.role === 'admin' && (
        <a
          href="/admin"
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          管理後台
        </a>
      )}
      <button
        onClick={() => logout()}
        style={{
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.875rem',
          textDecoration: 'none',
          padding: 0,
        }}
      >
        登出
      </button>
    </div>
  );
}
